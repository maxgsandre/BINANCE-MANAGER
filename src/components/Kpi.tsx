import React from 'react';

export function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border rounded-md p-4 text-center">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}


