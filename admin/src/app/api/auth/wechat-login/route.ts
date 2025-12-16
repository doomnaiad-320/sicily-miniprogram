import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signUserToken } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { code, nickname, avatarUrl } = await request.json()

    if (!code) {
      return NextResponse.json({ error: '缺少 code 参数' }, { status: 400 })
    }

    const appId = process.env.WECHAT_APPID
    const secret = process.env.WECHAT_SECRET

    let openid: string

    if (!appId || !secret) {
      openid = 'test_' + crypto.createHash('md5').update(code).digest('hex').substring(0, 16)
      console.log('[测试模式] 生成模拟 openid:', openid)
    } else {
      const wxRes = await fetch(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
      )
      const wxData = await wxRes.json()

      if (wxData.errcode) {
        return NextResponse.json({ error: wxData.errmsg }, { status: 400 })
      }

      openid = wxData.openid
    }

    let user = await prisma.user.findUnique({ where: { openId: openid } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          openId: openid,
          nickname: nickname || '微信用户',
          avatarUrl: avatarUrl || '',
        }
      })
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          ...(nickname && { nickname }),
          ...(avatarUrl && { avatarUrl }),
        }
      })
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 403 })
    }

    const token = signUserToken({ id: user.id, openId: user.openId })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      }
    })
  } catch (error) {
    console.error('WeChat login error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
