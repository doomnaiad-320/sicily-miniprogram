"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileCheck, Users, FolderOpen, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  totalPosts: number;
  pendingPosts: number;
  totalUsers: number;
  totalCategories: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = React.useState<Stats>({
    totalPosts: 0,
    pendingPosts: 0,
    totalUsers: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const [postsRes, pendingRes, usersRes, categoriesRes] = await Promise.all([
          fetch("/api/posts"),
          fetch("/api/posts?status=PENDING"),
          fetch("/api/users"),
          fetch("/api/categories"),
        ]);

        if (!postsRes.ok || !usersRes.ok) {
          if (postsRes.status === 401 || usersRes.status === 401) {
            router.push("/auth/v1/login");
            return;
          }
        }

        const [posts, pending, users, categories] = await Promise.all([
          postsRes.json(),
          pendingRes.json(),
          usersRes.json(),
          categoriesRes.json(),
        ]);

        setStats({
          totalPosts: posts.total || 0,
          pendingPosts: pending.total || 0,
          totalUsers: users.total || 0,
          totalCategories: Array.isArray(categories) ? categories.length : 0,
        });
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const cards = [
    {
      title: "信息总数",
      value: stats.totalPosts,
      description: "失物招领信息",
      icon: FileCheck,
      href: "/dashboard/posts",
    },
    {
      title: "待审核",
      value: stats.pendingPosts,
      description: "等待审核的信息",
      icon: Clock,
      href: "/dashboard/posts?status=PENDING",
      highlight: stats.pendingPosts > 0,
    },
    {
      title: "用户数",
      value: stats.totalUsers,
      description: "注册用户总数",
      icon: Users,
      href: "/dashboard/users",
    },
    {
      title: "分类数",
      value: stats.totalCategories,
      description: "物品分类数量",
      icon: FolderOpen,
      href: "/dashboard/categories",
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground">校园失物招领后台管理系统</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className={`cursor-pointer transition-colors hover:bg-accent ${card.highlight ? "border-orange-500" : ""}`}
            onClick={() => router.push(card.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.highlight ? "text-orange-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.highlight ? "text-orange-500" : ""}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
            <CardDescription>常用功能入口</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <button
              onClick={() => router.push("/dashboard/posts/create")}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent text-left"
            >
              <FileCheck className="h-5 w-5" />
              <div>
                <div className="font-medium">发布信息</div>
                <div className="text-sm text-muted-foreground">后台直接发布失物招领</div>
              </div>
            </button>
            <button
              onClick={() => router.push("/dashboard/posts?status=PENDING")}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent text-left"
            >
              <Clock className="h-5 w-5" />
              <div>
                <div className="font-medium">审核信息</div>
                <div className="text-sm text-muted-foreground">
                  {stats.pendingPosts > 0 ? `${stats.pendingPosts} 条待审核` : "暂无待审核"}
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>基本配置状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">系统版本</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">框架版本</span>
              <span>Next.js 16</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">UI 组件</span>
              <span>Shadcn UI</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
