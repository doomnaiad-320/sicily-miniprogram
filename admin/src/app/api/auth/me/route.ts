import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = getTokenFromHeader(request)
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const payload = verifyUserToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'token 无效' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 403 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user info error:', error)
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
  }
}
