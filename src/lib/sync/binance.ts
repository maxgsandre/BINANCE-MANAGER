import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import crypto from 'crypto';

export interface SyncResult {
  inserted: number;
  updated: number;
}

async function createSignature(queryString: string, secret: string): Promise<string> {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

interface BinanceTrade {
  id?: number;
  orderId: number;
  symbol: string;
  side?: string; // Obrigatório em FUTURES, opcional em SPOT
  qty?: string;
  quantity?: string;
  price: string;
  commission: string;
  commissionAsset: string;
  realizedPnl?: string;
  time: number;
  isBuyer?: boolean; // Usado em SPOT para determinar se comprou ou vendeu
  isMaker?: boolean;
}

async function fetchBinanceTrades(
  apiKey: string,
  apiSecret: string,
  market: string,
  symbol?: string,
  startTime?: number,
  endTime?: number
): Promise<BinanceTrade[]> {
  const baseUrl = market === 'FUTURES' 
    ? 'https://fapi.binance.com' 
    : 'https://api.binance.com';
  
  const endpoint = market === 'FUTURES'
    ? '/fapi/v1/userTrades'
    : '/api/v3/myTrades';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {};
  if (symbol) params.symbol = symbol;
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;
  params.limit = 1000;
  params.recvWindow = 5000;
  params.timestamp = Date.now();

  const queryString = new URLSearchParams(params).toString();
  const signature = await createSignature(queryString, apiSecret);
  const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
  
  console.log('Binance request:', fullUrl.substring(0, 100) + '...');

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

  return response.json();
}

export async function syncAccount(
  account: { id: string; market: string }, 
  startDate: string = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
  endDate: string = new Date().toISOString().split('T')[0], 
  symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
): Promise<SyncResult> {
  try {
    // Buscar conta no banco
    console.log('Buscando conta:', account.id);
    const acc = await prisma.binanceAccount.findUnique({
      where: { id: account.id },
    });

    if (!acc) {
      console.error('Conta não encontrada:', account.id);
      const allAccounts = await prisma.binanceAccount.findMany();
      console.log('Todas as contas:', allAccounts.map(a => ({ id: a.id, name: a.name })));
      throw new Error('Account not found');
    }
    
    console.log('Conta encontrada:', { name: acc.name, id: acc.id, userId: acc.userId });
    console.log('Verificando se a conta existe no banco...');
    const verifyAccount = await prisma.binanceAccount.findUnique({ where: { id: acc.id } });
    console.log('Verificação:', verifyAccount ? 'EXISTE' : 'NÃO EXISTE');

    // Descriptografar credenciais
    const apiKey = await decrypt(acc.apiKeyEnc);
    const apiSecret = await decrypt(acc.apiSecretEnc);

    // Converter datas para timestamps
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate + 'T23:59:59').getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let allTrades: BinanceTrade[] = [];
    
    // Buscar dia por dia para respeitar limite de 24h da API
    for (let currentStart = startTimestamp; currentStart < endTimestamp; currentStart += oneDayMs) {
      const currentEnd = Math.min(currentStart + oneDayMs, endTimestamp);
      
      for (const symbol of symbols) {
        try {
        console.log(`Buscando trades para ${symbol} de ${new Date(currentStart).toISOString().split('T')[0]}...`);
        const trades = await fetchBinanceTrades(apiKey, apiSecret, account.market, symbol, currentStart, currentEnd);
        console.log(`API retornou ${trades.length} trades para ${symbol}`);
        if (trades.length > 0) {
          console.log('Exemplo de trade completo:', trades[0]);
        }
        allTrades = allTrades.concat(trades);
        } catch (error) {
          console.error(`Erro ao buscar trades para ${symbol}:`, error);
        }
      }
    }

    let inserted = 0;
    const updated = 0;

    for (const trade of allTrades) {
      const tradeId = trade.id || `${trade.orderId}_${trade.symbol}`;
      // Se não vier side direto da API, tentar inferir de isBuyer
      let side = trade.side;
      if (!side && trade.isBuyer !== undefined) {
        side = trade.isBuyer ? 'BUY' : 'SELL';
      }
      // Fallback final
      if (!side) {
        side = 'BUY';
      }
      
      console.log('Trade:', { 
        symbol: trade.symbol, 
        sideOriginal: trade.side,
        isBuyer: trade.isBuyer,
        sideFinal: side,
        orderId: trade.orderId 
      });
      
      try {
        console.log('Tentando salvar trade com accountId:', acc.id);
        
        // Verificar se o trade já existe
        const existingTrade = await prisma.trade.findUnique({
          where: { id: `${acc.id}_${tradeId}` }
        });
        
        if (existingTrade) {
          await prisma.trade.update({
            where: { id: `${acc.id}_${tradeId}` },
            data: {
              side: side,
              qty: trade.qty || trade.quantity || '0',
              price: trade.price,
              feeValue: trade.commission,
              feeAsset: trade.commissionAsset,
              feePct: '0',
              realizedPnl: trade.realizedPnl || '0',
              executedAt: new Date(trade.time),
            }
          });
        } else {
          await prisma.trade.create({
            data: {
              id: `${acc.id}_${tradeId}`,
              accountId: acc.id,
              exchange: 'binance',
              market: account.market,
              symbol: trade.symbol,
              side: side,
              qty: trade.qty || trade.quantity || '0',
              price: trade.price,
              feeValue: trade.commission,
              feeAsset: trade.commissionAsset,
              feePct: '0', // TODO: Calcular percentual de fee
              realizedPnl: trade.realizedPnl || '0',
              orderId: trade.orderId.toString(),
              tradeId: String(tradeId),
              executedAt: new Date(trade.time),
            }
          });
        }
        inserted++;
      } catch (error) {
        console.error('Error upserting trade:', error);
      }
    }

    return { inserted, updated };
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}


