import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'sicily-admin-secret-2024'
const JWT_USER_SECRET = process.env.JWT_USER_SECRET || 'sicily-user-secret-2024'

export interface AdminPayload {
  id: number
  username: string
  type: 'admin'
}

export interface UserPayload {
  id: number
  openId: string
  type: 'user'
}

export function signAdminToken(payload: Omit<AdminPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
}

export function signUserToken(payload: Omit<UserPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'user' }, JWT_USER_SECRET, { expiresIn: '30d' })
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload
  } catch {
    return null
  }
}

export function verifyUserToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_USER_SECRET) as UserPayload
  } catch {
    return null
  }
}

export async function getAdminFromCookie(): Promise<AdminPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export function getTokenFromHeader(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}
