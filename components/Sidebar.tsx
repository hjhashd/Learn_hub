// File: components/Sidebar.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Plus, Search, LayoutGrid, ChevronRight, Menu, Moon, Sun, Github, Settings, LogOut, HelpCircle, User, Trash2, PanelLeftClose } from 'lucide-react';
import { Post, Category } from '../types/knowledge';
import { useRouter } from 'next/navigation';
import { deleteKnowledge } from '@/lib/api-client';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface CategoryItemProps {
  icon: React.ElementType;
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function CategoryItem({ icon: Icon, label, count, isActive, onClick }: CategoryItemProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200
        ${isActive 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/40 dark:to-indigo-900/20 text-blue-700 dark:text-blue-100 shadow-sm border border-blue-200/60 dark:border-blue-700/50' 
          : 'hover:bg-gray-100/60 dark:hover:bg-[#2d2e30] text-gray-600 dark:text-gray-400 border border-transparent'}
      `}
    >
      <Icon size={18} strokeWidth={2} />
      <span className="text-sm font-medium flex-1">{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/50 dark:bg-black/20' : 'bg-gray-200/70 dark:bg-gray-700/50'}`}>
        {count}
      </span>
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
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
  isMobile: boolean;
  getCategoryIcon: (iconName: string) => React.ElementType;
  onPostsUpdate?: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
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
  isMobile,
  getCategoryIcon,
  onPostsUpdate,
}: SidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredPosts = useMemo(() => {
    const matchesCategory = (post: Post) => activeCategory === 'all' || post.category === activeCategory;
    return posts.filter(matchesCategory);
  }, [posts, activeCategory]);

  return (
    <>
      {/* 遮罩层 (Mobile) */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* --- 左侧侧边栏 (Google Material Style) --- */}
      <aside 
        className={`
          fixed lg:relative z-30 h-full flex flex-col transition-all duration-300 ease-[cubic-bezier(0.2,0.0,0,1.0)]
          bg-[#F3F6FC] dark:bg-[#1E1F20] 
          ${isOpen ? 'w-[300px] translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:-translate-x-0'}
          overflow-hidden
        `}
      >
        <div className="w-[300px] h-full flex flex-col shrink-0">
          
          {/* 1. 顶部 Logo 区 */}
          <div className="h-16 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3 select-none">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-transform duration-300">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl text-[#1f1f1f] dark:text-[#e3e3e3] tracking-tight font-serif">思维花园</span>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={onToggle}
              className="lg:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#2d2e30] text-gray-500 transition-colors"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>

        
          {/* 2. Google 风格的大号操作按钮 (Extended FAB style) */}
          <div className="px-4 mb-4">
             <button 
                onClick={() => router.push('/edit')}
                className="flex items-center gap-3 w-full bg-[#C2E7FF] dark:bg-[#004A77] hover:bg-[#b3d7ef] dark:hover:bg-[#005c94] text-[#001D35] dark:text-[#C2E7FF] px-4 py-3.5 rounded-2xl transition-colors duration-200 shadow-sm"
             >
                <Plus size={20} />
                <span className="font-medium text-sm">新建笔记</span>
             </button>
          </div>

          {/* 3. 搜索框 (Pill Shape) */}
          <div className="px-4 mb-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white dark:bg-[#2d2e30] border-none rounded-full pl-11 pr-4 py-3 text-sm transition-all outline-none placeholder:text-gray-500 text-gray-800 dark:text-gray-200 shadow-sm focus:shadow-md"
              />
            </div>
          </div>

          {/* 4. 导航列表 (Material Lists) */}
          <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar space-y-6">
            
            {/* 分类 Folder */}
            <div>
              <div className="space-y-1">
                <CategoryItem 
                  icon={LayoutGrid} 
                  label="全部笔记" 
                  count={posts.length} 
                  isActive={activeCategory === 'all'} 
                  onClick={() => onCategoryChange('all')} 
                />
                {categories.map(cat => {
                  const IconComponent = getCategoryIcon(cat.icon);
                  return (
                    <CategoryItem 
                      key={cat.id} 
                      icon={IconComponent} 
                      label={cat.name} 
                      count={cat.count} 
                      isActive={activeCategory === cat.id} 
                      onClick={() => onCategoryChange(cat.id)} 
                    />
                  );
                })}
              </div>
            </div>

            {/* 最近文件列表 */}
            <div>
              <div className="px-4 mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {activeCategory === 'all' ? 'Recent' : 'In Folder'}
                </h3>
              </div>
              <div className="space-y-1">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map(post => (
                    <div 
                      key={post.id}
                      onClick={() => onPostClick(post)}
                      className={`
                        group px-4 py-2 rounded-xl cursor-pointer transition-colors duration-200 flex flex-col gap-0.5 relative
                        ${activePost && activePost.id === post.id 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/40 dark:to-indigo-900/20 text-blue-700 dark:text-blue-100 shadow-sm border border-blue-200/60 dark:border-blue-700/50' 
                          : 'hover:bg-gray-100/60 dark:hover:bg-[#2d2e30] text-gray-600 dark:text-gray-400 border border-transparent'}
                      `}
                    >
                      <div className="flex items-center justify-between w-full">
                         <span className={`text-sm font-medium truncate flex-1 ${activePost && activePost.id === post.id ? 'font-semibold' : ''}`}>
                            {post.title}
                         </span>
                         <button
                           onClick={(e) => handleDeleteClick(post, e)}
                           className={`
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2
                             p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30
                             text-gray-400 hover:text-red-600 dark:hover:text-red-400
                             ${activePost && activePost.id === post.id ? 'opacity-100' : ''}
                           `}
                           title="删除笔记"
                         >
                           <Trash2 size={14} />
                         </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] opacity-70">
                         <span>{post.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    未找到笔记
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Footer (Material Card style) */}
          <div className="p-4 mt-auto relative" ref={userMenuRef}>
             {/* Popup Menu */}
             {showUserMenu && (
               <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#2d2e30] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                 <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">我的工作空间</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">user@example.com</p>
                 </div>
                 
                 <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors">
                   <Settings size={16} /> 
                   <span>设置</span>
                 </button>
                 <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors">
                   <HelpCircle size={16} /> 
                   <span>帮助与反馈</span>
                 </button>
                 <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                 <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors">
                   <LogOut size={16} /> 
                   <span>退出登录</span>
                 </button>
               </div>
             )}

             <div 
               onClick={() => setShowUserMenu(!showUserMenu)}
               className={`flex items-center gap-3 p-2 rounded-full transition-colors cursor-pointer ${showUserMenu ? 'bg-white dark:bg-[#2d2e30] shadow-sm' : 'hover:bg-white/60 dark:hover:bg-[#2d2e30]'}`}
             >
                {/* Avatar with Local Image */}
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-white dark:border-gray-600 shadow-md ring-1 ring-gray-100 dark:ring-gray-800">
                   <img 
                     src="/images/116590818.jpg" 
                     alt="User Avatar" 
                     className="w-full h-full object-cover"
                   />
                </div>
                
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">我的工作空间</p>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onDarkModeToggle(); }}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
             </div>
          </div>
        </div>
      </aside>
      
      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={postToDelete?.title || ''}
      />
    </>
  );
}
