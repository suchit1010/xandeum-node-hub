// lib/prpc.ts
import axios from 'axios';
import _ from 'lodash';



export interface PNode {
  address: string; // e.g., "IP:9001"
  is_public: boolean;
  last_seen_timestamp: number;
  pubkey: string; // e.g., "2asTHq4vVGazKrmEa3YTXKuYiNZBdv1cQoLc1Tr2kvaw"
  rpc_port: number; // e.g., 6000
  storage_committed: number; // in bytes
  storage_usage_percent: number; // e.g., 0.02486133575439453
  storage_used: number;
  uptime: number; // in seconds
  version: string; // e.g., "0.7.0"
  // Derived fields
  status?: 'online' | 'offline' | 'syncing';
  region?: string; // Optional, can derive from IP
  stake?: number; // From credits API
}

const bootstrapEndpoints = [
  'http://173.212.220.65:6000/rpc',
  'http://161.97.97.41:6000/rpc',
  'http://192.190.136.36:6000/rpc',
  'http://192.190.136.37:6000/rpc',
  'http://192.190.136.38:6000/rpc',
  'http://192.190.136.28:6000/rpc',
  'http://192.190.136.29:6000/rpc',
  'http://207.244.255.1:6000/rpc',
  'http://173.212.203.145:6000/rpc',
];

