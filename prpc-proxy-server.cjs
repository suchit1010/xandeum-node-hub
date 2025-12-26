const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// Simple CORS middleware so browsers can call this service from other origins
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Simple in-memory geo cache: ip -> { region, expiresAt }
const GEO_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const geoCache = new Map();

// Helper: fetch with timeout using AbortController
async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const merged = { ...options, signal: controller.signal };
    const resp = await fetch(url, merged);
    clearTimeout(id);
    return resp;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Try fetch with simple retries and clearer error responses
app.post('/api/prpc-proxy', async (req, res) => {
  const { url, payload } = req.body || {};
  if (!url || !payload) {
    return res.status(400).json({ error: 'bad_request', details: 'Missing url or payload in body' });
  }

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Proxy attempt ${attempt} -> ${url}`);
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 15000);

      const text = await response.text();
      // Server-side debug: log upstream response status and small body snippet to help diagnose failures
      try {
        const snippet = (typeof text === 'string' && text.length > 0) ? text.slice(0, 1000) : text;
        console.debug(`Upstream response for ${url}: status=${response.status}, snippet=${snippet}`);
      } catch (logErr) {
        // ignore logging errors
      }

      // Try parse JSON, but if remote returns non-json, return raw text for debugging
      try {
        const data = JSON.parse(text);

        // If data contains pods, try to enrich with region lookup (best-effort, cached)
        if (data && data.result && Array.isArray(data.result.pods)) {
          const pods = data.result.pods;
          const uniqueIps = new Set();
          pods.forEach(p => {
            if (p && p.address) {
              const ip = String(p.address).split(':')[0].replace(/\[|\]/g, '');
              if (ip) uniqueIps.add(ip);
            }
          });

          const lookups = Array.from(uniqueIps).map(async (ip) => {
            try {
              const cached = geoCache.get(ip);
              if (cached && cached.expiresAt > Date.now()) return { ip, region: cached.region };
              // use ip-api.com for simple free geolocation
              const geoResp = await fetchWithTimeout(`http://ip-api.com/json/${ip}?fields=country,regionName,city`, {}, 3500);
              const geoJson = await geoResp.json();
              const region = [geoJson.regionName, geoJson.country].filter(Boolean).join(', ');
              geoCache.set(ip, { region, expiresAt: Date.now() + GEO_TTL_MS });
              return { ip, region };
            } catch (err) {
              return { ip, region: null };
            }
          });

          try {
            const results = await Promise.allSettled(lookups);
            const regionMap = new Map();
            results.forEach(r => {
              if (r.status === 'fulfilled' && r.value && r.value.region) regionMap.set(r.value.ip, r.value.region);
            });
            pods.forEach(p => {
              if (p && p.address) {
                const ip = String(p.address).split(':')[0].replace(/\[|\]/g, '');
                if (regionMap.has(ip)) p.region = regionMap.get(ip);
              }
            });
            data.result.pods = pods;

            // Compute aggregated region counts to reduce client-side work
            try {
              const regionCounts = {};
              pods.forEach(p => {
                const r = p && p.region ? p.region : 'Unknown';
                regionCounts[r] = (regionCounts[r] || 0) + 1;
              });
              data.meta = data.meta || {};
              data.meta.regionCounts = regionCounts;
            } catch (err) {
              // ignore
            }
          } catch (err) {
            // ignore geo enrichment failures
            console.warn('Geo enrichment failed', err);
          }
        }
        return res.status(response.status >= 400 ? 502 : 200).json(data);
      } catch (parseErr) {
        // Non-JSON body
        return res.status(502).json({ error: 'invalid_json', status: response.status, body: text.slice(0, 10000) });
      }
    } catch (err) {
      lastError = err;
      console.error(`Proxy error (attempt ${attempt}) for ${url}:`, err && err.message ? err.message : err);
      // small backoff before retry
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 500));
    }
  }

  // All attempts failed
  return res.status(502).json({ error: 'proxy_failed', details: lastError && lastError.message ? lastError.message : String(lastError), code: lastError && lastError.code ? lastError.code : null });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
