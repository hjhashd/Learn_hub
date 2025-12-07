import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { KnowledgeItem, Category } from '@/types/knowledge';

const DATA_DIR = process.env.DATA_PATH || path.join(process.cwd(), 'data');
const KNOWLEDGE_DIR = path.join(DATA_DIR, 'knowledge');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

/**
 * 初始化数据目录结构
 */
export function initializeDataDirectory(): void {
  // 创建必要的目录
  [DATA_DIR, KNOWLEDGE_DIR, ATTACHMENTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 创建图片、文档等子目录
  ['images', 'docs', 'others'].forEach(subdir => {
    const dir = path.join(ATTACHMENTS_DIR, subdir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 初始化索引文件
  if (!fs.existsSync(INDEX_FILE)) {
    const initialIndex = {
      knowledge: [],
      categories: {},
      tags: {},
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(INDEX_FILE, JSON.stringify(initialIndex, null, 2));
  }
}

/**
 * 生成知识条目文件名
 */
function generateKnowledgeFilename(item: KnowledgeItem): string {
  const date = new Date(item.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const safeTitle = item.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-');
  return `${year}/${month}/${item.id}-${safeTitle}.md`;
}

/**
 * 将知识条目转换为Markdown格式
 */
function knowledgeToMarkdown(item: KnowledgeItem): string {
  const frontmatter = {
    id: item.id,
    title: item.title,
    category: item.category,
    tags: item.tags,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };

  const frontmatterStr = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}`)
    .join('\n');

  return `---
${frontmatterStr}
---

${item.content}`;
}

/**
 * 从Markdown解析知识条目
 */
function markdownToKnowledge(content: string, filename?: string): KnowledgeItem {
  const { data, content: markdownContent } = matter(content);
  
  // 移除内容中的一级标题（如果存在），避免重复显示
  let cleanedContent = markdownContent.trim();
  // 使用正则表达式匹配以#开头的一级标题行，并移除它
  cleanedContent = cleanedContent.replace(/^#\s+.*\n\s*/, '');
  
  return {
    id: data.id || (filename ? path.basename(filename, '.md') : Date.now().toString()),
    title: data.title || (filename ? path.basename(filename, '.md') : 'Untitled'),
    content: cleanedContent,
    category: data.category || 'uncategorized',
    tags: data.tags || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * 更新索引文件
 */
function updateIndex(): void {
  const knowledgeItems = getAllKnowledgeFromFiles();
  const categories: Record<string, number> = {};
  const tags: Record<string, number> = {};

  knowledgeItems.forEach(item => {
    // 统计分类
    categories[item.category] = (categories[item.category] || 0) + 1;
    
    // 统计标签
    item.tags.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
  });

  const index = {
    knowledge: knowledgeItems.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      tags: item.tags,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      filePath: generateKnowledgeFilename(item)
    })),
    categories,
    tags,
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

/**
 * 获取所有知识条目（从文件）
 */
export function getAllKnowledgeFromFiles(): KnowledgeItem[] {
  initializeDataDirectory();
  
  const items: KnowledgeItem[] = [];
  
  function scanDirectory(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.md')) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const item = markdownToKnowledge(content, file);
          items.push(item);
        } catch (error) {
          console.error(`Error reading file ${filePath}:`, error);
        }
      }
    });
  }
  
  scanDirectory(KNOWLEDGE_DIR);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 保存知识条目到文件
 */
export function saveKnowledgeToFile(item: KnowledgeItem): void {
  initializeDataDirectory();
  
  const filename = generateKnowledgeFilename(item);
  const filePath = path.join(KNOWLEDGE_DIR, filename);
  
  // 确保目录存在
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const markdownContent = knowledgeToMarkdown(item);
  fs.writeFileSync(filePath, markdownContent, 'utf-8');
  
  // 更新索引
  updateIndex();
}

/**
 * 根据ID获取知识条目
 */
export function getKnowledgeByIdFromFiles(id: string): KnowledgeItem | null {
  const items = getAllKnowledgeFromFiles();
  return items.find(item => item.id === id) || null;
}

/**
 * 删除知识条目
 */
export function deleteKnowledgeFile(id: string): void {
  const items = getAllKnowledgeFromFiles();
  const item = items.find(i => i.id === id);
  
  if (item) {
    const filename = generateKnowledgeFilename(item);
    const filePath = path.join(KNOWLEDGE_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      updateIndex();
    }
  }
}

/**
 * 获取分类统计
 */
export function getCategoriesFromFiles(): Category[] {
  const items = getAllKnowledgeFromFiles();
  const categoryMap = new Map<string, number>();
  
  items.forEach(item => {
    const count = categoryMap.get(item.category) || 0;
    categoryMap.set(item.category, count + 1);
  });
  
  // 预定义的分类配置
  const predefinedCategories = [
    { id: 'tech', name: 'tech', icon: 'Code', color: '#3B82F6' },
    { id: 'life', name: 'life', icon: 'Heart', color: '#EF4444' },
    { id: 'work', name: 'work', icon: 'Briefcase', color: '#10B981' },
    { id: 'study', name: 'study', icon: 'BookOpen', color: '#F59E0B' },
    { id: 'thinking', name: 'thinking', icon: 'Lightbulb', color: '#8B5CF6' }
  ];
  
  // 返回包含图标和颜色的完整分类信息
  return predefinedCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    count: categoryMap.get(cat.name) || 0,
    icon: cat.icon,
    color: cat.color
  }));
}

/**
 * 搜索知识条目
 */
export function searchKnowledge(query: string): KnowledgeItem[] {
  const items = getAllKnowledgeFromFiles();
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => {
    return (
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * 文件上传处理
 */
export function handleFileUpload(file: Buffer, filename: string, type: 'image' | 'doc' | 'other'): string {
  initializeDataDirectory();
  
  const ext = path.extname(filename);
  const timestamp = Date.now();
  const safeFilename = `${timestamp}-${filename}`;
  
  let uploadDir: string;
  switch (type) {
    case 'image':
      uploadDir = path.join(ATTACHMENTS_DIR, 'images');
      break;
    case 'doc':
      uploadDir = path.join(ATTACHMENTS_DIR, 'docs');
      break;
    default:
      uploadDir = path.join(ATTACHMENTS_DIR, 'others');
  }
  
  const filePath = path.join(uploadDir, safeFilename);
  fs.writeFileSync(filePath, file);
  
  return `/attachments/${type}/${safeFilename}`;
}