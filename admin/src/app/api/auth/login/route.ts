import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAdminToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      let admin = await prisma.admin.findUnique({ where: { username } })
      if (!admin) {
        const hashedPassword = await bcrypt.hash(password, 10)
        admin = await prisma.admin.create({
          data: { username, password: hashedPassword }
        })
      }
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() }
      })
      const token = signAdminToken({ id: admin.id, username: admin.username })
      const cookieStore = await cookies()
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })
      return NextResponse.json({ success: true })
    }

    const admin = await prisma.admin.findUnique({ where: { username } })
    if (!admin) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    })
    const token = signAdminToken({ id: admin.id, username: admin.username })
    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
