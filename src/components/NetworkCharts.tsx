import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";

interface ChartsProps {
  statusData: { name: string; value: number; color: string }[];
  trendData: { time: string; nodes: number; uptime: number }[];
}

export function NetworkCharts({ statusData, trendData }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Status Distribution */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Status Distribution</h3>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: "hsl(220 20% 12%)", 
                  border: "1px solid hsl(168 80% 45%)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "8px 12px",
                }}
                itemStyle={{
                  color: "#ffffff",
                }}
                labelStyle={{
                  color: "hsl(168 80% 45%)",
                  fontWeight: "bold",
                  marginBottom: "4px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
              <span className="text-sm text-muted-foreground">{item.name}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Network Trend */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Network Activity (24h)</h3>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorNodes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(168 80% 45%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(168 80% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(35 95% 55%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(35 95% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(215 15% 55%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215 15% 55%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  background: "hsl(220 20% 12%)", 
                  border: "1px solid hsl(168 80% 45%)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "8px 12px",
                }}
                itemStyle={{
                  color: "#ffffff",
                }}
                labelStyle={{
                  color: "hsl(168 80% 45%)",
                  fontWeight: "bold",
                  marginBottom: "4px",
                }}
              />
              <Area
                type="monotone"
                dataKey="nodes"
                stroke="hsl(168 80% 45%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNodes)"
                name="Active Nodes"
              />
              <Area
                type="monotone"
                dataKey="uptime"
                stroke="hsl(35 95% 55%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUptime)"
                name="Avg Uptime %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
