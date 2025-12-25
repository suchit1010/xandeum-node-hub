# Deployment Guide

Quick deploy (Vercel)
1. Sign into Vercel and import the GitHub repo.
2. Set build command: `npm run build` and dev command `npm run dev` if preview needed.
3. Set any required environment variables (e.g., `PRPC_BOOTSTRAP_URL` if used).
4. Deploy. The site will host the static build; ensure the pRPC endpoints are reachable from the deployed origin.

Netlify / Static Hosting
- Build command: `npm run build`. Publish the `dist` folder.
- Ensure DNS and CORS settings allow the frontend to reach pRPC endpoints.

Env vars and timeouts
- If pRPC endpoints are slow or blocked by CORS, you can configure a server-side proxy or set environment variables pointing to a proxy URL.

Troubleshooting
- CORS errors: either enable CORS on the pRPC endpoint or host a proxy.
- Slow bootstrap: increase timeout or run periodic background job to warm data.

Tips
- Use Vercel preview deploys for PRs to let judges verify changes live.
- Add a simple health endpoint to check that pRPC fetches succeed (optional small server).
