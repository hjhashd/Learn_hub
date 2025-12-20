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
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [initialPosts, setInitialPosts] = useState<Post[]>([]);
  const [lastActivePost, setLastActivePost] = useState<Post | null>(null);

  const POSTS_CACHE_KEY = 'learnhub_cache_posts_v1';
  const CATS_CACHE_KEY = 'learnhub_cache_categories_v1';

  const handleInternalLinkOpen = (id: string) => {
    const target = posts.find(p => String(p.id) === String(id));
    if (target) {
      setLastActivePost(activePost);
      setActivePost(target);
    }
  };

  useEffect(() => {
    try {
      const cachedPostsRaw = typeof window !== 'undefined' ? localStorage.getItem(POSTS_CACHE_KEY) : null;
      const cachedCatsRaw = typeof window !== 'undefined' ? localStorage.getItem(CATS_CACHE_KEY) : null;
      if (cachedPostsRaw) {
        const cachedPosts = JSON.parse(cachedPostsRaw);
        setPosts(cachedPosts);
        if (cachedPosts.length > 0 && !activePost) setActivePost(cachedPosts[0]);
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
      if (isMobile) setIsSidebarOpen(false);
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
    <div className={`${darkMode ? 'dark' : ''} flex h-screen bg-white dark:bg-[#1E1F20] text-[#1f1f1f] dark:text-[#e3e3e3] font-sans overflow-hidden transition-colors duration-300`}>
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

      {/* --- 主内容区域 (Integrates Content, TOC, Mascot, PromptUniverse) --- */}
      <MainContentWithToc
        darkMode={darkMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activePost={activePost}
        posts={posts}
        onInternalLinkOpen={handleInternalLinkOpen}
        lastActivePost={lastActivePost}
        onReturnToLastPost={() => {
          if (lastActivePost) {
            setActivePost(lastActivePost);
            setLastActivePost(null);
          }
        }}
      />
    </div>
  );
}

export default PersonalKnowledgeBase;
