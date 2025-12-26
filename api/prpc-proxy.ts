// Local request/response types to avoid depending on '@vercel/node' types
type VercelRequest = { method?: string; body?: any; headers?: Record<string, string | undefined> };
type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: any) => void;
};

// Best-effort in-memory geo cache (ephemeral per instance)
const GEO_TTL_MS = 24 * 60 * 60 * 1000;
const geoCache = new Map<string, { region: string | null; expiresAt: number }>();

async function readRawBody(req: any) {
  return new Promise<string>((resolve, reject) => {
    let body = '';
    req.on?.('data', (c: any) => (body += c));
    req.on?.('end', () => resolve(body));
    req.on?.('error', (err: any) => reject(err));
  });
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const id = controller ? setTimeout(() => controller.abort(), timeout) : null;
  try {
    const merged = { ...options, signal: controller ? controller.signal : undefined } as RequestInit;
    const resp = await fetch(url, merged);
    if (id) clearTimeout(id as any);
    return resp;
  } catch (err) {
    if (id) clearTimeout(id as any);
    throw err;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow public browser access when frontend and API are same domain
  try {
    (res as any).setHeader?.('Access-Control-Allow-Origin', '*');
    (res as any).setHeader?.('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    (res as any).setHeader?.('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  } catch (e) {
    // ignore
  }

  if (req.method === 'OPTIONS') {
    res.status(204).json({});
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Read body (Vercel usually parses it, but be defensive)
  let body: any = req.body;
  if (!body) {
    try {
      const raw = await readRawBody(req as any);
      if (raw) body = JSON.parse(raw);
    } catch (e) {
      // ignore parse errors
    }
  }

  const { url, payload } = body || {};
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'bad_request', details: 'Missing url or payload in body' });
    return;
  }

  const maxAttempts = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const upstream = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 15000);

      const text = await upstream.text();

      try {
        const data = JSON.parse(text);

        // Geo enrichment: if pods present, try best-effort lookup and cache
        if (data && data.result && Array.isArray(data.result.pods)) {
          const pods = data.result.pods;
          const uniqueIps = new Set<string>();
          pods.forEach((p: any) => {
            if (p && p.address) {
              const ip = String(p.address).split(':')[0].replace(/\[|\]/g, '');
              if (ip) uniqueIps.add(ip);
            }
          });

          const lookups = Array.from(uniqueIps).map(async (ip) => {
            try {
              const cached = geoCache.get(ip);
              if (cached && cached.expiresAt > Date.now()) return { ip, region: cached.region };
              const geoResp = await fetchWithTimeout(`http://ip-api.com/json/${ip}?fields=country,regionName,city`, {}, 3500);
              const geoJson = await geoResp.json();
              const region = [geoJson.regionName, geoJson.country].filter(Boolean).join(', ');
              geoCache.set(ip, { region: region || null, expiresAt: Date.now() + GEO_TTL_MS });
              return { ip, region: region || null };
            } catch (err) {
              return { ip, region: null };
            }
          });

          const results = await Promise.allSettled(lookups);
          const regionMap = new Map<string, string>();
          results.forEach(r => {
            if (r.status === 'fulfilled' && r.value && r.value.region) regionMap.set(r.value.ip, r.value.region);
          });

          pods.forEach((p: any) => {
            if (p && p.address) {
              const ip = String(p.address).split(':')[0].replace(/\[|\]/g, '');
              if (regionMap.has(ip)) p.region = regionMap.get(ip);
            }
          });

          // aggregated region counts
          try {
            const regionCounts: Record<string, number> = {};
            pods.forEach((p: any) => {
              const r = p && p.region ? p.region : 'Unknown';
              regionCounts[r] = (regionCounts[r] || 0) + 1;
            });
            data.meta = data.meta || {};
            data.meta.regionCounts = regionCounts;
          } catch (err) {
            // ignore
          }
        }

        return res.status(upstream.status >= 400 ? 502 : 200).json(data);
      } catch (parseErr) {
        return res.status(502).json({ error: 'invalid_json', status: upstream.status, body: text.slice(0, 10000) });
      }
    } catch (err: any) {
      lastError = err;
      console.error(`Proxy error (attempt ${attempt}) for ${url}:`, err && err.message ? err.message : err);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 500));
    }
  }

  // All attempts failed
  return res.status(502).json({ error: 'proxy_failed', details: lastError && lastError.message ? lastError.message : String(lastError), code: lastError && lastError.code ? lastError.code : null });
}
