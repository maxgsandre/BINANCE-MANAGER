import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

async function getUserIdFromToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
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

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromToken(req);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.binanceAccount.findMany({ 
    where: { userId },
    orderBy: { createdAt: 'desc' } 
  });
  return Response.json({ ok: true, message: accounts.length > 0 ? `${accounts.length} accounts found` : 'No accounts found', results: accounts });
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromToken(req);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name: string = body?.name;
  const market: string = body?.market;
  const apiKey: string = body?.apiKey;
  const apiSecret: string = body?.apiSecret;

  if (!name || !market || !apiKey || !apiSecret) {
    return Response.json({ error: 'name, market, apiKey, apiSecret required' }, { status: 400 });
  }

  // Criptografar as chaves com libsodium
  const apiKeyEnc = await encrypt(apiKey);
  const apiSecretEnc = await encrypt(apiSecret);

  // Criar ou sincronizar usuário no Prisma se não existir
  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: '', // Será atualizado quando tivermos a sessão completa
        name: '',
      },
    });
  } catch (error) {
    console.error('User sync error:', error);
  }

  const acc = await prisma.binanceAccount.create({
    data: { 
      userId, 
      name, 
      market, 
      apiKeyEnc, 
      apiSecretEnc
    },
  });
  return Response.json({ ok: true, account: acc }, { status: 201 });
}


