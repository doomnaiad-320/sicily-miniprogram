"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Category {
  id: number;
  name: string;
  sort: number;
  enabled: boolean;
  createdAt: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [editCategory, setEditCategory] = React.useState<Category | null>(null);
  const [form, setForm] = React.useState({ name: "", sort: 0, enabled: true });

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("获取分类列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditCategory(null);
    setForm({ name: "", sort: 0, enabled: true });
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditCategory(category);
    setForm({ name: category.name, sort: category.sort, enabled: category.enabled });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("请输入分类名称");
      return;
    }
    try {
      const res = await fetch("/api/categories", {
        method: editCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCategory ? { id: editCategory.id, ...form } : form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }
      toast.success(editCategory ? "更新成功" : "创建成功");
      setDialogOpen(false);
      fetchCategories();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/categories?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("删除成功");
      setDeleteId(null);
      fetchCategories();
    } catch {
      toast.error("删除失败");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">分类管理</h1>
          <p className="text-muted-foreground">管理失物招领信息分类</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新建分类
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
          <CardDescription>共 {categories.length} 个分类</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.sort}</TableCell>
                  <TableCell>
                    <Badge variant={category.enabled ? "default" : "secondary"}>
                      {category.enabled ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteId(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    暂无分类，点击"新建分类"创建
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCategory ? "编辑分类" : "新建分类"}</DialogTitle>
            <DialogDescription>
              {editCategory ? "修改分类信息" : "创建新的物品分类"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：电子产品、证件、钥匙等"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">排序值</Label>
              <Input
                id="sort"
                type="number"
                value={form.sort}
                onChange={(e) => setForm({ ...form, sort: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">启用状态</Label>
              <Switch
                id="enabled"
                checked={form.enabled}
                onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除分类后，该分类下的信息可能无法正常显示。
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
