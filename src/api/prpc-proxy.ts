import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// Vite dev server middleware for /api/prpc-proxy
export default function prpcProxyMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { url, payload } = JSON.parse(body);
        const fetchRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await fetchRes.json();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Proxy failed', details: e.message }));
      }
    });
  };
}

// To use this, add to Vite config:
// import prpcProxyMiddleware from './src/api/prpc-proxy';
// server: { middlewareMode: true, setupMiddlewares: (middlewares, devServer) => {
//   middlewares.use('/api/prpc-proxy', prpcProxyMiddleware());
//   return middlewares;
// } }