export async function fetchPNodes(): Promise<{ nodes: PNode[]; raw: unknown; source?: string; meta?: { attempted: number; responded: number; durationMs: number } }> {
  const methods = ['get-pods-with-stats', 'get-pods']; // Primary for stats, fallback for basic list
  // Helper: perform a proxy request with timeout + retries and quiet handling for aborts/timeouts
    const isAbortLike = (err: unknown): boolean => {
      if (err == null) return false;
      const obj = err as Record<string, unknown>;
      const rawMessage = obj.message ?? '';
      const message = typeof rawMessage === 'string' ? rawMessage : String(rawMessage);
      const msg = message.toLowerCase();
      const code = typeof obj.code === 'string' ? obj.code : '';
      const name = typeof obj.name === 'string' ? obj.name : '';
      return msg.includes('aborted') || msg.includes('timeout') || code === 'ECONNABORTED' || name === 'CanceledError';
    };
  
    // Prefer build-time env, then an injected runtime global, otherwise fall back to local serverless path.
    // If the bundle was built without the env var, force a runtime fallback to the Render proxy so the
    // deployed frontend can reach a working backend immediately.
    const RENDER_PROXY = 'https://prpc-proxy.onrender.com/api/prpc-proxy';
    const API_URL = (import.meta as any).env?.VITE_PRPC_PROXY_URL ?? (typeof window !== 'undefined' ? (window as any).__PRPC_PROXY_URL : undefined) ?? '/api/prpc-proxy';
    const RUNTIME_API_URL: string = (typeof window !== 'undefined' && API_URL === '/api/prpc-proxy') ? RENDER_PROXY : API_URL;
    if (typeof window !== 'undefined') {
      (window as any).__PRPC_PROXY_USED = RUNTIME_API_URL;
      // Helpful runtime log to verify which proxy the built app is using in the browser console
      // (remove this after verification).
      // eslint-disable-next-line no-console
      console.log('PRPC proxy (runtime):', RUNTIME_API_URL);
    }

    const doProxyRequest = async (
      url: string,
      payload: {
        jsonrpc?: string;
        id?: number | string;
        method?: string;
        params?: unknown[];
        [key: string]: unknown;
      },
      opts?: { timeout?: number; retries?: number }
    ) => {
      const timeout = opts?.timeout ?? 8000;
      const retries = Math.max(1, opts?.retries ?? 1);
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await axios.post(RUNTIME_API_URL, { url, payload }, { timeout });
          return res;
        } catch (err: unknown) {
          if (isAbortLike(err)) {
            // expected when remote endpoint is slow / resets — keep quiet
            return null;
          }
          // log debug for other errors, but avoid spamming console.warn for intermittent failures
          const msg = (() => {
            if (err == null) return '';
            if (typeof err === 'object') {
              const e = err as { message?: unknown };
              if (typeof e.message === 'string') return e.message;
            }
            return String(err);
          })();
          console.debug(`pRPC proxy attempt ${attempt} failed for ${url}:`, msg);
          // small backoff before retrying
          if (attempt < retries) await new Promise((r) => setTimeout(r, 200 * attempt));
        }
      }
      return null;
    };

  // Quick probe to estimate coverage: ping all bootstrap endpoints with a lightweight get-pods call (short timeout)
  const probeStart = Date.now();
  const probePromises = bootstrapEndpoints.map(async (url) => {
    try {
      const r = await doProxyRequest(url, { jsonrpc: '2.0', id: 1, method: 'get-pods', params: [] }, { timeout: 3000, retries: 1 });
      if (r && r.data) return { ok: true, url, data: r.data };
      return { ok: false, url };
    } catch (e: unknown) {
      return { ok: false, url };
    }
  });

  const probeResultsSettled = await Promise.allSettled(probePromises);
  const probeResults = probeResultsSettled.map((s) => (s.status === 'fulfilled' ? s.value : { ok: false, url: 'unknown' }));
  const responded = probeResults.filter((r) => r.ok).length;
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('xandeum:prpc-progress', { detail: { attempted: bootstrapEndpoints.length, responded } }));
    }
  } catch (e) {
    // ignore
  }
  // Try to fetch in small parallel batches for fast cold-starts
  for (const method of methods) {
    // First attempt: Promise.any across endpoints so we resolve as soon as any endpoint returns usable nodes
    try {
      const endpoints = _.shuffle(bootstrapEndpoints);
      const attemptPromises = endpoints.map(async (url) => {
        const response = await doProxyRequest(url, { jsonrpc: '2.0', id: 1, method, params: [] }, { timeout: 8000, retries: 1 });
        if (!response) throw new Error('no response');
        const result = response.data?.result;
        let nodesArray: unknown[] | undefined;
        if (Array.isArray(result)) nodesArray = result as unknown[];
        else if (result) {
          const pods = (result as unknown as { pods?: unknown }).pods;
          if (Array.isArray(pods)) nodesArray = pods as unknown[];
        } else if (response.data && Array.isArray(response.data)) {
          nodesArray = response.data as unknown[];
        }
        if (!nodesArray || !Array.isArray(nodesArray) || nodesArray.length === 0) throw new Error('no nodes');
        const isPNode = (obj: unknown): obj is PNode => {
          if (obj == null || typeof obj !== 'object') return false;
          const o = obj as Record<string, unknown>;
          return typeof o.pubkey === 'string' && typeof o.address === 'string' && typeof o.uptime === 'number';
        };
        const mapped = nodesArray.filter(isPNode).map((node) => ({
          ...node,
          status: node && node.uptime && node.uptime > 0 ? 'online' : 'offline',
        }));
        const meta = { attempted: bootstrapEndpoints.length, responded: Math.max(responded, 1), durationMs: Date.now() - probeStart };
        return { nodes: mapped as unknown as PNode[], raw: response.data, source: url, meta };
      });

      // Race to first successful resolved promise
      // Polyfill for Promise.any if not available
      // Polyfill AggregateError if not available
      class PolyfillAggregateError extends Error {
        public errors: unknown[];
        constructor(errors: unknown[], message?: string) {
          super(message);
          this.name = 'AggregateError';
          this.errors = errors;
        }
      }
      // Use globalThis.AggregateError if available, otherwise use the polyfill
      interface AggregateErrorConstructorLike {
        new (errors: unknown[], message?: string): Error;
      }
      const AggregateErrorImpl: AggregateErrorConstructorLike = (() => {
        const g = globalThis as unknown as { AggregateError?: new (errors: unknown[], message?: string) => Error };
        return typeof g.AggregateError !== 'undefined' ? g.AggregateError : PolyfillAggregateError;
      })();

      function promiseAny<T>(promises: Promise<T>[]): Promise<T> {
        return new Promise((resolve, reject) => {
          const rejections: unknown[] = [];
          let pending = promises.length;
          if (pending === 0) return reject(new AggregateErrorImpl([], 'All promises were rejected'));
          promises.forEach((p, i) => {
            p.then(resolve).catch(e => {
              rejections[i] = e;
              pending--;
              if (pending === 0) {
                reject(new AggregateErrorImpl(rejections, 'All promises were rejected'));
              }
            });
          });
        });
      }
      
      type AnyFn = <T>(promises: Promise<T>[]) => Promise<T>;
      const promiseAnyImpl: AnyFn = ((Promise as unknown as { any?: AnyFn }).any) ?? promiseAny;
      const winner = await promiseAnyImpl<{ nodes: PNode[]; raw: unknown; source: string; meta: { attempted: number; responded: number; durationMs: number } }>(attemptPromises);
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('xandeum:prpc-progress', { detail: winner.meta }));
        }
      } catch (e) {
        // Ignore dispatch errors but log for diagnostics
        console.debug('xandeum:prpc-progress dispatch failed', e);
      }
      return winner;
    } catch (err) {
      // Promise.any failed (all endpoints failed quickly) — fall back to batched probing below
    }

    // Fallback: try in small parallel batches to collect a response
    let fullFetchResponded = 0;
    const endpoints = _.shuffle(bootstrapEndpoints);
    const batchSize = 6;
    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize);
      const startBatch = Date.now();
      try {
        const results = await Promise.all(batch.map((url) => doProxyRequest(url, { jsonrpc: '2.0', id: 1, method, params: [] }, { timeout: 8000, retries: 1 })));
        for (let j = 0; j < results.length; j++) {
          const response = results[j];
          const url = batch[j];
          if (!response) continue;

          const result = response.data?.result;
          let nodesArray: unknown[] | undefined;
          if (Array.isArray(result)) nodesArray = result as unknown[];
          else if (result) {
            const pods = (result as unknown as { pods?: unknown }).pods;
            if (Array.isArray(pods)) nodesArray = pods as unknown[];
          } else if (response.data && Array.isArray(response.data)) {
            nodesArray = response.data as unknown[];
          }

          const isPNode = (obj: unknown): obj is PNode => {
            if (obj == null || typeof obj !== 'object') return false;
            const o = obj as Record<string, unknown>;
            return typeof o.pubkey === 'string' && typeof o.address === 'string' && typeof o.uptime === 'number';
          };

          if (nodesArray && Array.isArray(nodesArray)) {
            fullFetchResponded++;
            const mapped = nodesArray.filter(isPNode).map((node) => ({
              ...node,
              status: node && node.uptime && node.uptime > 0 ? 'online' : 'offline',
            }));
            const meta = { attempted: bootstrapEndpoints.length, responded: Math.max(responded, fullFetchResponded), durationMs: Date.now() - probeStart };
            try {
              if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('xandeum:prpc-progress', { detail: meta }));
              }
            } catch (e) {
              // ignore
            }
            return { nodes: mapped as unknown as PNode[], raw: response.data, source: url, meta };
          }
        }
        const batchDuration = Date.now() - startBatch;
        try {
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('xandeum:prpc-progress', { detail: { attempted: bootstrapEndpoints.length, responded: Math.max(responded, fullFetchResponded), lastBatchMs: batchDuration } }));
          }
        } catch (e) {
          // ignore
        }
      } catch (error: unknown) {
        // ignore batch-level errors; continue
      }
    }
  }
  // If nothing returned, avoid throwing to prevent blank UI — return empty list and meta for diagnostics
  return { nodes: [], raw: null, source: undefined, meta: { attempted: bootstrapEndpoints.length, responded, durationMs: Date.now() - probeStart } };
}

