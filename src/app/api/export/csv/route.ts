import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { monthRange } from '@/lib/format';

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    })
    .join(',');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || '';
  const market = searchParams.get('market') || undefined;
  const symbol = searchParams.get('symbol') || undefined;

  if (!month) return new Response('month query is required', { status: 400 });

  const { start, end } = monthRange(month);

  const where = {
    executedAt: { gte: start, lte: end },
    ...(market ? { market } : {}),
    ...(symbol ? { symbol } : {}),
  };

  const trades = await prisma.trade.findMany({ where, orderBy: { executedAt: 'asc' } });

  const headers = [
    'executedAt','exchange','market','symbol','side','qty','price','feeValue','feeAsset','feePct','realizedPnl','orderId','tradeId'
  ];

  const lines: string[] = [];
  lines.push(headers.join(','));
  for (const t of trades) {
    lines.push(
      toCsvRow([
        t.executedAt.toISOString(),
        t.exchange,
        t.market,
        t.symbol,
        t.side,
        String(t.qty),
        String(t.price),
        String(t.feeValue),
        t.feeAsset,
        String(t.feePct),
        String(t.realizedPnl),
        t.orderId ?? '',
        t.tradeId ?? '',
      ])
    );
  }

  const body = lines.join('\n');
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="trades_${month}.csv"`,
    },
  });
}


