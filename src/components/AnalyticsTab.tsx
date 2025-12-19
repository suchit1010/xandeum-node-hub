import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LineChart, Line, Legend,
  RadialBarChart, RadialBar
} from "recharts";
import {
  TrendingUp, TrendingDown, Globe, Cpu, Clock, Activity,
  Zap, Database, Users, ArrowUpRight, ArrowDownRight,
  Calendar, Download, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PNode } from "@/components/PNodeTable";

interface AnalyticsTabProps {
  nodes: PNode[];
}

export function AnalyticsTab({ nodes }: AnalyticsTabProps) {
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
            name === "Europe" ? "hsl(270 70% 60%)" : "hsl(35 95% 55%)"
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
      acc[node.version] = (acc[node.version] || 0) + 1;
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

  const tooltipStyle = {
    background: "hsl(220 25% 10%)",
    border: "1px solid hsl(220 20% 18%)",
    borderRadius: "8px",
    color: "hsl(210 20% 95%)"
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
          <Button variant="outline" size="sm" className="border-border/50">
            <Calendar className="h-4 w-4 mr-2" />
            Last 7 Days
          </Button>
          <Button variant="outline" size="sm" className="border-border/50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
        />
        <MetricCard
          icon={<Database className="h-5 w-5" />}
          label="Avg Capacity"
          value={`${metrics.avgCapacity}%`}
          trend={-1.2}
          color="text-xandeum-orange"
        />
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Total Peers"
          value={metrics.totalPeers.toLocaleString()}
          trend={+5.7}
          color="text-primary"
        />
        <MetricCard
          icon={<Zap className="h-5 w-5" />}
          label="Total Staked"
          value={`${metrics.totalStake}M`}
          trend={+8.4}
          color="text-xandeum-purple"
        />
      </div>

      {/* Network Health Score + Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        <div className="glass-card rounded-xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Network Health Score
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
              <p className="font-semibold text-emerald-400">98.5%</p>
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

      {/* Performance Over Time */}
      <div className="glass-card rounded-xl p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Performance Trends (7 Days)
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
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {versionData.map((v, i) => (
            <div key={v.version} className="p-4 rounded-lg bg-secondary/30 text-center">
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  color: string;
}) {
  const isPositive = trend >= 0;
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={color}>{icon}</span>
        <div className={`flex items-center text-xs ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