export async function fetchPodCredits(): Promise<Record<string, number>> {
  try {
    const response = await axios.get('https://podcredits.xandeum.network/api/pods-credits');
    return response.data; // { pubkey: credits }
  } catch (error: unknown) {
    const msg = (() => {
      if (error == null) return '';
      if (typeof error === 'object') {
        const e = error as { message?: unknown };
        if (typeof e.message === 'string') return e.message;
      }
      return String(error);
    })();
    console.warn('Failed to fetch pod credits:', msg);
    return {};
  }
}

// Aggregate for dashboard stats
export function computeStats(nodes: PNode[]) {
  const totalNodes = nodes.length;
  const activeNodes = nodes.filter(n => n.status === 'online').length;
  const avgUptime = _.meanBy(nodes, 'uptime') || 0;
  const totalCapacity = _.sumBy(nodes, 'storage_committed') / (1024 ** 4); // TB
  const avgResponse = 0; // If available from other calls
  const networkHealth = totalNodes > 0 ? (activeNodes / totalNodes) * 100 : 0;
  return { totalNodes, activeNodes, avgUptime, totalCapacity, networkHealth };
}

// Group for charts (e.g., version distribution)
export function groupByVersion(nodes: PNode[]) {
  return _.countBy(nodes, 'version');
}

// Convert real PNode to the app's PNode interface (for compatibility)
export interface AppPNode {
  id: string;
  address: string;
  status: 'online' | 'offline' | 'syncing';
  uptime: number;
  capacity: number;
  peers: unknown | null;
  lastSeen: Date;
  region: string;
  country?: string;
  version: string;
  stake: number;
  isTop: boolean;
}

export function mapToAppPNode(realNode: PNode): AppPNode {
  const maxUptimeSeconds = 30 * 24 * 3600; // 30 days
  const uptimePercent = Math.min(100, (realNode.uptime / maxUptimeSeconds) * 100);
  return {
    id: realNode.pubkey,
    address: realNode.address,
    status: realNode.status || 'offline',
    uptime: Math.round(uptimePercent * 10) / 10, // Round to 1 decimal
    capacity: realNode.storage_committed / (1024 ** 3), // GB
    peers: (realNode as unknown as Record<string, unknown>).peers ?? null, // Keep null when not provided so UI can show 'N/A'
    lastSeen: realNode.last_seen_timestamp ? new Date(realNode.last_seen_timestamp * 1000) : new Date(),
    region: realNode.region || 'Unknown',
    // try to extract a country name from region (e.g., "Grand Est, France" -> "France")
    country: ((): string | undefined => {
      const r = realNode.region;
      if (!r) return undefined;
      // if region contains a comma, assume last token is country
      const parts = r.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) return parts[parts.length - 1];
      // if region matches common country strings, return as-is
      if (/^([A-Za-z ]+)$/.test(r)) return r;
      return undefined;
    })(),
    version: realNode.version,
    stake: realNode.stake || 0,
    isTop: false, // Can compute based on stake
  };
}