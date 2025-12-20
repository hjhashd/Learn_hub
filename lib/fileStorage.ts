import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { KnowledgeItem, Category, PromptItem } from '@/types/knowledge';

const DATA_DIR = process.env.DATA_PATH || path.join(process.cwd(), 'data');
export const SUB_DIRS = {
  KNOWLEDGE: 'knowledge',
  DOCS: 'docs',
  IMAGES: 'images',
  PROMPTS: 'prompts'
};

const KNOWLEDGE_DIR = path.join(DATA_DIR, SUB_DIRS.KNOWLEDGE);
const DOCS_DIR = path.join(DATA_DIR, SUB_DIRS.DOCS);
const IMAGES_DIR = path.join(DATA_DIR, SUB_DIRS.IMAGES);
const PROMPTS_DIR = path.join(DATA_DIR, SUB_DIRS.PROMPTS);
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

/**
 * 初始化数据目录结构
 */
export function initializeDataDirectory(): void {
  // 创建必要的目录
  [DATA_DIR, KNOWLEDGE_DIR, DOCS_DIR, IMAGES_DIR, PROMPTS_DIR, ATTACHMENTS_DIR].forEach(dir => {
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
      prompts: [],
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
 * 生成提示词文件名
 */
function generatePromptFilename(item: PromptItem): string {
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
 * 提示词转 Markdown
 */
function promptToMarkdown(item: PromptItem): string {
  const frontmatter = {
    id: item.id,
    title: item.title,
    category: item.category,
    tags: item.tags,
    favorite: !!item.favorite,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };

  const frontmatterStr = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}`)
    .join('\n');

  return `---\n${frontmatterStr}\n---\n\n${item.content}`;
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
    id: String(data.id || (filename ? path.basename(filename, '.md') : Date.now().toString())),
    title: data.title || (filename ? path.basename(filename, '.md') : 'Untitled'),
    content: cleanedContent,
    category: data.category || 'uncategorized',
    tags: data.tags || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

/**
 * 从 Markdown 解析提示词
 */
function markdownToPrompt(content: string, filename?: string): PromptItem {
  const { data, content: markdownContent } = matter(content);
  const cleanedContent = markdownContent.trim();
  return {
    id: String(data.id || (filename ? path.basename(filename, '.md') : Date.now().toString())),
    title: data.title || (filename ? path.basename(filename, '.md') : 'Untitled Prompt'),
    content: cleanedContent,
    category: data.category || 'general',
    tags: data.tags || [],
    favorite: !!data.favorite,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    filePath: undefined
  };
}

/**
 * 更新索引文件
 */
function updateIndex(): void {
  const { items: knowledgeItems } = getAllKnowledgeFromFiles(1, 100000); // Get all for index
  const { items: promptItems } = getAllPromptsFromFiles(1, 100000);
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
      filePath: item.filePath || generateKnowledgeFilename(item)
    })),
    prompts: promptItems.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      tags: item.tags,
      favorite: !!item.favorite,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      filePath: item.filePath || generatePromptFilename(item)
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
export function getAllKnowledgeFromFiles(page: number = 1, limit: number = 1000): { items: KnowledgeItem[], total: number } {
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
          item.filePath = filePath;
          items.push(item);
        } catch (error) {
          console.error(`Error reading file ${filePath}:`, error);
        }
      }
    });
  }
  
  scanDirectory(KNOWLEDGE_DIR);
  scanDirectory(DOCS_DIR);
  scanDirectory(IMAGES_DIR);
  
  // Sort by date desc
  const sortedItems = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    total: sortedItems.length
  };
}

/**
 * 获取所有提示词（从文件）
 */
export function getAllPromptsFromFiles(page: number = 1, limit: number = 1000): { items: PromptItem[], total: number } {
  initializeDataDirectory();

  const items: PromptItem[] = [];

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
          const item = markdownToPrompt(content, file);
          (item as any).filePath = filePath;
          items.push(item);
        } catch (error) {
          console.error(`Error reading prompt file ${filePath}:`, error);
        }
      }
    });
  }

  scanDirectory(PROMPTS_DIR);

  const sortedItems = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  return { items: paginatedItems, total: sortedItems.length };
}

/**
 * 保存知识条目到文件
 */
export function saveKnowledgeToFile(item: KnowledgeItem, directory: string = 'knowledge'): void {
  initializeDataDirectory();
  
  // Ensure ID exists
  const knowledgeItem: KnowledgeItem = {
    ...item,
    id: item.id || Date.now().toString()
  };
  
  const filename = generateKnowledgeFilename(knowledgeItem);
  let targetDir;
  
  switch (directory) {
    case 'docs':
      targetDir = DOCS_DIR;
      break;
    case 'images':
      targetDir = IMAGES_DIR;
      break;
    case 'knowledge':
    default:
      targetDir = KNOWLEDGE_DIR;
      break;
  }
  
  const filePath = path.join(targetDir, filename);
  
  // 确保目录存在
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const markdownContent = knowledgeToMarkdown(knowledgeItem);
  fs.writeFileSync(filePath, markdownContent, 'utf-8');
  
  // 更新索引
  updateIndex();
}

/**
 * 保存提示词到文件（创建或更新）
 */
export function savePromptToFile(item: PromptItem): PromptItem {
  initializeDataDirectory();

  const promptItem: PromptItem = {
    ...item,
    id: item.id || Date.now().toString(),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const filename = generatePromptFilename(promptItem);
  const filePath = path.join(PROMPTS_DIR, filename);

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const markdownContent = promptToMarkdown(promptItem);
  fs.writeFileSync(filePath, markdownContent, 'utf-8');

  updateIndex();
  return promptItem;
}

/**
 * 根据ID获取知识条目
 */
export function getKnowledgeByIdFromFiles(id: string): KnowledgeItem | null {
  const { items } = getAllKnowledgeFromFiles(1, 100000);
  return items.find(item => item.id === id) || null;
}

/**
 * 根据ID获取提示词
 */
export function getPromptByIdFromFiles(id: string): PromptItem | null {
  const { items } = getAllPromptsFromFiles(1, 100000);
  return items.find(item => String(item.id) === String(id)) || null;
}

/**
 * 删除知识条目
 */
export function deleteKnowledgeFile(id: string): void {
  const { items } = getAllKnowledgeFromFiles(1, 100000);
  const item = items.find(i => i.id === id);
  
  if (item) {
    const filename = generateKnowledgeFilename(item);
    
    // Check all directories
    [KNOWLEDGE_DIR, DOCS_DIR, IMAGES_DIR].forEach(dir => {
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    updateIndex();
  }
}

/**
 * 删除提示词（返回结果格式）
 */
export async function deletePromptFromFiles(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { items } = getAllPromptsFromFiles(1, 100000);
    const item = items.find(i => String(i.id) === String(id));
    if (!item) return { success: false, error: 'Prompt not found' };

    const filename = generatePromptFilename(item);
    let deleted = false;
    const filePath = path.join(PROMPTS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted = true;
    }

    if (deleted) {
      updateIndex();
      return { success: true };
    } else {
      return { success: false, error: 'File not found' };
    }
  } catch (error) {
    console.error('Failed to delete prompt:', error);
    return { success: false, error: 'Failed to delete prompt' };
  }
}

/**
 * 删除知识条目（返回结果格式）
 */
export async function deleteKnowledgeFromFiles(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { items } = getAllKnowledgeFromFiles(1, 100000);
    // 使用 String() 确保 ID 类型一致
    const item = items.find(i => String(i.id) === String(id));
    
    if (!item) {
      return { success: false, error: 'Knowledge item not found' };
    }
    
    let deleted = false;

    if (item.filePath && fs.existsSync(item.filePath)) {
      fs.unlinkSync(item.filePath);
      deleted = true;
    } else {
      const filename = generateKnowledgeFilename(item);
      
      // Check all directories
      [KNOWLEDGE_DIR, DOCS_DIR, IMAGES_DIR].forEach(dir => {
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deleted = true;
        }
      });
    }
    
    if (deleted) {
      updateIndex();
      return { success: true };
    } else {
      return { success: false, error: 'File not found' };
    }
  } catch (error) {
    console.error('Failed to delete knowledge:', error);
    return { success: false, error: 'Failed to delete knowledge item' };
  }
}

/**
 * 获取分类统计
 */
export function getCategoriesFromFiles(): Category[] {
  const { items } = getAllKnowledgeFromFiles(1, 100000);
  const categoryMap = new Map<string, number>();
  
  items.forEach(item => {
    const count = categoryMap.get(item.category) || 0;
    categoryMap.set(item.category, count + 1);
  });
  
  // 预定义的分类配置
  const predefinedCategories = [
    { id: 'tech', name: '技术', icon: 'Code', color: '#3B82F6' },
    { id: 'life', name: '生活', icon: 'Heart', color: '#EF4444' },
    { id: 'work', name: '工作', icon: 'Briefcase', color: '#10B981' },
    { id: 'study', name: '学习', icon: 'BookOpen', color: '#F59E0B' },
    { id: 'thinking', name: '思考', icon: 'Lightbulb', color: '#8B5CF6' }
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
  const { items } = getAllKnowledgeFromFiles(1, 100000);
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
 * 搜索提示词
 */
export function searchPrompts(query: string): PromptItem[] {
  const { items } = getAllPromptsFromFiles(1, 100000);
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
