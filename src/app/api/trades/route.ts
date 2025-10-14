import { NextRequest } from 'next/server';
import { getTrades } from '@/lib/trades';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || '';
  const market = searchParams.get('market') || undefined;
  const symbol = searchParams.get('symbol') || undefined;
  const page = Number(searchParams.get('page') || '1');
  const pageSize = Number(searchParams.get('pageSize') || '20');

  try {
    const data = await getTrades({ month, market, symbol, page, pageSize });
    return Response.json(data, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: err?.message || 'internal error' }, { status: 400 });
  }
}


