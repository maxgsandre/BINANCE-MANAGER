import { Card } from '@/components/Card';
import { Kpi } from '@/components/Kpi';
import { PnlLineChart } from '@/components/PnlLineChart';
import InternalLayout from '@/components/InternalLayout';
import { headers } from 'next/headers';

type TradeRow = { executedAt: string | Date; realizedPnl: string };
type TradesResponse = {
  rows: TradeRow[];
  total: number;
  summary: { pnlMonth: string; feesTotal: string; avgFeePct: string; tradesCount: number; winRate: number };
};

async function fetchTrades(month: string): Promise<TradesResponse> {
  try {
    const h = await headers();
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const host = h.get('host') ?? 'localhost:3000';
    const url = `${proto}://${host}/api/trades?month=${encodeURIComponent(month)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed to fetch');
    return res.json();
  } catch (error) {
    // Fallback para produção
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    const url = `${baseUrl}/api/trades?month=${encodeURIComponent(month)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed to fetch');
    return res.json();
  }
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
    <InternalLayout>
      <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-white mb-2">Dashboard</h2>
          <p className="text-slate-400">Visão geral dos seus trades</p>
        </div>
        <button className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2 rounded-lg flex items-center gap-2">
          <span>📅</span>
          Período
          <span>⌄</span>
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Kpi 
          label="PnL Total" 
          value={`R$ ${summary.pnlMonth}`} 
          icon="💰" 
          color="blue"
          trend={Number(summary.pnlMonth) >= 0 ? 'up' : 'down'}
          trendValue={Number(summary.pnlMonth) >= 0 ? '+12.5%' : '-5.2%'}
        />
        <Kpi 
          label="ROI Acumulado" 
          value={`${(summary.winRate * 100).toFixed(1)}%`} 
          icon="📈" 
          color="green"
          trend={summary.winRate >= 0.5 ? 'up' : 'down'}
          trendValue={summary.winRate >= 0.5 ? '+2.1%' : '-1.8%'}
        />
        <Kpi 
          label="Token Futuro" 
          value={`R$ ${summary.feesTotal}`} 
          icon="📊" 
          color="purple"
          trend="up"
          trendValue="+5.8%"
        />
        <Kpi 
          label="Total de Trades" 
          value={summary.tradesCount} 
          icon="📊" 
          color="orange"
          trend="up"
          trendValue="+4 hoje"
        />
      </div>

      {/* PnL Chart */}
      <Card title="PnL Diário" icon="📊" subtitle="Evolução do lucro/prejuízo">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-slate-400">Últimos 30 dias</div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">Hoje</p>
              <p className="text-emerald-400 flex items-center gap-1">
                <span>↗️</span>
                R$ 70,00
              </p>
            </div>
          </div>
        </div>
        {daily.length > 0 ? (
          <PnlLineChart data={daily} />
        ) : (
          <div className="h-96 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Nenhum dado disponível</h3>
              <p className="text-slate-500">Adicione trades para ver o gráfico de PnL</p>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl border-white/10 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm hover:from-emerald-500/20 hover:to-emerald-500/10 transition-all duration-300 cursor-pointer group">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-xl">📈</span>
            </div>
            <div>
              <p className="text-white">Nova Operação</p>
              <p className="text-sm text-slate-400">Registrar trade</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm hover:from-blue-500/20 hover:to-blue-500/10 transition-all duration-300 cursor-pointer group">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <p className="text-white">Análise Detalhada</p>
              <p className="text-sm text-slate-400">Ver relatório</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm hover:from-purple-500/20 hover:to-purple-500/10 transition-all duration-300 cursor-pointer group">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-xl">💰</span>
            </div>
            <div>
              <p className="text-white">Gerenciar Carteira</p>
              <p className="text-sm text-slate-400">Adicionar fundos</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </InternalLayout>
  );
}


