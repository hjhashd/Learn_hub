// File: components/Sidebar.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { 
  Sparkles, Plus, Search, LayoutGrid, ChevronRight, Menu, 
  Moon, Sun, Settings, LogOut, HelpCircle, Trash2, 
  PanelLeftClose, PanelLeftOpen, ChevronDown, Folder,
  Files, FileText, MessageSquare
} from 'lucide-react';
import { Post, Category } from '../types/knowledge';
import { useRouter } from 'next/navigation';
import { deleteKnowledge } from '@/lib/api-client';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useSidebar } from '@/context/SidebarContext';

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  indent?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (e: React.MouseEvent) => void;
}

function MenuItem({ 
  icon: Icon, label, count, isActive, isCollapsed, onClick, 
  indent = 0, hasChildren, isExpanded, onToggleExpand 
}: MenuItemProps) {
  return (
    <div 
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={hasChildren ? isExpanded : undefined}
      className={`
        group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-indigo)]
        ${isActive 
          ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)] font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
          : 'hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)]'}
        ${isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto mb-1' : ''}
      `}
      style={{ marginLeft: !isCollapsed ? `${indent * 16}px` : '0' }}
      title={isCollapsed ? label : ''}
    >
      <div className={`flex items-center justify-center ${isCollapsed ? 'w-full h-full' : 'min-w-[20px]'}`}>
        <Icon 
          size={isCollapsed ? 20 : 18} 
          className={`
            ${isActive ? 'text-[var(--sidebar-icon-active)]' : 'text-[var(--sidebar-icon)] group-hover:text-[var(--sidebar-icon-active)]'} 
            shrink-0 transition-transform duration-200 group-hover:scale-110
          `} 
        />
      </div>
      
      {!isCollapsed && (
        <>
          <span className="text-sm flex-1 truncate">
            {label}
          </span>
          {count !== undefined && count > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums ${isActive ? 'bg-[var(--primary-indigo)] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
              {count}
            </span>
          )}
          {hasChildren && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.(e);
              }}
              className="p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SidebarProps {
  darkMode: boolean;
  onDarkModeToggle: () => void;
  posts: Post[];
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  activePost: Post | null;
  onPostClick: (post: Post) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  getCategoryIcon: (iconName: string) => React.ElementType;
  onPostsUpdate?: () => void;
  mode: 'doc' | 'universe';
  onModeChange: (mode: 'doc' | 'universe') => void;
}

export default function Sidebar({
  darkMode,
  onDarkModeToggle,
  posts,
  categories,
  activeCategory,
  onCategoryChange,
  activePost,
  onPostClick,
  searchQuery,
  onSearchChange,
  getCategoryIcon,
  onPostsUpdate,
  mode,
  onModeChange,
}: SidebarProps) {
  const { isCollapsed, setIsCollapsed, isMobile, isDrawerOpen, setIsDrawerOpen, expandedFolders, toggleFolder } = useSidebar();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showCategoryPopover, setShowCategoryPopover] = useState(false);
  const categoryPopoverRef = useRef<HTMLDivElement>(null);

  const handleDeleteClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    try {
      await deleteKnowledge(postToDelete.id);
      onPostsUpdate?.();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => activeCategory === 'all' || post.category === activeCategory);
  }, [posts, activeCategory]);

  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-[280px]';
  const displayClass = isMobile 
    ? (isDrawerOpen ? 'translate-x-0' : '-translate-x-full') 
    : 'translate-x-0';

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-[4px] transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed lg:relative z-50 h-full flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          bg-[var(--sidebar-bg)] border-r border-black/5 dark:border-white/5
          ${sidebarWidth} ${displayClass}
        `}
      >
        {/* 1. Header */}
        <div className={`h-16 flex items-center px-6 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 select-none overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary-indigo)] to-indigo-600 text-white shadow-indigo-200/50 dark:shadow-none shadow-lg">
                <Sparkles size={16} fill="currentColor" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100 truncate">LearnHub</span>
            </div>
          )}
          
          <button 
            onClick={() => isMobile ? setIsDrawerOpen(false) : setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* 2. FAB Button */}
        <div className={`px-4 mb-6 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button 
            onClick={() => router.push('/edit')}
            className={`
              flex items-center gap-2 bg-[var(--primary-indigo)] text-white
              hover:bg-indigo-600 hover:shadow-indigo-200 dark:hover:shadow-none hover:shadow-lg transition-all duration-200
              ${isCollapsed ? 'w-10 h-10 rounded-lg justify-center' : 'w-full px-4 py-2.5 rounded-xl'}
            `}
            title={isCollapsed ? "新建笔记" : ""}
            aria-label="新建笔记"
          >
            <Plus size={20} strokeWidth={2.5} />
            {!isCollapsed && <span className="font-semibold text-sm">新建笔记</span>}
          </button>
        </div>

        {/* 3. Search (only in expanded mode) */}
        {!isCollapsed && (
          <div className="px-4 mb-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary-indigo)] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="快速搜索..." 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary-indigo)]/20 focus:border-[var(--primary-indigo)] transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* 4. Menu List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 flex flex-col gap-1">
          <div className="space-y-1">
            <MenuItem 
              icon={MessageSquare} 
              label="AI 对话" 
              isActive={mode === 'universe'} 
              isCollapsed={isCollapsed}
              onClick={() => onModeChange('universe')}
            />

          {/* "知识库" - 支持右侧弹出分类菜单 */}
          <div 
            className="relative"
            ref={categoryPopoverRef}
            onMouseEnter={() => setShowCategoryPopover(true)}
            onMouseLeave={() => setShowCategoryPopover(false)}
          >
            <MenuItem 
              icon={LayoutGrid} 
              label="知识库" 
              isActive={mode === 'doc' && activeCategory === 'all'} 
              isCollapsed={isCollapsed}
              onClick={() => {
                onModeChange('doc');
                onCategoryChange('all');
                if (!expandedFolders.includes('categories-root')) {
                  toggleFolder('categories-root');
                }
              }}
              hasChildren={true}
              isExpanded={expandedFolders.includes('categories-root')}
              onToggleExpand={() => {
                toggleFolder('categories-root');
              }}
            />

            {!isCollapsed && expandedFolders.includes('categories-root') && (
              <div className="mt-1 space-y-1 ml-4 border-l border-slate-100 dark:border-slate-800 transition-all">
                {categories.map(cat => {
                  const IconComponent = getCategoryIcon(cat.icon);
                  return (
                    <MenuItem 
                      key={cat.id}
                      icon={IconComponent} 
                      label={cat.name} 
                      count={cat.count} 
                      isActive={activeCategory === cat.id} 
                      isCollapsed={isCollapsed}
                      onClick={() => onCategoryChange(cat.id)}
                      indent={0.5}
                    />
                  );
                })}
              </div>
            )}

            {showCategoryPopover && isCollapsed && (
              <div className="absolute left-full top-0 ml-2 w-[200px] rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--sidebar-bg)] shadow-xl z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="p-1.5 space-y-1">
                  {categories.map(cat => {
                    const IconComponent = getCategoryIcon(cat.icon);
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onModeChange('doc');
                          onCategoryChange(cat.id);
                          setShowCategoryPopover(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${active ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)] font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        <IconComponent size={16} className={active ? 'text-[var(--primary-indigo)]' : 'text-slate-400'} />
                        <span className="flex-1 text-left truncate">{cat.name}</span>
                        {cat.count > 0 && <span className="text-[10px] opacity-60 tabular-nums">{cat.count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <MenuItem 
            icon={Files} 
            label="文档管理" 
            isActive={false} 
            isCollapsed={isCollapsed}
            onClick={() => router.push('/docs')}
          />
          </div>

          {/* 5. Notes List (File list for active category) */}
          <div className={`
            mt-6 mb-4 flex-1 flex flex-col min-h-0 pt-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isCollapsed 
              ? 'opacity-0 pointer-events-none border-transparent' 
              : 'opacity-100 border-t border-slate-100 dark:border-slate-800'}
          `}>
            {!isCollapsed && (
              <>
                <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  {activeCategory === 'all' ? '所有笔记' : categories.find(c => c.id === activeCategory)?.name || '笔记列表'}
                </p>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 px-1">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                      <div 
                        key={post.id}
                        onClick={() => onPostClick(post)}
                        className={`
                          group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                          ${activePost?.id === post.id && mode === 'doc'
                            ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)] font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}
                        `}
                      >
                        <FileText size={16} className={`shrink-0 ${activePost?.id === post.id && mode === 'doc' ? 'text-[var(--primary-indigo)]' : 'text-slate-400'}`} />
                        <span className="text-sm truncate flex-1">
                          {post.title}
                        </span>
                        <button
                          onClick={(e) => handleDeleteClick(post, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 rounded transition-all"
                          aria-label="删除笔记"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-slate-400 italic">暂无笔记</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 6. Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 relative" ref={userMenuRef}>
          {showUserMenu && !isCollapsed && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in slide-in-from-bottom-2 duration-200 backdrop-blur-md">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">我的工作空间</p>
                <p className="text-[11px] text-slate-500 truncate">user@example.com</p>
              </div>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-2.5 transition-colors">
                <Settings size={14} /> <span className="font-medium">设置</span>
              </button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-2.5 transition-colors">
                <HelpCircle size={14} /> <span className="font-medium">帮助与反馈</span>
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <button 
                onClick={() => router.push('/login')}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
              >
                <LogOut size={14} /> <span className="font-medium">退出登录</span>
              </button>
            </div>
          )}

          <div 
            onClick={() => !isCollapsed && setShowUserMenu(!showUserMenu)}
            className={`
              flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer
              ${isCollapsed ? 'justify-center' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
              ${showUserMenu && !isCollapsed ? 'bg-slate-50 dark:bg-slate-800' : ''}
            `}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900/30 transition-all shadow-sm relative group">
              <Image 
                src="/images/116590818.jpg" 
                alt="Avatar" 
                width={64} 
                height={64} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 image-high-quality"
                priority
              />
            </div>
            
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">我的工作空间</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDarkModeToggle(); }}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--primary-indigo)] transition-all hover:rotate-12 active:scale-90 shadow-sm border border-slate-100 dark:border-slate-800"
                  aria-label={darkMode ? "切换为亮色模式" : "切换为深色模式"}
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={postToDelete?.title || ''}
      />
    </>
  );
}
