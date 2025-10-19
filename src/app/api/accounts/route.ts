import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const accounts = await prisma.binanceAccount.findMany({ orderBy: { createdAt: 'desc' } });
  return Response.json({ rows: accounts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name: string = body?.name;
  const market: string = body?.market;
  const apiKey: string = body?.apiKey;
  const apiSecret: string = body?.apiSecret;

  if (!name || !market || !apiKey || !apiSecret) {
    return Response.json({ error: 'name, market, apiKey, apiSecret required' }, { status: 400 });
  }

  // Temporariamente armazenar Base64 (TODO: substituir por libsodium)
  const apiKeyEnc = Buffer.from(apiKey, 'utf8').toString('base64');
  const apiSecretEnc = Buffer.from(apiSecret, 'utf8').toString('base64');

  // TODO: Obter userId da sessão autenticada
  const userId = 'temp-user-id'; // Placeholder até implementar autenticação

  const acc = await prisma.binanceAccount.create({
    data: { userId, name, market, apiKeyEnc, apiSecretEnc },
  });
  return Response.json({ ok: true, account: acc }, { status: 201 });
}


