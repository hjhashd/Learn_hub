"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Hash, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Menu,
  FolderHeart, 
  FolderOpen,
  MoreHorizontal,
  Heart,
  Moon,
  Sun,
  Coffee,
  Github,
  List,
  Code,
  Briefcase,
  BookOpen,
  Lightbulb,
  RefreshCw,
  Tag
} from 'lucide-react';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import Sidebar from '@/components/Sidebar';
import { 
  getAllKnowledge, 
  getCategories, 
  searchKnowledge,
  KnowledgeItem,
  Category
} from '@/lib/api-client';
import { HeadingItem, generateHeadingToc } from '@/lib/utils';

// --- 类型定义 ---
interface Post {
  id: string;
  title: string;
  categoryId: string;
  date: string;
  readTime: string;
  tags: string[];
  toc: HeadingItem[];
  content: string;
  updatedAt?: string;
}

// 获取分类图标
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

  // 数据加载
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
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [tocItems]);

  // 响应式检测
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

  // 搜索功能
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

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'all' || post.categoryId === activeCategory;
    return matchesCategory;
  });

  const handlePostClick = (post: Post) => {
    setActivePost(post);
    setActiveHeadingId(null);
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen bg-white dark:bg-[#131314] text-[#1f1f1f] dark:text-[#e3e3e3] font-sans overflow-hidden transition-colors duration-300`}>
      
      {/* 使用新的Sidebar组件 */}
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
      />

      {/* --- 主内容区域 (Surface Container) --- */}
      <main className="flex-1 flex min-w-0 h-full relative bg-white dark:bg-[#131314] rounded-tl-3xl shadow-sm overflow-hidden border-l border-gray-100 dark:border-none">
        
        {/* 中间：文章内容区 */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          
          {/* Top Navigation (Minimalist) */}
          <header className="h-16 flex items-center justify-between px-8 shrink-0 sticky top-0 bg-white/90 dark:bg-[#131314]/90 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#2d2e30] rounded-full text-gray-500 transition-colors"
              >
                {isSidebarOpen ? <Menu size={20} /> : <ChevronRight size={20} />}
              </button>
              
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Library</span>
                <ChevronRight size={14} />
                <span className="text-gray-900 dark:text-gray-200 font-medium">
                  {activePost ? (categories.find(c => c.id === activePost.categoryId)?.name || 'General') : 'Loading...'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2d2e30] rounded-full transition-colors">
                <Github size={20} />
              </button>
              <button className="hidden sm:flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors items-center gap-2">
                 <span>Share</span>
              </button>
            </div>
          </header>

          {/* 文章内容区域 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto p-8">
              {activePost ? (
                <div className="space-y-6">
                  {/* 文章标题和元信息 */}
                  <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {activePost.title}
                    </h1>
                    
                    {/* 标签 */}
                    {activePost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {activePost.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                            <Hash size={12} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 目录 */}
                    {tocItems.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 my-6 xl:hidden">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <List size={16} />
                          内容提纲
                        </h3>
                        <nav className="space-y-1">
                          {tocItems.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleTocItemClick(item.id)}
                              className={`
                                w-full text-left text-[13px] py-1.5 pl-3 border-l-2 rounded-md transition-colors
                                ${item.level === 3 ? 'ml-4' : ''}
                                ${activeHeadingId === item.id ? 'border-blue-300 text-blue-600 dark:text-blue-300 dark:border-blue-500/60' : 'border-transparent text-gray-500 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-500/40'}
                              `}
                            >
                              {item.text}
                            </button>
                          ))}
                        </nav>
                      </div>
                    )}
                  </div>

                  {/* Markdown 内容显示区域 */}
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <MarkdownViewer content={activePost.content} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-medium mb-2">No article selected</h3>
                  <p className="text-sm">Select an article from the sidebar to start reading</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：目录 (Table of Contents) */}
        {tocItems.length > 0 && (
          <aside className="hidden xl:flex w-72 shrink-0 border-l border-gray-100 dark:border-white/5 bg-white/60 dark:bg-white/5 backdrop-blur px-5 py-8">
            <div className="sticky top-6 w-full space-y-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <List size={16} />
                  Subtitles
                </div>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[11px] text-gray-600 dark:text-gray-300">
                  {tocItems.length}
                </span>
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  On this page
                </div>
                <nav className="max-h-[70vh] overflow-y-auto custom-scrollbar px-2 py-3 space-y-1">
                  {tocItems.map(item => {
                    const isActive = activeHeadingId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTocItemClick(item.id)}
                        className={`
                          group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors
                          ${item.level === 3 ? 'ml-4' : ''}
                          ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-200 shadow-[0_4px_10px_rgba(59,130,246,0.15)]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}
                        `}
                      >
                        <span
                          className={`h-2 w-2 rounded-full transition-colors ${isActive ? 'bg-blue-600 dark:bg-blue-300' : 'bg-gray-300 dark:bg-gray-600'}`}
                        />
                        <span className="flex-1 truncate">{item.text}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default PersonalKnowledgeBase;

// --- 主内容区域开始 ---