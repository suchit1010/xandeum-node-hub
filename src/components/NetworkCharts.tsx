import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { ChartTooltipContent } from "@/components/ui/chart";
import { useState } from "react";

interface ChartsProps {
  statusData: { name: string; value: number; color: string }[];
  trendData: { time: string; nodes: number; uptime: number }[];
}

export function NetworkCharts({ statusData, trendData }: ChartsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null);

  // Calculate total for percentage
  const total = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
      {/* Status Distribution - Enhanced */}
      <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="p-2 rounded-lg bg-primary/10">
            <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base">Status Distribution</h3>
        </div>

        <div className="h-[160px] sm:h-[200px] flex items-center justify-center mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={(_, index) => {
                  setActiveIndex(index);
                  setHoveredLegend(statusData[index].name);
                }}
                onMouseLeave={() => {
                  setActiveIndex(null);
                  setHoveredLegend(null);
                }}
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={hoveredLegend === null || hoveredLegend === entry.name ? 1 : 0.35}
                    stroke={activeIndex === index ? '#ffffff' : 'transparent'}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    style={{ 
                      transition: 'opacity 150ms ease, stroke-width 150ms ease',
                      cursor: 'pointer',
                      filter: activeIndex === index ? 'drop-shadow(0 0 6px rgba(255,255,255,0.25))' : 'none'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    const percentage = ((data.value / total) * 100).toFixed(1);
                    return (
                      <div className="bg-popover border border-border rounded-md p-2 shadow-lg text-xs sm:text-sm">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-muted-foreground">{data.value} nodes • {percentage}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Compact Legend */}
        <div className="space-y-1.5 sm:space-y-2">
          {statusData.map((item) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const isActive = hoveredLegend === item.name;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredLegend(item.name)}
                onMouseLeave={() => setHoveredLegend(null)}
                className={`flex items-center justify-between gap-2 p-2 rounded-md transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-secondary/40 px-2.5'
                    : 'hover:bg-secondary/15'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: isActive ? `0 0 8px ${item.color}80` : 'none',
                      transition: 'all 150ms ease'
                    }}
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">{item.name}</span>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold">{item.value}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Trend - Enhanced */}
      <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base">Network Activity (24h)</h3>
        </div>
        <div className="h-[160px] sm:h-[200px]">
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
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(220 20% 20%)" 
                opacity={0.2}
              />
              <XAxis 
                dataKey="time" 
                stroke="hsl(215 15% 55%)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215 15% 55%)" 
                fontSize={10}
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
                  fontSize: "12px"
                }}
                itemStyle={{
                  color: "#ffffff",
                  fontSize: "12px"
                }}
                labelStyle={{
                  color: "hsl(168 80% 45%)",
                  fontWeight: "600",
                  marginBottom: "4px",
                  fontSize: "12px"
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

        {/* Compact Legend */}
        <div className="flex gap-2 sm:gap-4 mt-4 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(168_80%_45%)]" />
            <span className="text-xs sm:text-sm text-muted-foreground">Active Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(35_95%_55%)]" />
            <span className="text-xs sm:text-sm text-muted-foreground">Avg Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
