"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

type TradeRow = {
  executedAt: string;
  exchange: string;
  market: string;
  symbol: string;
  side: string;
  qty: string;
  price: string;
  feeValue: string;
  feeAsset: string;
  feePct: string;
  realizedPnl: string;
  orderId?: string;
  tradeId?: string;
};

function getMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function TradesPage() {
  const [month, setMonth] = useState(getMonth());
  const [market, setMarket] = useState('');
  const [symbol, setSymbol] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<TradeRow[]>([]);

  useEffect(() => {
    type ApiTrade = {
      executedAt: string | Date;
      exchange: string;
      market: string;
      symbol: string;
      side: string;
      qty: string;
      price: string;
      feeValue: string;
      feeAsset: string;
      feePct: string;
      realizedPnl: string;
      orderId?: string | null;
      tradeId?: string | null;
    };
    const params = new URLSearchParams({ month, page: String(page), pageSize: String(pageSize) });
    if (market) params.set('market', market);
    if (symbol) params.set('symbol', symbol);
    fetch(`/api/trades?${params.toString()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { total: number; rows: ApiTrade[] }) => {
        setTotal(d.total);
        setRows(
          d.rows.map((t: ApiTrade) => ({
            executedAt: new Date(t.executedAt).toISOString(),
            exchange: t.exchange,
            market: t.market,
            symbol: t.symbol,
            side: t.side,
            qty: t.qty,
            price: t.price,
            feeValue: t.feeValue,
            feeAsset: t.feeAsset,
            feePct: t.feePct,
            realizedPnl: t.realizedPnl,
            orderId: t.orderId ?? undefined,
            tradeId: t.tradeId ?? undefined,
          }))
        );
      });
  }, [month, market, symbol, page, pageSize]);

  const columnHelper = createColumnHelper<TradeRow>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('executedAt', { header: 'executedAt' }),
      columnHelper.accessor('exchange', { header: 'exchange' }),
      columnHelper.accessor('market', { header: 'market' }),
      columnHelper.accessor('symbol', { header: 'symbol' }),
      columnHelper.accessor('side', { header: 'side' }),
      columnHelper.accessor('qty', { header: 'qty' }),
      columnHelper.accessor('price', { header: 'price' }),
      columnHelper.accessor('feeValue', { header: 'feeValue' }),
      columnHelper.accessor('feeAsset', { header: 'feeAsset' }),
      columnHelper.accessor('feePct', { header: 'feePct' }),
      columnHelper.accessor('realizedPnl', { header: 'realizedPnl' }),
      columnHelper.accessor('orderId', { header: 'orderId' }),
      columnHelper.accessor('tradeId', { header: 'tradeId' }),
    ],
    [columnHelper]
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="flex items-center gap-2">
          <label className="text-sm">Mês</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Market</label>
          <input value={market} onChange={(e) => setMarket(e.target.value)} placeholder="SPOT/FUTURES" className="border rounded px-2 py-1" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Symbol</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g. BTCUSDT" className="border rounded px-2 py-1" />
        </div>
        <a className="border rounded px-3 py-1" href={`/api/export/csv?month=${month}&market=${market}&symbol=${symbol}`}>Export CSV</a>
        <a className="border rounded px-3 py-1" href={`/api/export/pdf?month=${month}&market=${market}&symbol=${symbol}`}>Export PDF</a>
      </Toolbar>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left border-b p-2">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="border-b">
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="p-2">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button className="border rounded px-2 py-1" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <div>Page {page} / {totalPages}</div>
        <button className="border rounded px-2 py-1" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        <select className="border rounded px-2 py-1" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}


