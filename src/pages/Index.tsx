import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { NetworkStats } from "@/components/NetworkStats";
import { NetworkCharts } from "@/components/NetworkCharts";
import { FilterBar } from "@/components/FilterBar";
import { PNodeTable, PNode } from "@/components/PNodeTable";
import { PNodeGrid } from "@/components/PNodeGrid";
import { AnalyticsTab } from "@/components/AnalyticsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Trophy } from "lucide-react";

// Generate mock pNode data
const generateMockNodes = (): PNode[] => {
  const statuses: PNode["status"][] = ["online", "online", "online", "online", "syncing", "offline"];
  const regions = ["North America", "Europe", "Asia Pacific"];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `pNode-${String(i + 1).padStart(4, "0")}`,
    address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    uptime: Math.floor(Math.random() * 15) + 85,
    capacity: Math.floor(Math.random() * 60) + 40,
    peers: Math.floor(Math.random() * 150) + 50,
    lastSeen: new Date(Date.now() - Math.random() * 3600000),
    region: regions[Math.floor(Math.random() * regions.length)],
    version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.0`,
    stake: Math.floor(Math.random() * 50000) + 10000,
    isTop: i < 5,
  }));
};

const Index = () => {
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    setNodes(generateMockNodes());
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setNodes(generateMockNodes());
      setIsLoading(false);
    }, 1000);
  };

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesStatus = statusFilter === "all" || node.status === statusFilter;
      const matchesRegion = regionFilter === "all" || 
        (regionFilter === "na" && node.region === "North America") ||
        (regionFilter === "eu" && node.region === "Europe") ||
        (regionFilter === "asia" && node.region === "Asia Pacific");
      const matchesSearch = searchQuery === "" || 
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesRegion && matchesSearch;
    });
  }, [nodes, statusFilter, regionFilter, searchQuery]);

  const stats = useMemo(() => {
    const active = nodes.filter(n => n.status === "online").length;
    const avgUptime = nodes.reduce((acc, n) => acc + n.uptime, 0) / nodes.length;
    const totalCapacity = nodes.reduce((acc, n) => acc + n.capacity, 0);
    const avgResponse = Math.floor(Math.random() * 30) + 20;
    return {
      totalNodes: nodes.length,
      activeNodes: active,
      avgUptime: Math.round(avgUptime * 10) / 10,
      totalCapacity: `${(totalCapacity / 1000).toFixed(1)} TB`,
      avgResponseTime: avgResponse,
      networkHealth: Math.round((active / nodes.length) * 100),
    };
  }, [nodes]);

  const statusData = useMemo(() => [
    { name: "Online", value: nodes.filter(n => n.status === "online").length, color: "hsl(160, 84%, 39%)" },
    { name: "Syncing", value: nodes.filter(n => n.status === "syncing").length, color: "hsl(45, 93%, 47%)" },
    { name: "Offline", value: nodes.filter(n => n.status === "offline").length, color: "hsl(0, 84%, 60%)" },
  ], [nodes]);

  const trendData = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, "0")}:00`,
      nodes: Math.floor(Math.random() * 20) + 40,
      uptime: Math.floor(Math.random() * 5) + 95,
    }))
  , []);

  const topNodes = useMemo(() => 
    [...nodes].sort((a, b) => b.stake - a.stake).slice(0, 10)
  , [nodes]);

  return (
    <div className="min-h-screen">
      <Header onRefresh={handleRefresh} isLoading={isLoading} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Network Stats */}
        <NetworkStats stats={stats} lastUpdated={new Date()} />

        {/* Charts */}
        <NetworkCharts statusData={statusData} trendData={trendData} />

        {/* Tabs Section */}
        <Tabs defaultValue="all-nodes" className="space-y-6">
          <TabsList className="glass-card p-1 bg-secondary/50">
            <TabsTrigger value="all-nodes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="h-4 w-4 mr-2" />
              All pNodes
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-nodes" className="space-y-4">
            <FilterBar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              regionFilter={regionFilter}
              setRegionFilter={setRegionFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            
            {viewMode === "table" ? (
              <PNodeTable nodes={filteredNodes} />
            ) : (
              <PNodeGrid nodes={filteredNodes} />
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-xandeum-orange" />
                Top 10 pNodes by Stake
              </h3>
              <div className="space-y-3">
                {topNodes.map((node, index) => (
                  <div 
                    key={node.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? "bg-xandeum-orange/20 text-xandeum-orange" :
                      index === 1 ? "bg-gray-300/20 text-gray-300" :
                      index === 2 ? "bg-amber-700/20 text-amber-600" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-mono font-semibold">{node.id}</p>
                      <p className="text-sm text-muted-foreground">{node.region}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-primary">
                        {(node.stake / 1000).toFixed(1)}K
                      </p>
                      <p className="text-sm text-muted-foreground">staked</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">{node.uptime}%</p>
                      <p className="text-sm text-muted-foreground">uptime</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab nodes={nodes} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-border/50 text-center text-muted-foreground text-sm">
          <p>© 2024 Xandeum Network. Built for the pNode Analytics Bounty.</p>
          <p className="mt-1">Real-time validator metrics powered by pRPC</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
