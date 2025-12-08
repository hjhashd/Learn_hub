// File: app/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Menu,
  Github,
  List,
  Code,
  Heart,
  Briefcase,
  BookOpen,
  Lightbulb,
  FolderHeart,
  ChevronRight
} from 'lucide-react';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import Sidebar from '@/components/Sidebar';
import TableOfContents from '@/components/TableOfContents';
import { 
  getAllKnowledge, 
  getCategories, 
  searchKnowledge,
  Category
} from '@/lib/api-client';
import { HeadingItem, generateHeadingToc } from '@/lib/utils';

interface Post {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  toc: HeadingItem[];
  content: string;
  updatedAt?: string;
}

function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case 'Code': return Code;
    case 'Heart': return Heart;
    case 'Briefcase': return Briefcase;
    case 'BookOpen': return BookOpen;
    case 'Lightbulb': return Lightbulb;
    default: return FolderHeart;
  }
}

function PersonalKnowledgeBase() {
  // ... (原有状态保持不变) ...
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // ✨ 新增：控制右侧目录显示的状态
  const [showToc, setShowToc] = useState(true);

  // ... (tocItems, scrollToHeading, handleTocItemClick 逻辑保持不变) ...
  const tocItems = useMemo<HeadingItem[]>(() => {
    if (!activePost) return [];
    const generated = generateHeadingToc(activePost.content || '');
    if (generated.length > 0) return generated;
    return activePost.toc || [];
  }, [activePost]);

  const scrollToHeading = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    const target = document.getElementById(id);
    if (!target) return;
    const headerOffset = 96;
    const y = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, []);

  const handleTocItemClick = useCallback((id: string) => {
    scrollToHeading(id);
    setActiveHeadingId(id);
  }, [scrollToHeading]);

  // ... (useEffect 数据加载、滚动监听、Mobile检测、搜索逻辑全部保持不变) ...
  // 为节省篇幅，这里假设原有 useEffect 逻辑都在，无需改动。
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const cats = await getCategories();
        setCategories(cats);
        const knowledgeItems = await getAllKnowledge();
        setPosts(knowledgeItems);
        if (knowledgeItems.length > 0 && !activePost) {
          setActivePost(knowledgeItems[0]);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('加载数据失败，请检查文件系统权限');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!tocItems.length) {
      setActiveHeadingId(null);
      return;
    }
    let frameId: number | null = null;
    const updateActiveHeading = () => {
      let currentId: string | null = tocItems[0]?.id ?? null;
      for (const item of tocItems) {
        const element = document.getElementById(item.id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top - 120;
        if (top <= 0) {
          currentId = item.id;
        } else {
          break;
        }
      }
      setActiveHeadingId(currentId);
    };
    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        updateActiveHeading();
        frameId = null;
      });
    };
    updateActiveHeading();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [tocItems]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        try {
          const searchResults = await searchKnowledge(searchQuery);
          setPosts(searchResults);
        } catch (err) {
          console.error('Search failed:', err);
        }
      } else {
        const knowledgeItems = await getAllKnowledge();
        setPosts(knowledgeItems);
      }
    };
    performSearch();
  }, [searchQuery]);

  const handlePostClick = (post: Post) => {
    setActivePost(post);
    setActiveHeadingId(null);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handlePostsUpdate = () => {
    // 重新加载数据
    const loadData = async () => {
      try {
        const [knowledgeItems, cats] = await Promise.all([
          getAllKnowledge(),
          getCategories()
        ]);
        setPosts(knowledgeItems);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to reload data:', err);
      }
    };
    loadData();
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen bg-white dark:bg-[#131314] text-[#1f1f1f] dark:text-[#e3e3e3] font-sans overflow-hidden transition-colors duration-300`}>
      
      {/* 侧边栏 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        posts={posts}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activePost={activePost}
        onPostClick={handlePostClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isMobile={isMobile}
        getCategoryIcon={getCategoryIcon}
        onPostsUpdate={handlePostsUpdate}
      />

      {/* --- 主内容区域 --- */}
      <main className="flex-1 flex min-w-0 h-full relative bg-white dark:bg-[#131314] rounded-tl-3xl shadow-sm overflow-hidden border-l border-gray-100 dark:border-none">
        
        {/* 中间：文章内容区 */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          
          {/* Top Header */}
          <header className="h-16 flex items-center justify-between px-8 shrink-0 sticky top-0 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md z-10 border-b border-transparent dark:border-white/5">
            <div className="flex items-center gap-4">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#2d2e30] rounded-full text-slate-500 transition-colors"
                  title="展开侧边栏"
                >
                  <Menu size={20} />
                </button>
              )}
              
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition-colors">文库</span>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-slate-900 dark:text-slate-200 font-medium">
                  {/* 这里可以做一个简单的映射，或者直接显示 ID */}
                  {activePost ? activePost.category : '加载中...'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* ✨ 当 TOC 隐藏时，在 Header 显示一个小按钮来重新打开它 */}
              {!showToc && tocItems.length > 0 && (
                <button 
                  onClick={() => setShowToc(true)}
                  className="hidden xl:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <List size={16} />
                  <span>显示目录</span>
                </button>
              )}

              <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <Github size={20} />
              </button>
              <button className="hidden sm:flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors items-center gap-2 shadow-sm shadow-blue-500/20">
                 <span>分享</span>
              </button>
            </div>
          </header>

          {/* 文章滚动区域 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
            <div className="max-w-4xl mx-auto p-8 lg:p-12 pb-32">
              {activePost ? (
                <div className="space-y-8 animate-fade-in">
                  {/* Title & Meta */}
                  <div className="space-y-4 border-b border-slate-100 dark:border-white/5 pb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                      {activePost.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      {activePost.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-blue-500/10 text-slate-600 dark:text-blue-300 text-xs font-medium rounded-md">
                          #{tag}
                        </span>
                      ))}
                      <span className="text-sm text-slate-400">
                        {activePost.date} · {activePost.readTime} 阅读
                      </span>
                    </div>
                  </div>

                  {/* Markdown Content - 传入 darkMode 属性 */}
                  <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-a:text-blue-600 dark:prose-a:text-blue-400">
                    <MarkdownViewer content={activePost.content} darkMode={darkMode} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                  <div className="text-6xl mb-6 opacity-20">📝</div>
                  <h3 className="text-xl font-medium mb-2 text-slate-600 dark:text-slate-300">还没有选择文章</h3>
                  <p className="text-sm">请从左侧列表选择一篇笔记开始阅读</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：可折叠目录 (Table of Contents) */}
        <TableOfContents
          tocItems={tocItems}
          activeHeadingId={activeHeadingId}
          showToc={showToc}
          onToggleToc={() => setShowToc(false)}
          onHeadingClick={handleTocItemClick}
          darkMode={darkMode}
        />
      </main>
    </div>
  );
}

export default PersonalKnowledgeBase;