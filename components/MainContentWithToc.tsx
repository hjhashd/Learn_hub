"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Menu, List, ChevronRight, Sparkles, FolderHeart, Coffee, Sprout, ArrowLeft, PanelLeftClose, PanelLeft
} from 'lucide-react';
import TableOfContents from '@/components/TableOfContents';
import PromptUniverse from '@/components/PromptUniverse';
import Mascot from '@/components/Mascot';
import { HeadingItem, generateHeadingToc } from '@/lib/utils';
import { Post } from '@/types/knowledge';

const MarkdownViewerDynamic = dynamic(() => import('@/components/MarkdownViewer').then(m => m.MarkdownViewer), { ssr: false });

interface MainContentWithTocProps {
  darkMode: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  
  activePost: Post | null;
  posts: Post[]; // For resolving internal links/titles
  onInternalLinkOpen: (id: string) => void;
  
  lastActivePost: Post | null;
  onReturnToLastPost: () => void;
  
  onModeChange?: (mode: 'doc' | 'universe') => void;
}

export default function MainContentWithToc({
  darkMode,
  isSidebarOpen,
  onToggleSidebar,
  activePost,
  posts,
  onInternalLinkOpen,
  lastActivePost,
  onReturnToLastPost,
  onModeChange
}: MainContentWithTocProps) {
  const [mode, setMode] = useState<'doc' | 'universe'>('doc');
  const [showToc, setShowToc] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [domToc, setDomToc] = useState<HeadingItem[]>([]);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Sync mode change
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  // When activePost changes, switch back to doc mode if not already
  useEffect(() => {
    if (activePost) {
      setMode('doc');
    }
  }, [activePost]);

  const handlePromptClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMode('universe');
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

  return (
    <main className={`flex-1 flex min-w-0 h-full relative rounded-tl-3xl shadow-sm overflow-hidden border-l transition-colors duration-300
      ${darkMode ? 'bg-[#131314] border-none' : 'bg-white border-gray-100'}
    `}>
      
      {/* Center Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10 backdrop-blur-md border-b transition-colors
          ${darkMode ? 'bg-[#131314]/80 border-white/5' : 'bg-white/80 border-transparent'}
        `}>
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleSidebar}
              className={`p-2 -ml-2 rounded-full transition-colors ${darkMode ? 'hover:bg-[#2d2e30] text-slate-400' : 'hover:bg-gray-100 text-slate-500'}`}
              title={isSidebarOpen ? "收起侧边栏" : "展开侧边栏"}
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
            </button>
            
            {/* Breadcrumbs */}
            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className={`cursor-pointer transition-colors ${darkMode ? 'hover:text-slate-200' : 'hover:text-slate-900'}`} onClick={() => setMode('doc')}>
                文库
              </span>
              <ChevronRight size={14} className="text-slate-300" />
              <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                {mode === 'universe' ? '提示词宇宙' : (activePost ? activePost.category : '...')}
              </span>
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
              className={`group flex items-center gap-2 transition-opacity ${mode === 'universe' ? 'opacity-50 cursor-default' : 'hover:opacity-80'}`}
              disabled={mode === 'universe'}
            >
              <img
                src="/api/images/prompt-mascot.png"
                alt="Prompts"
                className={`h-8 w-8 rounded-full ring-1 shadow-sm object-cover transition-transform ${mode === 'doc' ? 'group-hover:scale-105' : ''} ${darkMode ? 'ring-slate-700' : 'ring-slate-200'}`}
              />
              <span className={`hidden sm:inline text-xs ${darkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-700'}`}>
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
          {/* Doc View - Using conditional rendering for performance instead of just opacity */}
          <div className={`transition-opacity duration-300 ease-in-out ${mode === 'doc' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
             <div className="max-w-4xl mx-auto p-8 lg:p-12 pb-32 min-h-full">
              {activePost ? (
                <div className="space-y-8 animate-fade-in">
                  {/* Title & Meta */}
                  <div className={`space-y-4 rounded-xl p-8 border ${darkMode ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700' : 'bg-gradient-to-r from-primary-50 to-accent-50 border-transparent'}`}>
                    <div className="flex items-center justify-between">
                      <h1 className={`text-3xl font-bold leading-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {activePost.title}
                      </h1>
                      <a href={`/edit?id=${activePost.id}`} className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-colors">
                        <Sparkles className="h-4 w-4" />
                        编辑
                      </a>
                    </div>
                    <div className={`flex items-center gap-4 flex-wrap text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      <div className="flex items-center">
                        <FolderHeart className="h-4 w-4 mr-1" />
                        <span>{activePost.category}</span>
                      </div>
                      <div className="flex items-center">
                        <Coffee className="h-4 w-4 mr-1" />
                        <span>{activePost.date}</span>
                      </div>
                    </div>
                    {activePost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {activePost.tags.map(tag => (
                          <span key={tag} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                            <Sprout className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Markdown Content */}
                  <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-a:text-blue-600 dark:prose-a:text-blue-400">
                    <MarkdownViewerDynamic 
                      content={activePost.content} 
                      darkMode={darkMode} 
                      articles={posts.map(p => ({ id: p.id, title: p.title }))}
                      onInternalLinkClick={onInternalLinkOpen}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                  <div className="text-6xl mb-6 opacity-20">📝</div>
                  <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>还没有选择文章</h3>
                  <p className="text-sm">请从左侧列表选择一篇笔记开始阅读</p>
                </div>
              )}
             </div>
          </div>

          {/* Universe View - Using conditional rendering for performance */}
          {mode === 'universe' && (
            <div className="transition-opacity duration-300 ease-in-out animate-fade-in">
               <div className="p-8 lg:p-12 min-h-full">
                  <PromptUniverse darkMode={darkMode} />
               </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Right Sidebar Area (TOC or Mascot Placeholder) */}
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

      {/* Floating Mascot (Only Visible in Universe Mode) */}
      {mode === 'universe' && (
        <div className="absolute bottom-6 right-6 z-30 animate-fade-in">
          <Mascot 
             mode={mode} 
             darkMode={darkMode} 
             className="transform scale-75 origin-bottom-right sm:scale-100"
          />
        </div>
      )}

    </main>
  );
}
