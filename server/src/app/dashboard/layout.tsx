'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, FolderTree, FileText, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: '首页', icon: LayoutDashboard },
  { href: '/dashboard/users', label: '用户管理', icon: Users },
  { href: '/dashboard/categories', label: '分类管理', icon: FolderTree },
  { href: '/dashboard/posts', label: '信息审核', icon: FileText },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">后台管理</div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors',
                pathname === item.href ? 'bg-blue-600' : 'hover:bg-gray-800'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-4 border-t border-gray-700 hover:bg-gray-800">
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </aside>
      <main className="flex-1 bg-gray-100 p-6">{children}</main>
    </div>
  )
}
