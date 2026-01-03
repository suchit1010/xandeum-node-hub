import { Server, Activity, Wifi, Zap, TrendingUp, Clock, Info, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  delay?: number;
  tooltip?: string;
  showGauge?: boolean;
  gaugeValue?: number;
}

function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon, 
  delay = 0,
  tooltip,
  showGauge,
  gaugeValue = 0
}: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Determine gauge color based on value
  const getGaugeColor = (val: number) => {
    if (val >= 90) return "from-emerald-400 to-emerald-500";
    if (val >= 70) return "from-primary to-xandeum-purple";
    if (val >= 50) return "from-xandeum-orange to-amber-400";
    return "from-red-400 to-red-500";
  };

  return (
    <div 
      className={`stat-card transform transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex items-center gap-2">
          {change && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              changeType === "positive" ? "bg-emerald-500/20 text-emerald-400" :
              changeType === "negative" ? "bg-red-500/20 text-red-400" :
              "bg-secondary text-muted-foreground"
            }`}>
              {change}
            </span>
          )}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] bg-popover border-border text-sm">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {showGauge ? (
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <p className="text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
          <div className="relative h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getGaugeColor(gaugeValue)} transition-all duration-1000`}
              style={{ width: `${gaugeValue}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
        </div>
      )}
    </div>
  );
}

interface NetworkStatsProps {
  stats: {
    totalNodes: number;
    activeNodes: number;
    avgUptime: number;
    totalCapacity: string;
    avgResponseTime: number;
    networkHealth: number;
    availabilityScore?: number;
    uptimeScore?: number;
    versionScore?: number;
    coverageAttempted?: number | null;
    coverageResponded?: number | null;
    lastFetchDurationMs?: number | null;
  };
  lastUpdated?: Date;
}

export function NetworkStats({ stats, lastUpdated }: NetworkStatsProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  return (
    <section className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Network Overview</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Real-time pNode network statistics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lastUpdated && (
            <div className="hidden xs:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Last sync: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <button
            className="text-xs sm:text-sm text-muted-foreground bg-secondary/30 px-2 sm:px-3 py-1 sm:py-1 rounded-full flex items-center gap-2"
            onClick={() => setShowBreakdown(!showBreakdown)}
            aria-expanded={showBreakdown}
            aria-controls="network-health-breakdown"
          >
            <span>Details</span>
            {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total pNodes"
          value={stats.totalNodes.toLocaleString()}
          change="+12"
          changeType="positive"
          icon={<Server className="h-5 w-5" />}
          delay={0}
          tooltip="Total number of pNodes registered in the network via pRPC gossip data"
        />
        <StatCard
          title="Active Nodes"
          value={stats.activeNodes.toLocaleString()}
          change={`${((stats.activeNodes / stats.totalNodes) * 100).toFixed(1)}%`}
          changeType="positive"
          icon={<Activity className="h-5 w-5" />}
          delay={100}
          tooltip="Nodes currently online and responding to network requests"
        />
        <StatCard
          title="Avg Uptime"
          value={`${stats.avgUptime}%`}
          change="+0.3%"
          changeType="positive"
          icon={<TrendingUp className="h-5 w-5" />}
          delay={200}
          tooltip="Average percentage of time pNodes have been active and available"
        />
        <StatCard
          title="Total Capacity"
          value={stats.totalCapacity}
          icon={<Zap className="h-5 w-5" />}
          delay={300}
          tooltip="Combined storage capacity across all pNodes (Exabytes for Solana Programs)"
        />
        <StatCard
          title="Avg Response"
          value={`${stats.avgResponseTime}ms`}
          change="-5ms"
          changeType="positive"
          icon={<Clock className="h-5 w-5" />}
          delay={400}
          tooltip="Average network response latency - lower is better for performance"
        />
        <StatCard
          title="Network Health"
          value={`${stats.networkHealth}%`}
          changeType="positive"
          icon={<Wifi className="h-5 w-5" />}
          delay={500}
          tooltip={
            `Score breakdown — availability: ${stats.availabilityScore ?? 'n/a'}%, uptime: ${stats.uptimeScore ?? 'n/a'}%, version: ${stats.versionScore ?? 'n/a'}%. Coverage: ${stats.coverageResponded ?? 'n/a'}/${stats.coverageAttempted ?? 'n/a'} endpoints.`
          }
          showGauge
          gaugeValue={stats.networkHealth}
        />
      </div>

      {showBreakdown && (
        <div id="network-health-breakdown" className="mt-3 sm:mt-4 glass-card p-3 sm:p-4 rounded-lg sm:rounded-xl">
          <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Health Score Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-secondary/20">
              <div className="text-xs text-muted-foreground">Availability</div>
              <div className="text-base sm:text-lg font-bold">{stats.availabilityScore ?? 'n/a'}%</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-secondary/20">
              <div className="text-xs text-muted-foreground">Uptime</div>
              <div className="text-base sm:text-lg font-bold">{stats.uptimeScore ?? 'n/a'}%</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-secondary/20">
              <div className="text-xs text-muted-foreground">Version Freshness</div>
              <div className="text-base sm:text-lg font-bold">{stats.versionScore ?? 'n/a'}%</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-secondary/20">
              <div className="text-xs text-muted-foreground">Coverage</div>
              <div className="text-base sm:text-lg font-bold">{stats.coverageResponded ?? 'n/a'}/{stats.coverageAttempted ?? 'n/a'}</div>
              {typeof stats.lastFetchDurationMs === 'number' && (
                <div className="text-xs text-muted-foreground">probe: {stats.lastFetchDurationMs}ms</div>
              )}
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
            <strong>Formula:</strong> networkHealth = 0.5 * availability + 0.3 * uptime + 0.2 * version (each clamped 0–100).
          </div>
        </div>
      )}
    </section>
  );
}
