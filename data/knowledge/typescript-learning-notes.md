---
title: "TypeScript 学习心得"
category: "study"
tags: ["TypeScript", "JavaScript", "类型系统"]
date: "2024-12-07"
readingTime: "4分钟"
toc:
  - id: "why-typescript"
    text: "为什么选择 TypeScript"
    level: 2
  - id: "basic-types"
    text: "基础类型"
    level: 2
  - id: "advanced-types"
    text: "高级类型"
    level: 2
  - id: "best-practices"
    text: "最佳实践"
    level: 2
---

# TypeScript 学习心得

## 为什么选择 TypeScript

TypeScript 为 JavaScript 添加了静态类型检查，带来了以下好处：

- **编译时错误检查**：在代码运行前发现潜在错误
- **更好的 IDE 支持**：智能提示、自动补全、重构支持
- **代码可维护性**：类型定义让代码更易理解和维护
- **团队协作**：明确的接口定义减少沟通成本

## 基础类型

### 基本类型
```typescript
let name: string = "LearnHub"
let age: number = 25
let isActive: boolean = true
let data: any = { key: "value" }
```

### 数组和对象
```typescript
let numbers: number[] = [1, 2, 3]
let person: { name: string; age: number } = {
  name: "Alice",
  age: 30
}
```

### 接口定义
```typescript
interface User {
  id: number
  name: string
  email?: string // 可选属性
  readonly createdAt: Date
}
```

## 高级类型

### 联合类型和交叉类型
```typescript
type Status = "pending" | "completed" | "failed"
type AdminUser = User & { role: "admin" }
```

### 泛型
```typescript
function identity<T>(arg: T): T {
  return arg
}

interface Container<T> {
  value: T
  getValue(): T
}
```

### 条件类型
```typescript
type IsArray<T> = T extends any[] ? true : false
type ArrayType = IsArray<number[]> // true
type NonArrayType = IsArray<string> // false
```

## 最佳实践

### 1. 渐进式采用
- 从关键模块开始使用 TypeScript
- 逐步迁移现有 JavaScript 代码
- 使用 `allowJs: true` 允许混合开发

### 2. 严格配置
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 3. 类型推断
```typescript
// 好的做法 - 让 TypeScript 推断类型
const users = ["Alice", "Bob"] // string[]

// 避免不必要的类型注解
const name: string = "Alice" // 多余
```

### 4. 使用工具类型
```typescript
// Partial<T> - 所有属性变为可选
interface Config {
  host: string
  port: number
  ssl: boolean
}
type PartialConfig = Partial<Config>

// Pick<T, K> - 选择部分属性
type NetworkConfig = Pick<Config, "host" | "port">
```

---

*最后更新：2024年12月7日*