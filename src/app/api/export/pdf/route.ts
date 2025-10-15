import { NextRequest } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { monthRange } from '@/lib/format';
// no Prisma.Decimal in this route; use native numbers

// pdfkit import será lazy para evitar puxar dependências pesadas no build

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || '';
  const market = searchParams.get('market') || undefined;
  const symbol = searchParams.get('symbol') || undefined;

  if (!month) return new Response('month query is required', { status: 400 });

  const { start, end, label } = monthRange(month);
  const where = {
    executedAt: { gte: start, lte: end },
    ...(market ? { market } : {}),
    ...(symbol ? { symbol } : {}),
  };

  const trades = await prisma.trade.findMany({ where });

  // Compute summary using native numbers
  const toNum = (v: unknown) => Number(v ?? 0);
  let pnl = 0;
  let fees = 0;
  for (const t of trades) {
    pnl += toNum(t.realizedPnl);
    fees += toNum(t.feeValue);
  }
  const tradesCount = trades.length;

  // Bankroll up to month end using cashflows (deposits - withdrawals)
  const cashflows = await prisma.cashflow.findMany({ where: { at: { lte: end } } });
  let bankroll = 0;
  for (const c of cashflows) {
    const amt = toNum(c.amount);
    if ((c.type || '').toUpperCase() === 'WITHDRAWAL') bankroll -= amt;
    else bankroll += amt;
  }
  const roi = bankroll === 0 ? 0 : pnl / bankroll;

  // Build PDF (lazy import, avoiding bundling)
  const PDFDocument = (await import('pdfkit').catch(() => ({ default: eval('require')("pdfkit") }))).default;
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
  doc.text(`PnL do mês: ${pnl.toFixed(2)}`);
  doc.text(`Taxas totais: ${fees.toFixed(2)}`);
  doc.text(`Trades: ${tradesCount}`);
  doc.text(`ROI (aprox.): ${(roi * 100).toFixed(2)}%`);
  doc.moveDown();

  doc.fontSize(14).text('Observações');
  doc.fontSize(10).list([
    'ROI usa caixa acumulada por Cashflow (depósitos - saques) até o fim do mês.',
    'Relatório não considera marcação a mercado; apenas realizedPnl.',
  ]);

  doc.end();

  const bodyBuf = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  return new Response(new Uint8Array(bodyBuf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report_${label}.pdf"`,
    },
  });
}


