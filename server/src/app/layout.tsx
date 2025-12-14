import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '失物招领后台管理',
  description: '失物招领后台管理系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
