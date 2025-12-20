# LearnHub Wiki 链接用法

## 功能概述

- 支持在 Markdown 中写 `[[标题]]`，渲染为可点击链接。
- 解析规则：优先使用自定义解析器，其次在传入的文章列表中按标题匹配 ID；若未匹配，则跳转到首页并附带查询参数 `?q=标题`。

## 依赖

- 必需依赖：无（已在组件内实现解析逻辑）。
- 可选依赖：`remark-wiki-link`（若需更复杂的语法），安装命令：

```bash
npm i remark-wiki-link
```

> 当前实现未使用该库，安装仅在你需要扩展语法时使用。

## 组件用法

```tsx
import { MarkdownViewer } from '@/components/MarkdownViewer'

// 示例：传入 articles，用于标题→ID 匹配
const articles = [
  { id: '20240115-nextjs-dev', title: 'Next.js 开发笔记' },
  { id: 'typescript-learning-notes', title: 'TypeScript 学习心得' }
]

export default function Example() {
  const md = `在这篇 [[Next.js 开发笔记]] 中有更多细节。`;
  return (
    <MarkdownViewer content={md} darkMode={true} articles={articles} />
  )
}
```

### 使用自定义解析器

```tsx
const resolver = (text: string) => {
  if (text === 'Next.js 开发笔记') return '/knowledge/20240115-nextjs-dev'
  return null
}

<MarkdownViewer content={md} wikiLinkResolver={resolver} />
```

### 内部链接渲染

- 以 `/` 开头的内部链接会用 Next.js 的 `Link` 渲染，以获得更佳的导航体验。
- 外部链接仍使用 `<a>` 并在新窗口打开。

## 路由与回退

- 期望路由：`/knowledge/[id]`。
- 当无法通过 `articles` 或 `wikiLinkResolver` 解析到 ID 时，组件会生成链接到 `/?q=标题`，可在首页通过 `useSearchParams()` 读取 `q` 值以预填搜索。

## Markdown 示例

```markdown
有关 Next.js 的更多内容请参考 [[Next.js 开发笔记]]。

也支持别名写法：[[Next.js 开发笔记|Next.js 笔记]]
```

