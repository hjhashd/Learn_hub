'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Plus, Search, LayoutGrid, ChevronRight, Menu, Moon, Sun, Github } from 'lucide-react';
import { Post, Category } from '../types/knowledge';

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
        flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-200
        ${isActive 
          ? 'bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#c2e7ff] shadow-sm' 
          : 'hover:bg-white/60 dark:hover:bg-[#2d2e30] text-gray-700 dark:text-gray-300'}
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
  getCategoryIcon: (icon: string) => React.ElementType;
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
  getCategoryIcon
}: SidebarProps) {
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || post.categoryId === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

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
          <div className="h-16 flex items-center px-6 shrink-0 justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
              <span className="font-medium text-xl text-[#1f1f1f] dark:text-[#e3e3e3] tracking-tight">Mind Garden</span>
            </div>
          </div>

          {/* 2. Google 风格的大号操作按钮 (Extended FAB style) */}
          <div className="px-4 mb-4">
             <button 
                onClick={async () => {
                  /* 创建逻辑示例 */
                  alert("Create logic here");
                }}
                className="flex items-center gap-3 w-full bg-[#C2E7FF] dark:bg-[#004A77] hover:bg-[#b3d7ef] dark:hover:bg-[#005c94] text-[#001D35] dark:text-[#C2E7FF] px-4 py-3.5 rounded-2xl transition-colors duration-200 shadow-sm"
             >
                <Plus size={20} />
                <span className="font-medium text-sm">New Note</span>
             </button>
          </div>

          {/* 3. 搜索框 (Pill Shape) */}
          <div className="px-4 mb-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search" 
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
                  label="All Notes" 
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
                        group px-4 py-3 rounded-full cursor-pointer transition-colors duration-200 flex flex-col gap-1
                        ${activePost && activePost.id === post.id 
                          ? 'bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#c2e7ff]' 
                          : 'hover:bg-gray-200/50 dark:hover:bg-[#2d2e30] text-gray-700 dark:text-gray-300'}
                      `}
                    >
                      <div className="flex items-center justify-between w-full">
                         <span className={`text-sm font-medium truncate w-full ${activePost && activePost.id === post.id ? 'font-semibold' : ''}`}>
                            {post.title}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] opacity-70">
                         <span>{post.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No notes found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Footer (Material Card style) */}
          <div className="p-4 mt-auto">
             <div className="flex items-center gap-3 p-2 rounded-full hover:bg-white/60 dark:hover:bg-[#2d2e30] transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                   M
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">My Workspace</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDarkModeToggle(); }}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}
