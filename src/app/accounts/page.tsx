"use client";
import React, { useEffect, useState } from 'react';

type Account = { id: string; name: string; market: string; createdAt: string };

export default function AccountsPage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [market, setMarket] = useState('SPOT');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []));
  };

  useEffect(() => {
    refresh();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, market, apiKey, apiSecret }),
      });
      setName(''); setApiKey(''); setApiSecret(''); setMarket('SPOT');
      refresh();
    } finally {
      setLoading(false);
    }
  };

  const syncAll = async () => {
    setLoading(true);
    try {
      await fetch('/api/jobs/sync-all', { method: 'POST' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 border p-4 rounded">
        <div>
          <label className="block text-sm">Nome</label>
          <input className="border rounded w-full px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Market</label>
          <select className="border rounded w-full px-2 py-1" value={market} onChange={(e) => setMarket(e.target.value)}>
            <option value="SPOT">SPOT</option>
            <option value="FUTURES">FUTURES</option>
            <option value="BOTH">BOTH</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">API Key</label>
          <input className="border rounded w-full px-2 py-1" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">API Secret</label>
          <input className="border rounded w-full px-2 py-1" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} required />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <button className="border rounded px-3 py-1" disabled={loading} type="submit">Salvar</button>
          <button className="border rounded px-3 py-1" disabled={loading} type="button" onClick={syncAll}>Sincronizar agora</button>
        </div>
      </form>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left border-b p-2">Nome</th>
              <th className="text-left border-b p-2">Market</th>
              <th className="text-left border-b p-2">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.market}</td>
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


