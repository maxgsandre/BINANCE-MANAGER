import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import crypto from 'crypto';

export const runtime = 'nodejs';
// Alternando região para 'iad1' (Washington, EUA)
export const preferredRegion = 'iad1';
export const dynamic = 'force-dynamic';

async function getUserIdFromToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.user_id || payload.uid || null;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

// Sincroniza horário com servidor Binance para evitar erro -1021
async function getServerTimeOffset(): Promise<number> {
  try {
    const res = await fetch('https://api.binance.com/api/v3/time', { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[BALANCE] Time sync endpoint returned ${res.status}, using 0 offset`);
      return 0;
    }
    const data = await res.json();
    const serverTime = Number(data.serverTime);
    if (isNaN(serverTime)) {
      console.warn('[BALANCE] Invalid serverTime from Binance, using 0 offset');
      return 0;
    }
    const offset = serverTime - Date.now();
    return isNaN(offset) ? 0 : offset;
  } catch (error) {
    console.error('[BALANCE] Time sync error:', error);
    return 0; // Fallback
  }
}

function createSignature(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

async function fetchBinanceBalance(apiKey: string, apiSecret: string, market: string, offset: number): Promise<{ asset: string; free: string; locked: string }[]> {
  const baseUrl = market === 'FUTURES' 
    ? 'https://fapi.binance.com' 
    : 'https://api.binance.com';
  
  const endpoint = market === 'FUTURES'
    ? '/fapi/v2/account'
    : '/api/v3/account';
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {};
  params.recvWindow = 10000; // Aumentado para 10s
  params.timestamp = Date.now() + offset; // Usar time sync
  
  const queryString = new URLSearchParams(params).toString();
  const signature = createSignature(queryString, apiSecret);
  const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
  
  const logCall = `[BALANCE] Calling Binance API: ${market} at ${fullUrl.split('?')[0]}`;
  const logOffset = `[BALANCE] Using time offset: ${offset}ms, timestamp: ${params.timestamp}`;
  console.log(logCall);
  console.log(logOffset);
  
  let response: Response;
  try {
    response = await fetch(fullUrl, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
      cache: 'no-store',
    });
  } catch (fetchError) {
    const errorMsg = `[BALANCE] Network error calling Binance: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const usedWeight = response.headers.get('x-mbx-used-weight-1m');
  const logStatus = `[BALANCE] Response status: ${response.status}, used weight: ${usedWeight}`;
  console.log(logStatus);

  const text = await response.text();
  const logText = `[BALANCE] Response text length: ${text.length}, first 200 chars: ${text.substring(0, 200)}`;
  console.log(logText);
  
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    const errorMsg = `[BALANCE] Failed to parse JSON. Response: ${text.substring(0, 500)}`;
    console.error(errorMsg);
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }

  if (!response.ok) {
    const errorCode = (data as { code?: number }).code;
    const errorMsg = (data as { msg?: string }).msg || JSON.stringify(data);
    
    // Erro 451: Localização bloqueada pela Binance
    if (response.status === 451) {
      const detailedError = `[BALANCE] Binance bloqueou esta requisição (451 - Restricted Location). A Vercel pode estar em uma região/IP bloqueado pela Binance. Mensagem: ${errorMsg}`;
      console.error(detailedError);
      throw new Error(`BINANCE_BLOCKED: ${errorMsg}`);
    }
    
    const errorFullMsg = `[BALANCE] Binance API error ${response.status}: ${JSON.stringify(data)}`;
    console.error(errorFullMsg);
    throw new Error(`Binance ${response.status}: ${errorMsg}`);
  }

  const dataTyped = data as { balances?: Array<{ asset: string; free: string; locked: string }>; assets?: Array<{ asset: string; availableBalance: string; walletBalance: string }> };
  
  const balancesCount = dataTyped.balances?.length || 0;
  const assetsCount = dataTyped.assets?.length || 0;
  const logRaw = `[BALANCE] Market: ${market}, Raw balances: ${balancesCount}, Raw assets: ${assetsCount}`;
  console.log(logRaw);
  
  // Log sample balances for debugging (first 3)
  if (dataTyped.balances && dataTyped.balances.length > 0) {
    const sample = dataTyped.balances.slice(0, 3).map(b => `${b.asset}: free=${b.free}, locked=${b.locked}`);
    console.log(`[BALANCE] Sample balances (first 3): ${sample.join('; ')}`);
  }
  
  if (market === 'FUTURES') {
    const assets = dataTyped.assets?.map((asset: { asset: string; availableBalance: string; walletBalance: string }) => ({
      asset: asset.asset,
      free: asset.availableBalance,
      locked: asset.walletBalance,
    })) || [];
    const logReturn = `[BALANCE] Returning ${assets.length} FUTURES assets (from ${assetsCount} total)`;
    console.log(logReturn);
    return assets;
  } else {
    const allBalances = dataTyped.balances || [];
    const nonZeroBalances = allBalances.filter((b: { free: string; locked: string }) => {
      const free = Number(b.free);
      const locked = Number(b.locked);
      return free > 0 || locked > 0;
    });
    const balances = nonZeroBalances.map((b: { asset: string; free: string; locked: string }) => ({
      asset: b.asset,
      free: b.free,
      locked: b.locked,
    }));
    const logReturn = `[BALANCE] Returning ${balances.length} SPOT balances (from ${balancesCount} total, ${nonZeroBalances.length} non-zero)`;
    console.log(logReturn);
    if (balances.length === 0 && allBalances.length > 0) {
      console.log(`[BALANCE] WARNING: All ${allBalances.length} balances are zero!`);
      // Log first 5 balances for debugging
      const first5 = allBalances.slice(0, 5).map(b => `${b.asset}: free=${b.free}, locked=${b.locked}`);
      console.log(`[BALANCE] First 5 balances: ${first5.join('; ')}`);
    }
    return balances;
  }
}

async function getPriceInUSDT(asset: string): Promise<number> {
  // Se já for USDT, retorna 1
  if (asset === 'USDT' || asset === 'BUSD') return 1;
  
  try {
    // Buscar preço no mercado spot da Binance
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${asset}USDT`);
    if (response.ok) {
      const data = await response.json();
      return Number(data.price);
    }
  } catch (error) {
    console.error(`Error fetching price for ${asset}:`, error);
  }
  
  // Se não encontrar o par direto, tentar outras moedas
  const alternatives = ['BUSD', 'BRL', 'BTC', 'ETH'];
  for (const alt of alternatives) {
    if (asset === alt) continue;
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${asset}${alt}`);
      if (response.ok) {
        const data = await response.json();
        const price = Number(data.price);
        
        // Se encontrou via BUSD/BRL, precisamos converter para USDT
        if (alt === 'BUSD') return price; // BUSD ~= USDT
        if (alt === 'BRL') {
          // Buscar cotação BRL/USDT
          const brlUsdt = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL')
            .then(r => r.json())
            .then(d => 1 / Number(d.price))
            .catch(() => 0.19); // Fallback
          return price * brlUsdt;
        }
        
        // Para BTC/ETH, buscar suas cotações em USDT
        if (alt === 'BTC' || alt === 'ETH') {
          const altUsdt = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${alt}USDT`)
            .then(r => r.json())
            .then(d => Number(d.price))
            .catch(() => 0);
          return price * altUsdt;
        }
        
        return price;
      }
    } catch (error) {
      console.error(`Error fetching price for ${asset}${alt}:`, error);
    }
  }
  
  return 0;
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromToken(req);
  const debugLogs: string[] = [];
  const currentRegion = preferredRegion;
  const regionLog = `[BALANCE] Running in region: ${currentRegion}`;
  console.log(regionLog);
  debugLogs.push(regionLog);
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Sync time sync uma vez
    const timeOffset = await getServerTimeOffset();
    const log1 = `[BALANCE] Starting with time offset: ${timeOffset}ms`;
    console.log(log1);
    debugLogs.push(log1);

    const accounts = await prisma.binanceAccount.findMany({
      where: { userId }
    });

    const log2 = `[BALANCE] Found ${accounts.length} accounts`;
    console.log(log2);
    debugLogs.push(log2);

    if (accounts.length === 0) {
      return Response.json({ 
        ok: true, 
        balance: '0',
        accounts: [],
        debug: { logs: debugLogs }
      });
    }

    // Buscar saldo de todas as contas
    const allBalances: { asset: string; total: number }[] = [];
    
    for (const account of accounts) {
      try {
        const log3 = `[BALANCE] Processing account: ${account.name} (${account.market})`;
        console.log(log3);
        debugLogs.push(log3);
        
        const apiKey = await decrypt(account.apiKeyEnc);
        const apiSecret = await decrypt(account.apiSecretEnc);
        
        // Log fingerprint sem expor a chave
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
        const log4 = `[BALANCE] Decrypted credentials hash: ${keyHash}`;
        console.log(log4);
        debugLogs.push(log4);
        
        debugLogs.push(`[BALANCE] About to call fetchBinanceBalance for ${account.market}`);
        
        const balances = await fetchBinanceBalance(apiKey, apiSecret, account.market, timeOffset);
        
        const log5 = `[BALANCE] Fetched ${balances.length} assets for ${account.name}`;
        console.log(log5);
        debugLogs.push(log5);
        
        if (balances.length > 0) {
          const log6 = `[BALANCE] Assets: ${balances.map(b => `${b.asset}(${Number(b.free) + Number(b.locked)})`).join(', ')}`;
          console.log(log6);
          debugLogs.push(log6);
        } else {
          debugLogs.push(`[BALANCE] WARNING: No assets returned from Binance API for ${account.name}`);
        }
        
        for (const bal of balances) {
          const existing = allBalances.find(b => b.asset === bal.asset);
          const total = Number(bal.free) + Number(bal.locked);
          
          if (existing) {
            existing.total += total;
          } else {
            allBalances.push({ asset: bal.asset, total });
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        const fullError = `[BALANCE] Error fetching balance for account ${account.name}: ${errorMsg}${errorStack ? `\nStack: ${errorStack}` : ''}`;
        console.error(fullError);
        
        // Tratar especificamente o erro 451 (Bloqueio de IP/Localização)
        if (errorMsg.includes('BINANCE_BLOCKED') || errorMsg.includes('451')) {
          debugLogs.push(`ERROR 451: Binance bloqueou esta requisição. A Vercel está em uma região bloqueada pela Binance.`);
          debugLogs.push(`SOLUÇÃO: Configure uma API Route em outra região ou use um proxy.`);
        } else {
          debugLogs.push(`ERROR: ${errorMsg}`);
        }
        
        if (errorStack) {
          debugLogs.push(`STACK: ${errorStack.split('\n').slice(0, 3).join(' -> ')}`);
        }
      }
    }
    
    const log7 = `[BALANCE] Total assets found: ${allBalances.length}`;
    console.log(log7);
    debugLogs.push(log7);
    
    if (allBalances.length > 0) {
      const log8 = `[BALANCE] Assets: ${allBalances.map(b => `${b.asset}: ${b.total}`).join(', ')}`;
      console.log(log8);
      debugLogs.push(log8);
    }

    // Se não tem assets, retorna zero (mas sempre retorna os accounts)
    if (allBalances.length === 0) {
      // Verificar se houve erro de bloqueio da Binance
      const hasBinanceBlock = debugLogs.some(log => log.includes('BINANCE_BLOCKED') || log.includes('451'));
      
      return Response.json({ 
        ok: true, 
        balance: '0',
        balanceUSDT: '0',
        exchangeRate: '5.37',
        assets: [],
        accounts: accounts.map(acc => ({ id: acc.id, name: acc.name })),
        error: hasBinanceBlock ? 'BINANCE_BLOCKED' : undefined,
        errorMessage: hasBinanceBlock 
          ? 'A Binance bloqueou esta requisição devido à localização da Vercel. Por favor, verifique as configurações de IP/região na Binance ou considere usar uma API Route em outra região.'
          : undefined,
        debug: {
          allBalancesLength: allBalances.length,
          accountsCount: accounts.length,
          region: currentRegion,
          logs: debugLogs
        }
      });
    }

    // Buscar cotação USDT/BRL
    let brlPerUsdt = 5.37; // Fallback
    try {
      const usdtBrlResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
      if (usdtBrlResponse.ok) {
        const data = await usdtBrlResponse.json();
        brlPerUsdt = Number(data.price);
      }
    } catch (error) {
      console.error('Error fetching USDT/BRL price:', error);
    }

    // Calcular valor total em USDT para cada ativo e depois em BRL
    let totalUSDT = 0;
    const assetsWithValue: { asset: string; amount: number; usdtValue: number; brlValue: number }[] = [];
    
    for (const bal of allBalances) {
      const priceInUSDT = await getPriceInUSDT(bal.asset);
      const usdtValue = bal.total * priceInUSDT;
      const brlValue = usdtValue * brlPerUsdt;
      
      totalUSDT += usdtValue;
      
      assetsWithValue.push({
        asset: bal.asset,
        amount: bal.total,
        usdtValue,
        brlValue
      });
    }

    const totalBRL = totalUSDT * brlPerUsdt;
    
    const log9 = `[BALANCE] Final calculation: ${totalUSDT.toFixed(8)} USDT = ${totalBRL.toFixed(2)} BRL`;
    console.log(log9);
    debugLogs.push(log9);

    return Response.json({ 
      ok: true, 
      balance: totalBRL.toFixed(2),
      balanceUSDT: totalUSDT.toFixed(8),
      exchangeRate: brlPerUsdt.toFixed(2),
      assets: assetsWithValue,
      accounts: accounts.map(acc => ({ id: acc.id, name: acc.name })),
      debug: {
        logs: debugLogs,
        allBalancesLength: allBalances.length,
        accountsCount: accounts.length,
        region: currentRegion
      }
    });
  } catch (error) {
    const errorMsg = `[BALANCE] FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    return Response.json({ 
      error: 'Internal server error',
      debug: {
        error: errorMsg,
        logs: debugLogs,
        region: currentRegion
      }
    }, { status: 500 });
  }
}

