import { createHmac } from 'node:crypto';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function getServerTimeOffset(): Promise<number> {
  const res = await fetch('https://api.binance.com/api/v3/time', { cache: 'no-store' });
  const data = await res.json();
  return Number(data.serverTime) - Date.now();
}

export async function signedFetch(
  path: string,
  params: Record<string, string | number> = {},
  base = 'https://api.binance.com'
) {
  const KEY = requireEnv('BINANCE_API_KEY');
  const SECRET = requireEnv('BINANCE_API_SECRET');

  const offset = await getServerTimeOffset();
  const timestamp = Date.now() + offset;
  const recvWindow = 10000;

  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    timestamp: String(timestamp),
    recvWindow: String(recvWindow),
  });
  const signature = createHmac('sha256', SECRET).update(qs.toString()).digest('hex');
  qs.set('signature', signature);

  const res = await fetch(`${base}${path}?${qs.toString()}`, {
    headers: { 'X-MBX-APIKEY': KEY },
    cache: 'no-store',
  });

  const text = await res.text();
  let json: unknown;
  try { 
    json = JSON.parse(text); 
  } catch { 
    json = { raw: text }; 
  }

  if (!res.ok) throw new Error(`Binance ${res.status}: ${JSON.stringify(json)}`);
  return json as Record<string, unknown>;
}
