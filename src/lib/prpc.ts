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
  const isAbortLike = (err: any) => {
    if (!err) return false;
    const msg = String(err?.message || '').toLowerCase();
    return msg.includes('aborted') || msg.includes('timeout') || err?.code === 'ECONNABORTED' || err?.name === 'CanceledError';
  };

  const doProxyRequest = async (url: string, payload: any, opts?: { timeout?: number; retries?: number }) => {
    const timeout = opts?.timeout ?? 15000;
    const retries = Math.max(1, opts?.retries ?? 2);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios.post('/api/prpc-proxy', { url, payload }, { timeout });
        return res;
      } catch (err: any) {
        if (isAbortLike(err)) {
          // expected when remote endpoint is slow / resets — keep quiet
          return null;
        }
        // log debug for other errors, but avoid spamming console.warn for intermittent failures
        console.debug(`pRPC proxy attempt ${attempt} failed for ${url}:`, err?.message || err);
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
      const r = await doProxyRequest(url, { jsonrpc: '2.0', id: 1, method: 'get-pods', params: [] }, { timeout: 4000, retries: 1 });
      if (r && r.data) return { ok: true, url, data: r.data };
      return { ok: false, url };
    } catch (e) {
      return { ok: false, url };
    }
  });

  const probeResultsSettled = await Promise.allSettled(probePromises);
  const probeResults = probeResultsSettled.map((s) => (s.status === 'fulfilled' ? s.value : { ok: false, url: 'unknown' }));
  const responded = probeResults.filter((r) => r.ok).length;

  for (const method of methods) {
    let fullFetchResponded = 0;
    for (const url of _.shuffle(bootstrapEndpoints)) { // Shuffle for load balance
      try {
        // Use proxy route to bypass browser port block
        const start = Date.now();
        const response = await doProxyRequest(url, { jsonrpc: '2.0', id: 1, method, params: [] }, { timeout: 20000, retries: 2 });
        const durationMs = Date.now() - start;

        if (!response) {
          // no usable response (likely timeout/abort); try next
          continue;
        }

        // Handle differing response shapes: either result = [nodes] or result = { pods: [nodes], total_count }
        const result = response.data?.result;
        let nodesArray: unknown[] | undefined;
        if (Array.isArray(result)) {
          nodesArray = result as unknown[];
        } else if (result && Array.isArray((result as any).pods)) {
          nodesArray = (result as any).pods as unknown[];
        } else if (response.data && Array.isArray(response.data)) {
          // sometimes response may be direct array
          nodesArray = response.data as unknown[];
        }

        // Narrow unknowns into PNode objects using a small runtime check
        const isPNode = (obj: any): obj is PNode => {
          return obj && typeof obj === 'object' && typeof obj.pubkey === 'string' && typeof obj.address === 'string' && typeof obj.uptime === 'number';
        };

        if (nodesArray && Array.isArray(nodesArray)) {
          fullFetchResponded++;
          const mapped = nodesArray.filter(isPNode).map((node) => ({
            ...node,
            status: node && node.uptime && node.uptime > 0 ? 'online' : 'offline',
          }));
          return { nodes: mapped as unknown as PNode[], raw: response.data, source: url, meta: { attempted: bootstrapEndpoints.length, responded: Math.max(responded, fullFetchResponded), durationMs: Date.now() - probeStart } };
        }
      } catch (error) {
        // Be quiet about aborts/timeouts; debug log other errors
        if (isAbortLike(error)) {
          // expected network abort/timeout; not a fatal error
        } else {
          console.debug(`pRPC fetch failed on ${url} with ${method}:`, error?.message || error);
        }
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
  } catch (error) {
    console.warn('Failed to fetch pod credits:', error);
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
export function mapToAppPNode(realNode: PNode): any { // Using any for now, adjust to match app's PNode
  const maxUptimeSeconds = 30 * 24 * 3600; // 30 days
  const uptimePercent = Math.min(100, (realNode.uptime / maxUptimeSeconds) * 100);
  return {
    id: realNode.pubkey,
    address: realNode.address,
    status: realNode.status || 'offline',
    uptime: Math.round(uptimePercent * 10) / 10, // Round to 1 decimal
    capacity: realNode.storage_committed / (1024 ** 3), // GB
    peers: (realNode as any).peers ?? null, // Keep null when not provided so UI can show 'N/A'
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