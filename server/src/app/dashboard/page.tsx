'use client'
import { useEffect, useState } from 'react'
import { Users, FileText, FolderTree, Clock } from 'lucide-react'

interface Stats {
  userCount: number
  postCount: number
  pendingCount: number
  categoryCount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ userCount: 0, postCount: 0, pendingCount: 0, categoryCount: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/users?pageSize=1').then(r => r.json()),
      fetch('/api/posts?pageSize=1').then(r => r.json()),
      fetch('/api/posts?status=PENDING&pageSize=1').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([users, posts, pending, categories]) => {
      setStats({
        userCount: users.total || 0,
        postCount: posts.total || 0,
        pendingCount: pending.total || 0,
        categoryCount: categories.length || 0,
      })
    })
  }, [])

  const cards = [
    { label: '用户总数', value: stats.userCount, icon: Users, color: 'bg-blue-500' },
    { label: '信息总数', value: stats.postCount, icon: FileText, color: 'bg-green-500' },
    { label: '待审核', value: stats.pendingCount, icon: Clock, color: 'bg-orange-500' },
    { label: '分类数', value: stats.categoryCount, icon: FolderTree, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">数据概览</h1>
      <div className="grid grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
