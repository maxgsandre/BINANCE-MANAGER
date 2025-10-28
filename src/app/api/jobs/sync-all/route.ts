import { prisma } from '@/lib/prisma';
import { syncAccount } from '@/lib/sync/binance';

async function getUserIdFromToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  
  // Decode JWT token (simplificado - em produção use Firebase Admin)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.user_id || payload.uid || null;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Ler parâmetros do body
    const body = await request.json().catch(() => ({}));
    const startDate = body.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = body.endDate || new Date().toISOString().split('T')[0];
    const symbols = body.symbols || ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    
    // Tentar autenticação por usuário primeiro
    const authHeader = request.headers.get('authorization');
    const userId = await getUserIdFromToken(authHeader);
    
    // Se autenticação de usuário falhar, verificar se é cron job
    const cronSecret = process.env.VERCEL_CRON_SECRET;
    if (!userId && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = userId 
      ? await prisma.binanceAccount.findMany({ where: { userId } })
      : await prisma.binanceAccount.findMany({});
    
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
        const r = await syncAccount({ id: acc.id, market: acc.market }, startDate, endDate, symbols);
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


