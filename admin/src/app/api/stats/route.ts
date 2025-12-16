import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie } from '@/lib/auth'

export async function GET() {
  const admin = await getAdminFromCookie()
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    totalUsers,
    totalPosts,
    todayPosts,
    todayUsers,
    pendingPosts,
    approvedPosts,
    rejectedPosts,
    offlinePosts,
    lostPosts,
    foundPosts,
    closedPosts,
    openPosts,
    categoriesWithCount,
    recentPostsTrend,
    recentUsersTrend,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.post.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { status: 'APPROVED' } }),
    prisma.post.count({ where: { status: 'REJECTED' } }),
    prisma.post.count({ where: { status: 'REMOVED' } }),
    prisma.post.count({ where: { type: 'LOST' } }),
    prisma.post.count({ where: { type: 'FOUND' } }),
    prisma.post.count({ where: { bizStatus: 'CLOSED' } }),
    prisma.post.count({ where: { bizStatus: 'OPEN' } }),
    prisma.category.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
        _count: { select: { posts: true } }
      },
      orderBy: { sort: 'asc' }
    }),
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(createdAt) as date, COUNT(*) as count 
      FROM Post 
      WHERE createdAt >= ${sevenDaysAgo.toISOString()}
      GROUP BY DATE(createdAt) 
      ORDER BY date ASC
    `,
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(createdAt) as date, COUNT(*) as count 
      FROM User 
      WHERE createdAt >= ${sevenDaysAgo.toISOString()}
      GROUP BY DATE(createdAt) 
      ORDER BY date ASC
    `,
  ])

  const lostClosed = await prisma.post.count({ where: { type: 'LOST', bizStatus: 'CLOSED' } })
  const foundClosed = await prisma.post.count({ where: { type: 'FOUND', bizStatus: 'CLOSED' } })

  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - i)
    last7Days.push(d.toISOString().split('T')[0])
  }

  const postsTrendMap = new Map(recentPostsTrend.map(r => [r.date, Number(r.count)]))
  const usersTrendMap = new Map(recentUsersTrend.map(r => [r.date, Number(r.count)]))

  const trendData = last7Days.map(date => ({
    date,
    posts: postsTrendMap.get(date) || 0,
    users: usersTrendMap.get(date) || 0,
  }))

  const categoryData = categoriesWithCount.map(c => ({
    name: c.name,
    value: c._count.posts,
  }))

  return NextResponse.json({
    overview: {
      totalUsers,
      totalPosts,
      todayPosts,
      todayUsers,
    },
    statusDistribution: [
      { name: '审核中', value: pendingPosts, color: '#facc15' },
      { name: '进行中', value: approvedPosts - closedPosts > 0 ? approvedPosts - closedPosts : 0, color: '#3b82f6' },
      { name: '已找回/认领', value: closedPosts, color: '#22c55e' },
      { name: '已拒绝', value: rejectedPosts, color: '#ef4444' },
      { name: '已下架', value: offlinePosts, color: '#6b7280' },
    ].filter(item => item.value > 0),
    typeDistribution: [
      { name: '失物', value: lostPosts, color: '#ef4444' },
      { name: '招领', value: foundPosts, color: '#22c55e' },
    ],
    recoveryRate: {
      lost: { total: lostPosts, closed: lostClosed, rate: lostPosts > 0 ? Math.round((lostClosed / lostPosts) * 100) : 0 },
      found: { total: foundPosts, closed: foundClosed, rate: foundPosts > 0 ? Math.round((foundClosed / foundPosts) * 100) : 0 },
    },
    categoryData,
    trendData,
  })
}
