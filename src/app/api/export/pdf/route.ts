import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { monthRange } from '@/lib/format';
import { Prisma } from '@prisma/client';

// pdfkit is CJS; import via require to avoid TS/ESM interop issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || '';
  const market = searchParams.get('market') || undefined;
  const symbol = searchParams.get('symbol') || undefined;

  if (!month) return new Response('month query is required', { status: 400 });

  const { start, end, label } = monthRange(month);
  const where: any = {
    executedAt: { gte: start, lte: end },
    ...(market ? { market } : {}),
    ...(symbol ? { symbol } : {}),
  };

  const trades = await prisma.trade.findMany({ where });

  // Compute summary
  let pnl = new Prisma.Decimal(0);
  let fees = new Prisma.Decimal(0);
  for (const t of trades) {
    pnl = pnl.plus(new Prisma.Decimal(t.realizedPnl || 0));
    fees = fees.plus(new Prisma.Decimal(t.feeValue || 0));
  }
  const tradesCount = trades.length;

  // Bankroll up to month end using cashflows (deposits - withdrawals)
  const cashflows = await prisma.cashflow.findMany({ where: { at: { lte: end } } });
  let bankroll = new Prisma.Decimal(0);
  for (const c of cashflows) {
    const amt = new Prisma.Decimal(c.amount || 0);
    if ((c.type || '').toUpperCase() === 'WITHDRAWAL') bankroll = bankroll.minus(amt);
    else bankroll = bankroll.plus(amt);
  }
  const roi = bankroll.equals(0) ? new Prisma.Decimal(0) : pnl.dividedBy(bankroll);

  // Build PDF
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  doc.fontSize(18).text('Relatório Mensal - Binance Manager', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Mês: ${label}`);
  if (market) doc.text(`Mercado: ${market}`);
  if (symbol) doc.text(`Símbolo: ${symbol}`);
  doc.moveDown();

  doc.fontSize(14).text('Resumo', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`PnL do mês: ${pnl.toFixed()}`);
  doc.text(`Taxas totais: ${fees.toFixed()}`);
  doc.text(`Trades: ${tradesCount}`);
  doc.text(`ROI (aprox.): ${roi.mul(100).toFixed(2)}%`);
  doc.moveDown();

  doc.fontSize(14).text('Observações');
  doc.fontSize(10).list([
    'ROI usa caixa acumulada por Cashflow (depósitos - saques) até o fim do mês.',
    'Relatório não considera marcação a mercado; apenas realizedPnl.',
  ]);

  doc.end();

  const body = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report_${label}.pdf"`,
    },
  });
}


