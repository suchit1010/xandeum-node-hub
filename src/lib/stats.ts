// src/lib/stats.ts
import _ from 'lodash';

export interface HealthResult {
  networkHealth: number;
  availabilityScore: number;
  uptimeScore: number;
  versionScore: number;
  sampleSize: number;
  trusted: boolean;
}

const MAX_UPTIME_SECONDS = 30 * 24 * 3600; // 30 days

const clamp = (v: number) => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));

// nodes: array of objects with at least: status, uptime (either percent 0-100 OR seconds), version
export function computeNetworkHealth(nodes: any[], options?: { attemptedEndpoints?: number; respondedEndpoints?: number }): HealthResult {
  const total = nodes?.length || 0;
  const sampleSize = total;

  const active = nodes.filter((n) => n && n.status === 'online').length;
  // derive uptime percent: support both percent and seconds
  const uptimes = nodes.map((n) => {
    const u = Number(n?.uptime ?? 0);
    if (!Number.isFinite(u)) return 0;
    if (u > 100) {
      // assume seconds
      return Math.min(100, (u / MAX_UPTIME_SECONDS) * 100);
    }
    return Math.min(100, Math.max(0, u));
  });
  const avgUptime = uptimes.length ? _.mean(uptimes) : 0;

  // version freshness: percent of nodes on the most common/latest version
  const versions = nodes.reduce((acc: Record<string, number>, n: any) => {
    const v = n?.version || 'unknown';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
  const versionKeys = Object.keys(versions);
  let latestCount = 0;
  if (versionKeys.length) {
    // pick the highest semver-like key by numeric sort
    const sorted = versionKeys.sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na !== nb) return nb - na;
      }
      return 0;
    });
    const latest = sorted[0];
    latestCount = versions[latest] || 0;
  }

  const availabilityScore = clamp(total > 0 ? (active / total) * 100 : 0);
  const uptimeScore = clamp(avgUptime);
  const versionScore = clamp(total > 0 ? (latestCount / total) * 100 : 0);

  const networkHealth = clamp(Math.round((availabilityScore * 0.5) + (uptimeScore * 0.3) + (versionScore * 0.2)));

  // trust: if responded endpoints provided, require at least 30% coverage to be trusted
  const attempted = options?.attemptedEndpoints ?? 0;
  const responded = options?.respondedEndpoints ?? 0;
  let trusted = true;
  if (attempted > 0) {
    trusted = (responded / attempted) >= 0.3; // arbitrary threshold
  } else {
    // if we have < 5 nodes, not trusted
    trusted = sampleSize >= 5;
  }

  return {
    networkHealth,
    availabilityScore,
    uptimeScore,
    versionScore,
    sampleSize,
    trusted,
  };
}

export default { computeNetworkHealth };
