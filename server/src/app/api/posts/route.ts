import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie, getTokenFromHeader, verifyUserToken } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const categoryId = searchParams.get('categoryId')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (type) where.type = type
  if (categoryId) where.categoryId = parseInt(categoryId)

  // 小程序端只能看到已通过的
  const token = getTokenFromHeader(request)
  const user = token ? verifyUserToken(token) : null
  if (!user) {
    const admin = await getAdminFromCookie()
    if (!admin) {
      where.status = 'APPROVED'
    }
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sort: 'asc' } },
        user: { select: { id: true, nickname: true, avatarUrl: true } },
        admin: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, pageSize })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { type, title, description, categoryId, locationLat, locationLng, locationText, contactPhone, images, tagsJson } = body

  // 检查是管理员还是用户
  const admin = await getAdminFromCookie()
  const token = getTokenFromHeader(request)
  const user = token ? verifyUserToken(token) : null

  if (!admin && !user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const post = await prisma.post.create({
    data: {
      type,
      title,
      description,
      categoryId,
      locationLat,
      locationLng,
      locationText,
      contactPhone,
      tagsJson: tagsJson ? JSON.stringify(tagsJson) : null,
      status: admin ? 'APPROVED' : 'PENDING',
      createdByAdmin: admin?.id,
      createdByUser: user?.id,
      images: images?.length ? {
        create: images.map((url: string, index: number) => ({ url, sort: index }))
      } : undefined,
    },
    include: {
      category: true,
      images: true,
    },
  })

  return NextResponse.json(post)
}
