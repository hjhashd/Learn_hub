---
title: "Next.js 开发笔记"
category: "技术"
tags: ["Next.js", "React", "Web开发"]
date: "2024-12-07"
readingTime: "5分钟"
toc:
  - id: "overview"
    text: "概述"
    level: 2
  - id: "features"
    text: "主要特性"
    level: 2
  - id: "getting-started"
    text: "快速开始"
    level: 2
  - id: "best-practices"
    text: "最佳实践"
    level: 2
---

# Next.js 开发笔记

## 概述

Next.js 是一个基于 React 的全栈框架，提供了服务端渲染、静态生成等功能，让 React 应用开发更加高效。

## 主要特性

### 1. 服务端渲染 (SSR)
```javascript
// pages/index.js
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/data')
  const data = await res.json()
  
  return {
    props: { data }
  }
}
```

### 2. 静态生成 (SSG)
```javascript
export async function getStaticProps() {
  const data = await fetchData()
  
  return {
    props: { data },
    revalidate: 60 // ISR
  }
}
```

### 3. 文件系统路由
Next.js 基于文件系统的路由机制非常直观：

```
pages/
├── index.js      # 首页
├── about.js      # /about
└── blog/
    ├── index.js  # /blog
    └── [slug].js # /blog/:slug
```

## 快速开始

### 安装
```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```

### 项目结构
```
my-app/
├── pages/
├── public/
├── styles/
├── components/
└── package.json
```

## 最佳实践

### 1. 组件组织
- 保持组件小而专注
- 使用自定义 Hooks 提取逻辑
- 合理使用 TypeScript

### 2. 性能优化
- 使用 Image 组件优化图片
- 实现代码分割
- 合理使用缓存策略

### 3. SEO 优化
- 使用 Next.js Head 组件
- 实现结构化数据
- 优化元标签

---

*最后更新：2024年12月7日*