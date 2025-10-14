import { prisma } from './prisma';
import { monthRange } from './format';
import { PaginatedResult, TradesQuery } from './types';
import { Prisma } from '@prisma/client';

export type TradeRow = {
  id: string;
  accountId: string;
  exchange: string;
  market: string;
  symbol: string;
  side: string;
  qty: string;
  price: string;
  feeValue: string;
  feeAsset: string;
  feePct: string;
  realizedPnl: string;
  orderId?: string | null;
  tradeId?: string | null;
  executedAt: Date;
};

function decToString(d: Prisma.Decimal | null | undefined): string {
  if (!d) return '0';
  try {
    return new Prisma.Decimal(d).toFixed();
  } catch {
    return '0';
  }
}

export async function getTrades(
  query: TradesQuery
): Promise<PaginatedResult<TradeRow>> {
  if (!query.month) throw new Error('month is required (YYYY-MM)');
  const { start, end } = monthRange(query.month);

  const where: Prisma.TradeWhereInput = {
    executedAt: { gte: start, lte: end },
    ...(query.market ? { market: query.market } : {}),
    ...(query.symbol ? { symbol: query.symbol } : {}),
  };

  const page = Math.max(1, Number(query.page ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 20)));

  const [total, trades] = await Promise.all([
    prisma.trade.count({ where }),
    prisma.trade.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Summary
  let pnl = new Prisma.Decimal(0);
  let fees = new Prisma.Decimal(0);
  let feePctSum = new Prisma.Decimal(0);
  let wins = 0;

  for (const t of trades) {
    const realized = new Prisma.Decimal(t.realizedPnl || 0);
    pnl = pnl.plus(realized);
    const feeVal = new Prisma.Decimal(t.feeValue || 0);
    fees = fees.plus(feeVal);
    feePctSum = feePctSum.plus(new Prisma.Decimal(t.feePct || 0));
    if (realized.greaterThan(0)) wins += 1;
  }

  const rows: TradeRow[] = trades.map((t) => ({
    id: t.id,
    accountId: t.accountId,
    exchange: t.exchange,
    market: t.market,
    symbol: t.symbol,
    side: t.side,
    qty: decToString(t.qty as unknown as Prisma.Decimal),
    price: decToString(t.price as unknown as Prisma.Decimal),
    feeValue: decToString(t.feeValue as unknown as Prisma.Decimal),
    feeAsset: t.feeAsset,
    feePct: decToString(t.feePct as unknown as Prisma.Decimal),
    realizedPnl: decToString(t.realizedPnl as unknown as Prisma.Decimal),
    orderId: t.orderId,
    tradeId: t.tradeId,
    executedAt: t.executedAt,
  }));

  const summary = {
    pnlMonth: pnl.toFixed(),
    feesTotal: fees.toFixed(),
    avgFeePct: (trades.length > 0
      ? feePctSum.dividedBy(trades.length)
      : new Prisma.Decimal(0)
    ).toFixed(),
    tradesCount: total,
    winRate: total > 0 ? wins / total : 0,
  };

  return { rows, total, summary };
}


