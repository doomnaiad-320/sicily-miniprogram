'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface User {
  id: number
  openId: string
  nickname: string
  avatarUrl: string
  status: string
  createdAt: string
  lastLoginAt: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const fetchUsers = async () => {
    const res = await fetch(`/api/users?page=${page}&pageSize=20`)
    const data = await res.json()
    setUsers(data.users || [])
    setTotal(data.total || 0)
  }

  useEffect(() => { fetchUsers() }, [page])

  const handleStatus = async (id: number, status: string) => {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchUsers()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该用户？')) return
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">注册时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">最后登录</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-sm">{user.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                    <span className="text-sm">{user.nickname}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status === 'ACTIVE' ? '正常' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {user.status === 'ACTIVE' ? (
                      <Button size="sm" variant="outline" onClick={() => handleStatus(user.id, 'DISABLED')}>禁用</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleStatus(user.id, 'ACTIVE')}>启用</Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>删除</Button>
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
    </div>
  )
}
