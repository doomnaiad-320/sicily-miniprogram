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
    include: {
      user1: { select: { id: true, nickname: true, avatarUrl: true } },
      user2: { select: { id: true, nickname: true, avatarUrl: true } },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: '会话不存在' }, { status: 404 })
  }

  const otherUser =
    conversation.userId1 === userId ? conversation.user2 : conversation.user1

  return NextResponse.json({ conversation: { ...conversation, otherUser } })
}
