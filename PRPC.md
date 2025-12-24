# pRPC integration (Xandeum)

This dashboard is powered by live pRPC calls to the Xandeum gossip network. It fetches the full pNode list and statistics from multiple bootstrap endpoints and displays metrics, a globe, and a sortable/filterable table — all from real data (no mock values in the fetching pipeline unless explicitly noted in the UI).

## Bootstrap endpoints used by the client (proxied via `/api/prpc-proxy` in dev)

- http://173.212.220.65:6000/rpc
- http://161.97.97.41:6000/rpc
- http://192.190.136.36:6000/rpc
- http://192.190.136.37:6000/rpc
- http://192.190.136.38:6000/rpc
- http://192.190.136.28:6000/rpc
- http://192.190.136.29:6000/rpc
- http://207.244.255.1:6000/rpc
- http://173.212.203.145:6000/rpc

## How it works

- The client calls `fetchPNodes()` in `src/lib/prpc.ts`, which probes the bootstrap endpoints and attempts `get-pods-with-stats` (falls back to `get-pods`).
- Requests are sent through a local dev proxy (`/api/prpc-proxy`) to avoid browser port restrictions; in production the proxy should be implemented server-side.
- The app also merges pod credits from `https://podcredits.xandeum.network/api/pods-credits` when available.

## Verify real data locally

1. Start the dev server: `npm run dev`
2. Open the site in an incognito window (no cache) and confirm the Network Overview shows non-zero node counts and the footer states "Real-time validator metrics powered by pRPC from Xandeum gossip network".
3. Click the globe clusters — the table should filter to the selected region and node details should open on selection.

## Notes

- If you see empty data, check your network connectivity and the dev proxy logs. Timeouts and retries are in place (`src/lib/prpc.ts`) — increasing timeouts or improving probe concurrency can help for slow networks.
- For production deployment, host a server-side proxy (or serverless function) to forward pRPC calls securely rather than relying on the dev middleware.
