import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie, getTokenFromHeader, verifyUserToken } from '@/lib/auth'

const REOPEN_REASONS = new Set(['MISOPERATION', 'NOT_SOLVED', 'NEW_CLUE', 'OTHER'])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookie()
  const token = getTokenFromHeader(request)
  const user = token ? verifyUserToken(token) : null

  if (!admin && !user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const postId = parseInt(id)
  if (!postId) {
    return NextResponse.json({ error: '无效的帖子ID' }, { status: 400 })
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, createdByUser: true, bizStatus: true },
  })

  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  if (!admin && (!user || post.createdByUser !== user.id)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  if (post.bizStatus !== 'CLOSED') {
    return NextResponse.json({ error: '该信息未结束，无需重新开启' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const reason = String(body.reason ?? body.reopenReason ?? '').trim().toUpperCase()
  const remarkRaw = body.remark ?? body.reopenRemark
  const remark =
    typeof remarkRaw === 'string' ? remarkRaw.trim() : remarkRaw == null ? '' : null

  if (!reason) {
    return NextResponse.json({ error: '请选择重新开启原因' }, { status: 400 })
  }

  if (!REOPEN_REASONS.has(reason)) {
    return NextResponse.json({ error: '无效的重新开启原因' }, { status: 400 })
  }

  if (remark === null) {
    return NextResponse.json({ error: '备注格式不正确' }, { status: 400 })
  }

  if (remark.length > 200) {
    return NextResponse.json({ error: '备注最多200字' }, { status: 400 })
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      bizStatus: 'OPEN',
      status: 'PENDING',
      rejectReason: null,
      closedAt: null,
      closedReason: null,
      closedRemark: null,
      closedByUserId: null,
      closedByAdminId: null,
      reopenedAt: new Date(),
      reopenReason: reason,
      reopenRemark: remark || null,
      reopenedByUserId: user ? user.id : null,
      reopenedByAdminId: admin ? admin.id : null,
    },
  })

  return NextResponse.json(updated)
}
