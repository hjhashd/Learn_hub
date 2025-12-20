'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const MarkdownViewerDynamic = dynamic(
  () => import('@/components/MarkdownViewer').then(m => m.MarkdownViewer),
  { ssr: false }
)

export default function TestWikiLinksPage() {
  const [articles, setArticles] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/knowledge')
        const data = await res.json()
        const items = (data.knowledge || []).map((i: any) => ({ id: String(i.id), title: String(i.title) }))
        setArticles(items)
      } catch {}
    }
    load()
  }, [])

  const md = `# Wiki Links 测试\n\n`+
    `这是一个 [[Next.js 开发笔记]] 和 [[TypeScript 学习心得|TS 笔记]] 以及 [[不存在的条目]]。\n\n`+
    `- 也支持在列表里使用 [[TypeScript 学习心得]]\n`+
    `- 以及在强调中 **[[Next.js 开发笔记]]**`;

  return (
    <div className="min-h-screen bg-white dark:bg-[#131314] text-[#1f1f1f] dark:text-[#e3e3e3]">
      <div className="max-w-3xl mx-auto p-8">
        <MarkdownViewerDynamic content={md} darkMode={false} articles={articles} />
      </div>
    </div>
  )
}

