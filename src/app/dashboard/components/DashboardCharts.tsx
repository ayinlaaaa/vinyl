"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import type { ListeningStats } from "@/lib/analytics";

export default function DashboardCharts({ stats }: { stats: ListeningStats }) {
  return (
    <div className="lg:col-span-2 bg-secondary/30 border border-border p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-playfair font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          Listening Velocity
        </h3>
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Plays by weekday</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats.weekdayActivity}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "#71717a" }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "#71717a" }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "0px" }}
              itemStyle={{ color: "#fdfdfc", fontSize: "12px" }}
              cursor={{ stroke: '#27272a', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="currentColor" 
              fillOpacity={1} 
              fill="url(#colorCount)" 
              strokeWidth={2}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
