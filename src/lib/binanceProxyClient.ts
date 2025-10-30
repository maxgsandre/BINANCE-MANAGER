export function getProxyUrl(): string | null {
  const url = process.env.BINANCE_PROXY_URL;
  if (!url || url.trim().length === 0) return null;
  return url.replace(/\/$/, '');
}

export async function proxyGet<T>(path: string, authHeader?: string): Promise<T> {
  const baseUrl = getProxyUrl();
  if (!baseUrl) {
    throw new Error('Proxy URL not configured');
  }
  const res = await fetch(`${baseUrl}${path}`, {
    headers: authHeader ? { Authorization: authHeader } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Proxy error ${res.status}: ${text}`);
  }
  return res.json();
}


