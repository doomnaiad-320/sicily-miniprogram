"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: number;
  name: string;
  enabled: boolean;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [images, setImages] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [recognizing, setRecognizing] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [form, setForm] = React.useState({
    type: "LOST",
    categoryId: "",
    description: "",
    locationText: "",
    contactPhone: "",
  });

  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.filter((c: Category) => c.enabled)))
      .catch(() => toast.error("获取分类失败"));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (images.length + files.length > 9) {
      toast.error("最多上传9张图片");
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error();
        const { url } = await res.json();
        setImages((prev) => [...prev, url]);

        if (images.length === 0) {
          setRecognizing(true);
          try {
            const recRes = await fetch("/api/recognize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: url }),
            });
            const recData = await recRes.json();
            if (recData.category) {
              const matchedCategory = categories.find(
                (c) => c.name.includes(recData.category) || recData.category.includes(c.name)
              );
              if (matchedCategory) {
                setForm((prev) => ({ ...prev, categoryId: matchedCategory.id.toString() }));
              }
            }
            if (recData.tags?.length) {
              setTags(recData.tags);
            }
            if (recData.description) {
              setForm((prev) => ({
                ...prev,
                description: prev.description || recData.description,
              }));
            }
          } catch {
          } finally {
            setRecognizing(false);
          }
        }
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length < 2) {
      toast.error("请至少上传2张图片");
      return;
    }
    if (!form.categoryId) {
      toast.error("请选择分类");
      return;
    }
    if (!form.description.trim()) {
      toast.error("请输入描述");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          categoryId: parseInt(form.categoryId),
          description: form.description,
          locationText: form.locationText,
          contactPhone: form.contactPhone,
          images,
          tagsJson: tags,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("发布成功");
      router.push("/dashboard/posts");
    } catch {
      toast.error("发布失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">发布信息</h1>
        <p className="text-muted-foreground">后台发布的信息自动通过审核</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>类型</Label>
            <RadioGroup
              value={form.type}
              onValueChange={(value) => setForm({ ...form, type: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="LOST" id="lost" />
                <Label htmlFor="lost">失物</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FOUND" id="found" />
                <Label htmlFor="found">招领</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>分类</Label>
            <Select
              value={form.categoryId}
              onValueChange={(value) => setForm({ ...form, categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {recognizing && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                正在识别物品...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>图片 (2-9张)</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative">
                  <img src={url} alt="" className="w-24 h-24 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <label className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </label>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>识别标签</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>描述</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="详细描述物品特征、丢失/捡到的情况..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>位置</Label>
            <Input
              value={form.locationText}
              onChange={(e) => setForm({ ...form, locationText: e.target.value })}
              placeholder="如：图书馆一楼大厅"
            />
          </div>

          <div className="space-y-2">
            <Label>联系电话</Label>
            <Input
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="用于联系失主/拾获者"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          发布
        </Button>
      </div>
    </div>
  );
}
