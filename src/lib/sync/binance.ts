// TODO: Implement real Binance sync with signed requests (HMAC-SHA256)
// Endpoints to use:
// - Spot trades: /api/v3/myTrades
// - Futures user trades: /fapi/v1/userTrades
// - Futures income (fees, realized pnl, funding): /fapi/v1/income
// Notes:
// - Authentication uses API key header and query signature (HMAC-SHA256 with secret).
// - Implement idempotency using unique keys (tradeId/orderId per exchange + market).
// - Handle pagination via fromId/startTime + loop until empty page.
// - Backoff on 429/418 and respect Binance weight limits.

export interface SyncResult {
  inserted: number;
  updated: number;
}

export async function syncAccount(account: { id: string; market: string }): Promise<SyncResult> {
  // Placeholder until real integration. This should:
  // 1) Decrypt credentials (later libsodium; for now, API will store Base64 temporarily).
  // 2) Fetch trades/cashflows from Binance.
  // 3) Upsert into Trade/Cashflow with idempotency.
  void account;
  return { inserted: 0, updated: 0 };
}


