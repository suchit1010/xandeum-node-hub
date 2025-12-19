import { Server, Activity, Wifi, Zap, TrendingUp, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  delay?: number;
}

function StatCard({ title, value, change, changeType = "neutral", icon, delay = 0 }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

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
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            changeType === "positive" ? "bg-emerald-500/20 text-emerald-400" :
            changeType === "negative" ? "bg-red-500/20 text-red-400" :
            "bg-secondary text-muted-foreground"
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
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
}

export function NetworkStats({ stats }: NetworkStatsProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Network Overview</h2>
          <p className="text-muted-foreground">Real-time pNode network statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total pNodes"
          value={stats.totalNodes.toLocaleString()}
          change="+12"
          changeType="positive"
          icon={<Server className="h-5 w-5" />}
          delay={0}
        />
        <StatCard
          title="Active Nodes"
          value={stats.activeNodes.toLocaleString()}
          change="98.2%"
          changeType="positive"
          icon={<Activity className="h-5 w-5" />}
          delay={100}
        />
        <StatCard
          title="Avg Uptime"
          value={`${stats.avgUptime}%`}
          change="+0.3%"
          changeType="positive"
          icon={<TrendingUp className="h-5 w-5" />}
          delay={200}
        />
        <StatCard
          title="Total Capacity"
          value={stats.totalCapacity}
          icon={<Zap className="h-5 w-5" />}
          delay={300}
        />
        <StatCard
          title="Avg Response"
          value={`${stats.avgResponseTime}ms`}
          change="-5ms"
          changeType="positive"
          icon={<Clock className="h-5 w-5" />}
          delay={400}
        />
        <StatCard
          title="Network Health"
          value={`${stats.networkHealth}%`}
          changeType="positive"
          icon={<Wifi className="h-5 w-5" />}
          delay={500}
        />
      </div>
    </section>
  );
}
