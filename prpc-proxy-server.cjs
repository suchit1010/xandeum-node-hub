const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

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

      // Try parse JSON, but if remote returns non-json, return raw text for debugging
      try {
        const data = JSON.parse(text);
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

app.listen(3001, () => {
  console.log('Proxy server running on http://localhost:3001');
});
