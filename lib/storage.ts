import { KnowledgeItem } from '@/types/knowledge'

const STORAGE_KEY = 'learnhub_knowledge'

/**
 * 获取所有知识条目
 */
export function getAllKnowledge(): KnowledgeItem[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

/**
 * 保存知识条目
 */
export function saveKnowledge(item: KnowledgeItem): void {
  if (typeof window === 'undefined') return
  
  const items = getAllKnowledge()
  const existingIndex = items.findIndex(i => i.id === item.id)
  
  if (existingIndex >= 0) {
    items[existingIndex] = item
  } else {
    items.push(item)
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

/**
 * 删除知识条目
 */
export function deleteKnowledge(id: string): void {
  if (typeof window === 'undefined') return
  
  const items = getAllKnowledge()
  const filtered = items.filter(item => item.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

/**
 * 根据 ID 获取知识条目
 */
export function getKnowledgeById(id: string): KnowledgeItem | null {
  const items = getAllKnowledge()
  return items.find(item => item.id === id) || null
}

/**
 * 获取分类统计
 */
export function getCategories(): { name: string; count: number }[] {
  const items = getAllKnowledge()
  const categoryMap = new Map<string, number>()
  
  items.forEach(item => {
    const count = categoryMap.get(item.category) || 0
    categoryMap.set(item.category, count + 1)
  })
  
  return Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count
  }))
}

/**
 * 获取标签统计
 */
export function getTags(): { name: string; count: number }[] {
  const items = getAllKnowledge()
  const tagMap = new Map<string, number>()
  
  items.forEach(item => {
    item.tags.forEach(tag => {
      const count = tagMap.get(tag) || 0
      tagMap.set(tag, count + 1)
    })
  })
  
  return Array.from(tagMap.entries()).map(([name, count]) => ({
    name,
    count
  }))
}