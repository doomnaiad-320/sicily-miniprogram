import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyUserToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromHeader(request)
  const payload = token ? verifyUserToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const conversationId = parseInt(id)
  const userId = payload.id

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userId1: userId }, { userId2: userId }],
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: '会话不存在' }, { status: 404 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, nickname: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  })

  return NextResponse.json({ messages: messages.reverse() })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromHeader(request)
  const payload = token ? verifyUserToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const conversationId = parseInt(id)
  const userId = payload.id

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userId1: userId }, { userId2: userId }],
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: '会话不存在' }, { status: 404 })
  }

  const { content, imageUrl } = await request.json()

  if (!content && !imageUrl) {
    return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content: content || '',
      imageUrl,
    },
    include: {
      sender: { select: { id: true, nickname: true, avatarUrl: true } },
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({ message })
}
