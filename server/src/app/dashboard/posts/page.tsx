'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'

interface Post {
  id: number
  type: string
  title: string | null
  description: string
  status: string
  rejectReason: string | null
  createdAt: string
  category: { name: string }
  user: { nickname: string } | null
  admin: { username: string } | null
  images: { url: string }[]
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: '已通过', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  OFFLINE: { label: '已下架', color: 'bg-gray-100 text-gray-500' },
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchPosts = async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' })
    if (status) params.set('status', status)
    const res = await fetch(`/api/posts?${params}`)
    const data = await res.json()
    setPosts(data.posts || [])
    setTotal(data.total || 0)
  }

  useEffect(() => { fetchPosts() }, [page, status])

  const handleStatus = async (id: number, newStatus: string, reason?: string) => {
    await fetch(`/api/posts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, reason }),
    })
    fetchPosts()
  }

  const openReject = (id: number) => {
    setRejectId(id)
    setRejectReason('')
    setRejectOpen(true)
  }

  const confirmReject = () => {
    if (rejectId && rejectReason) {
      handleStatus(rejectId, 'REJECTED', rejectReason)
      setRejectOpen(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">信息审核</h1>
        <div className="flex gap-4">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="border rounded px-3 py-2 text-sm">
            <option value="">全部状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已拒绝</option>
            <option value="OFFLINE">已下架</option>
          </select>
          <Link href="/dashboard/posts/create">
            <Button>发布信息</Button>
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">标题/描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">分类</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">发布者</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="px-4 py-3 text-sm">{post.id}</td>
                <td className="px-4 py-3 text-sm">{post.type === 'LOST' ? '失物' : '招领'}</td>
                <td className="px-4 py-3 text-sm max-w-xs truncate">{post.title || post.description}</td>
                <td className="px-4 py-3 text-sm">{post.category.name}</td>
                <td className="px-4 py-3 text-sm">{post.user?.nickname || post.admin?.username || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusMap[post.status]?.color}`}>
                    {statusMap[post.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(post.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {post.status === 'PENDING' && (
                      <>
                        <Button size="sm" onClick={() => handleStatus(post.id, 'APPROVED')}>通过</Button>
                        <Button size="sm" variant="destructive" onClick={() => openReject(post.id)}>拒绝</Button>
                      </>
                    )}
                    {post.status === 'APPROVED' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatus(post.id, 'OFFLINE')}>下架</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
            <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
          </div>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝原因</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>请填写拒绝原因</Label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="mt-1" rows={3} />
            </div>
            <Button onClick={confirmReject} className="w-full" disabled={!rejectReason}>确认拒绝</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
