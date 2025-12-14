import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyUserToken } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const comments = await prisma.comment.findMany({
    where: { postId: parseInt(id), isDeleted: false },
    include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(comments)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromHeader(request)
  const user = token ? verifyUserToken(token) : null

  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const { content } = await request.json()

  const comment = await prisma.comment.create({
    data: {
      postId: parseInt(id),
      userId: user.id,
      content,
    },
    include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
  })

  return NextResponse.json(comment)
}
