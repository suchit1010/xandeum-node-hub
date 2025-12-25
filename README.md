# Xandeum pNode Dashboard

![Xandeum logo](src/assets/xandeum-x-logo.png)

Real-time analytics dashboard for Xandeum pNodes using pRPC gossip — built for the pNode Analytics Bounty.

[![Bounty Status](https://img.shields.io/badge/Bounty-Submitted-brightgreen)](https://superteam.example) [![Tech: React](https://img.shields.io/badge/Tech-React-blue)](https://reactjs.org) [![License: MIT](https://img.shields.io/badge/License-MIT-green)]

TL;DR: Clone, `npm install`, `npm run dev`, open http://localhost:5173 — the dashboard fetches live pNode metrics via pRPC, shows an interactive 3D globe, and provides a sortable/filterable pNode table with CSV/JSON export.

Links
- Docs: ./docs (pRPC integration, deployment, architecture, contribution)
- Demo GIFs/screenshots: ./docs/assets (place screenshots here)

Key Features
- ✅ Real-time pNode fetching via pRPC gossip (live metrics)
- 🌍 Interactive 3D globe for geo visualization (click to filter)
- 📊 Sortable, filterable, paginated table with copy/export and highlights
- ⚡ Responsive UI with loading overlay and progress visualization

Why this meets the bounty
- Functionality: Live pRPC fetch, exports, and interactive filters.
- Clarity: Single-page dashboard with clear controls and data provenance.
- UX: Fast, responsive, accessible controls and copy/export options.
- Innovation: Globe-driven filtering + region-aware CSV/JSON exports.

Quick Start

1. Clone the repo:

```bash
git clone <repo-url>
cd xandeum-node-hub
npm ci
npm run dev
```

2. Open the app: http://localhost:5173

Prove it's working (verification)
- Fetch raw pRPC endpoint used by the app (example bootstrap):

```bash
curl -X POST 'http://173.212.220.65:6000/rpc' \
	-H 'Content-Type: application/json' \
	-d '{"jsonrpc":"2.0","id":1,"method":"get-pods-with-stats","params":{}}'
```

You should receive JSON containing pNodes and stats. The dashboard maps those fields (id, address, status, uptime, capacity, region, version, stake).

Files to read first
- `src/lib/prpc.ts` — core fetch & retry logic.
- `src/pages/Index.tsx` — app entry: fetches data, wires filters, and renders `PNodeTable`.
- `src/components/PNodeTable.tsx` — table markup, sorting, CSV/JSON export.

Docs
- See the `/docs` folder for focused docs: pRPC-Integration, Deployment-Guide, Contribution-Guide, Architecture, CHANGELOG.

Screenshots / Demo
- Add short GIFs or screenshots to `docs/assets/` and reference them here for judges.

Contributing
- See `docs/Contribution-Guide.md` for how to run tests and request features.

License & Contact
- MIT License — see LICENSE file.
- Built for the Xandeum pNode Analytics Bounty. Questions: maintainer@example.com

---
This README is the single entry point for judges: it includes verification steps, feature mapping to bounty criteria, and links to deeper docs in `/docs`.
