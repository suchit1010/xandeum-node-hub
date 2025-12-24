import { useMemo, useState, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LineChart, Line, Legend,
  RadialBarChart, RadialBar
} from "recharts";
import {
  TrendingUp, TrendingDown, Globe, Cpu, Clock, Activity,
  Zap, Database, Users, ArrowUpRight, ArrowDownRight,
  Calendar, Download, Filter, Map, FileJson, FileSpreadsheet,
  Info, AlertCircle, CheckCircle
} from "lucide-react";
import { NetworkGlobe } from "@/components/NetworkGlobe";
import { Button } from "@/components/ui/button";
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PNode } from "@/components/PNodeTable";
import { toast } from "@/hooks/use-toast";

interface AnalyticsTabProps {
  nodes: PNode[];
}

export function AnalyticsTab({ nodes }: AnalyticsTabProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [regionFilter, setRegionFilter] = useState<string | null>(null);

  const handleGlobeLocationClick = useCallback((region: string) => {
    setRegionFilter(prev => prev === region ? null : region);
  }, []);

  // Filter nodes by region if filter is set
  const filteredNodes = useMemo(() => {
    if (!regionFilter) return nodes;
    return nodes.filter(n => n.region === regionFilter);
  }, [nodes, regionFilter]);
  // Regional Distribution Data
  const regionalData = useMemo(() => {
    const regions = nodes.reduce((acc, node) => {
      acc[node.region] = (acc[node.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(regions).map(([name, value]) => ({
      name,
      value,
      fill: name === "North America" ? "hsl(168 80% 45%)" : 
            name === "Europe" ? "hsl(270 70% 60%)" : 
            name === "Asia" ? "hsl(35 95% 55%)" : "hsl(200 80% 50%)"
    }));
  }, [nodes]);

  // Performance Over Time (mock 7 days)
  const performanceData = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        uptime: Math.floor(Math.random() * 3) + 97,
        capacity: Math.floor(Math.random() * 15) + 65,
        responseTime: Math.floor(Math.random() * 15) + 25,
      };
    })
  , []);

  // Capacity Utilization
  const capacityData = useMemo(() => [
    { name: "0-25%", count: nodes.filter(n => n.capacity <= 25).length, fill: "hsl(168 80% 45%)" },
    { name: "26-50%", count: nodes.filter(n => n.capacity > 25 && n.capacity <= 50).length, fill: "hsl(200 80% 50%)" },
    { name: "51-75%", count: nodes.filter(n => n.capacity > 50 && n.capacity <= 75).length, fill: "hsl(35 95% 55%)" },
    { name: "76-100%", count: nodes.filter(n => n.capacity > 75).length, fill: "hsl(0 84% 60%)" },
  ], [nodes]);

  // Hourly Traffic Pattern
  const trafficData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      requests: Math.floor(Math.random() * 5000) + 2000,
      errors: Math.floor(Math.random() * 50),
    }))
  , []);

  // Version Distribution
  const versionData = useMemo(() => {
    const versions = nodes.reduce((acc, node) => {
      // Group versions (e.g., 0.8.0, 0.8.1 -> 0.8.x)
      const parts = node.version.split(".");
      const groupedVersion = parts.length >= 2 ? `${parts[0]}.${parts[1]}.x` : node.version;
      acc[groupedVersion] = (acc[groupedVersion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(versions).map(([version, count]) => ({
      version,
      count,
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [nodes]);

  // Network Health Score
  const healthScore = useMemo(() => {
    const online = nodes.filter(n => n.status === "online").length / nodes.length;
    const avgUptime = nodes.reduce((acc, n) => acc + n.uptime, 0) / nodes.length / 100;
    const avgCapacity = nodes.reduce((acc, n) => acc + n.capacity, 0) / nodes.length / 100;
    return Math.round((online * 0.4 + avgUptime * 0.4 + (1 - avgCapacity) * 0.2) * 100);
  }, [nodes]);

  const healthData = [{ name: "Health", value: healthScore, fill: "url(#healthGradient)" }];

  // Key Metrics
  const metrics = useMemo(() => ({
    avgUptime: (nodes.reduce((acc, n) => acc + n.uptime, 0) / nodes.length).toFixed(1),
    avgCapacity: (nodes.reduce((acc, n) => acc + n.capacity, 0) / nodes.length).toFixed(1),
    totalPeers: nodes.reduce((acc, n) => acc + n.peers, 0),
    totalStake: (nodes.reduce((acc, n) => acc + n.stake, 0) / 1000000).toFixed(2),
  }), [nodes]);

  // Status breakdown
  const statusBreakdown = useMemo(() => ({
    online: nodes.filter(n => n.status === "online").length,
    offline: nodes.filter(n => n.status === "offline").length,
    syncing: nodes.filter(n => n.status === "syncing").length,
  }), [nodes]);

  const tooltipStyle = {
    background: "hsl(220 25% 10%)",
    border: "1px solid hsl(220 20% 18%)",
    borderRadius: "8px",
    color: "hsl(210 20% 95%)"
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ["ID", "Address", "Status", "Uptime", "Capacity", "Peers", "Stake", "Version", "Region"];
    const rows = nodes.map(n => [
      n.id, n.address, n.status, n.uptime, n.capacity, n.peers, n.stake, n.version, n.region
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xandeum-pnodes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported to CSV", description: `${nodes.length} pNodes exported successfully` });
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(nodes, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xandeum-pnodes-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported to JSON", description: `${nodes.length} pNodes exported successfully` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Advanced Network Analytics
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Deep dive into pNode performance metrics and network trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`border-border/50 ${selectedTimeRange === "24h" ? "bg-primary/20" : ""}`}
            onClick={() => setSelectedTimeRange("24h")}
          >
            24h
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`border-border/50 ${selectedTimeRange === "7d" ? "bg-primary/20" : ""}`}
            onClick={() => setSelectedTimeRange("7d")}
          >
            7 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`border-border/50 ${selectedTimeRange === "30d" ? "bg-primary/20" : ""}`}
            onClick={() => setSelectedTimeRange("30d")}
          >
            30 Days
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-border/50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToJSON} className="cursor-pointer">
                <FileJson className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg Uptime"
          value={`${metrics.avgUptime}%`}
          trend={+2.3}
          color="text-emerald-400"
          tooltip="Average percentage of time all pNodes have been active"
        />
        <MetricCard
          icon={<Database className="h-5 w-5" />}
          label="Avg Capacity"
          value={`${metrics.avgCapacity}%`}
          trend={-1.2}
          color="text-xandeum-orange"
          tooltip="Average storage utilization across all pNodes"
        />
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Total Peers"
          value={metrics.totalPeers.toLocaleString()}
          trend={+5.7}
          color="text-primary"
          tooltip="Sum of all peer connections across the network"
        />
        <MetricCard
          icon={<Zap className="h-5 w-5" />}
          label="Total Staked"
          value={`${metrics.totalStake}M`}
          trend={+8.4}
          color="text-xandeum-purple"
          tooltip="Total tokens staked across all pNodes"
        />
      </div>

      {/* Status Overview Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-500/20">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{statusBreakdown.online}</p>
            <p className="text-sm text-muted-foreground">Online Nodes</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-amber-500/20">
            <Activity className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{statusBreakdown.syncing}</p>
            <p className="text-sm text-muted-foreground">Syncing</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-500/20">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{statusBreakdown.offline}</p>
            <p className="text-sm text-muted-foreground">Offline</p>
          </div>
        </div>
      </div>

      {/* Network Health Score + Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        <div className="glass-card rounded-xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Network Health Score
            <TooltipProvider>
              <TooltipUI>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] bg-popover border-border">
                  <p>Composite score based on: 40% availability, 40% uptime, 20% capacity headroom</p>
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          </h4>
          <div className="h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                data={healthData}
              >
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(168 80% 45%)" />
                    <stop offset="100%" stopColor="hsl(270 70% 60%)" />
                  </linearGradient>
                </defs>
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background={{ fill: "hsl(220 20% 15%)" }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold gradient-text">{healthScore}</span>
              <span className="text-sm text-muted-foreground">out of 100</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-secondary/30">
              <p className="text-muted-foreground">Availability</p>
              <p className="font-semibold text-emerald-400">{((statusBreakdown.online / nodes.length) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30">
              <p className="text-muted-foreground">Latency</p>
              <p className="font-semibold text-primary">32ms</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30">
              <p className="text-muted-foreground">Errors</p>
              <p className="font-semibold text-xandeum-orange">0.2%</p>
            </div>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="glass-card rounded-xl p-6 lg:col-span-2">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Regional Distribution
            <TooltipProvider>
              <TooltipUI>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] bg-popover border-border">
                  <p>Geographic distribution of pNodes derived from IP geolocation</p>
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionalData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {regionalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {regionalData.map((region) => (
                <div key={region.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: region.fill }} />
                    <span className="text-sm">{region.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{region.value}</span>
                    <span className="text-muted-foreground text-sm ml-1">
                      ({((region.value / nodes.length) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Globe Visualization */}
      <NetworkGlobe nodes={nodes} onLocationClick={handleGlobeLocationClick} />
      
      {/* Region Filter Indicator */}
      {regionFilter && (
        <div className="glass-card rounded-xl p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Showing nodes from: <span className="font-semibold text-primary">{regionFilter}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              ({filteredNodes.length} of {nodes.length} nodes)
            </span>
          </div>
          <button
            onClick={() => setRegionFilter(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filter ×
          </button>
        </div>
      )}

      {/* Performance Over Time */}
      <div className="glass-card rounded-xl p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Performance Trends ({selectedTimeRange === "24h" ? "24 Hours" : selectedTimeRange === "7d" ? "7 Days" : "30 Days"})
        </h4>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
              <XAxis dataKey="date" stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="hsl(168 80% 45%)"
                strokeWidth={2}
                dot={{ fill: "hsl(168 80% 45%)", strokeWidth: 2 }}
                name="Uptime %"
              />
              <Line
                type="monotone"
                dataKey="capacity"
                stroke="hsl(270 70% 60%)"
                strokeWidth={2}
                dot={{ fill: "hsl(270 70% 60%)", strokeWidth: 2 }}
                name="Capacity %"
              />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(35 95% 55%)"
                strokeWidth={2}
                dot={{ fill: "hsl(35 95% 55%)", strokeWidth: 2 }}
                name="Response (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Capacity + Traffic Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacity Utilization */}
        <div className="glass-card rounded-xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Capacity Utilization
            <TooltipProvider>
              <TooltipUI>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] bg-popover border-border">
                  <p>Distribution of storage usage across pNodes</p>
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(215 15% 55%)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(215 15% 55%)" fontSize={12} width={60} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {capacityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Traffic */}
        <div className="glass-card rounded-xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Hourly Traffic Pattern
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168 80% 45%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(168 80% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                <XAxis dataKey="hour" stroke="hsl(215 15% 55%)" fontSize={10} tickLine={false} interval={3} />
                <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(168 80% 45%)"
                  strokeWidth={2}
                  fill="url(#trafficGradient)"
                  name="Requests"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Version Distribution */}
      <div className="glass-card rounded-xl p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          Node Version Distribution
          <TooltipProvider>
            <TooltipUI>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] bg-popover border-border">
                <p>Versions grouped by major.minor release for easier tracking</p>
              </TooltipContent>
            </TooltipUI>
          </TooltipProvider>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {versionData.map((v, i) => (
            <div key={v.version} className="p-4 rounded-lg bg-secondary/30 text-center hover:bg-secondary/50 transition-colors">
              <p className="font-mono text-lg font-semibold text-primary">{v.version}</p>
              <p className="text-2xl font-bold mt-1">{v.count}</p>
              <p className="text-xs text-muted-foreground">nodes</p>
              <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-xandeum-purple"
                  style={{ width: `${(v.count / nodes.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  trend,
  color,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  color: string;
  tooltip?: string;
}) {
  const isPositive = trend >= 0;
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={color}>{icon}</span>
        <div className="flex items-center gap-2">
          <div className={`flex items-center text-xs ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
          {tooltip && (
            <TooltipProvider>
              <TooltipUI>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[180px] bg-popover border-border text-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          )}
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
