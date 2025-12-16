import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookie()
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const postId = parseInt(id)
  const { status, rejectReason } = await request.json()

  if (!['APPROVED', 'REJECTED', 'REMOVED'].includes(status)) {
    return NextResponse.json({ error: '无效的状态' }, { status: 400 })
  }

  if (status === 'REJECTED' && !rejectReason) {
    return NextResponse.json({ error: '拒绝时必须填写理由' }, { status: 400 })
  }

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status,
      rejectReason: status === 'REJECTED' ? rejectReason : null,
    },
  })

  await prisma.auditRecord.create({
    data: {
      postId,
      adminId: admin.id,
      action: status,
      reason: rejectReason,
    },
  })

  return NextResponse.json(updated)
}
