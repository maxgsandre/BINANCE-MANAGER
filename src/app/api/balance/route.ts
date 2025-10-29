import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import crypto from 'crypto';

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

function createSignature(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

async function fetchBinanceBalance(apiKey: string, apiSecret: string, market: string): Promise<{ asset: string; free: string; locked: string }[]> {
  const baseUrl = market === 'FUTURES' 
    ? 'https://fapi.binance.com' 
    : 'https://api.binance.com';
  
  const endpoint = market === 'FUTURES'
    ? '/fapi/v2/account'
    : '/api/v3/account';
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {};
  params.recvWindow = 5000;
  params.timestamp = Date.now();
  
  const queryString = new URLSearchParams(params).toString();
  const signature = createSignature(queryString, apiSecret);
  const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
  
  const response = await fetch(fullUrl, {
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Binance API error:', response.status, errorText);
    throw new Error(`Binance API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (market === 'FUTURES') {
    return data.assets?.map((asset: { asset: string; availableBalance: string; walletBalance: string }) => ({
      asset: asset.asset,
      free: asset.availableBalance,
      locked: asset.walletBalance,
    })) || [];
  } else {
    return data.balances?.filter((b: { free: string; locked: string }) => 
      Number(b.free) > 0 || Number(b.locked) > 0
    ).map((b: { asset: string; free: string; locked: string }) => ({
      asset: b.asset,
      free: b.free,
      locked: b.locked,
    })) || [];
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromToken(req);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accounts = await prisma.binanceAccount.findMany({
      where: { userId }
    });

    if (accounts.length === 0) {
      return Response.json({ 
        ok: true, 
        balance: '0',
        accounts: []
      });
    }

    // Buscar saldo de todas as contas
    const allBalances: { asset: string; total: number }[] = [];
    
    for (const account of accounts) {
      try {
        const apiKey = await decrypt(account.apiKeyEnc);
        const apiSecret = await decrypt(account.apiSecretEnc);
        const balances = await fetchBinanceBalance(apiKey, apiSecret, account.market);
        
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
        console.error(`Error fetching balance for account ${account.name}:`, error);
      }
    }

    // Calcular o saldo total em BRL (supondo que exista uma conversão)
    // Por enquanto, retorna apenas o saldo em USDT ou BUSD
    const usdtBalance = allBalances.find(b => b.asset === 'USDT' || b.asset === 'BUSD');
    const totalBalance = usdtBalance?.total || 0;

    return Response.json({ 
      ok: true, 
      balance: totalBalance.toFixed(2),
      assets: allBalances,
      accounts: accounts.map(acc => ({ id: acc.id, name: acc.name }))
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

