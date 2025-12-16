import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyUserToken } from '@/lib/auth'

export async function GET(request: Request) {
  const token = getTokenFromHeader(request)
  const user = token ? verifyUserToken(token) : null

  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const bizStatus = searchParams.get('bizStatus')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = { createdByUser: user.id }
  if (status) where.status = status
  if (bizStatus) {
    const normalized = bizStatus.toUpperCase()
    if (normalized === 'OPEN' || normalized === 'CLOSED') {
      where.bizStatus = normalized
    }
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sort: 'asc' } },
      },
      orderBy: [{ bizStatus: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, pageSize })
}
