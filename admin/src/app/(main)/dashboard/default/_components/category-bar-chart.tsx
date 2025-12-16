"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryItem {
  name: string;
  value: number;
}

interface StatsData {
  categoryData: CategoryItem[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#06b6d4", "#eab308", "#ef4444"];

export function CategoryBarChart() {
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
          <CardTitle>分类统计</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse h-full w-full bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data.categoryData].sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>分类统计</CardTitle>
        <CardDescription>各分类下的信息数量</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
            <XAxis
              type="number"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              formatter={(value: number) => [`${value} 条`, "数量"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
