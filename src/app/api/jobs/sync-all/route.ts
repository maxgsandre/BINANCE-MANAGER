import { prisma } from '@/lib/prisma';
import { syncAccount } from '@/lib/sync/binance';

export async function POST() {
  const accounts = await prisma.account.findMany({});
  const results = [] as { accountId: string; inserted: number; updated: number }[];
  for (const acc of accounts) {
    const r = await syncAccount({ id: acc.id, market: acc.market });
    results.push({ accountId: acc.id, ...r });
  }
  return Response.json({ ok: true, results });
}


