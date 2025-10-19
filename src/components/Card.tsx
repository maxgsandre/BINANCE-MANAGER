import React from 'react';

type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: string;
  subtitle?: string;
};

export function Card({ title, children, className = '', icon, subtitle }: CardProps) {
  return (
    <div className={`relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:from-white/10 hover:to-white/5 transition-all duration-300 group rounded-xl ${className}`}>
      {/* Header */}
      {title && (
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white text-lg">{icon}</span>
                </div>
              )}
              <div>
                <h3 className="text-white">{title}</h3>
                {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}


