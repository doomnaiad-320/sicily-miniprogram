"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, FileText, Clock, CheckCircle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsData {
  overview: {
    totalUsers: number;
    totalPosts: number;
    todayPosts: number;
    todayUsers: number;
  };
  recoveryRate: {
    lost: { total: number; closed: number; rate: number };
    found: { total: number; closed: number; rate: number };
  };
}

export function StatsCards() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="grid @5xl/main:grid-cols-4 @xl/main:grid-cols-2 grid-cols-1 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "总用户数",
      value: data.overview.totalUsers,
      description: `今日新增 ${data.overview.todayUsers} 人`,
      icon: Users,
      gradient: "from-blue-500/10 to-blue-600/5",
      iconColor: "text-blue-500",
    },
    {
      title: "总信息数",
      value: data.overview.totalPosts,
      description: `今日新增 ${data.overview.todayPosts} 条`,
      icon: FileText,
      gradient: "from-purple-500/10 to-purple-600/5",
      iconColor: "text-purple-500",
    },
    {
      title: "失物找回率",
      value: `${data.recoveryRate.lost.rate}%`,
      description: `${data.recoveryRate.lost.closed}/${data.recoveryRate.lost.total} 已找回`,
      icon: CheckCircle,
      gradient: "from-green-500/10 to-green-600/5",
      iconColor: "text-green-500",
    },
    {
      title: "招领认领率",
      value: `${data.recoveryRate.found.rate}%`,
      description: `${data.recoveryRate.found.closed}/${data.recoveryRate.found.total} 已认领`,
      icon: TrendingUp,
      gradient: "from-orange-500/10 to-orange-600/5",
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="grid @5xl/main:grid-cols-4 @xl/main:grid-cols-2 grid-cols-1 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={`@container/card bg-gradient-to-br ${card.gradient}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardDescription className="text-sm font-medium">{card.title}</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">{card.value}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </div>
            <card.icon className={`h-8 w-8 ${card.iconColor} opacity-80`} />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
