import { Server, Activity, Wifi, Zap, TrendingUp, Clock, Info, AlertCircle } from "lucide-react";
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
          <p className="text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
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
  };
  lastUpdated?: Date;
}

export function NetworkStats({ stats, lastUpdated }: NetworkStatsProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Network Overview</h2>
          <p className="text-muted-foreground">Real-time pNode network statistics from pRPC gossip</p>
        </div>
        {lastUpdated && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Last sync: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          tooltip="Overall network health score based on availability, latency, and error rates"
          showGauge
          gaugeValue={stats.networkHealth}
        />
      </div>
    </section>
  );
}
