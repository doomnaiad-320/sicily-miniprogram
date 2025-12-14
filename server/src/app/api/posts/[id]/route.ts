import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) },
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await prisma.post.delete({ where: { id: parseInt(id) } })

  return NextResponse.json({ success: true })
}
