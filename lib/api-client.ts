import { KnowledgeItem, Category } from '@/types/knowledge';

const API_BASE = '/api';

// 获取所有知识条目
export async function getAllKnowledge(): Promise<KnowledgeItem[]> {
  const response = await fetch(`${API_BASE}/knowledge`);
  if (!response.ok) throw new Error('Failed to fetch knowledge');
  const data = await response.json();
  return data.knowledge.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: item.category || 'uncategorized',
    tags: item.tags || [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    readTime: item.readTime || '5 min',
    toc: item.toc || []
  }));
}

// 搜索知识条目
export async function searchKnowledge(query: string): Promise<KnowledgeItem[]> {
  const response = await fetch(`${API_BASE}/knowledge?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search knowledge');
  const data = await response.json();
  return data.knowledge.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: item.category || 'uncategorized',
    tags: item.tags || [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    readTime: item.readTime || '5 min',
    toc: item.toc || []
  }));
}

// 获取分类统计
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/knowledge/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  const data = await response.json();
  return data.categories.map((cat: any) => ({
    id: cat.name.toLowerCase().replace(/\s+/g, '-'),
    name: cat.name,
    count: cat.count
  }));
}

// 创建知识条目
export async function createKnowledge(item: Omit<KnowledgeItem, 'id' | 'date' | 'readTime'>): Promise<KnowledgeItem> {
  const response = await fetch(`${API_BASE}/knowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error('Failed to create knowledge');
  const data = await response.json();
  return data.knowledge;
}