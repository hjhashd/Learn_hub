'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Heart, Sparkles, Coffee, Sprout, Smile } from 'lucide-react';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { KnowledgeItem } from '@/types/knowledge'
import { getKnowledgeById, saveKnowledge } from '@/lib/storage'
import { generateId } from '@/lib/utils'

export default function EditPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) {
      const existing = getKnowledgeById(id)
      if (existing) {
        setTitle(existing.title)
        setContent(existing.content)
        setCategory(existing.category)
        setTags(existing.tags)
      }
    }
  }, [id])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容')
      return
    }

    setSaving(true)
    
    const knowledgeItem: KnowledgeItem = {
      id: id || generateId(),
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || '未分类',
      tags: tags,
      createdAt: id ? getKnowledgeById(id)!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    saveKnowledge(knowledgeItem)
    
    setTimeout(() => {
      setSaving(false)
      router.push('/')
    }, 500)
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/')}
                className="mr-4"
              >
                返回
              </Button>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {id ? '编辑知识' : '新建知识'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center"
              >
                {showPreview ? <Coffee className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {showPreview ? '隐藏预览' : '显示预览'}
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center"
              >
                <Heart className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : ""}>
          {/* Editor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    标题 *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入知识标题"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    分类
                  </label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="输入分类名称"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    标签
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入标签后按回车"
                      className="flex-1"
                    />
                    <Button onClick={addTag} type="button">
                      <Sprout className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                    >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <Smile className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>内容编辑</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="使用 Markdown 格式编写内容...\n\n支持：\n# 标题\n**粗体**\n*斜体*\n`代码`\n- 列表\n> 引用\n```代码块```"
                  className="w-full h-96 font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose-custom">
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
                      }}
                    >
                      {content || '*暂无内容*'}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}