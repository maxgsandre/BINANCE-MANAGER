import { prisma } from '@/lib/prisma';
import { syncAccount } from '@/lib/sync/binance';

export async function POST(request: Request) {
  try {
    // Verificar se é uma chamada de cron job da Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.VERCEL_CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.binanceAccount.findMany({});
    
    if (accounts.length === 0) {
      return Response.json({ 
        ok: true, 
        message: 'No accounts found',
        results: [] 
      });
    }

    const results = [] as { accountId: string; name: string; inserted: number; updated: number; error?: string }[];
    
    for (const acc of accounts) {
      try {
        const r = await syncAccount({ id: acc.id, market: acc.market });
        results.push({ 
          accountId: acc.id, 
          name: acc.name,
          ...r 
        });
      } catch (error) {
        results.push({ 
          accountId: acc.id, 
          name: acc.name,
          inserted: 0, 
          updated: 0, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return Response.json({ 
      ok: true, 
      message: `Synced ${accounts.length} account(s)`,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


