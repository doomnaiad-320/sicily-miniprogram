'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

interface Category {
  id: number
  name: string
  enabled: boolean
}

export default function CreatePostPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [form, setForm] = useState({
    type: 'LOST',
    title: '',
    description: '',
    categoryId: '',
    locationText: '',
    contactPhone: '',
  })

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => {
      setCategories(data.filter((c: Category) => c.enabled))
    })
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) setImages([...images, data.url])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!form.description || !form.categoryId) {
      alert('请填写必填项')
      return
    }
    setLoading(true)
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          categoryId: parseInt(form.categoryId),
          images,
        }),
      })
      router.push('/dashboard/posts')
    } catch {
      alert('发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">发布信息</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <Label>类型</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOST">失物</SelectItem>
                <SelectItem value="FOUND">招领</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>分类 *</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="请选择分类" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>标题</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>描述 *</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={4} />
          </div>
          <div>
            <Label>地点</Label>
            <Input value={form.locationText} onChange={(e) => setForm({ ...form, locationText: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>联系电话</Label>
            <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>图片</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={url} alt="" className="w-full h-full object-cover rounded" />
                  <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-500">
                  <span className="text-2xl text-gray-400">+</span>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button onClick={handleSubmit} disabled={loading}>{loading ? '发布中...' : '发布'}</Button>
            <Button variant="outline" onClick={() => router.back()}>取消</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
