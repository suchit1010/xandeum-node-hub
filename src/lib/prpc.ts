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

export async function fetchPNodes(): Promise<{ nodes: PNode[]; raw: any; source?: string }> {
  const methods = ['get-pods-with-stats', 'get-pods']; // Primary for stats, fallback for basic list

  for (const method of methods) {
    for (const url of _.shuffle(bootstrapEndpoints)) { // Shuffle for load balance
      try {
        // Use proxy route to bypass browser port block
        const response = await axios.post('/api/prpc-proxy', {
          url,
          payload: {
            jsonrpc: '2.0',
            id: 1,
            method,
            params: [],
          },
        }, { timeout: 20000 }); // 20s timeout

        // Handle differing response shapes: either result = [nodes] or result = { pods: [nodes], total_count }
        const result = response.data?.result;
        let nodesArray: any[] | undefined;
        if (Array.isArray(result)) {
          nodesArray = result;
        } else if (result && Array.isArray(result.pods)) {
          nodesArray = result.pods;
        } else if (response.data && Array.isArray(response.data)) {
          // sometimes response may be direct array
          nodesArray = response.data;
        }

        if (nodesArray && Array.isArray(nodesArray)) {
          const mapped = nodesArray.map((node: PNode) => ({
            ...node,
            // Derive status based on uptime
            status: (node && node.uptime && node.uptime > 0 ? 'online' : 'offline') as 'online' | 'offline' | 'syncing',
          }));
          return { nodes: mapped, raw: response.data, source: url };
        }
      } catch (error) {
        console.warn(`pRPC fetch failed on ${url} with ${method}:`, error);
      }
    }
  }
  throw new Error('Unable to fetch pNodes from any endpoint');
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
    peers: 0, // Not available in pRPC
    lastSeen: new Date(realNode.last_seen_timestamp * 1000),
    region: realNode.region || 'Unknown',
    version: realNode.version,
    stake: realNode.stake || 0,
    isTop: false, // Can compute based on stake
  };
}