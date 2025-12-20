'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Heart, Sparkles, Coffee, Sprout, Smile, Upload, Download, ArrowLeft, Save, FileText, Image as ImageIcon, Book, Layout } from 'lucide-react';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { KnowledgeItem } from '@/types/knowledge'
import { createKnowledge, getKnowledgeById, getAllKnowledge } from '@/lib/api-client'
import { generateId, cn } from '@/lib/utils'

export default function EditPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [directory, setDirectory] = useState('knowledge')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [allTitles, setAllTitles] = useState<{ id: string; title: string; category?: string; tags?: string[] }[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestQuery, setSuggestQuery] = useState('')
  const [suggestStart, setSuggestStart] = useState<number | null>(null)
  const [suggestIndex, setSuggestIndex] = useState(0)
  const [caretPos, setCaretPos] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [showCategoryOptions, setShowCategoryOptions] = useState(false)
  const [showTagOptions, setShowTagOptions] = useState(false)

  useEffect(() => {
    if (id) {
      // Load existing knowledge
      getKnowledgeById(id).then(item => {
        setTitle(item.title)
        setContent(item.content)
        setCategory(item.category)
        setTags(item.tags)
        // Note: directory is not stored in item, so we default to 'knowledge' or need to infer it
      }).catch(err => console.error(err))
    }
  }, [id])

  useEffect(() => {
    getAllKnowledge(1, 500).then(items => {
      setAllTitles(items.map((i: any) => ({ id: String(i.id), title: String(i.title), category: i.category, tags: i.tags })))
    }).catch(() => {})
  }, [])

  const filteredTitles = useMemo(() => {
    const q = suggestQuery.trim().toLowerCase()
    const list = allTitles.filter(t => t.title.toLowerCase().includes(q))
    return list.slice(0, 12)
  }, [suggestQuery, allTitles])

  const existingCategories = useMemo(() => {
    const s = new Set<string>()
    allTitles.forEach(t => { if (t.category) s.add(String(t.category)) })
    return Array.from(s)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [allTitles])

  const existingTags = useMemo(() => {
    const s = new Set<string>()
    allTitles.forEach(t => (t.tags || []).forEach(tag => s.add(String(tag))))
    return Array.from(s)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [allTitles])

  const filteredCategories = useMemo(() => {
    const q = category.trim().toLowerCase()
    return existingCategories.filter(c => c.toLowerCase().includes(q)).slice(0, 10)
  }, [category, existingCategories])

  const filteredTags = useMemo(() => {
    const q = tagInput.trim().toLowerCase()
    const exclude = new Set(tags.map(t => t.toLowerCase()))
    return existingTags.filter(t => t.toLowerCase().includes(q) && !exclude.has(t.toLowerCase())).slice(0, 12)
  }, [tagInput, existingTags, tags])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容')
      return
    }

    setSaving(true)
    
    try {
      const knowledgeItem = {
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || '未分类',
        tags: tags,
        directory: directory,
        updatedAt: new Date().toISOString(),
        // If ID exists, we preserve it (handled by backend if passed, but createKnowledge excludes ID in type)
        // We'll pass it anyway by casting or modifying backend to accept ID for updates
        ...(id ? { id, createdAt: new Date().toISOString() } : { createdAt: new Date().toISOString() })
      }

      // We use createKnowledge which calls POST. POST uses saveKnowledgeToFile which uses ID if present or generates new one.
      // We need to ensure ID is passed if editing.
      await createKnowledge(knowledgeItem as any)
      
      router.push('/')
    } catch (error) {
      console.error('Failed to save:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setContent(text);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!content) {
      alert('没有内容可下载');
      return;
    }
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'untitled'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    const caret = e.target.selectionStart
    setCaretPos(caret)
    const before = val.slice(0, caret)
    const m = /\[\[([^\]]*)$/.exec(before)
    if (m) {
      setSuggestOpen(true)
      setSuggestQuery(m[1] || '')
      setSuggestStart(caret - (m[1]?.length || 0) - 2)
      setSuggestIndex(0)
    } else {
      setSuggestOpen(false)
      setSuggestQuery('')
      setSuggestStart(null)
    }
  }

  const completeWith = (titleToInsert: string) => {
    if (suggestStart == null) return
    const val = content
    const before = val.slice(0, suggestStart)
    const after = val.slice(caretPos)
    const insert = `[[${titleToInsert}]]`
    const next = before + insert + after
    setContent(next)
    setSuggestOpen(false)
    setSuggestQuery('')
    setSuggestStart(null)
    setSuggestIndex(0)
    const pos = before.length + insert.length
    setCaretPos(pos)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = pos
        textareaRef.current.selectionEnd = pos
        textareaRef.current.focus()
      }
    }, 0)
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!suggestOpen || filteredTitles.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestIndex(i => (i + 1) % filteredTitles.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestIndex(i => (i - 1 + filteredTitles.length) % filteredTitles.length)
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      completeWith(filteredTitles[suggestIndex]?.title || '')
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setSuggestOpen(false)
      setSuggestQuery('')
      setSuggestStart(null)
      return
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items || !items.length) return
    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.kind === 'file' && it.type.startsWith('image/')) {
        const f = it.getAsFile()
        if (f) files.push(f)
      }
    }
    if (files.length === 0) return
    e.preventDefault()
    setUploading(true)
    try {
      let insertText = ''
      for (const f of files) {
        const fd = new FormData()
        fd.append('file', f)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (data?.url) {
          const alt = (f.name || 'image').replace(/\.[^.]+$/, '')
          insertText += `![${alt}](${data.url})\n`
        }
      }
      if (insertText) {
        const val = content
        const start = textareaRef.current ? textareaRef.current.selectionStart : caretPos
        const end = textareaRef.current ? textareaRef.current.selectionEnd : caretPos
        const next = val.slice(0, start) + insertText + val.slice(end)
        setContent(next)
        const pos = start + insertText.length
        setCaretPos(pos)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = pos
            textareaRef.current.selectionEnd = pos
            textareaRef.current.focus()
          }
        }, 0)
      }
    } catch (err) {
      console.error('upload failed', err)
      alert('图片上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".md,.txt"
        className="hidden"
      />
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-indigo-100 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/')}
                className="hover:bg-indigo-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                {id ? '编辑笔记' : '新建笔记'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="hidden sm:flex"
              >
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
              >
                {saving ? (
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? '保存中...' : '保存笔记'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Metadata */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-indigo-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-indigo-500" />
                  基本信息
                </CardTitle>
                <CardDescription>设置笔记的标题和分类</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">标题</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入笔记标题..."
                    className="focus:ring-indigo-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">存储位置</label>
                  <Select 
                    value={directory} 
                    onChange={(e) => setDirectory(e.target.value)}
                    className="w-full"
                  >
                    <option value="knowledge">知识md文件 (Knowledge)</option>
                    <option value="docs">文档 (Docs)</option>
                    <option value="images">图片 (Images)</option>
                  </Select>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    文件将保存在: data/{directory}/
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">分类</label>
                  <div className="relative">
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      onFocus={() => setShowCategoryOptions(true)}
                      onBlur={() => setTimeout(() => setShowCategoryOptions(false), 100)}
                      placeholder="例如: tech, life..."
                    />
                    <div className={`${showCategoryOptions && filteredCategories.length ? '' : 'hidden'} absolute left-0 right-0 mt-1 rounded-lg border bg-white dark:bg-slate-900 shadow-md max-h-60 overflow-auto z-50`}> 
                      {filteredCategories.map(c => (
                        <button
                          key={c}
                          onMouseDown={(e) => { e.preventDefault(); setCategory(c); setShowCategoryOptions(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">标签</label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setShowTagOptions(true)}
                        onBlur={() => setTimeout(() => setShowTagOptions(false), 100)}
                        placeholder="输入标签按回车"
                        className="flex-1"
                      />
                      <Button onClick={addTag} size="icon" variant="outline">
                        <Sprout className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className={`${showTagOptions && filteredTags.length ? '' : 'hidden'} absolute left-0 right-0 mt-1 rounded-lg border bg-white dark:bg-slate-900 shadow-md max-h-60 overflow-auto z-50`}> 
                      {filteredTags.map(t => (
                        <button
                          key={t}
                          onMouseDown={(e) => { e.preventDefault(); if (!tags.includes(t)) setTags([...tags, t]); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 dark:border-slate-800 shadow-sm bg-indigo-50/50 dark:bg-slate-900/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2 flex items-center">
                  <Smile className="h-4 w-4 mr-2" />
                  小贴士
                </h3>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  支持 Markdown 语法。你可以直接拖拽文件到编辑器中（即将支持），或者点击上方的导入按钮。
                  选择正确的存储目录有助于文件管理。
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Content: Editor/Preview */}
          <div className="lg:col-span-8">
            <Card className="h-full border-indigo-100 dark:border-slate-800 shadow-md flex flex-col min-h-[600px]">
              <div className="border-b px-4 py-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 rounded-t-lg">
                <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
                  <button
                    onClick={() => setActiveTab('write')}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-sm transition-all",
                      activeTab === 'write' 
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    <FileText className="h-4 w-4 inline mr-1.5" />
                    编写
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-sm transition-all",
                      activeTab === 'preview' 
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    <Coffee className="h-4 w-4 inline mr-1.5" />
                    预览
                  </button>
                </div>
              </div>
              
              <CardContent className="flex-1 p-0 overflow-hidden relative">
                {activeTab === 'write' ? (
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={content}
                      onChange={handleEditorChange}
                      onKeyDown={handleEditorKeyDown}
                      onPaste={handlePaste}
                      onSelect={(e) => setCaretPos((e.target as HTMLTextAreaElement).selectionStart)}
                      placeholder="# 开始你的创作...&#10;&#10;支持 Markdown 格式"
                      className="w-full h-full min-h-[500px] border-0 focus-visible:ring-0 rounded-none p-6 font-mono text-base resize-none bg-transparent"
                    />
                    {uploading && (
                      <div className="absolute top-3 right-6 text-xs px-2 py-1 rounded bg-indigo-600 text-white shadow-sm">上传中...</div>
                    )}
                    <div className={`${suggestOpen && filteredTitles.length ? '' : 'hidden'} absolute top-4 right-6 xl:right-8 xl:left-auto xl:w-[420px] left-6 w-[calc(100%-3rem)] z-50`}> 
                      <div className="rounded-xl border shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur p-3">
                        <div className="flex items-center justify-between px-2 pb-2 border-b dark:border-slate-800">
                          <div className="text-xs text-slate-500 dark:text-slate-400">输入以筛选 · {filteredTitles.length} 项</div>
                          <div className="text-[11px] text-slate-400">↑↓选择 · Enter/Tab插入 · Esc关闭</div>
                        </div>
                        <div className="max-h-80 overflow-auto py-1">
                          {filteredTitles.map((t, idx) => (
                            <button
                              key={t.id}
                              onMouseDown={(e) => { e.preventDefault(); completeWith(t.title) }}
                              className={`group flex w-full items-start gap-3 px-3 py-2 rounded-md text-sm ${idx === suggestIndex ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {(() => {
                                    const q = suggestQuery.trim();
                                    const title = t.title;
                                    const lq = q.toLowerCase();
                                    const li = title.toLowerCase().indexOf(lq);
                                    if (!q || li < 0) return title;
                                    return (
                                      <>
                                        {title.slice(0, li)}
                                        <span className="bg-yellow-100 dark:bg-yellow-900/40 rounded px-0.5">{title.slice(li, li + q.length)}</span>
                                        {title.slice(li + q.length)}
                                      </>
                                    )
                                  })()}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  {t.category && <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{t.category}</span>}
                                  {(t.tags || []).slice(0, 3).map(tag => (
                                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100">回车选择</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[500px] p-8 overflow-auto prose prose-indigo dark:prose-invert max-w-none bg-white dark:bg-slate-950">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code: ({ inline, children, ...props }) => {
                          if (inline) {
                            return (
                              <code className="bg-indigo-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400" {...props}>
                                {children}
                              </code>
                            );
                          }
                          
                          // 对于块级代码，使用div包装避免HTML嵌套问题
                          return (
                            <div className="my-4">
                              <pre className="bg-slate-900 dark:bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto shadow-inner">
                                <code {...props} className="bg-transparent p-0 text-sm font-mono">
                                  {children}
                                </code>
                              </pre>
                            </div>
                          );
                        }
                      }}
                    >
                      {content || '*暂无内容*'}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
