import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie } from '@/lib/auth'

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const admin = await getAdminFromCookie()
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { name, sort, enabled } = await request.json()

  const category = await prisma.category.create({
    data: { name, sort: sort || 0, enabled: enabled ?? true },
  })

  return NextResponse.json(category)
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromCookie()
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id, name, sort, enabled } = await request.json()

  const category = await prisma.category.update({
    where: { id },
    data: { name, sort, enabled },
  })

  return NextResponse.json(category)
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromCookie()
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = parseInt(searchParams.get('id') || '0')

  await prisma.category.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
