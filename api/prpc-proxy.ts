// Local request/response types to avoid depending on '@vercel/node' types
type VercelRequest = { method?: string; body?: any; headers?: Record<string, string | undefined> };
type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: any) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS for browser clients (adjust origin for production)
  try {
    (res as any).setHeader('Access-Control-Allow-Origin', '*');
    (res as any).setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    (res as any).setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  } catch (e) {
    // setHeader may not exist on some runtime typings — ignore in that case
  }

  if (req.method === 'OPTIONS') {
    res.status(204).json({});
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const { url, payload, method = 'POST', headers: forwardHeaders } = body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing or invalid `url` in request body' });
      return;
    }

    // Timeout / abort support
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutMs = 25000;
    let timeoutId: NodeJS.Timeout | null = null;
    if (controller) timeoutId = setTimeout(() => controller.abort(), timeoutMs) as any;

    const fetchOptions: any = {
      method: method.toUpperCase(),
      headers: { 'Content-Type': 'application/json', ...(forwardHeaders || {}) },
      signal: controller ? controller.signal : undefined,
    };

    if (payload !== undefined && method.toUpperCase() !== 'GET') {
      fetchOptions.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    const upstream = await fetch(url, fetchOptions as RequestInit);
    if (timeoutId) clearTimeout(timeoutId);

    const contentType = upstream.headers.get('content-type') || '';
    let data: any;
    if (contentType.includes('application/json')) {
      try {
        data = await upstream.json();
      } catch (e) {
        data = await upstream.text();
      }
    } else {
      data = await upstream.text();
    }

    // Mirror status where possible, but wrap body so we always return valid JSON to caller
    res.status(upstream.status || 200).json({ ok: upstream.ok, status: upstream.status, data });
  } catch (err: any) {
    const details = err?.name === 'AbortError' ? 'Request timed out' : err?.message || String(err);
    res.status(500).json({ error: 'Proxy failed', details });
  }
}
