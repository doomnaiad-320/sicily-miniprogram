import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromCookie()
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const { status, reason } = await request.json()

  const post = await prisma.post.update({
    where: { id: parseInt(id) },
    data: {
      status,
      rejectReason: status === 'REJECTED' ? reason : null,
    },
  })

  // 记录审核日志
  await prisma.auditRecord.create({
    data: {
      postId: parseInt(id),
      adminId: admin.id,
      action: status,
      reason,
    },
  })

  return NextResponse.json(post)
}
