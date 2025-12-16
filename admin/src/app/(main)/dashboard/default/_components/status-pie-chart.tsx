"use client";

import { useEffect, useState } from "react";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusItem {
  name: string;
  value: number;
  color: string;
}

interface StatsData {
  statusDistribution: StatusItem[];
  typeDistribution: StatusItem[];
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function StatusPieChart() {
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
          <CardTitle>信息状态分布</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse h-48 w-48 bg-muted rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid @3xl/main:grid-cols-2 grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>信息状态分布</CardTitle>
          <CardDescription>按审核状态和业务状态划分</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                dataKey="value"
              >
                {data.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} 条`, "数量"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>信息类型分布</CardTitle>
          <CardDescription>失物与招领信息占比</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.typeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                dataKey="value"
              >
                {data.typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} 条`, "数量"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
