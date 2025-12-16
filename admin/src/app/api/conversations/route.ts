import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyUserToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = getTokenFromHeader(request)
  const payload = token ? verifyUserToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const userId = payload.id

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    include: {
      user1: { select: { id: true, nickname: true, avatarUrl: true } },
      user2: { select: { id: true, nickname: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const result = await Promise.all(
    conversations.map(async (conv) => {
      const otherUser = conv.userId1 === userId ? conv.user2 : conv.user1
      const lastMessage = conv.messages[0] || null

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          isRead: false,
        },
      })

      return {
        id: conv.id,
        otherUser,
        lastMessage,
        unreadCount,
        updatedAt: conv.updatedAt,
      }
    })
  )

  return NextResponse.json({ conversations: result })
}

export async function POST(request: NextRequest) {
  const token = getTokenFromHeader(request)
  const payload = token ? verifyUserToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { targetUserId } = await request.json()
  const userId = payload.id

  if (!targetUserId || targetUserId === userId) {
    return NextResponse.json({ error: '无效的目标用户' }, { status: 400 })
  }

  const [smallerId, largerId] =
    userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId]

  let conversation = await prisma.conversation.findUnique({
    where: {
      userId1_userId2: { userId1: smallerId, userId2: largerId },
    },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId1: smallerId, userId2: largerId },
    })
  }

  return NextResponse.json({ conversation })
}
