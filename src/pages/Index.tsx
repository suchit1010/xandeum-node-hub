import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import VerificationCard from "@/components/VerificationCard";
import { NetworkStats } from "@/components/NetworkStats";
import { NetworkCharts } from "@/components/NetworkCharts";
import { FilterBar } from "@/components/FilterBar";
import { PNodeTable, PNode } from "@/components/PNodeTable";
import { PNodeGrid } from "@/components/PNodeGrid";
import { AnalyticsTab } from "@/components/AnalyticsTab";
import { LoadingOverlay } from "@/components/LoadingOverlay";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Trophy } from "lucide-react";
import PrpcProgress from "@/components/PrpcProgress";
import { fetchPNodes, fetchPodCredits, mapToAppPNode } from "@/lib/prpc";
import NodeDetailsModal from '@/components/NodeDetailsModal';
import { VirtualizedGrid } from "@/components/VirtualizedGrid";


const Index = () => {
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState<string | undefined>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [lastSource, setLastSource] = useState<string | undefined>(undefined);
  const [lastRawJson, setLastRawJson] = useState<unknown>(null);
  const [coverageAttempted, setCoverageAttempted] = useState<number | null>(null);
  const [coverageResponded, setCoverageResponded] = useState<number | null>(null);
  const [lastFetchDurationMs, setLastFetchDurationMs] = useState<number | null>(null);
  type PrpcProgressType = Record<string, unknown> | null;
  const [prpcProgress, setPrpcProgress] = useState<PrpcProgressType>(null);
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // ms, 0 = off

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pResp, creditData] = await Promise.all([fetchPNodes(), fetchPodCredits()]);
      // Debug: log proxy response and credit data to help diagnose empty dashboard
      // (temporary - remove after debugging)
      // eslint-disable-next-line no-console
      console.debug('prpc fetch response', pResp);
      // eslint-disable-next-line no-console
      console.debug('prpc meta', pResp.meta);
      // eslint-disable-next-line no-console
      console.debug('pod credits', creditData);
      // pResp: { nodes, raw, source }
      const nodeData = pResp.nodes || [];
      // Robust stake merge: try exact pubkey, trimmed keys, and fallback by prefix match
      const creditKeys = Object.keys(creditData || {});
      const findCredit = (pubkey?: string) => {
        if (!pubkey) return 0;
        if (creditData[pubkey] !== undefined) return creditData[pubkey];
        const trimmed = String(pubkey).trim();
        if (creditData[trimmed] !== undefined) return creditData[trimmed];
        // Attempt case-insensitive or prefixed matches
        const lower = trimmed.toLowerCase();
        for (const k of creditKeys) {
          if (String(k).toLowerCase() === lower) return creditData[k];
        }
        // prefix match (first 8 chars)
        const prefix = trimmed.slice(0, 8);
        const matchKey = creditKeys.find(k => String(k).startsWith(prefix));
        if (matchKey) return creditData[matchKey];
        return 0;
      };

      const enrichedNodes = nodeData.map(node => ({ ...node, stake: findCredit(node.pubkey) || 0 }));
      const mappedNodes = enrichedNodes.map(mapToAppPNode);
      setNodes(mappedNodes as unknown as PNode[]);
      // persist last successful fetch to localStorage for offline fallback
      try {
        const payload = { ts: Date.now(), nodes: mappedNodes };
        localStorage.setItem('xandeum:lastNodes', JSON.stringify(payload));
      } catch (e) {
        // ignore
      }
      setLastFetchTime(Date.now());
      setLastSource(pResp.source);
      setLastRawJson(pResp.raw);
        setCoverageAttempted(pResp.meta?.attempted ?? null);
        setCoverageResponded(pResp.meta?.responded ?? null);
        setLastFetchDurationMs(pResp.meta?.durationMs ?? null);
    } catch (err) {
      setError('Failed to fetch pNode data from Xandeum network. Retrying...');
      console.error('pRPC fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // try load cached data first if available
    try {
      const raw = localStorage.getItem('xandeum:lastNodes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.ts && (Date.now() - parsed.ts) < (10 * 60 * 1000) && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          setNodes(parsed.nodes);
        }
      }
    } catch (e) {
      // ignore
    }
    loadData();
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(loadData, refreshInterval);
    }

    // Globe selection listener: filter table by region or open node details
    function onGlobeSelect(e: CustomEvent<{ region?: string; nodes?: PNode[] }>) {
      const detail = e?.detail;
      if (!detail) return;
      const region = detail.region;
      const clusterNodes = detail.nodes || [];
      if (region) {
        setRegionFilter(region === 'Unknown' ? 'all' : region);
      }
      if (clusterNodes.length > 0) {
        const first = clusterNodes[0];
        setSelectedNode(first);
      }
    }
    window.addEventListener('xandeum:globe-select', onGlobeSelect as EventListener);

    function onPrpcProgress(e: CustomEvent<Record<string, unknown>>) {
      const d = e?.detail;
      if (!d) return;
      setPrpcProgress(d);
      // clear after a slightly longer timeout (5s)
      setTimeout(() => setPrpcProgress(null), 5000);
    }
    window.addEventListener('xandeum:prpc-progress', onPrpcProgress as EventListener);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('xandeum:globe-select', onGlobeSelect as EventListener);
      window.removeEventListener('xandeum:prpc-progress', onPrpcProgress as EventListener);
    };
  }, [refreshInterval]);

  const handleRefresh = () => {
    loadData();
  };

  // Export current filtered nodes as CSV
  const exportFiltered = () => {
    try {
      window.dispatchEvent(new Event('xandeum:export-csv'));
    } catch (e) {
      console.error('Export trigger failed', e);
    }
  };

  const filteredNodes = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return nodes.filter((node) => {
      const matchesStatus = statusFilter === "all" || node.status === statusFilter;
      const matchesRegion = regionFilter === "all" ||
        (regionFilter === 'na' && node.region === 'North America') ||
        (regionFilter === 'eu' && node.region === 'Europe') ||
        (regionFilter === 'asia' && node.region === 'Asia Pacific') ||
        (regionFilter !== 'na' && regionFilter !== 'eu' && regionFilter !== 'asia' && regionFilter !== 'all' && node.region === regionFilter);
      const matchesVersion = !versionFilter || versionFilter === "all" || node.version === versionFilter;
      if (!q) return matchesStatus && matchesRegion && matchesVersion;

      const id = (node.id || '').toLowerCase();
      const addr = (node.address || '').toLowerCase();
      const exactMatch = id === q || addr === q;
      const partialMatch = id.includes(q) || addr.includes(q);
      const matchesSearch = exactMatch || partialMatch;

      return matchesStatus && matchesRegion && matchesVersion && matchesSearch;
    });
  }, [nodes, statusFilter, regionFilter, searchQuery, versionFilter]);

  // derive unique region names for the top filter (sorted)
  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      const r = (n.region || '').trim();
      if (r) set.add(r);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [nodes]);

  const versions = useMemo(() => {
    const s = Array.from(new Set(nodes.map(n => n.version).filter(Boolean)));
    return s.sort((a,b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).reverse();
  }, [nodes]);

  interface NetworkStatsType {
    totalNodes: number;
    activeNodes: number;
    avgUptime: number;
    totalCapacity: string;
    avgResponseTime: number;
    networkHealth: number;
    availabilityScore: number;
    uptimeScore: number;
    versionScore: number;
    coverageAttempted: number | null;
    coverageResponded: number | null;
    lastFetchDurationMs: number | null;
  }

  const stats = useMemo<NetworkStatsType>(() => {
    const total = nodes.length || 0;
    const active = nodes.filter(n => n.status === "online").length;
    const avgUptime = total > 0 ? nodes.reduce((acc, n) => acc + n.uptime, 0) / total : 0;
    const totalCapacity = nodes.reduce((acc, n) => acc + (Number(n.capacity) || 0), 0); // capacity is GB
    const avgResponse = lastFetchDurationMs && coverageResponded ? Math.round((lastFetchDurationMs / Math.max(1, coverageResponded)) ) : 0;

    // Version freshness: percent of nodes on the most recent major.minor
    const versionCounts: Record<string, number> = {};
    nodes.forEach(n => { if (n.version) versionCounts[n.version] = (versionCounts[n.version] || 0) + 1; });
    const versionsSorted = Object.keys(versionCounts).sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na !== nb) return nb - na; // descending
      }
      return 0;
    });
    const latest = versionsSorted[0] || null;
    const latestCount = latest ? versionCounts[latest] || 0 : 0;
    const versionScore = total > 0 ? (latestCount / total) * 100 : 0;

    // Health score (weighted): availability 50%, uptime 30%, version freshness 20%
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    const availabilityScore = clamp(total > 0 ? (active / total) * 100 : 0);
    const uptimeScore = clamp(avgUptime); // uptime is percentage already
    const vScore = clamp(versionScore);
    const networkHealth = clamp(Math.round((availabilityScore * 0.5) + (uptimeScore * 0.3) + (vScore * 0.2)));

    return {
      totalNodes: total,
      activeNodes: active,
      avgUptime: Math.round(avgUptime * 10) / 10,
      totalCapacity: `${(totalCapacity / 1024).toFixed(2)} TB`,
      avgResponseTime: avgResponse,
      networkHealth,
      availabilityScore,
      uptimeScore,
      versionScore: vScore,
      coverageAttempted: coverageAttempted,
      coverageResponded: coverageResponded,
      lastFetchDurationMs,
    };
  }, [nodes]);

  const statusData = useMemo(() => [
    { name: "Online", value: nodes.filter(n => n.status === "online").length, color: "hsl(160, 84%, 39%)" },
    { name: "Syncing", value: nodes.filter(n => n.status === "syncing").length, color: "hsl(45, 93%, 47%)" },
    { name: "Offline", value: nodes.filter(n => n.status === "offline").length, color: "hsl(0, 84%, 60%)" },
  ], [nodes]);

  const trendData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ time: `${String(i).padStart(2, "0")}:00`, nodes: 0, uptimeSum: 0 }));
    nodes.forEach(n => {
      const ls = n.lastSeen ? new Date(n.lastSeen) : null;
      if (!ls) return;
      const h = ls.getHours();
      hours[h].nodes += 1;
      hours[h].uptimeSum += Number(n.uptime) || 0;
    });
    return hours.map(h => ({ time: h.time, nodes: h.nodes, uptime: h.nodes ? Math.round((h.uptimeSum / h.nodes) * 10) / 10 : (nodes.length ? Math.round((nodes.reduce((s, n) => s + (Number(n.uptime)||0), 0) / nodes.length) * 10) / 10 : 0) }));
  }, [nodes]);

  const topNodes = useMemo(() => 
    [...nodes].sort((a, b) => b.stake - a.stake).slice(0, 10)
  , [nodes]);

  // Show loading overlay only on initial load (no cached data yet)
  const showLoadingOverlay = isLoading && nodes.length === 0;

  return (
    <div className="min-h-screen">
      <LoadingOverlay isVisible={showLoadingOverlay} />
      <Header
        onRefresh={handleRefresh}
        isLoading={isLoading}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <main className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Verification card moved to header (keeps dashboard clean) */}

        {/* Network Stats */}
        <PrpcProgress progress={prpcProgress} />
        <NetworkStats stats={stats} lastUpdated={new Date()} />


        {/* Charts */}
        <NetworkCharts statusData={statusData} trendData={trendData} />

        {/* Tabs Section */}
        <Tabs defaultValue="all-nodes" className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="glass-card p-1 bg-secondary/50 w-full flex justify-start sm:justify-start">
            <TabsTrigger value="all-nodes" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              All pNodes
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Leader</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-nodes" className="space-y-3 sm:space-y-4">
            <FilterBar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              regionFilter={regionFilter}
              setRegionFilter={setRegionFilter}
              regions={uniqueRegions}
              versionFilter={versionFilter}
              setVersionFilter={setVersionFilter}
              versions={versions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onExport={exportFiltered}
            />
            
            {/* Verification card shown above the grid to match pNode card design */}
            <div className="mb-4">
              <VerificationCard
                lastFetchTime={lastFetchTime}
                sourceUrl={lastSource}
                rawJson={lastRawJson}
                podsCount={nodes.length}
              />
            </div>

            {viewMode === "table" ? (
              <PNodeTable nodes={filteredNodes} onViewDetails={(n) => setSelectedNode(n)} />
            ) : (
              <VirtualizedGrid nodes={filteredNodes} onViewDetails={(n) => setSelectedNode(n)} />
            )}
            <NodeDetailsModal open={!!selectedNode} onOpenChange={(o) => { if (!o) setSelectedNode(null); }} node={selectedNode} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-xandeum-orange" />
                Top 10 pNodes by Stake
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {topNodes.map((node, index) => (
                  <div 
                    key={node.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm ${
                      index === 0 ? "bg-xandeum-orange/20 text-xandeum-orange" :
                      index === 1 ? "bg-gray-300/20 text-gray-300" :
                      index === 2 ? "bg-amber-700/20 text-amber-600" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-xs sm:text-sm truncate">{node.id}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{node.region}</p>
                    </div>
                    <div className="flex gap-3 sm:gap-4 w-full sm:w-auto text-right">
                      <div className="flex-1 sm:flex-none">
                        <p className="font-mono font-bold text-primary text-xs sm:text-sm">
                          {(node.stake / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">staked</p>
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <p className="font-semibold text-emerald-400 text-xs sm:text-sm">{node.uptime}%</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">uptime</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab
              nodes={nodes}
              coverageAttempted={coverageAttempted ?? 0}
              coverageResponded={coverageResponded ?? 0}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 md:mt-16 py-4 sm:py-6 md:py-8 border-t border-border/50 text-center text-muted-foreground text-xs sm:text-sm">
          <p>© 2024 Xandeum Network. Built for the pNode Analytics Bounty.</p>
          <p className="mt-1">Real-time validator metrics powered by pRPC from Xandeum gossip network</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
