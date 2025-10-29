"use client";
import InternalLayout from '@/components/InternalLayout';

export default function StatsPage() {
  return (
    <InternalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl text-white">Estatísticas</h1>
        <p className="text-slate-400">Relatórios e métricas detalhadas (em breve).</p>
        <div className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl p-6">
          <p className="text-slate-300">Aqui você verá win rate por período, drawdown, Sharpe, etc.</p>
        </div>
      </div>
    </InternalLayout>
  );
}


