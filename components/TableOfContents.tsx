// File: components/TableOfContents.tsx
"use client";

import React from 'react';
import { List, PanelRightClose } from 'lucide-react';
import { HeadingItem } from '@/lib/utils';

interface TableOfContentsProps {
  tocItems: HeadingItem[];
  activeHeadingId: string | null;
  showToc: boolean;
  onToggleToc: () => void;
  onHeadingClick: (id: string) => void;
  darkMode?: boolean;
}

export default function TableOfContents({
  tocItems,
  activeHeadingId,
  showToc,
  onToggleToc,
  onHeadingClick,
  darkMode = false
}: TableOfContentsProps) {
  if (tocItems.length === 0) return null;

  return (
    <aside 
      className={`
        hidden xl:flex flex-col shrink-0 border-l border-slate-100 dark:border-white/5 bg-white/50 dark:bg-[#131314] backdrop-blur-sm
        transition-[width,opacity] duration-300 ease-in-out
        ${showToc ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 overflow-hidden'}
      `}
    >
      <div className="sticky top-0 w-full h-full flex flex-col p-6">
        {/* TOC Header with Toggle Button */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <List size={14} />
            目录
          </span>
          
          {/* 右上角手动折叠按钮 */}
          <button 
            onClick={onToggleToc}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            title="隐藏目录"
          >
            <PanelRightClose size={16} />
          </button>
        </div>

        {/* TOC List */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
          {tocItems.map(item => {
            const isActive = activeHeadingId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onHeadingClick(item.id)}
                className={`
                  group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200
                  ${item.level === 3 ? 'ml-4' : ''}
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 font-medium' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                <span className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${isActive ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400'}`} />
                <span className="flex-1 leading-snug">{item.text}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}