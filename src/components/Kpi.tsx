import React from 'react';

type KpiProps = {
  label: string;
  value: React.ReactNode;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  trendValue?: string;
};

export function Kpi({ label, value, icon, trend = 'neutral', color = 'blue', trendValue }: KpiProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-green-500',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-amber-500',
  };

  const bgColors = {
    blue: 'from-blue-500/10 to-cyan-500/10',
    green: 'from-emerald-500/10 to-green-500/10',
    red: 'from-red-500/10 to-red-600/10',
    purple: 'from-purple-500/10 to-pink-500/10',
    orange: 'from-orange-500/10 to-amber-500/10',
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '➡️',
  };

  return (
    <div className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:from-white/10 hover:to-white/5 transition-all duration-300 group rounded-xl">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColors[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative p-6">
        {/* Icon & Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <span className="text-white text-xl">{icon}</span>
          </div>
          {trendValue && (
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
              trend === 'up' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
              trend === 'down' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {trendIcons[trend]} {trendValue}
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        
        {/* Value */}
        <p className="text-white text-2xl tracking-tight">{value}</p>
      </div>
    </div>
  );
}


