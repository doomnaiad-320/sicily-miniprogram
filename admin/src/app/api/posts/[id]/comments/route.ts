import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie, getTokenFromHeader, verifyUserToken } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const postId = parseInt(id)

  const comments = await prisma.comment.findMany({
    where: { postId, isDeleted: false },
    include: {
      user: { select: { id: true, nickname: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(comments)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const postId = parseInt(id)

  const token = getTokenFromHeader(request)
  const user = token ? verifyUserToken(token) : null

  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { content, imageUrl } = await request.json()

  if (!content?.trim() && !imageUrl) {
    return NextResponse.json({ error: '留言内容不能为空' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId: user.id,
      content: content?.trim() || '',
      imageUrl: imageUrl || null,
    },
    include: {
      user: { select: { id: true, nickname: true, avatarUrl: true } },
    },
  })

  return NextResponse.json(comment)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookie()
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const commentId = parseInt(searchParams.get('commentId') || '')

  if (!commentId) {
    return NextResponse.json({ error: '缺少 commentId' }, { status: 400 })
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  })

  return NextResponse.json({ success: true })
}
