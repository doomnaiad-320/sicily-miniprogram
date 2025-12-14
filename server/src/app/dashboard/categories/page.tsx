'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Category {
  id: number
  name: string
  sort: number
  enabled: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', sort: 0, enabled: true })

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  useEffect(() => { fetchCategories() }, [])

  const handleSubmit = async () => {
    const method = editing ? 'PATCH' : 'POST'
    const body = editing ? { ...form, id: editing.id } : form
    await fetch('/api/categories', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setOpen(false)
    setEditing(null)
    setForm({ name: '', sort: 0, enabled: true })
    fetchCategories()
  }

  const handleEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, sort: cat.sort, enabled: cat.enabled })
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该分类？')) return
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
    fetchCategories()
  }

  const handleToggle = async (cat: Category) => {
    await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, enabled: !cat.enabled }),
    })
    fetchCategories()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">分类管理</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm({ name: '', sort: 0, enabled: true }) } }}>
          <DialogTrigger asChild>
            <Button>新增分类</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? '编辑分类' : '新增分类'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>排序</Label>
                <Input type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="enabled" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                <Label htmlFor="enabled">启用</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full">保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">排序</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-4 py-3 text-sm">{cat.id}</td>
                <td className="px-4 py-3 text-sm">{cat.name}</td>
                <td className="px-4 py-3 text-sm">{cat.sort}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${cat.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.enabled ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}>编辑</Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggle(cat)}>{cat.enabled ? '禁用' : '启用'}</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id)}>删除</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
