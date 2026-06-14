"use client";

import React, { useState, useEffect, startTransition } from 'react';
import { 
  Code,
  Heart,
  Briefcase,
  BookOpen,
  Lightbulb,
  FolderHeart
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MainContentWithToc from '@/components/MainContentWithToc';
import { useSidebar } from '@/context/SidebarContext';
import { 
  getAllKnowledge, 
  getCategories, 
  searchKnowledge,
  Category
} from '@/lib/api-client';

interface Post {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  toc: any[]; // We let MainContent handle specific types
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
  const { isMobile, setIsDrawerOpen } = useSidebar();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [initialPosts, setInitialPosts] = useState<Post[]>([]);
  const [lastActivePost, setLastActivePost] = useState<Post | null>(null);
  const [mode, setMode] = useState<'doc' | 'universe'>('universe');

  const POSTS_CACHE_KEY = 'learnhub_cache_posts_v1';
  const CATS_CACHE_KEY = 'learnhub_cache_categories_v1';

  const handleInternalLinkOpen = (id: string) => {
    const target = posts.find(p => String(p.id) === String(id));
    if (target) {
      setLastActivePost(activePost);
      setActivePost(target);
      setMode('doc'); // Explicitly switch to doc mode when a link is clicked
    }
  };

  useEffect(() => {
    try {
      const cachedPostsRaw = typeof window !== 'undefined' ? localStorage.getItem(POSTS_CACHE_KEY) : null;
      const cachedCatsRaw = typeof window !== 'undefined' ? localStorage.getItem(CATS_CACHE_KEY) : null;
      if (cachedPostsRaw) {
        const cachedPosts = JSON.parse(cachedPostsRaw);
        setPosts(cachedPosts);
        // Keep activePost null at start to stay on Chat mode purely
      }
      if (cachedCatsRaw) {
        const cachedCats = JSON.parse(cachedCatsRaw);
        setCategories(cachedCats);
      }
    } catch {}

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [cats, knowledgeItems] = await Promise.all([
          getCategories(),
          getAllKnowledge(1, 100)
        ]);
        setCategories(cats);
        setPosts(knowledgeItems);
        setInitialPosts(knowledgeItems);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(knowledgeItems));
            localStorage.setItem(CATS_CACHE_KEY, JSON.stringify(cats));
          } catch {}
        }
      } catch (err) {
        setError('加载数据失败，请重试');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.trim().length >= 2) {
        try {
          const searchResults = await searchKnowledge(debouncedQuery);
          setPosts(searchResults);
        } catch (err) {
          console.error('Search failed:', err);
        }
      } else {
        if (initialPosts.length) {
          setPosts(initialPosts);
        } else {
          const knowledgeItems = await getAllKnowledge(1, 100);
          setPosts(knowledgeItems);
          setInitialPosts(knowledgeItems);
        }
      }
    };
    performSearch();
  }, [debouncedQuery, initialPosts]);

  const handlePostClick = (post: Post) => {
    startTransition(() => {
      setActivePost(post);
      setMode('doc');
      if (isMobile) setIsDrawerOpen(false);
    });
  };

  const handlePostsUpdate = () => {
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
    <div className={`${darkMode ? 'dark' : ''} flex h-screen bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] font-sans overflow-hidden transition-theme`}>
      <Sidebar
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
        getCategoryIcon={getCategoryIcon}
        onPostsUpdate={handlePostsUpdate}
        mode={mode}
        onModeChange={setMode}
      />

      {/* --- 主内容区域 (Integrates Content, TOC, PromptUniverse) --- */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <MainContentWithToc
          darkMode={darkMode}
          activePost={activePost}
          posts={posts}
          onInternalLinkOpen={handleInternalLinkOpen}
          lastActivePost={lastActivePost}
          onReturnToLastPost={() => {
            if (lastActivePost) {
              setActivePost(lastActivePost);
              setLastActivePost(null);
              setMode('doc');
            }
          }}
          mode={mode}
          onModeChange={setMode}
        />
      </main>
    </div>
  );
}

export default PersonalKnowledgeBase;
