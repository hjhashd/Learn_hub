/**
 * 知识条目数据类型定义
 */
export interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  filePath?: string
}

/**
 * 分类数据类型定义
 */
export interface Category {
  id: string
  name: string
  count: number
  icon: string
  color: string
}

/**
 * 标签数据类型定义
 */
export interface Tag {
  name: string
  count: number
}

/**
 * 搜索过滤条件
 */
export interface SearchFilter {
  query: string
  category?: string
  tags?: string[]
}