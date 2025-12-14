import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signUserToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { code, nickname, avatarUrl } = await request.json()
    if (!code) {
      return NextResponse.json({ error: '缺少 code 参数' }, { status: 400 })
    }

    // 调用微信接口获取 openId
    const appid = process.env.WECHAT_APPID
    const secret = process.env.WECHAT_SECRET
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`

    const wxRes = await fetch(wxUrl)
    const wxData = await wxRes.json()

    if (wxData.errcode) {
      return NextResponse.json({ error: wxData.errmsg || '微信登录失败' }, { status: 400 })
    }

    const { openid } = wxData

    // 查找或创建用户
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
      // 更新用户信息
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          nickname: nickname || user.nickname,
          avatarUrl: avatarUrl || user.avatarUrl,
          lastLoginAt: new Date(),
        }
      })
    }

    // 检查用户状态
    if (user.status === 'DISABLED') {
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
