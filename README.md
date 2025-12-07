# LearnHub - 个人知识库

一个简洁优雅的个人知识管理工具，采用现代化设计风格，支持 Markdown 编辑、文件存储和全文搜索。

## � 核心功能

### 📚 知识管理
- **Markdown 支持**：完整的 Markdown 渲染，支持代码高亮、表格、任务列表等
- **分类管理**：灵活的分类系统，支持多级分类和统计
- **标签系统**：为知识点添加多个标签，便于检索和组织
- **全文搜索**：实时搜索知识库内容，支持标题和内容搜索

### 🎨 用户体验
- **现代化设计**：采用 Tailwind CSS，界面简洁优雅
- **响应式布局**：完美适配桌面端、平板和移动设备
- **暗色模式**：完整的暗色主题支持，保护眼睛
- **实时预览**：编辑时实时预览 Markdown 效果

### 💾 数据存储
- **文件系统存储**：基于 Markdown 文件的存储方案，数据完全自主控制
- **Git 友好**：支持版本控制，便于备份和协作
- **Docker 支持**：一键部署，数据持久化
- **导入导出**：支持批量导入导出知识条目

### � 技术特性
- **Next.js 14+**：最新的 React 框架，性能优异
- **TypeScript**：类型安全，开发体验好
- **TypeScript**：完整的类型定义，开发体验好
- **API 接口**：RESTful API，便于扩展和集成

## 🚀 快速开始

### 本地开发
```bash
# 克隆项目
git clone <repository-url>
cd LearnHub

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### Docker 部署
```bash
# 构建镜像
docker build -t learnhub .

# 运行容器
docker run -d -p 3000:3000 -v ./data:/app/data learnhub
```

### Docker Compose 部署
```bash
# 使用 docker-compose.yml
docker-compose up -d
```

## 📁 项目结构

```
LearnHub/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── knowledge/     # 知识条目 API
│   │       ├── route.ts   # 知识条目 CRUD
│   │       ├── categories/ # 分类管理
│   │       └── [id]/       # 单个知识条目
│   ├── edit/              # 编辑页面
│   ├── knowledge/         # 知识详情页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── not-found.tsx      # 404 页面
│   └── page.tsx           # 首页
├── components/            # React 组件
│   └── ui/               # UI 基础组件
├── lib/                  # 工具函数
│   ├── api-client.ts     # API 客户端
│   ├── fileStorage.ts    # 文件存储实现
│   ├── storage.ts        # 存储抽象层
│   └── utils.ts          # 通用工具
├── types/                # TypeScript 类型
│   └── knowledge.ts      # 知识库类型定义
├── data/                 # 数据目录
│   ├── knowledge/        # Markdown 文件存储
│   └── attachments/      # 附件文件
├── docs/                 # 文档
│   └── storage-strategy.md # 存储策略详细说明
└── public/               # 静态资源
```

## 🎯 功能详解

### 知识条目管理
- **创建**：支持 Markdown 格式创建新知识
- **编辑**：实时预览，支持拖拽上传图片
- **删除**：安全删除，支持批量操作
- **搜索**：全文搜索，支持高级筛选
- **分类**：灵活的分类系统，支持层级结构

### 文件存储系统
- **Markdown 文件**：每个知识条目对应一个 `.md` 文件
- **元数据**：YAML frontmatter 存储标题、分类、标签等信息
- **附件管理**：图片、文档等附件统一存储
- **索引文件**：JSON 索引加速查询和统计

### API 接口
- **GET /api/knowledge**：获取所有知识条目
- **POST /api/knowledge**：创建新知识条目
- **GET /api/knowledge/[id]**：获取单个知识条目
- **PUT /api/knowledge/[id]**：更新知识条目
- **DELETE /api/knowledge/[id]**：删除知识条目
- **GET /api/knowledge/categories**：获取分类统计

## 🛠 技术栈

- **前端框架**：Next.js 14+ (App Router)
- **编程语言**：TypeScript
- **样式方案**：Tailwind CSS
- **图标库**：Lucide React
- **Markdown 渲染**：React Markdown + Remark
- **代码高亮**：Prism.js
- **文件处理**：Node.js File System
- **部署方案**：Docker + Docker Compose

## 🔧 配置说明

### 环境变量
```env
NODE_ENV=development|production
DATA_PATH=./data
PORT=3000
```

### 数据目录结构
```
data/
├── knowledge/          # Markdown 文件
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── distributed-systems.md
│   │   │   └── react-hooks.md
│   │   └── 02/
│   └── attachments/    # 附件文件
│       ├── images/
│       ├── docs/
│       └── others/
├── index.json         # 知识库索引
└── config.json        # 配置文件
```

## 🚀 高级功能

### 全文搜索
- 支持标题和内容搜索
- 实时搜索结果展示
- 支持按分类和标签筛选

### 版本控制
- 基于 Git 的版本管理
- 支持知识库历史版本查看
- 便于团队协作和备份

### 导入导出
- 支持批量导入 Markdown 文件
- 支持导出整个知识库
- 兼容常见笔记软件格式

## 💡 使用建议

### 个人知识管理
1. **日常笔记**：记录学习心得和工作经验
2. **技术文档**：整理技术方案和代码片段
3. **项目总结**：归档项目经验和技术选型
4. **知识分享**：生成分享链接，与同事交流

### 团队协作
1. **知识共享**：团队成员共享技术知识
2. **文档协作**：多人协作编辑技术文档
3. **经验传承**：新人快速了解团队技术栈

## 🔒 安全考虑

- **数据本地存储**：所有数据存储在本地文件系统
- **访问控制**：支持基础的身份验证
- **数据备份**：支持自动备份和恢复
- **文件验证**：上传文件类型和大小验证

## 🎯 未来规划

- **插件系统**：支持自定义插件扩展
- **移动端**：开发移动端应用
- **AI 助手**：集成 AI 写作和问答功能
- **协作编辑**：支持多人实时协作编辑

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发规范
- 使用 TypeScript 编写代码
- 遵循 ESLint 和 Prettier 规范
- 编写单元测试
- 更新相关文档

---

**LearnHub** - 让知识管理变得简单而优雅 🚀