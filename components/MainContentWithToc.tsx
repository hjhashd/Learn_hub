"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { 
  Menu, List, ChevronRight, Sparkles, FolderHeart, Coffee, Sprout, ArrowLeft, PanelLeftClose, PanelLeft,
  Plus, Wand2, ChevronDown, Mic, Pencil, GraduationCap, Zap, Code, Files, MessageSquare
} from 'lucide-react';
import TableOfContents from '@/components/TableOfContents';
import PromptUniverse from '@/components/PromptUniverse';
import AIChat from '@/components/AIChat';
import { useSidebar } from '@/context/SidebarContext';
import { HeadingItem, generateHeadingToc } from '@/lib/utils';
import { Post } from '@/types/knowledge';

const MarkdownViewerDynamic = dynamic(() => import('@/components/MarkdownViewer').then(m => m.MarkdownViewer), { ssr: false });

interface MainContentWithTocProps {
  darkMode: boolean;
  
  activePost: Post | null;
  posts: Post[]; // For resolving internal links/titles
  onInternalLinkOpen: (id: string) => void;
  
  lastActivePost: Post | null;
  onReturnToLastPost: () => void;
  
  mode: 'doc' | 'universe';
  onModeChange: (mode: 'doc' | 'universe') => void;
}

export default function MainContentWithToc({
  darkMode,
  activePost,
  posts,
  onInternalLinkOpen,
  lastActivePost,
  onReturnToLastPost,
  mode,
  onModeChange
}: MainContentWithTocProps) {
  const { isCollapsed, setIsCollapsed, isMobile, setIsDrawerOpen } = useSidebar();
  const router = useRouter();
  const [showToc, setShowToc] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [domToc, setDomToc] = useState<HeadingItem[]>([]);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showPromptsUniverse, setShowPromptsUniverse] = useState(false);

  const handlePromptClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mode === 'universe') {
      setShowPromptsUniverse(true);
    } else {
      onModeChange('universe');
    }
  };

  // --- TOC Logic Copied from page.tsx ---
  const tocItems = useMemo<HeadingItem[]>(() => {
    if (domToc.length) return domToc;
    if (!activePost) return [];
    const generated = generateHeadingToc(activePost.content || '');
    if (generated.length > 0) return generated;
    return activePost.toc || [];
  }, [activePost, domToc]);

  const scrollToHeading = useCallback((id: string) => {
    const container = contentContainerRef.current;
    const selectorId = (window as any).CSS && (window as any).CSS.escape ? (window as any).CSS.escape(id) : id;
    let target = container ? (container.querySelector(`#${selectorId}`) as HTMLElement | null) : document.getElementById(id);
    if (!target && container) {
      target = container.querySelector(`[id^="${selectorId}"]`) as HTMLElement | null;
    }
    
    if (!container || !target) return;
    
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const relativeTop = targetRect.top - containerRect.top;
    const currentScroll = container.scrollTop;
    const headerOffset = 20;

    container.scrollTo({ 
      top: currentScroll + relativeTop - headerOffset, 
      behavior: 'smooth' 
    });
  }, []);

  useEffect(() => {
    const container = contentContainerRef.current;
    if (!container) return;
    const headings = Array.from(container.querySelectorAll('h2,h3,h4')) as HTMLElement[];
    const mapped: HeadingItem[] = headings
      .filter(h => h.id)
      .map(h => ({ id: h.id, text: h.textContent || '', level: Number(h.tagName.substring(1)) }));
    setDomToc(mapped);
  }, [activePost, mode]); // Recalculate when post or mode changes

  useEffect(() => {
    const container = contentContainerRef.current;
    if (!container || !tocItems.length || mode !== 'doc') {
      if (mode !== 'doc') setActiveHeadingId(null);
      return;
    }
    
    let debounceTimer: number | null = null;
    const updateActiveHeading = () => {
      let currentId: string | null = tocItems[0]?.id ?? null;
      const containerTop = container.getBoundingClientRect().top;

      for (const item of tocItems) {
        const selectorId = (window as any).CSS && (window as any).CSS.escape ? (window as any).CSS.escape(item.id) : item.id;
        const element = container.querySelector(`#${selectorId}`) as HTMLElement | null;
        if (!element) continue;
        
        const relativeTop = element.getBoundingClientRect().top - containerTop;
        // Switch to this heading if it's above the threshold (100px from top)
        if (relativeTop <= 100) {
          currentId = item.id;
        } else {
          break;
        }
      }
      setActiveHeadingId(currentId);
    };

    const handleScroll = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        updateActiveHeading();
        debounceTimer = null;
      }, 50); // Reduced from 200ms to 50ms for better responsiveness
    };
    
    updateActiveHeading();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (debounceTimer) window.clearTimeout(debounceTimer);
    };
  }, [tocItems, mode]);

  const handleTocItemClick = useCallback((id: string) => {
    scrollToHeading(id);
    setActiveHeadingId(id);
  }, [scrollToHeading]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMessages = [...chatMessages, { role: 'user' as const, content: inputValue }];
    setChatMessages(newMessages);
    setInputValue('');
    
    // Mock response
    setTimeout(() => {
      setChatMessages([...newMessages, { role: 'assistant' as const, content: '这是一条模拟回复。我正在学习如何更好地协助您管理知识库。' }]);
    }, 1000);
  };

  return (
    <main className={`flex-1 flex min-w-0 h-full relative rounded-tl-3xl shadow-sm overflow-hidden border-l transition-theme bg-[var(--content-bg)]
      ${darkMode ? 'border-none' : 'border-gray-100'}
    `}>
      
      {/* Center Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-[var(--content-bg)] transition-theme">
        
        {/* 1. Content Header */}
        <header className={`h-16 flex items-center justify-between px-4 sm:px-8 border-b transition-theme shrink-0 z-30 ${darkMode ? 'bg-[#131314]/80 border-white/5' : 'bg-white/80 border-black/5'} backdrop-blur-xl sticky top-0`}>
          <div className="flex items-center gap-4 overflow-hidden">
            {isMobile && (
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--sidebar-icon)]"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--sidebar-text)] opacity-60 truncate">
              <span className="shrink-0">LearnHub</span>
              <ChevronRight size={14} className="shrink-0" />
              <div className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${mode === 'universe' ? 'bg-[var(--primary-indigo)]/10 text-[var(--primary-indigo)] font-bold' : ''}`}>
                {mode === 'universe' && <MessageSquare size={14} />}
                <span className="truncate">
                  {mode === 'universe' ? 'AI 对话' : (activePost ? activePost.category : '知识库')}
                </span>
              </div>
              {mode === 'doc' && activePost && (
                <>
                  <ChevronRight size={14} className="shrink-0" />
                  <span className="truncate text-[var(--sidebar-text-active)] font-semibold">{activePost.title}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Show TOC Button (Doc Mode Only) */}
            {mode === 'doc' && !showToc && tocItems.length > 0 && (
              <button 
                onClick={() => setShowToc(true)}
                className={`hidden xl:flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border
                  ${darkMode 
                    ? 'text-slate-300 hover:bg-slate-800 border-slate-700' 
                    : 'text-slate-600 hover:bg-slate-100 border-slate-200'}
                `}
              >
                <List size={16} />
                <span>显示目录</span>
              </button>
            )}

            {/* Prompt Universe Button */}
            <button 
              onClick={handlePromptClick}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${mode === 'universe' ? 'bg-[var(--primary-indigo)] text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400'}`}
              disabled={mode === 'universe'}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${mode === 'universe' ? 'bg-white/20' : 'bg-[var(--primary-indigo)]/10 text-[var(--primary-indigo)]'}`}>
                <Sparkles size={18} />
              </div>
              <span className="hidden sm:inline text-sm font-semibold">
                提示词宇宙
              </span>
            </button>

            {/* Return to Last Post Button - Enhanced */}
            {mode === 'universe' && lastActivePost && (
              <button 
                onClick={onReturnToLastPost}
                className={`flex px-4 py-2 text-sm font-medium rounded-full transition-colors items-center gap-2 border shadow-sm
                  ${darkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}
                `}
              >
                <ArrowLeft size={16} />
                <span>返回上一篇</span>
              </button>
            )}
            
            <button className="hidden sm:flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors items-center gap-2 shadow-sm shadow-blue-500/20">
               <span>分享</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div 
          ref={contentContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth relative"
        >
          {/* Doc View */}
          {mode === 'doc' && activePost && (
            <div className="transition-opacity duration-300 ease-in-out opacity-100 animate-fade-in">
               <div className="max-w-4xl mx-auto p-8 lg:p-12 pb-32 min-h-full">
                <div className="space-y-8">
                  {/* Title & Meta */}
                  <div className={`space-y-6 rounded-3xl p-10 border transition-all duration-500 shadow-sm ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-xl hover:border-transparent'}`}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-[var(--primary-indigo)] font-bold tracking-widest text-xs uppercase">
                        <span className="px-2 py-1 rounded-md bg-[var(--primary-indigo)]/10">{activePost.category}</span>
                        <span className="opacity-30">•</span>
                        <span>{activePost.date}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <h1 className={`text-4xl md:text-5xl font-black leading-tight tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {activePost.title}
                        </h1>
                        <a href={`/edit?id=${activePost.id}`} className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary-indigo)] hover:bg-indigo-600 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200/50 dark:shadow-none hover:scale-105 active:scale-95 shrink-0">
                          <Sparkles className="h-4 w-4" />
                          优化建议
                        </a>
                      </div>
                    </div>
                    
                    {activePost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {activePost.tags.map(tag => (
                          <span key={tag} className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${darkMode ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50' : 'bg-white text-indigo-700 border border-indigo-100 hover:bg-indigo-50'}`}>
                            <Sprout className="h-3.5 w-3.5 mr-1.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Markdown Content */}
                  <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 note-title-hierarchy">
                    <MarkdownViewerDynamic 
                      content={activePost.content} 
                      darkMode={darkMode} 
                      articles={posts.map(p => ({ id: p.id, title: p.title }))}
                      onInternalLinkClick={onInternalLinkOpen}
                    />
                  </div>
                </div>
               </div>
            </div>
          )}

          {/* Universe View */}
          {mode === 'universe' && (
            <div className="transition-opacity duration-300 ease-in-out opacity-100 animate-fade-in h-full flex flex-col">
               {showPromptsUniverse ? (
                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                   <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 min-h-full">
                     <PromptUniverse darkMode={darkMode} onBackToChat={() => setShowPromptsUniverse(false)} />
                   </div>
                 </div>
               ) : (
                 <div className="flex-1 h-full overflow-hidden">
                   <AIChat darkMode={darkMode} onSwitchToPrompts={() => setShowPromptsUniverse(true)} />
                 </div>
               )}
            </div>
          )}
          
          {/* Default/Empty State (Optional, but helps prevent flashes) */}
          {mode === 'doc' && !activePost && (
            <div className="flex items-center justify-center h-full text-[var(--sidebar-text)] opacity-40">
              请在侧边栏选择一篇笔记
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar Area (TOC or AI Sidebar) */}
      <div className="flex flex-col h-full shrink-0">
        {mode === 'doc' && (
           <TableOfContents
             tocItems={tocItems}
             activeHeadingId={activeHeadingId}
             showToc={showToc}
             onToggleToc={() => setShowToc(false)}
             onHeadingClick={handleTocItemClick}
             darkMode={darkMode}
           />
        )}
      </div>
    </main>
  );
}
