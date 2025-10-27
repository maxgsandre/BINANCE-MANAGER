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
  side: string;
  qty?: string;
  quantity?: string;
  price: string;
  commission: string;
  commissionAsset: string;
  realizedPnl?: string;
  time: number;
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

  const queryString = new URLSearchParams(params).toString();
  const signature = await createSignature(queryString, apiSecret);
  const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;

  const response = await fetch(fullUrl, {
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  return response.json();
}

export async function syncAccount(account: { id: string; market: string }): Promise<SyncResult> {
  try {
    // Buscar conta no banco
    const acc = await prisma.binanceAccount.findUnique({
      where: { id: account.id },
    });

    if (!acc) {
      throw new Error('Account not found');
    }

    // Descriptografar credenciais
    const apiKey = await decrypt(acc.apiKeyEnc);
    const apiSecret = await decrypt(acc.apiSecretEnc);

    // Buscar trades dos últimos 90 dias
    const endTime = Date.now();
    const startTime = endTime - (90 * 24 * 60 * 60 * 1000); // 90 dias atrás

    // Buscar trades da Binance
    const trades = await fetchBinanceTrades(apiKey, apiSecret, account.market, undefined, startTime, endTime);

    let inserted = 0;
    const updated = 0;

    for (const trade of trades) {
      const tradeId = trade.id || `${trade.orderId}_${trade.symbol}`;
      
      try {
        await prisma.trade.upsert({
          where: { 
            id: `${acc.id}_${tradeId}` 
          },
          update: {
            qty: trade.qty || trade.quantity || '0',
            price: trade.price,
            feeValue: trade.commission,
            feeAsset: trade.commissionAsset,
            feePct: '0', // TODO: Calcular percentual de fee
            realizedPnl: trade.realizedPnl || '0',
            executedAt: new Date(trade.time),
            updatedAt: new Date(),
          },
          create: {
            id: `${acc.id}_${tradeId}`,
            accountId: acc.id,
            exchange: 'binance',
            market: account.market,
            symbol: trade.symbol,
            side: trade.side,
            qty: trade.qty || trade.quantity || '0',
            price: trade.price,
            feeValue: trade.commission,
            feeAsset: trade.commissionAsset,
            feePct: '0', // TODO: Calcular percentual de fee
            realizedPnl: trade.realizedPnl || '0',
            orderId: trade.orderId.toString(),
            tradeId: String(tradeId),
            executedAt: new Date(trade.time),
          },
        });
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


