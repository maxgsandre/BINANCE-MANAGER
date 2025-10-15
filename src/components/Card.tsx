import React from 'react';

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-md p-4 bg-white/50 dark:bg-black/20">
      {title ? <div className="font-semibold mb-2">{title}</div> : null}
      {children}
    </div>
  );
}


