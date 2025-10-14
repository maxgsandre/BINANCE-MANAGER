export type MarketType = 'SPOT' | 'FUTURES' | 'BOTH';

export interface TradesQuery {
  month: string; // YYYY-MM
  market?: MarketType | string;
  symbol?: string;
  page?: number;
  pageSize?: number;
}

export interface TradesSummary {
  pnlMonth: string; // decimal as string to avoid fp issues
  feesTotal: string;
  avgFeePct: string;
  tradesCount: number;
  winRate: number; // 0..1
}

export interface PaginatedResult<Row> {
  rows: Row[];
  total: number;
  summary: TradesSummary;
}


