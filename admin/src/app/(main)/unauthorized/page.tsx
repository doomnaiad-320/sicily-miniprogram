import Link from "next/link";

import { Lock } from "lucide-react";

export default function page() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <Lock className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 font-bold text-3xl tracking-tight sm:text-4xl">未授权访问</h1>
        <p className="mt-4 text-muted-foreground">
          您没有权限查看请求的内容。如果您认为这是一个错误，请联系管理员。
        </p>
        <div className="mt-6">
          <Link
            href="dashboard"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-xs transition-colors hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
            prefetch={false}
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
