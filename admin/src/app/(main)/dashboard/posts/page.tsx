"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Check, X, Ban, Trash2, MessageSquare } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Comment {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: { id: number; nickname: string; avatarUrl: string };
}

interface Post {
  id: number;
  type: string;
  title: string | null;
  description: string;
  status: string;
  bizStatus?: string;
  closedAt?: string | null;
  closedReason?: string | null;
  closedRemark?: string | null;
  reopenedAt?: string | null;
  reopenReason?: string | null;
  reopenRemark?: string | null;
  rejectReason: string | null;
  locationText: string | null;
  contactPhone: string | null;
  createdAt: string;
  category: { id: number; name: string };
  images: { id: number; url: string }[];
  user: { id: number; nickname: string; avatarUrl: string } | null;
  admin: { id: number; username: string } | null;
  comments?: Comment[];
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "待审核", variant: "secondary" },
  APPROVED: { label: "已通过", variant: "default" },
  REJECTED: { label: "已拒绝", variant: "destructive" },
  REMOVED: { label: "已下架", variant: "outline" },
};

const getDisplayStatus = (post: Pick<Post, "type" | "status" | "bizStatus">) => {
  if (post.status === "PENDING") {
    return { label: "审核中", variant: "secondary" as const };
  }
  if (post.status === "REJECTED") {
    return { label: "已拒绝", variant: "destructive" as const };
  }
  if (post.status === "REMOVED" || post.status === "OFFLINE") {
    return { label: "已下架", variant: "outline" as const };
  }
  if (post.bizStatus === "CLOSED") {
    return { label: post.type === "LOST" ? "已找回" : "已认领", variant: "outline" as const };
  }
  return { label: "进行中", variant: "default" as const };
};

const getClosedReasonLabel = (type: string, reason?: string | null) => {
  if (!reason) return "-";
  const code = String(reason).toUpperCase();
  if (type === "LOST") {
    const map: Record<string, string> = {
      RECOVERED: "已找回",
      GAVE_UP: "不找了",
      OTHER: "其他",
    };
    return map[code] || "其他";
  }
  if (type === "FOUND") {
    const map: Record<string, string> = {
      CLAIMED: "已认领",
      HANDED_OVER: "已移交",
      OTHER: "其他",
    };
    return map[code] || "其他";
  }
  return "-";
};

