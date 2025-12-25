# pRPC Integration

Overview
- This project consumes pRPC gossip endpoints to retrieve real-time pNode metrics. The app queries bootstrap RPC endpoints and maps responses into the UI (pNodes list, uptime, capacity, region, version, stake).

How it works (short)
- `src/lib/prpc.ts` contains the network logic: bootstrapping, retry/backoff, and merging pod credit info. The dashboard calls `fetchPNodes()` which returns `{ nodes, raw, meta, source }`.

Key code snippets

Fetch example (from `src/lib/prpc.ts`):
```ts
export async function fetchPNodes() {
  const resp = await fetch(PRPC_URL, { method: 'POST', body: JSON.stringify(payload) });
  const json = await resp.json();
  return { nodes: json.result?.nodes || [], raw: json, source: PRPC_URL };
}
```

Verification steps (quick)
1. Run the app locally (`npm run dev`).
2. Call a bootstrap endpoint used by the app (example):

```bash
curl -X POST 'http://173.212.220.65:6000/rpc' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"get-pods-with-stats","params":{}}'
```

Expected output: JSON object with `nodes` array. Confirm fields: `id`, `address`, `status`, `uptime`, `capacity`, `region`, `version`.

Edge cases & fallbacks
- The app caches the last successful fetch to `localStorage` (see `Index.tsx`) and uses that for initial render if network fetch fails.
- Timeouts and partial responses are handled by the fetch wrapper: retries and best-effort merging of stake/credit info.

Security & privacy
- No private keys or secrets are stored in repo. If deploying with external bootstrap endpoints, configure them in environment variables.

Notes
- If you run into CORS, use a local proxy or host the frontend on a static host that can access the pRPC endpoint, or enable CORS on the bootstrap endpoint.
