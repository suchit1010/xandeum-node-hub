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
  Calendar, Download, Filter, /* Map, */ FileJson, FileSpreadsheet,
  Info, AlertCircle, CheckCircle
} from "lucide-react";
import React, { Suspense } from 'react';
import { countryCentroids } from '@/lib/geo';
interface GlobeCluster { name: string; lat: number; lon: number; count: number; nodes: PNode[]; color: string; }
interface GlobeProps { nodes: PNode[]; regionClusters: GlobeCluster[]; }
const GlobeLazy = React.lazy(() => import('./GlobeClean')) as React.LazyExoticComponent<React.ComponentType<GlobeProps>>;
import { Button } from "@/components/ui/button";
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TooltipProps } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PNode } from "@/components/PNodeTable";
import CentralizationAlert from '@/components/CentralizationAlert';
import { computeNetworkHealth } from "@/lib/stats";
import { toast } from "@/hooks/use-toast";

interface AnalyticsTabProps {
  nodes: PNode[];
  coverageAttempted?: number | null;
  coverageResponded?: number | null;
}

export function AnalyticsTab({ nodes, coverageAttempted = 0, coverageResponded = 0 }: AnalyticsTabProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [showOtherDetails, setShowOtherDetails] = useState(false);
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
  const { pieData: regionalData, otherList: regionalOtherList, total: regionalTotal } = useMemo(() => {
    const counts = nodes.reduce((acc, node) => {
      const r = node.region || 'Unknown';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(counts).map(([name, value]) => ({ name, value }));
    entries.sort((a, b) => b.value - a.value);
    const topN = 6; // show top 5-7 as requested; using 6 here
    const top = entries.slice(0, topN);
    const other = entries.slice(topN);
    const otherCount = other.reduce((s, e) => s + e.value, 0);

    // reduced, high-contrast palette
    const palette = [
      'hsl(200 80% 50%)',
      'hsl(168 80% 45%)',
      'hsl(270 70% 60%)',
      'hsl(35 95% 55%)',
      'hsl(300 70% 55%)',
      'hsl(40 80% 50%)',
    ];

    const mapped = top.map((e, i) => ({
      name: e.name,
      value: e.value,
      fill: palette[i % palette.length],
    }));

    if (otherCount > 0) mapped.push({ name: `Other (${other.length})`, value: otherCount, fill: 'hsl(220 20% 30%)' });

    return { pieData: mapped, otherList: other, total: entries.reduce((s, e) => s + e.value, 0) };
  }, [nodes]);

  // Performance Over Time derived from real node lastSeen timestamps (7 days)
  const performanceData = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const totalNodes = nodes.length || 0;

    return days.map((d) => {
      const start = new Date(d);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      const seenNodes = nodes.filter(n => {
        const ls = n.lastSeen ? new Date(n.lastSeen) : null;
        return ls && ls >= start && ls < end;
      });
      const nodesCount = seenNodes.length;
      const uptime = nodesCount > 0 ? Math.round((seenNodes.reduce((s, n) => s + (Number(n.uptime) || 0), 0) / nodesCount) * 10) / 10 : (totalNodes > 0 ? Math.round((nodes.reduce((s, n) => s + (Number(n.uptime) || 0), 0) / totalNodes) * 10) / 10 : 0);
      const capacity = nodesCount > 0 ? Math.round((seenNodes.reduce((s, n) => s + (Number(n.capacity) || 0), 0) / nodesCount) * 10) / 10 : (totalNodes > 0 ? Math.round((nodes.reduce((s, n) => s + (Number(n.capacity) || 0), 0) / totalNodes) * 10) / 10 : 0);
      const responseTime = nodesCount > 0 ? Math.round((seenNodes.reduce((s, n) => s + (Number(n.peers) || 0), 0) / nodesCount)) : 0;
      return {
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        uptime,
        capacity,
        responseTime,
        nodes: nodesCount,
      };
    });
  }, [nodes]);

  // Capacity Utilization
  const capacityData = useMemo(() => [
    { name: "0-25%", count: nodes.filter(n => n.capacity <= 25).length, fill: "hsl(168 80% 45%)" },
    { name: "26-50%", count: nodes.filter(n => n.capacity > 25 && n.capacity <= 50).length, fill: "hsl(200 80% 50%)" },
    { name: "51-75%", count: nodes.filter(n => n.capacity > 50 && n.capacity <= 75).length, fill: "hsl(35 95% 55%)" },
    { name: "76-100%", count: nodes.filter(n => n.capacity > 75).length, fill: "hsl(0 84% 60%)" },
  ], [nodes]);

  // Hourly Traffic Pattern derived from nodes' lastSeen timestamps
  const trafficData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, "0")}:00`, requests: 0, errors: 0 }));
    nodes.forEach(n => {
      const ls = n.lastSeen ? new Date(n.lastSeen) : null;
      if (!ls) return;
      const h = ls.getHours();
      hours[h].requests += 1;
      if (n.status === 'offline') hours[h].errors += 1;
    });
    return hours;
  }, [nodes]);

  // Version Distribution
  const versionData = useMemo(() => {
    const versions = nodes.reduce((acc, node) => {
      const v = typeof node.version === 'string' && node.version ? node.version : 'unknown';
      if (!v) return acc;
      const parts = v.split(".");
      const groupedVersion = parts.length >= 2 ? `${parts[0]}.${parts[1]}.x` : v;
      acc[groupedVersion] = (acc[groupedVersion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(versions).map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [nodes]);

  // Network Health Score (canonical) - include probe coverage so trust can be determined
  const health = useMemo(() => computeNetworkHealth(nodes, {
    attemptedEndpoints: coverageAttempted ?? 0,
    respondedEndpoints: coverageResponded ?? 0,
  }), [nodes, coverageAttempted, coverageResponded]);
  const healthScore = health.networkHealth;
  const healthData = [{ name: "Health", value: healthScore, fill: "url(#healthGradient)" }];

  // Centralization detection: aggregate stake and capacity by region
  const centralization = useMemo(() => {
    const stakeByRegion: Record<string, number> = {};
    const capByRegion: Record<string, number> = {};
    let totalStake = 0;
    let totalCap = 0;
    for (const n of nodes) {
      const r = n.region || 'Unknown';
      const s = Number(n.stake ?? 0);
      const c = Number(n.capacity ?? 0);
      stakeByRegion[r] = (stakeByRegion[r] || 0) + s;
      capByRegion[r] = (capByRegion[r] || 0) + c;
      totalStake += s;
      totalCap += c;
    }
    const stakeEntries = Object.entries(stakeByRegion).sort((a,b)=>b[1]-a[1]);
    const capEntries = Object.entries(capByRegion).sort((a,b)=>b[1]-a[1]);
    const topStake = stakeEntries[0];
    const topCap = capEntries[0];
    const topRegion = topStake?.[0] || topCap?.[0] || null;
    const stakePct = topStake && totalStake > 0 ? (topStake[1] / totalStake) * 100 : 0;
    const capacityPct = topCap && totalCap > 0 ? (topCap[1] / totalCap) * 100 : 0;
    return { topRegion, stakePct, capacityPct };
  }, [nodes]);

  // Key Metrics
  // safe metrics computation (avoid NaN / exceptions when nodes is empty or fields missing)
  const metrics = useMemo(() => {
    const total = nodes.length || 0;
    const sumUptime = nodes.reduce((acc, n) => acc + (Number(n.uptime) || 0), 0);
    const sumCapacity = nodes.reduce((acc, n) => acc + (Number(n.capacity) || 0), 0);
    const totalPeers = nodes.reduce((acc, n) => acc + (Number(n.peers) || 0), 0);
    const totalStake = nodes.reduce((acc, n) => acc + (Number(n.stake) || 0), 0);
    return {
      avgUptime: total > 0 ? (sumUptime / total).toFixed(1) : '0.0',
      avgCapacity: total > 0 ? (sumCapacity / total).toFixed(1) : '0.0',
      totalPeers,
      totalStake: (totalStake / 1000000).toFixed(2),
    };
  }, [nodes]);

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

  const [hoveredCapacityIndex, setHoveredCapacityIndex] = useState<number | null>(null);

  const CapacityTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const total = nodes.length || 1;
    const percent = ((data.count / total) * 100).toFixed(0);
    return (
      <div style={tooltipStyle} className="p-2 text-sm">
        <div className="font-semibold">{data.name}</div>
        <div>count: {data.count.toLocaleString()}</div>
        <div className="text-muted-foreground">{percent}%</div>
      </div>
    );
  };

  // Custom Pie tooltip for count + percent
  const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const percent = ((data.value / Math.max(1, regionalTotal)) * 100).toFixed(0);
    return (
      <div style={tooltipStyle} className="p-2 text-sm">
        <div className="font-semibold">{data.name}</div>
        <div>{data.value.toLocaleString()} • {percent}%</div>
      </div>
    );
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ["ID", "Address", "Status", "Uptime", "Capacity", "Peers", "Stake", "Version", "Region"];
    const rows = filteredNodes.map(n => [
      n.id, n.address, n.status, n.uptime, n.capacity, n.peers, n.stake, n.version, n.region
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(c => String(c ?? '').replace(/"/g, '""')).map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xandeum-pnodes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported to CSV", description: `${filteredNodes.length} pNodes exported successfully` });
  };

  const exportToJSON = () => {
    try {
      const payload = filteredNodes.map(n => ({ id: n.id, address: n.address, status: n.status, uptime: n.uptime, capacity: n.capacity, peers: n.peers, stake: n.stake, version: n.version, region: n.region }));
      const jsonContent = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xandeum-pnodes-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exported JSON', description: `${filteredNodes.length} pNodes exported successfully` });
    } catch (e) {
      console.error('Export JSON failed', e);
      toast({ title: 'Export failed' });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Advanced Network Analytics
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Deep dive into pNode performance metrics and network trends
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 text-xs sm:text-sm border-border/50 ${selectedTimeRange === "24h" ? "bg-primary/20" : ""}`}
            onClick={() => setSelectedTimeRange("24h")}
          >
            24h
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 text-xs sm:text-sm border-border/50 ${selectedTimeRange === "7d" ? "bg-primary/20" : ""}`}
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
      {centralization.topRegion && (
        <CentralizationAlert topRegion={centralization.topRegion} stakePct={centralization.stakePct} capacityPct={centralization.capacityPct} threshold={30} />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <MetricCard
          icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Avg Uptime"
          value={`${metrics.avgUptime}%`}
          trend={+2.3}
          color="text-emerald-400"
          tooltip="Average percentage of time all pNodes have been active"
        />
        <MetricCard
          icon={<Database className="h-4 w-4 sm:h-5 sm:w-5" />}
          label="Avg Capacity"
          value={`${metrics.avgCapacity}%`}
          trend={-1.2}
          color="text-xandeum-orange"
          tooltip="Average storage utilization across all pNodes"
        />
        <MetricCard
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <div className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-4 flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-full bg-emerald-500/20 flex-shrink-0">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-emerald-400">{statusBreakdown.online}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Online Nodes</p>
          </div>
        </div>
        <div className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-4 flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-full bg-amber-500/20 flex-shrink-0">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-amber-400">{statusBreakdown.syncing}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Syncing</p>
          </div>
        </div>
        <div className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-4 flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-full bg-red-500/20 flex-shrink-0">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-red-400">{statusBreakdown.offline}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Offline</p>
          </div>
        </div>
      </div>

      {/* Network Health Score + Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Health Score */}
        <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-6">
          <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Network Health Score
            <TooltipProvider>
              <TooltipUI>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[260px] bg-popover border-border text-xs sm:text-sm">
                  <p>Network Health is a composite score computed as:</p>
                  <ul className="list-inside list-disc text-xs sm:text-sm">
                    <li><strong>50%</strong> Availability (online / total)</li>
                    <li><strong>30%</strong> Avg uptime (normalized)</li>
                    <li><strong>20%</strong> Version freshness (percent on latest)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-1 sm:mt-2">Shows sample size and trust: health may be untrusted if probe coverage is low.</p>
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          </h4>
          <div className="h-[160px] sm:h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="54%"
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
                <span className="text-4xl font-bold gradient-text leading-none pt-10">{healthScore}</span>
                <span className="text-sm text-muted-foreground mt-0.1 mb-0.1">out of 100</span>
                <div className="mt-2 flex items-center gap-2">
                  {health.trusted ? (
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      <span>Trusted</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 text-xs px-2 py-1 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      <span>Untrusted (low probe coverage)</span>
                    </div>
                  )}
                </div>
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
            <div className="h-[260px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionalData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {regionalData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        fillOpacity={hoveredIndex === null ? 1 : hoveredIndex === index ? 1 : 0.35}
                        stroke={hoveredIndex === index ? 'hsl(210 20% 80%)' : 'transparent'}
                        strokeWidth={hoveredIndex === index ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* center total */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold">{regionalTotal}</div>
                  <div className="text-xs text-muted-foreground">Total nodes</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {regionalData.map((region, idx) => (
                <div
                  key={region.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${hoveredIndex === idx ? 'border border-primary/30' : 'bg-secondary/30'}`}
                  onMouseEnter={() => { setHoveredIndex(idx); setHoveredName(region.name); }}
                  onMouseLeave={() => { setHoveredIndex(null); setHoveredName(null); }}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: region.fill }} />
                    <span className="text-sm truncate max-w-[220px]">{region.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{region.value}</span>
                    <span className="text-muted-foreground text-sm ml-1">({((region.value / Math.max(1, regionalTotal)) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
              {/* If there is an aggregated Other, provide an expand/tooltip */}
              {regionalOtherList && regionalOtherList.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ background: 'hsl(220 20% 30%)' }} />
                      <button className="text-sm text-primary underline" onClick={() => setShowOtherDetails(s => !s)}>
                        Other ({regionalOtherList.length})
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{regionalOtherList.reduce((s, r) => s + r.value, 0)}</span>
                      <span className="text-muted-foreground text-sm ml-1">({((regionalOtherList.reduce((s, r) => s + r.value, 0) / Math.max(1, regionalTotal)) * 100).toFixed(0)}%)</span>
                    </div>
                  </div>

                  {showOtherDetails && (
                    <div className="mt-2 p-3 rounded bg-popover border border-border text-sm max-h-48 overflow-auto">
                      {regionalOtherList.map(r => (
                        <div key={r.name} className="flex items-center justify-between py-1">
                          <div className="truncate max-w-[280px]">{r.name}</div>
                          <div className="text-muted-foreground">{r.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 3D Globe (lazy-loaded) */}
      <div>
        <Suspense fallback={<div className="h-[420px] flex items-center justify-center">Loading globe...</div>}>
          {
            (() => {
              const clusters = regionalData.map(r => {
                const key = r.name;
                const countryKey = key.split(',').slice(-1)[0].trim();
                const centroid = countryCentroids[key] || countryCentroids[countryKey];
                const matchedNodes = nodes.filter(n => (n.region || '').toLowerCase().includes((key || '').split(',').slice(-1)[0].trim().toLowerCase()));
              return centroid ? { name: key, lat: centroid.lat, lon: centroid.lon, count: r.value, nodes: matchedNodes, color: r.fill } : null;
              }).filter((c): c is { name: string; lat: number; lon: number; count: number; nodes: PNode[]; color: string } => c !== null);
              const GlobeComponent = GlobeLazy as React.ComponentType<{
                nodes: PNode[];
                regionClusters: { name: string; lat: number; lon: number; count: number; nodes: PNode[]; color: string }[];
              }>;
              return <GlobeComponent nodes={nodes} regionClusters={clusters} />;
            })()
          }
        </Suspense>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Capacity Utilization */}
        <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-6">
          <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Capacity Utilization
            <TooltipProvider>
              <TooltipUI>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] bg-popover border-border text-xs sm:text-sm">
                  <p>Distribution of storage usage across pNodes</p>
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          </h4>
          <div className="h-[160px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(215 15% 55%)" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="hsl(215 15% 55%)" fontSize={10} width={50} />
                <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {capacityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        fillOpacity={hoveredCapacityIndex === null ? 1 : hoveredCapacityIndex === index ? 1 : 0.35}
                        onMouseEnter={() => setHoveredCapacityIndex(index)}
                        onMouseLeave={() => setHoveredCapacityIndex(null)}
                      />
                    ))}
                  </Bar>
                  <Tooltip contentStyle={tooltipStyle} content={<CapacityTooltip />} />
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
