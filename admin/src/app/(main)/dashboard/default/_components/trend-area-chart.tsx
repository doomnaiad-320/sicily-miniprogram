"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendItem {
  date: string;
  posts: number;
  users: number;
}

interface StatsData {
  trendData: TrendItem[];
}

export function TrendAreaChart() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>近7日趋势</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse h-full w-full bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>近7日趋势</CardTitle>
        <CardDescription>新增信息与新增用户趋势对比</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (value === "posts" ? "新增信息" : "新增用户")}
            />
            <Area
              type="monotone"
              dataKey="posts"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPosts)"
              name="posts"
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUsers)"
              name="users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