const getReopenReasonLabel = (reason?: string | null) => {
  if (!reason) return "-";
  const code = String(reason).toUpperCase();
  const map: Record<string, string> = {
    MISOPERATION: "误标结束",
    NOT_SOLVED: "信息仍未解决",
    NEW_CLUE: "有新线索",
    OTHER: "其他",
  };
  return map[code] || "其他";
};

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [detailPost, setDetailPost] = React.useState<Post | null>(null);
  const [detailComments, setDetailComments] = React.useState<Comment[]>([]);
  const [rejectPost, setRejectPost] = React.useState<Post | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [detailTab, setDetailTab] = React.useState("info");

  const fetchPosts = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/v1/login");
          return;
        }
        throw new Error();
      }
      const data = await res.json();
      setPosts(data.items || data.posts || []);
    } catch {
      toast.error("获取列表失败");
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter, typeFilter]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchPostDetail = async (postId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailPost(data);
        setDetailComments(data.comments || []);
      }
    } catch {
      toast.error("获取详情失败");
    }
  };

  const handleViewDetail = (post: Post) => {
    setDetailTab("info");
    fetchPostDetail(post.id);
  };

  const handleStatusChange = async (postId: number, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectReason: reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("操作成功");
      setRejectPost(null);
      setRejectReason("");
      fetchPosts();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!detailPost) return;
    try {
      const res = await fetch(`/api/posts/${detailPost.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("删除失败");
      }
      toast.success("留言已删除");
      setDetailComments(detailComments.filter(c => c.id !== commentId));
    } catch {
      toast.error("删除失败");
    }
  };

  const handleReject = () => {
    if (!rejectPost) return;
    if (!rejectReason.trim()) {
      toast.error("请填写拒绝理由");
      return;
    }
    handleStatusChange(rejectPost.id, "REJECTED", rejectReason);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">信息审核</h1>
          <p className="text-muted-foreground">审核用户发布的失物招领信息</p>
        </div>
        <Button onClick={() => router.push("/dashboard/posts/create")}>发布信息</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>信息列表</CardTitle>
              <CardDescription>共 {posts.length} 条信息</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>类型</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="LOST">失物</SelectItem>
                    <SelectItem value="FOUND">招领</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="PENDING">待审核</TabsTrigger>
                  <TabsTrigger value="APPROVED">已通过</TabsTrigger>
                  <TabsTrigger value="REJECTED">已拒绝</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">图片</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="max-w-[200px]">描述</TableHead>
                <TableHead>发布者</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    {post.images[0] ? (
                      <img
                        src={post.images[0].url}
                        alt=""
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        无
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.type === "LOST" ? "destructive" : "default"}>
                      {post.type === "LOST" ? "失物" : "招领"}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.category.name}</TableCell>
                  <TableCell className="max-w-[260px]">
                    <div className="truncate">{post.description}</div>
                    {post.bizStatus === "CLOSED" && post.closedRemark && (
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        备注：{post.closedRemark}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {post.user?.nickname || post.admin?.username || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getDisplayStatus(post).variant}>
                      {getDisplayStatus(post).label}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetail(post)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {post.status === "PENDING" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600"
                          onClick={() => handleStatusChange(post.id, "APPROVED")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => setRejectPost(post)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {post.status === "APPROVED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(post.id, "REMOVED")}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailPost} onOpenChange={() => setDetailPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>信息详情</DialogTitle>
          </DialogHeader>
          {detailPost && (
            <Tabs value={detailTab} onValueChange={setDetailTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">基本信息</TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  留言管理 ({detailComments.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">类型</Label>
                    <p>{detailPost.type === "LOST" ? "失物" : "招领"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">分类</Label>
                    <p>{detailPost.category.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">位置</Label>
                    <p>{detailPost.locationText || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">联系电话</Label>
                    <p>{detailPost.contactPhone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">状态</Label>
                    <p>{getDisplayStatus(detailPost).label}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">描述</Label>
                  <p className="mt-1">{detailPost.description}</p>
                </div>
                {detailPost.bizStatus === "CLOSED" && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">归档信息</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">结束原因</Label>
                        <p>{getClosedReasonLabel(detailPost.type, detailPost.closedReason)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">结束时间</Label>
                        <p>{detailPost.closedAt ? formatTime(detailPost.closedAt) : "-"}</p>
                      </div>
                    </div>
                    {detailPost.closedRemark && (
                      <div>
                        <Label className="text-muted-foreground">结束备注（发布者）</Label>
                        <p className="mt-1 whitespace-pre-wrap break-words">{detailPost.closedRemark}</p>
                      </div>
                    )}
                  </div>
                )}
                {detailPost.reopenReason && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">重新开启信息</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">原因</Label>
                        <p>{getReopenReasonLabel(detailPost.reopenReason)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">时间</Label>
                        <p>{detailPost.reopenedAt ? formatTime(detailPost.reopenedAt) : "-"}</p>
                      </div>
                    </div>
                    {detailPost.reopenRemark && (
                      <div>
                        <Label className="text-muted-foreground">备注（发布者）</Label>
                        <p className="mt-1 whitespace-pre-wrap break-words">{detailPost.reopenRemark}</p>
                      </div>
                    )}
                  </div>
                )}
                {detailPost.images.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">图片</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {detailPost.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt=""
                          className="w-24 h-24 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {detailPost.rejectReason && (
                  <div>
                    <Label className="text-muted-foreground">拒绝理由</Label>
                    <p className="mt-1 text-red-600">{detailPost.rejectReason}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="comments" className="mt-4">
                <ScrollArea className="h-[500px] pr-4">
                  {detailComments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      暂无留言
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {detailComments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={comment.user.avatarUrl} />
                            <AvatarFallback>{comment.user.nickname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{comment.user.nickname}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
                            </div>
                            {comment.content && <p className="text-sm mt-1 break-words">{comment.content}</p>}
                            {comment.imageUrl && (
                              <img src={comment.imageUrl} alt="" className="mt-2 max-w-[200px] rounded" />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 shrink-0"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectPost} onOpenChange={() => setRejectPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝审核</DialogTitle>
            <DialogDescription>请填写拒绝理由，用户将收到通知</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝理由..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectPost(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
