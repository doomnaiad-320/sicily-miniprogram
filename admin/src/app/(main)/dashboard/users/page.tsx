"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: number;
  openId: string;
  nickname: string;
  avatarUrl: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/v1/login");
          return;
        }
        throw new Error("获取用户列表失败");
      }
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      toast.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "ACTIVE" ? "已启用" : "已禁用");
      fetchUsers();
    } catch {
      toast.error("操作失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/users?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("删除成功");
      setDeleteId(null);
      fetchUsers();
    } catch {
      toast.error("删除失败");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">用户管理</h1>
        <p className="text-muted-foreground">管理小程序用户账号</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>共 {users.length} 个用户</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.nickname}</div>
                        <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>
                      {user.status === "ACTIVE" ? "正常" : "已禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(user.id, user.status === "ACTIVE" ? "DISABLED" : "ACTIVE")
                      }
                    >
                      {user.status === "ACTIVE" ? "禁用" : "启用"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(user.id)}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    暂无用户
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，删除后该用户的所有数据将被清除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
