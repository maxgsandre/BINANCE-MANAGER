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

// Função para calcular ROI por trade (simplificado)
function calculateTradeROI(realizedPnl: string, qty: string, price: string): number {
  const pnl = Number(realizedPnl || 0);
  const quantity = Number(qty || 0);
  const tradePrice = Number(price || 0);
  const tradeValue = quantity * tradePrice;
  return tradeValue === 0 ? 0 : (pnl / tradeValue) * 100;
}

// Função para formatar valores
function formatCurrency(value: string | number): string {
  const num = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Função para calcular drawdown (maior sequência de perdas)
function calculateDrawdown(trades: TradeRow[]): { maxDrawdown: number; currentDrawdown: number } {
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  let peak = 0;
  let runningPnL = 0;

  for (const trade of trades) {
    runningPnL += Number(trade.realizedPnl);
    if (runningPnL > peak) {
      peak = runningPnL;
      currentDrawdown = 0;
    } else {
      currentDrawdown = peak - runningPnL;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }
  }

  return { maxDrawdown, currentDrawdown };
}

// Função para calcular volume total
function calculateVolume(qty: string, price: string): number {
  return Number(qty || 0) * Number(price || 0);
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

function getMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Função para obter período baseado na seleção
function getPeriodFilter(period: string): string {
  const now = new Date();
  switch (period) {
    case 'today':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    case 'month':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    case 'year':
      return `${now.getFullYear()}`;
    default:
      return getMonth();
  }
}

export default function TradesPage() {
  const [month, setMonth] = useState(getMonth());
  const [period, setPeriod] = useState('month');
  const [market, setMarket] = useState('');
  const [symbol, setSymbol] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<TradeRow[]>([]);

  useEffect(() => {
    const currentMonth = period === 'custom' ? month : getPeriodFilter(period);
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
    const params = new URLSearchParams({ month: currentMonth, page: String(page), pageSize: String(pageSize) });
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
  }, [month, period, market, symbol, page, pageSize]);

  const columnHelper = createColumnHelper<TradeRow>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('executedAt', { 
        header: '📅 Data/Hora',
        cell: ({ getValue }) => formatDateTime(getValue())
      }),
      columnHelper.accessor('symbol', { 
        header: '💰 Par Moeda',
        cell: ({ getValue }) => (
          <span className="font-mono font-semibold text-blue-600">{getValue()}</span>
        )
      }),
      columnHelper.accessor('side', { 
        header: '📊 Operação',
        cell: ({ getValue }) => {
          const side = getValue();
          const isBuy = side === 'BUY' || side === 'LONG';
          return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              isBuy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {side}
            </span>
          );
        }
      }),
      columnHelper.accessor('qty', { 
        header: '📈 Quantidade',
        cell: ({ getValue }) => (
          <span className="font-mono">{Number(getValue()).toFixed(8)}</span>
        )
      }),
      columnHelper.accessor('price', { 
        header: '💵 Preço',
        cell: ({ getValue }) => (
          <span className="font-mono">{formatCurrency(getValue())}</span>
        )
      }),
      columnHelper.accessor('feeValue', { 
        header: '💸 Taxa',
        cell: ({ getValue, row }) => (
          <div className="text-sm">
            <div className="font-mono">{formatCurrency(getValue())}</div>
            <div className="text-xs text-gray-500">{row.original.feeAsset}</div>
          </div>
        )
      }),
      columnHelper.display({
        id: 'volume',
        header: '💎 Volume',
        cell: ({ row }) => {
          const volume = calculateVolume(row.original.qty, row.original.price);
          return (
            <span className="font-mono font-semibold text-purple-600">
              {formatCurrency(volume)}
            </span>
          );
        }
      }),
      columnHelper.accessor('realizedPnl', { 
        header: '📊 PnL',
        cell: ({ getValue }) => {
          const pnl = Number(getValue());
          return (
            <span className={`font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(pnl)}
            </span>
          );
        }
      }),
      columnHelper.display({
        id: 'roi',
        header: '🎯 ROI',
        cell: ({ row }) => {
          const roi = calculateTradeROI(row.original.realizedPnl, row.original.qty, row.original.price);
          return (
            <span className={`font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(roi)}
            </span>
          );
        }
      }),
      columnHelper.accessor('market', { 
        header: '🏪 Mercado',
        cell: ({ getValue }) => (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            {getValue()}
          </span>
        )
      }),
      columnHelper.accessor('tradeId', { 
        header: '🆔 Trade ID',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-gray-500">
            {getValue()?.slice(-8) || '-'}
          </span>
        )
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <Toolbar>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">⏰ Período</label>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">📅 Hoje</option>
            <option value="week">📆 Esta Semana</option>
            <option value="month">📅 Este Mês</option>
            <option value="year">📅 Este Ano</option>
            <option value="custom">🔧 Personalizado</option>
          </select>
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">📅 Mês</label>
            <input 
              type="month" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)} 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">🏪 Market</label>
          <input 
            value={market} 
            onChange={(e) => setMarket(e.target.value)} 
            placeholder="SPOT/FUTURES" 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">💰 Symbol</label>
          <input 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)} 
            placeholder="e.g. BTCUSDT" 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
        <a 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors" 
          href={`/api/export/csv?month=${period === 'custom' ? month : getPeriodFilter(period)}&market=${market}&symbol=${symbol}`}
        >
          📊 Export CSV
        </a>
        <a 
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors" 
          href={`/api/export/pdf?month=${period === 'custom' ? month : getPeriodFilter(period)}&market=${market}&symbol=${symbol}`}
        >
          📄 Export PDF
        </a>
      </Toolbar>

      {/* Métricas extras */}
      {rows.length > 0 && (
        <div className="space-y-4">
          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(rows.reduce((sum, r) => sum + Number(r.realizedPnl), 0))}
              </div>
              <div className="text-sm text-gray-600">PnL Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rows.filter(r => Number(r.realizedPnl) > 0).length}
              </div>
              <div className="text-sm text-gray-600">Trades Vencedores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {rows.filter(r => Number(r.realizedPnl) < 0).length}
              </div>
              <div className="text-sm text-gray-600">Trades Perdedores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(rows.reduce((sum, r) => sum + Number(r.feeValue), 0))}
              </div>
              <div className="text-sm text-gray-600">Taxas Totais</div>
            </div>
          </div>

          {/* Métricas avançadas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(rows.reduce((sum, r) => sum + calculateVolume(r.qty, r.price), 0))}
              </div>
              <div className="text-sm text-gray-600">Volume Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {rows.length > 0 ? ((rows.filter(r => Number(r.realizedPnl) > 0).length / rows.length) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rows.length > 0 ? formatCurrency(Math.max(...rows.map(r => Number(r.realizedPnl)))) : 'R$ 0,00'}
              </div>
              <div className="text-sm text-gray-600">Melhor Trade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {rows.length > 0 ? formatCurrency(Math.min(...rows.map(r => Number(r.realizedPnl)))) : 'R$ 0,00'}
              </div>
              <div className="text-sm text-gray-600">Pior Trade</div>
            </div>
          </div>

          {/* Métricas de risco */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(calculateDrawdown(rows).maxDrawdown)}
              </div>
              <div className="text-sm text-gray-600">Max Drawdown</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {formatCurrency(calculateDrawdown(rows).currentDrawdown)}
              </div>
              <div className="text-sm text-gray-600">Drawdown Atual</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="text-left px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((r, index) => (
                <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="px-4 py-3 text-sm">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <button 
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50" 
            disabled={page <= 1} 
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
            Página {page} de {totalPages}
          </span>
          <button 
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50" 
            disabled={page >= totalPages} 
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Próximo →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Itens por página:</label>
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            value={pageSize} 
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
}


