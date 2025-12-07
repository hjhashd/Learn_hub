'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { Heart, Sparkles, Coffee, Sprout, FolderHeart } from 'lucide-react';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KnowledgeItem } from '@/types/knowledge'
import { getKnowledgeById } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

export default function KnowledgeDetailPage({ params }: PageProps) {
  const [knowledge, setKnowledge] = useState<KnowledgeItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const item = getKnowledgeById(params.id)
    if (!item) {
      notFound()
    }
    setKnowledge(item)
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!knowledge) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <Heart className="h-4 w-4 mr-2" />
                  返回
                </Button>
              </Link>
              <nav className="flex items-center space-x-2 text-sm text-gray-500">
                <Link href="/" className="hover:text-gray-700">首页</Link>
                <span>/</span>
                <span className="text-gray-900">{knowledge.title}</span>
              </nav>
            </div>
            <Link href={`/edit?id=${knowledge.id}`}>
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-accent-50 border-b">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {knowledge.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FolderHeart className="h-4 w-4 mr-1" />
                  <span>{knowledge.category}</span>
                </div>
                <div className="flex items-center">
                  <Coffee className="h-4 w-4 mr-1" />
                  <span>创建于 {formatDate(knowledge.createdAt)}</span>
                </div>
                {knowledge.createdAt !== knowledge.updatedAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>更新于 {formatDate(knowledge.updatedAt)}</span>
                  </div>
                )}
              </div>

              {knowledge.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {knowledge.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                    >
                      <Sprout className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="prose-custom">
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4 first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mt-6 mb-3">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mb-4 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 mb-4 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-slate-600 dark:text-slate-300">
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-indigo-500 pl-4 my-4 italic text-slate-500 dark:text-slate-400 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, children, ...props }) => (
                      inline ? (
                        <code className="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code {...props}>
                          {children}
                        </code>
                      )
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-slate-900 dark:bg-slate-800 text-gray-100 dark:text-slate-100 p-4 rounded-lg overflow-x-auto my-4">
                        {children}
                      </pre>
                    ),
                    a: ({ children, href }) => (
                      <a
                            href={href}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full divide-y divide-gray-200">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {knowledge.content}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}