import { KnowledgeItem, Category, PromptItem } from '@/types/knowledge';

const API_BASE = '/api';

// 获取所有知识条目
export async function getAllKnowledge(page: number = 1, limit: number = 100): Promise<KnowledgeItem[]> {
  const response = await fetch(`${API_BASE}/knowledge?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch knowledge');
  const data = await response.json();
  // Support both old and new response structure
  const items = data.knowledge || data; 
  return items.map((item: any) => ({
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
export async function createKnowledge(item: Omit<KnowledgeItem, 'id' | 'date' | 'readTime'> & { directory?: string }): Promise<KnowledgeItem> {
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

// 根据ID获取知识条目
export async function getKnowledgeById(id: string): Promise<KnowledgeItem> {
  const response = await fetch(`${API_BASE}/knowledge?id=${id}`);
  if (!response.ok) throw new Error('Failed to fetch knowledge item');
  const data = await response.json();
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    category: data.category || 'uncategorized',
    tags: data.tags || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    readTime: data.readTime || '5 min',
    toc: data.toc || []
  };
}

// 删除知识条目
export async function deleteKnowledge(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/knowledge?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete knowledge');
}

// 获取所有提示词
export async function getAllPrompts(page: number = 1, limit: number = 100): Promise<PromptItem[]> {
  const response = await fetch(`${API_BASE}/prompts?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch prompts');
  const data = await response.json();
  const items = data.prompts || data;
  return items.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: item.category || 'general',
    tags: item.tags || [],
    favorite: !!item.favorite,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    filePath: item.filePath
  }));
}

// 搜索提示词
export async function searchPromptsApi(query: string): Promise<PromptItem[]> {
  const response = await fetch(`${API_BASE}/prompts?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search prompts');
  const data = await response.json();
  const items = data.prompts || [];
  return items.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: item.category || 'general',
    tags: item.tags || [],
    favorite: !!item.favorite,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    filePath: item.filePath
  }));
}

// 创建/更新提示词
export async function savePrompt(item: Partial<PromptItem> & { id?: string }): Promise<PromptItem> {
  const response = await fetch(`${API_BASE}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!response.ok) throw new Error('Failed to save prompt');
  const data = await response.json();
  return data.prompt as PromptItem;
}

// 根据ID获取提示词
export async function getPromptById(id: string): Promise<PromptItem> {
  const response = await fetch(`${API_BASE}/prompts?id=${id}`);
  if (!response.ok) throw new Error('Failed to fetch prompt');
  return await response.json();
}

// 删除提示词
export async function deletePrompt(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/prompts?id=${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete prompt');
}
