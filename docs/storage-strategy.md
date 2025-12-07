# LearnHub 存储策略详细说明

本文档详细说明 LearnHub 的存储架构、数据交互流程和实现细节，帮助开发者理解整个系统的数据流转机制。

## 📋 目录

- [整体架构](#整体架构)
- [数据模型](#数据模型)
- [文件存储结构](#文件存储结构)
- [API 数据交互](#api-数据交互)
- [前端数据流转](#前端数据流转)
- [存储实现细节](#存储实现细节)
- [性能优化](#性能优化)
- [错误处理](#错误处理)

## 🏗️ 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)  │◄──►│   API 路由      │◄──►│  文件存储系统   │
│                 │    │   (Next.js)     │    │   (Node.js FS)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   状态管理      │    │   数据验证      │    │   索引文件      │
│   (useState)    │    │   (Zod/Yup)     │    │   (JSON)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 数据模型

### KnowledgeItem 类型定义

```typescript
// types/knowledge.ts
export interface KnowledgeItem {
  id: string;              // 唯一标识符
  title: string;           // 文章标题
  content: string;         // Markdown 内容
  category: string;        // 分类名称
  tags: string[];          // 标签数组
  createdAt: string;       // 创建时间 (ISO 8601)
  updatedAt: string;       // 更新时间 (ISO 8601)
  readTime: number;        // 阅读时间（分钟）
  toc: TocItem[];         // 目录结构
}

export interface TocItem {
  id: string;              // 标题 ID
  text: string;            // 标题文本
  level: number;           // 标题级别 (1-6)
  children?: TocItem[];   // 子标题
}
```

### Category 类型定义

```typescript
export interface Category {
  id: string;              // 分类 ID
  name: string;            // 分类名称
  count: number;           // 文章数量
  color: string;           // 分类颜色
}
```

## 📁 文件存储结构

### 目录结构

```
data/
├── knowledge/              # 知识条目存储
│   ├── 2024/              # 按年份分组
│   │   ├── 01/            # 按月份分组
│   │   │   ├── nextjs-development-notes.md
│   │   │   └── typescript-learning.md
│   │   └── 02/
│   │       └── react-hooks-guide.md
│   └── attachments/        # 附件存储
│       ├── images/         # 图片文件
│       ├── documents/      # 文档文件
│       └── others/         # 其他文件
├── index.json             # 知识库索引
└── config.json            # 配置文件
```

### Markdown 文件格式

```markdown
---
id: "20240115-nextjs-dev"
title: "Next.js 开发笔记"
category: "tech"
tags: ["nextjs", "react", "frontend"]
createdAt: "2024-01-15T10:30:00Z"
updatedAt: "2024-01-15T14:20:00Z"
readTime: 8
toc:
  - id: "introduction"
    text: "项目介绍"
    level: 1
  - id: "setup"
    text: "环境搭建"
    level: 2
---

# Next.js 开发笔记

## 项目介绍

这是一个关于 Next.js 开发的学习笔记...

## 环境搭建

### 安装依赖

```bash
npm install next react react-dom
```
```

### 索引文件结构 (index.json)

```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-15T14:20:00Z",
  "totalCount": 3,
  "categories": {
    "tech": {
      "name": "技术",
      "count": 2,
      "color": "#3B82F6"
    },
    "study": {
      "name": "学习",
      "count": 1,
      "color": "#10B981"
    }
  },
  "tags": {
    "nextjs": 2,
    "react": 2,
    "frontend": 1,
    "typescript": 1
  },
  "items": [
    {
      "id": "20240115-nextjs-dev",
      "title": "Next.js 开发笔记",
      "category": "tech",
      "tags": ["nextjs", "react", "frontend"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:20:00Z",
      "readTime": 8,
      "filePath": "knowledge/2024/01/nextjs-development-notes.md"
    }
  ]
}
```

## 🔄 API 数据交互

### 获取所有知识条目 (GET /api/knowledge)

**请求流程：**
```
前端请求 → API 路由 → 文件系统 → 读取索引 → 返回数据
```

**代码实现：**
```typescript
// app/api/knowledge/route.ts
export async function GET() {
  try {
    // 1. 读取索引文件
    const indexData = await fs.readFile('data/index.json', 'utf-8');
    const index = JSON.parse(indexData);
    
    // 2. 读取所有知识条目
    const items: KnowledgeItem[] = [];
    for (const item of index.items) {
      const content = await fs.readFile(item.filePath, 'utf-8');
      const { data, content: markdownContent } = matter(content);
      
      items.push({
        id: data.id,
        title: data.title,
        content: markdownContent,
        category: data.category,
        tags: data.tags,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        readTime: data.readTime,
        toc: data.toc
      });
    }
    
    // 3. 返回数据（确保编码正确）
    return new NextResponse(JSON.stringify({ knowledge: items }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load knowledge' }, { status: 500 });
  }
}
```

**数据交互示例：**
```
前端发送: GET /api/knowledge
后端返回: 
{
  "knowledge": [
    {
      "id": "20240115-nextjs-dev",
      "title": "Next.js 开发笔记",
      "content": "# Next.js 开发笔记\n\n## 项目介绍...",
      "category": "tech",
      "tags": ["nextjs", "react", "frontend"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:20:00Z",
      "readTime": 8,
      "toc": [...]
    }
  ]
}
```

### 获取分类统计 (GET /api/knowledge/categories)

**请求流程：**
```
前端请求 → API 路由 → 读取索引 → 统计分类 → 返回数据
```

**代码实现：**
```typescript
// app/api/knowledge/categories/route.ts
export async function GET() {
  try {
    // 1. 读取索引文件
    const indexData = await fs.readFile('data/index.json', 'utf-8');
    const index = JSON.parse(indexData);
    
    // 2. 构建分类数据
    const categories: Category[] = Object.entries(index.categories).map(([id, data]: [string, any]) => ({
      id,
      name: data.name,
      count: data.count,
      color: data.color
    }));
    
    // 3. 返回数据（确保编码正确）
    return new NextResponse(JSON.stringify({ categories }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}
```

**数据交互示例：**
```
前端发送: GET /api/knowledge/categories
后端返回:
{
  "categories": [
    {
      "id": "tech",
      "name": "技术",
      "count": 2,
      "color": "#3B82F6"
    },
    {
      "id": "study",
      "name": "学习",
      "count": 1,
      "color": "#10B981"
    }
  ]
}
```

## 🎨 前端数据流转

### 主页面数据加载流程

```typescript
// app/page.tsx
export default function Home() {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePost, setActivePost] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. 并行加载知识条目和分类数据
        const [knowledgeRes, categoriesRes] = await Promise.all([
          fetch('/api/knowledge'),
          fetch('/api/knowledge/categories')
        ]);
        
        // 2. 解析响应数据
        const knowledgeData = await knowledgeRes.json();
        const categoriesData = await categoriesRes.json();
        
        // 3. 设置状态
        setKnowledge(knowledgeData.knowledge);
        setCategories(categoriesData.categories);
        
        // 4. 默认选中第一篇文章（如果有）
        if (knowledgeData.knowledge.length > 0) {
          setActivePost(knowledgeData.knowledge[0]);
        }
        
      } catch (err) {
        setError('Failed to load data');
        console.error('Data loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // 渲染逻辑...
}
```

### 文章选择交互

```typescript
// 文章点击处理
const handlePostClick = (post: KnowledgeItem) => {
  setActivePost(post);
};

// 渲染文章列表项
{knowledge.map((post) => (
  <div
    key={post.id}
    onClick={() => handlePostClick(post)}
    className={`cursor-pointer transition-colors ${
      // 安全地检查 activePost 是否存在
      activePost && activePost.id === post.id 
        ? 'bg-gray-100 dark:bg-gray-800' 
        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }`}
  >
    <h4 className="font-medium text-gray-900 dark:text-gray-100">
      {post.title}
    </h4>
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span>{post.category}</span>
      <span>•</span>
      <span>{post.readTime || 5} min</span>
    </div>
  </div>
))}
```

### 文章内容渲染

```typescript
// 安全渲染文章内容
{activePost && (
  <div className="prose prose-gray dark:prose-invert max-w-none">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
      {activePost.title}
    </h1>
    
    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
      <span>{activePost.category}</span>
      <span>•</span>
      <span>{new Date(activePost.createdAt).toLocaleDateString()}</span>
      <span>•</span>
      <span>{activePost.readTime || 5} min read</span>
    </div>
    
    {activePost.tags && activePost.tags.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-6">
        {activePost.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    )}
    
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {activePost.content}
    </ReactMarkdown>
  </div>
)}
```

## 🔧 存储实现细节

### 文件存储工具 (lib/storage.ts)

```typescript
export interface StorageInterface {
  // 知识条目操作
  getAllKnowledge(): Promise<KnowledgeItem[]>;
  getKnowledgeById(id: string): Promise<KnowledgeItem | null>;
  createKnowledge(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeItem>;
  updateKnowledge(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem | null>;
  deleteKnowledge(id: string): Promise<boolean>;
  
  // 分类操作
  getCategories(): Promise<Category[]>;
  getCategoryStats(): Promise<Record<string, number>>;
  
  // 搜索功能
  searchKnowledge(query: string): Promise<KnowledgeItem[]>;
  
  // 工具函数
  ensureDataDirectory(): Promise<void>;
  rebuildIndex(): Promise<void>;
}
```

### 文件命名策略

```typescript
// 生成文件路径
private generateFilePath(title: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `knowledge/${year}/${month}/${slug}.md`;
}

// 生成唯一 ID
private generateId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).slice(2, 8);
  return `${dateStr}-${randomStr}`;
}
```

### 索引更新机制

```typescript
// 更新索引文件
private async updateIndex(item: KnowledgeItem, operation: 'add' | 'update' | 'delete'): Promise<void> {
  const index = await this.loadIndex();
  
  switch (operation) {
    case 'add':
      index.items.push({
        id: item.id,
        title: item.title,
        category: item.category,
        tags: item.tags,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        readTime: item.readTime,
        filePath: item.filePath
      });
      
      // 更新分类统计
      if (!index.categories[item.category]) {
        index.categories[item.category] = {
          name: item.category,
          count: 0,
          color: this.generateCategoryColor(item.category)
        };
      }
      index.categories[item.category].count++;
      
      // 更新标签统计
      item.tags.forEach(tag => {
        index.tags[tag] = (index.tags[tag] || 0) + 1;
      });
      break;
      
    case 'update':
      // 找到并更新现有条目
      const existingIndex = index.items.findIndex(i => i.id === item.id);
      if (existingIndex !== -1) {
        const oldItem = index.items[existingIndex];
        
        // 更新分类统计
        if (oldItem.category !== item.category) {
          index.categories[oldItem.category].count--;
          if (!index.categories[item.category]) {
            index.categories[item.category] = {
              name: item.category,
              count: 0,
              color: this.generateCategoryColor(item.category)
            };
          }
          index.categories[item.category].count++;
        }
        
        // 更新标签统计
        // ... 类似逻辑
        
        index.items[existingIndex] = {
          id: item.id,
          title: item.title,
          category: item.category,
          tags: item.tags,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          readTime: item.readTime,
          filePath: item.filePath
        };
      }
      break;
      
    case 'delete':
      // 删除条目和更新统计
      // ... 类似逻辑
      break;
  }
  
  index.lastUpdated = new Date().toISOString();
  index.totalCount = index.items.length;
  
  await this.saveIndex(index);
}
```

## ⚡ 性能优化

### 1. 索引机制
- **预加载索引**：启动时加载索引到内存
- **增量更新**：只更新变更的部分
- **缓存策略**：API 响应缓存

### 2. 文件操作优化
- **批量读取**：并行读取多个文件
- **流式处理**：大文件使用流式读取
- **异步操作**：非阻塞的文件操作

### 3. 前端优化
- **虚拟滚动**：大量列表项使用虚拟滚动
- **懒加载**：图片和大型内容懒加载
- **防抖搜索**：搜索输入防抖处理

## 🛡️ 错误处理

### API 错误处理

```typescript
try {
  // 文件操作
  const content = await fs.readFile(filePath, 'utf-8');
} catch (error) {
  if (error.code === 'ENOENT') {
    // 文件不存在
    return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
  } else if (error.code === 'EACCES') {
    // 权限错误
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  } else {
    // 其他错误
    console.error('File operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 前端错误处理

```typescript
// 数据加载错误处理
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  loadData().catch(err => {
    setError(err.message);
    console.error('Data loading failed:', err);
    
    // 显示用户友好的错误信息
    toast.error('Failed to load knowledge base. Please try again.');
  });
}, []);

// 渲染错误状态
if (error) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-red-500 mb-2">⚠️ Error loading data</div>
        <div className="text-sm text-gray-500">{error}</div>
        <button 
          onClick={() => loadData()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

## � 数据一致性保证

### 事务性操作

```typescript
// 创建知识条目的事务性操作
async createKnowledge(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeItem> {
  const id = this.generateId();
  const filePath = this.generateFilePath(item.title);
  const now = new Date().toISOString();
  
  const newItem: KnowledgeItem = {
    id,
    ...item,
    createdAt: now,
    updatedAt: now
  };
  
  try {
    // 1. 确保目录存在
    await this.ensureDataDirectory();
    
    // 2. 写入 Markdown 文件
    const frontmatter = matter.stringify(item.content, {
      id,
      title: item.title,
      category: item.category,
      tags: item.tags,
      createdAt: now,
      updatedAt: now,
      readTime: item.readTime,
      toc: item.toc
    });
    
    await fs.writeFile(filePath, frontmatter, 'utf-8');
    
    // 3. 更新索引（如果文件写入失败，索引不会被更新）
    await this.updateIndex(newItem, 'add');
    
    return newItem;
    
  } catch (error) {
    // 如果任何步骤失败，清理已创建的文件
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }
    
    throw new Error(`Failed to create knowledge item: ${error.message}`);
  }
}
```

## 🔍 调试和监控

### 日志记录

```typescript
// 添加详细的日志记录
private logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }
};
```

### 性能监控

```typescript
// 监控文件操作性能
private async measurePerformance<T>(
  operation: string, 
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    this.logger.info(`${operation} completed in ${duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    this.logger.error(`${operation} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}
```

## 🎯 最佳实践

### 1. 数据验证
- 所有输入数据都要验证
- 使用 TypeScript 类型检查
- 运行时数据验证

### 2. 错误处理
- 详细的错误日志
- 用户友好的错误信息
- 优雅降级

### 3. 性能优化
- 索引和缓存
- 批量操作
- 异步处理

### 4. 数据安全
- 文件权限控制
- 数据备份
- 版本控制

---

这个存储策略确保了 LearnHub 的数据可靠性、性能和可扩展性，为用户提供了流畅的知识管理体验。