export const runtime = 'nodejs';
export const preferredRegion = 'gru1';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { signedFetch } from '@/lib/binance';

export async function GET() {
  try {
    console.log('BALANCE_API_START', { hasKey: !!process.env.BINANCE_API_KEY });

    const account = await signedFetch('/api/v3/account');
    const assets = ((account?.balances as Array<{ asset: string; free: string; locked: string }>) ?? [])
      .filter((a) => Number(a.free) > 0 || Number(a.locked) > 0)
      .map((a) => ({ asset: a.asset, free: a.free, locked: a.locked }));

    return NextResponse.json({ ok: true, assets, count: assets.length });
  } catch (e: unknown) {
    console.error('BINANCE_ERROR', String(e));
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
