import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-colors duration-300 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-800 dark:text-slate-100 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">页面未找到</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">抱歉，您访问的页面不存在</p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    </div>
  )
}