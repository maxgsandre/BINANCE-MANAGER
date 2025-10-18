import { Card } from '@/components/Card';
import { Kpi } from '@/components/Kpi';
import { Toolbar } from '@/components/Toolbar';
import { PnlLineChart } from '@/components/PnlLineChart';
import { headers } from 'next/headers';

type TradeRow = { executedAt: string | Date; realizedPnl: string };
type TradesResponse = {
  rows: TradeRow[];
  total: number;
  summary: { pnlMonth: string; feesTotal: string; avgFeePct: string; tradesCount: number; winRate: number };
};

async function fetchTrades(month: string): Promise<TradesResponse> {
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host') ?? 'localhost:3000';
  const url = `${proto}://${host}/api/trades?month=${encodeURIComponent(month)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('failed to fetch');
  return res.json();
}

function getMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function aggregateDaily(rows: TradeRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.executedAt).toISOString().slice(0, 10);
    const prev = map.get(d) || 0;
    map.set(d, prev + Number(r.realizedPnl || 0));
  }
  return Array.from(map.entries()).map(([date, pnl]) => ({ date, pnl }));
}

export default async function DashboardPage() {
  const month = getMonth();
  const data = await fetchTrades(month);

  const { summary, rows } = data;
  const daily = aggregateDaily(rows);

  return (
    <div className="space-y-6">
      <Toolbar>
        <form action="/dashboard" className="flex items-center gap-2">
          <label className="text-sm">Mês:</label>
          <input type="month" name="month" defaultValue={month} className="border rounded px-2 py-1" />
        </form>
      </Toolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="PnL" value={summary.pnlMonth} />
        <Kpi label="ROI (aprox)" value={`${(summary.winRate * 100).toFixed(0)}%`} />
        <Kpi label="Taxas" value={summary.feesTotal} />
        <Kpi label="Trades" value={summary.tradesCount} />
      </div>

      <Card title="PnL diário">
        <PnlLineChart data={daily} />
      </Card>
    </div>
  );
}


