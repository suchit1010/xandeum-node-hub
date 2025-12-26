// Local request/response types to avoid depending on '@vercel/node' types
type VercelRequest = { method?: string; body?: unknown; headers?: Record<string, string | undefined> };
type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader?: (name: string, value: string | number | string[]) => void;
};

type Pod = {
  address?: string | number;
  region?: string | null;
  [key: string]: unknown;
};

// Best-effort in-memory geo cache (ephemeral per instance)
const GEO_TTL_MS = 24 * 60 * 60 * 1000;
const geoCache = new Map<string, { region: string | null; expiresAt: number }>();

async function readRawBody(req: NodeJS.ReadableStream | { on?: (event: string, cb: (...args: unknown[]) => void) => void }) {
  return new Promise<string>((resolve, reject) => {
    let body = '';
    req.on?.('data', (c: unknown) => (body += typeof c === 'string' ? c : String(c)));
    req.on?.('end', () => resolve(body));
    req.on?.('error', (err: unknown) => reject(err));
  });
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const id: ReturnType<typeof setTimeout> | null = controller ? setTimeout(() => controller.abort(), timeout) : null;
  try {
    const merged = { ...options, signal: controller ? controller.signal : undefined } as RequestInit;
    const resp = await fetch(url, merged);
    if (id !== null) clearTimeout(id);
    return resp;
  } catch (err) {
    if (id !== null) clearTimeout(id);
    throw err;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow public browser access when frontend and API are same domain
  try {
    res.setHeader?.('Access-Control-Allow-Origin', '*');
    res.setHeader?.('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type,Authorization');
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
  let body: unknown = req.body;
  if (!body) {
    try {
      const raw = await readRawBody(req as NodeJS.ReadableStream);
      if (raw) body = JSON.parse(raw) as unknown;
    } catch (e) {
      // ignore parse errors
    }
  }

  const parsedBody = body as Record<string, unknown> | undefined;
  const { url, payload } = parsedBody || {};
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'bad_request', details: 'Missing url or payload in body' });
    return;
  }

    const maxAttempts = 2;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Proxy attempt ${attempt} -> ${url}`);
        const upstream = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, 20000);

        const text = await upstream.text();
        // Log a small snippet to help diagnose upstream shapes
        try {
          const snippet = (typeof text === 'string' && text.length > 0) ? text.slice(0, 1000) : text;
          console.debug(`Upstream response for ${url}: status=${upstream.status}, snippet=${snippet}`);
        } catch (e) { /* ignore logging errors */ }

        try {
          const data = JSON.parse(text);

          // Geo enrichment: if pods present, try lookup and cache
          if (data && data.result && Array.isArray(data.result.pods)) {
            const pods = data.result.pods as Pod[];
            const uniqueIps = new Set<string>();
            pods.forEach((p: Pod) => {
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

            try {
              const results = await Promise.allSettled(lookups);
              const regionMap = new Map<string, string>();
              results.forEach(r => {
                if (r.status === 'fulfilled' && r.value && r.value.region) regionMap.set(r.value.ip, r.value.region);
              });
              pods.forEach((p: Pod) => {
                if (p && p.address) {
                  const ip = String(p.address).split(':')[0].replace(/\[|\]/g, '');
                  if (regionMap.has(ip)) p.region = regionMap.get(ip);
                }
              });
              // aggregated region counts
              try {
                const regionCounts: Record<string, number> = {};
                pods.forEach((p: Pod) => {
                  const r = p && p.region ? p.region : 'Unknown';
                  regionCounts[r] = (regionCounts[r] || 0) + 1;
                });
                data.meta = data.meta || {};
                data.meta.regionCounts = regionCounts;
              } catch (err) { /* ignore */ }
            } catch (err) { /* ignore geo enrichment failures */ }
          }

          return res.status(upstream.status >= 400 ? 502 : 200).json(data);
        } catch (parseErr) {
          // Non-JSON upstream body — return raw text for debugging
          return res.status(502).json({ error: 'invalid_json', status: upstream.status, body: (typeof text === 'string' ? text.slice(0, 10000) : text) });
        }
      } catch (err: unknown) {
        lastError = err;
        const logged = (typeof err === 'object' && err !== null && 'message' in err) ? (err as { message?: unknown }).message : err;
        console.error(`Proxy error (attempt ${attempt}) for ${url}:`, logged);
        if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 500));
      }
    }

    // All attempts failed
    {
      let details: string;
      let code: unknown | null = null;
      if (lastError && typeof lastError === 'object' && lastError !== null) {
        const errObj = lastError as { message?: unknown; code?: unknown };
        details = typeof errObj.message === 'string' ? errObj.message : String(lastError);
        code = errObj.code ?? null;
      } else {
        details = String(lastError);
      }
      return res.status(502).json({ error: 'proxy_failed', details, code });
    }
}
