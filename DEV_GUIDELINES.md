# LearnHub 项目开发规范与 UI 指南

这份文档总结了项目中的核心 UI 逻辑、样式约定以及开发中的注意点，旨在为后续功能开发和上下文管理提供参考。

---

## 1. 全局样式与主题 (Theme Consistency)

项目采用 CSS 变量管理明暗模式，确保视觉一致性。

- **核心变量 (globals.css)**:
  - `--primary-indigo`: 主题品牌色（默认 #4F46E5，深色 #818CF8）。
  - `--sidebar-bg`: 侧边栏/模态框背景色。
  - `--content-bg`: 主内容区域背景色。
  - `--sidebar-text`: 标准文字颜色。

- **开发建议**:
  - **禁止硬编码颜色**：避免使用 `bg-white` 或 `bg-[#F8FAFC]`，应优先使用 `bg-[var(--sidebar-bg)]` 或 `bg-[var(--content-bg)]`。
  - **平滑过渡**：主容器应带有 `transition-theme` 类（定义在 globals.css 中），确保切换明暗模式时不突兀。

---

## 2. 布局管理 (Layout Management)

### 主内容区域结构
主区域通常位于 [MainContentWithToc.tsx](file:///d:/react_code/LearnHub/components/MainContentWithToc.tsx)，采用了响应式设计。

- **粘连问题防范**：
  - 内容容器必须包含 `px-4 sm:px-8 py-8` 级别的内边距，防止内容紧贴侧边栏。
  - 使用 `max-w-7xl mx-auto` 来限制列表/文档的阅读宽度，提高可读性。

- **按需分配宽度**：
  - **展示类（如提示词宇宙）**：应限制最大宽度（`max-w-7xl`），防止卡片在宽屏下过度拉伸。
  - **功能类（如 AI 对话）**：应撑满 100% 宽度，以提供足够的交互空间，不应被 `max-w-7xl` 限制。

---

## 3. 模态框规范 (Modal Guidelines)

模态框（如创建、编辑、详情页）需遵循以下标准：

- **层级 (Z-Index)**：
  - 必须使用 `z-[9999]` 或更高，以确保完全覆盖侧边栏（Sidebar）、页眉（Header）以及其他全局悬浮元素。
- **定位 (Positioning)**：
  - 必须使用 `fixed inset-0`，确保遮罩层从 `(0,0)` 开始铺满整个屏幕。
- **遮罩层样式**：
  - 背景：`bg-black/50`（对应 `rgba(0,0,0,0.5)`）。
  - 特效：配合 `backdrop-blur-sm` 提升层次感。
- **动画规范**：
  - 容器：使用 `animate-in fade-in duration-300`。
  - 内容面板：使用 `animate-in zoom-in-95 duration-300` 提供缩放进入效果。
- **结构**：
  - 头部（Header）：带有关闭按钮，且底边带有 `border-b`。
  - 内容区（Body）：必须包含 `overflow-y-auto custom-scrollbar`，防止长内容溢出导致页面无法滚动。

---

## 4. 组件开发注意点

- **独立滚动条**：
  - 在复杂页面中，使用 `flex flex-col h-full` 配合 `flex-1 overflow-y-auto` 实现局部滚动，而非全局滚动，这能保持 Header 和 Sidebar 的固定。
- **状态同步**：
  - 像 `darkMode` 这样的全局状态应通过 Props 逐级传递或使用 Context。
- **响应式断点**：
  - 移动端：`lg` 以下隐藏非必要侧边栏（如对话历史），并提供抽屉（Drawer）控制。
  - 列表：使用 `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`。

---

## 5. 常用 UI 组合 (Patterns)

- **卡片悬停效果**：
  - `transition-all duration-300 hover:shadow-xl hover:-translate-y-1`。
- **成功反馈**：
  - 复制操作应提供即时反馈（如 `copied` 状态切换），并伴随图标从 `Copy` 变为 `Check`。
- **空状态处理**：
  - 当没有选中内容时，显示带有 `opacity-40` 的提示文字，并居中对齐。

---

*最后更新日期：2026-01-01*
