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
    select: { id: true },
  })

  const conversationIds = conversations.map((c) => c.id)

  const unreadCount = await prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      isRead: false,
    },
  })

  return NextResponse.json({ unreadCount })
}
