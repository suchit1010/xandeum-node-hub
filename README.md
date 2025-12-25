<!-- Add the logo image at the top. Place the image in `assets/xandeum-logo.png` in the repo for this to render. -->
<p align="center">
  <img src="src/assets/xandeum-logo.png" alt="Xandeum Logo" width="360"/>
</p>

# Xandeum Node Hub

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-pending-lightgrey)](#)

Short overview of Xandeum
-------------------------
Xandeum is a decentralized blockchain platform designed to be scalable, modular and developer-friendly. It provides the fundamentals for building and running distributed applications and services with an emphasis on performance, reliability and operator ergonomics. This repository — Xandeum Node Hub — contains tools, scripts, and documentation to bootstrap, run, monitor and operate Xandeum network nodes in development and production environments.

A central hub for bootstrapping, running, monitoring and operating Xandeum network nodes. This repository collects opinionated scripts, configuration templates, container images and documentation to make node operations repeatable and safe for development and production.

Table of Contents
- About / Why we built this
- Features
- Architecture & Workflow (visual + explanation)
- Quick Start
  - Prerequisites
  - Environment
  - Install
  - Run locally (binary)
  - Run with Docker
  - Run with docker-compose
- Configuration
- Development & Testing
- CI / CD (example GitHub Actions workflow)
- Recommended Production Deployment Patterns
- Project structure
- Contributing
- License
- Contact

---

## About / Why we built this

Running blockchain nodes reliably requires many operational steps: binary management, configuration, data persistence, monitoring, backups, upgrades, and security. Xandeum Node Hub exists to:

- Provide a single, documented pattern to bring up a node for dev or prod.
- Package repeatable scripts, Docker assets and examples so new operators can get a node running quickly.
- Improve reliability by recommending best-practices for data persistence, monitoring and upgrades.
- Enable CI/CD for node-related components (config, operators, helper services).

This repository is intended for node operators, developers building on Xandeum, and SREs who manage node fleets.

---

## Features

- Templates and scripts to initialize and run node instances.
- Dockerfile and docker-compose examples for local reproducible environments.
- Opinionated defaults for config and data directories.
- Example monitoring hooks and health-check endpoints.
- Example CI workflow for lint/test/build and (optional) image builds.

---

## Architecture & Workflow

High-level components
- Node Runner(s): the actual Xandeum node process (binary or container).
- Management scripts/CLI: utilities to init, backup, restore, upgrade nodes.
- Persistent Storage: host volumes, cloud block storage, or PVCs in Kubernetes.
- Monitoring & Logging: metrics exporters, Prometheus scrape targets, and log aggregation.
- Orchestration layer: systemd / Docker Compose / Kubernetes for production orchestration.

ASCII workflow

```
+--------------------+
| Developers / CI    |
+---------+----------+
          |
          v
+--------------------+        +--------------------+
| Repo (this project)| -----> | CI/CD (GitHubActs) |
+--------------------+        +--------------------+
          |                           |
          |                           v
          |                   Build image / artifacts
          |                           |
          v                           v
+--------------------+        +--------------------+
| Dev machine / Ops  | <----> | Registry / Storage |
+--------------------+        +--------------------+
          |
          v
+--------------------+
| Node Runner (Docker| or |
|  Binary / K8s)     |
+--------------------+
          |
+---------+---------+
| Monitoring / Logs |
+-------------------+
```

Typical workflow
1. Clone repository, review .env.example and config templates.
2. Initialize a node data directory (or mount volume) and configure ports / peers.
3. Start the node locally (binary or container).
4. Run tests (integration or smoke tests) in CI.
5. Build and publish container images, deploy to prod (K8s, VM, etc).
6. Monitor node health and perform staged upgrades.

---

## Quick Start

### Prerequisites

- Git
- Docker (for container runs)
- docker-compose (optional)
- If running native binary: the Xandeum node binary (follow upstream build or download instructions)
- Recommended: small VM with >= 2 CPU, 4GB RAM for testnet; production requirements depend on chain state

### Environment

Copy and edit the example environment file:

```bash
cp .env.example .env
```

Suggested .env.example (create this file if absent):

```bash
# .env.example
NODE_ENV=development
NODE_DATA_DIR=./data
NODE_RPC_PORT=26657
NODE_P2P_PORT=26656
NODE_GRPC_PORT=9090
NODE_METRICS_PORT=9060
LOG_LEVEL=info
BINARY_PATH=./bin/xandeumd
```

### Install

Clone the repo:

```bash
git clone https://github.com/suchit1010/xandeum-node-hub.git
cd xandeum-node-hub
```

If the repository has a Node.js toolchain or helper UI:

```bash
# install node/tooling if present
npm ci
# or
# yarn install
```

### Run locally (native binary)

If you have a built or downloaded Xandeum binary:

1. Initialize the node and create configuration (example):

```bash
# set data dir
export XANDEUM_HOME="${PWD}/data"
# initialize
${BINARY_PATH:-./bin/xandeumd} init mynode --chain-id xandeum-chain --home $XANDEUM_HOME
# adjust config files as needed (config/config.toml, config/app.toml, genesis.json)
# start node
${BINARY_PATH:-./bin/xandeumd} start --home $XANDEUM_HOME
```

2. Health checks and RPC will be available on configured ports (e.g., 26657, 26656).

### Run with Docker

Build image (or pull a published image if available):

```bash
docker build -t suchit1010/xandeum-node-hub:latest .
```

Run container with volume and port mapping:

```bash
docker run -d --name xandeum-node \
  -v $(pwd)/data:/var/lib/xandeum-node \
  -p 26656:26656 -p 26657:26657 -p 9060:9060 \
  --env-file .env \
  suchit1010/xandeum-node-hub:latest
```

Notes:
- Ensure host volume permissions allow the container to read/write data.
- For production, use a managed registry and pinned tags.

### Run with docker-compose (example)

Create a docker-compose.yml based on your needs. Example snippet:

```yaml
version: "3.8"
services:
  xandeum:
    image: suchit1010/xandeum-node-hub:latest
    container_name: xandeum-node
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./data:/var/lib/xandeum-node
    ports:
      - "26656:26656"
      - "26657:26657"
      - "9060:9060"
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:26657/status || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Start:

```bash
docker compose up -d
```

### Run the project (frontend) and backend proxy

- Install dependencies and start the frontend (development):

```bash
# install node deps
npm install

# start dev server
npm run dev
```

- Run the backend proxy server (simple local proxy used by the UI):

```bash
# Node (CJS) proxy server
node prpc-proxy-server.cjs
```

Example proxy output (what you'll see in the terminal):

```text
Proxy server running on http://localhost:3001
Proxy attempt 1 -> http://173.212.220.65:6000/rpc
Proxy attempt 1 -> http://161.97.97.41:6000/rpc
Proxy attempt 1 -> http://192.190.136.36:6000/rpc
Proxy attempt 1 -> http://192.190.136.37:6000/rpc
Proxy attempt 1 -> http://192.190.136.38:6000/rpc
Proxy attempt 1 -> http://192.190.136.28:6000/rpc
Proxy attempt 1 -> http://192.190.136.29:6000/rpc
```

Notes:
- The proxy listens on `http://localhost:3001` by default and forwards RPC calls to configured upstream nodes.
- If you prefer a clean install for CI or reproducible installs, use `npm ci` instead of `npm install`.

---

## Configuration

- Keep configuration templates in `config/` or document how to generate them with the binary's `init` command.
- Do not commit private keys or seeds. Use environment variables or secret management (Vault / K8s Secrets).
- Common files:
  - `config/genesis.json` — chain genesis file
  - `config/config.toml` — p2p, rpc, and consensus tuning
  - `config/app.toml` — application-level settings
- Recommended: Use volume-backed storage and backups for the `data` directory.

---

## Development & Testing

- Unit tests (if present) run via:

```bash
npm test
# or
go test ./...
```

- Integration/smoke tests: spin up node in container (docker-compose) and run test suite against RPC ports.

- Linting: run `npm run lint` or language-specific linters before pushing.

---

## CI / CD (example GitHub Actions)

Below is a recommended minimal GitHub Actions workflow to run tests and build images. Add this as `.github/workflows/ci.yml` if you'd like.

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install
        run: npm ci
      - name: Lint
        run: npm run lint --if-present
      - name: Test
        run: npm test
  build-docker:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t ${{ secrets.DOCKER_REGISTRY }}/xandeum-node-hub:${{ github.sha }} .
      - name: Push Docker image
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login ${{ secrets.DOCKER_REGISTRY }} -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push ${{ secrets.DOCKER_REGISTRY }}/xandeum-node-hub:${{ github.sha }}
```

Notes:
- Store registry credentials in GitHub Secrets and set the proper registry URL.
- You can add deployment jobs that use kubeconfig or cloud provider actions to deploy images.

---

## Recommended Production Deployment Patterns

- Use Kubernetes with a Deployment + StatefulSet (if you need stable network identity and persistent storage).
- Use Persistent Volume Claims for chain data. Use ReadWriteOnce volumes.
- Use liveness and readiness checks:
  - Readiness: RPC returning a healthy status
  - Liveness: the process is running and able to respond to a simple RPC
- Rolling upgrades with small batch sizes or canary nodes to validate upgrades before rolling out cluster-wide.
- Regular backups: snapshot the `data` directory or use the node's snapshot export/import mechanism.

---

## Project structure (recommended)

- bin/               — helper scripts and local binaries
- config/            — config templates (genesis, app/config toml)
- docker/            — Dockerfile and container-related assets
- scripts/           — lifecycle utilities (init, backup, restore, upgrade)
- docs/              — additional documentation and operational runbooks
- examples/          — sample deploy configs and docker-compose examples
- tests/             — integration and CI test scenarios

If your repo uses different structure adapt the above accordingly.

---

## Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes with clear messages
4. Open a pull request describing the change and its motivation
5. Add tests and update docs where appropriate

Please follow the repository's code style and run linters/tests locally before opening a PR.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Contact

If you have questions or need help, please open an issue in this repository or contact the maintainer: suchit1010

---

What I changed
- Added a centered logo placeholder at the top of the README and a short, neutral overview of Xandeum right below it.
- Kept the full previously-added README content (quick start, architecture, CI/CD examples, etc.)

Next steps (pick any)
- I can add the provided logo image into the repository at assets/xandeum-logo.png and commit it for you (I will need your confirmation to write the file).
- I can also create a `.env.example` file, `.github/workflows/ci.yml` and a `docker-compose.yml` in the repo if you'd like them added now.
- I can adjust the short Xandeum overview to align with official project wording if you provide a preferred description.

Would you like me to add/commit the logo image (assets/xandeum-logo.png) and optionally the example files? If yes, I will commit them now.