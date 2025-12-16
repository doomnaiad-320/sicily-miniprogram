import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie, getTokenFromHeader, verifyUserToken } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const postId = parseInt(id)

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      category: true,
      images: { orderBy: { sort: 'asc' } },
      user: { select: { id: true, nickname: true, avatarUrl: true } },
      admin: { select: { id: true, username: true } },
      comments: {
        where: { isDeleted: false },
        include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const postId = parseInt(id)
  const body = await request.json()

  const admin = await getAdminFromCookie()
  const token = getTokenFromHeader(request)
  const user = token ? verifyUserToken(token) : null

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  if (!admin && (!user || post.createdByUser !== user.id)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { title, description, categoryId, locationLat, locationLng, locationText, contactPhone, images, tagsJson } = body

  if (images) {
    await prisma.postImage.deleteMany({ where: { postId } })
    await prisma.postImage.createMany({
      data: images.map((url: string, index: number) => ({ postId, url, sort: index }))
    })
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      description,
      categoryId,
      locationLat,
      locationLng,
      locationText,
      contactPhone,
      tagsJson: tagsJson ? JSON.stringify(tagsJson) : undefined,
      status: admin ? undefined : 'PENDING',
    },
    include: {
      category: true,
      images: { orderBy: { sort: 'asc' } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const postId = parseInt(id)

  const admin = await getAdminFromCookie()
  const token = getTokenFromHeader(request)
  const user = token ? verifyUserToken(token) : null

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  if (!admin && (!user || post.createdByUser !== user.id)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  await prisma.post.delete({ where: { id: postId } })
  return NextResponse.json({ success: true })
}
