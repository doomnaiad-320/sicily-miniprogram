import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromCookie, getTokenFromHeader, verifyUserToken } from '@/lib/auth'

const LOST_CLOSE_REASONS = new Set(['RECOVERED', 'GAVE_UP', 'OTHER'])
const FOUND_CLOSE_REASONS = new Set(['CLAIMED', 'HANDED_OVER', 'OTHER'])

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

  const body = await request.json().catch(() => ({}))
  const reason = String(body.reason ?? body.closedReason ?? '').trim().toUpperCase()
  const remarkRaw = body.remark ?? body.closedRemark
  const remark =
    typeof remarkRaw === 'string' ? remarkRaw.trim() : remarkRaw == null ? '' : null

  if (!reason) {
    return NextResponse.json({ error: '请选择结束原因' }, { status: 400 })
  }

  if (remark === null) {
    return NextResponse.json({ error: '备注格式不正确' }, { status: 400 })
  }

  if (remark.length > 200) {
    return NextResponse.json({ error: '备注最多200字' }, { status: 400 })
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      type: true,
      status: true,
      createdByUser: true,
      bizStatus: true,
      closedAt: true,
    },
  })

  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  if (!admin && (!user || post.createdByUser !== user.id)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const allowedReasons =
    post.type === 'LOST'
      ? LOST_CLOSE_REASONS
      : post.type === 'FOUND'
        ? FOUND_CLOSE_REASONS
        : null

  if (!allowedReasons || !allowedReasons.has(reason)) {
    return NextResponse.json({ error: '无效的结束原因' }, { status: 400 })
  }

  const closedAt =
    post.bizStatus === 'CLOSED' && post.closedAt ? post.closedAt : new Date()

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      bizStatus: 'CLOSED',
      closedAt,
      closedReason: reason,
      closedRemark: remark || null,
      closedByUserId: user ? user.id : null,
      closedByAdminId: admin ? admin.id : null,
    },
  })

  return NextResponse.json(updated)
}

