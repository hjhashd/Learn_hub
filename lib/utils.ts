import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

export interface HeadingItem {
  id: string
  text: string
  level: number
}

export class HeadingSlugger {
  private seen: Record<string, number> = {}

  private sanitize(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  slug(value: string): string {
    const base = this.sanitize(value) || 'section'
    const count = this.seen[base] ?? 0
    this.seen[base] = count + 1
    return count ? `${base}-${count}` : base
  }

  reset() {
    this.seen = {}
  }
}

export function generateHeadingToc(markdown: string): HeadingItem[] {
  if (!markdown) return []
  const regex = /^(#{2,4})\s+(.+)$/gm
  const slugger = new HeadingSlugger()
  const items: HeadingItem[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length
    const rawText = match[2].replace(/[`*]/g, '').trim()
    if (!rawText) continue
    const id = slugger.slug(rawText)
    items.push({ id, text: rawText, level })
  }

  return items
}