// File: components/MarkdownViewer.tsx
import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// 引入 Prism 高亮组件
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// 引入两款不同的主题：一款亮的，一款暗的
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Terminal } from 'lucide-react';
import { HeadingSlugger } from '@/lib/utils';
import Link from 'next/link';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  darkMode?: boolean; // 新增：接收深色模式状态
  articles?: { id: string; title: string }[]; // 用于根据标题匹配路由 ID
  wikiLinkResolver?: (text: string) => string | null; // 自定义解析器
  onInternalLinkClick?: (id: string) => void;
}

const getNodeText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (React.isValidElement(node)) return getNodeText(node.props.children);
  return '';
};

export const MarkdownViewer = React.memo(function MarkdownViewer({ content, className, darkMode = false, articles, wikiLinkResolver, onInternalLinkClick }: MarkdownViewerProps) {
  const sluggerRef = useRef(new HeadingSlugger());
  sluggerRef.current.reset();

  const remarkWikiLinks = () => {
    const normalize = (s: string) => s.trim().toLowerCase();
    const extractDocName = (s: string) => {
      const parts = s.split(/[:：]/);
      return (parts.length > 1 ? parts[parts.length - 1] : s).trim();
    };
    const resolveHref = (raw: string): { href: string; label: string } => {
      const [text, alias] = raw.split('|');
      const label = (alias || text).trim();
      const docName = extractDocName(text.trim());
      let href: string | null = null;

      if (typeof wikiLinkResolver === 'function') {
        try {
          href = wikiLinkResolver(docName);
        } catch {}
      }

      if (!href && Array.isArray(articles) && articles.length > 0) {
        const target = articles.find(a => normalize(a.title) === normalize(docName));
        if (target) href = `/knowledge/${encodeURIComponent(String(target.id))}`;
      }

      if (!href) {
        href = `/?q=${encodeURIComponent(docName)}`;
      }

      return { href, label };
    };

    return (tree: any) => {
      const visitChildren = (node: any) => {
        if (!node || !node.children || !Array.isArray(node.children)) return;
        const nextChildren: any[] = [];
        for (const child of node.children) {
          if (child.type === 'code' || child.type === 'inlineCode') {
            nextChildren.push(child);
            continue;
          }

          if (child.type === 'text' && typeof child.value === 'string') {
            const text = child.value as string;
            const parts: any[] = [];
            let lastIndex = 0;
            const regex = /\[\[([^\]]+)\]\]/g;
            let m: RegExpExecArray | null;
            while ((m = regex.exec(text)) !== null) {
              const start = m.index;
              const end = regex.lastIndex;
              if (start > lastIndex) {
                parts.push({ type: 'text', value: text.slice(lastIndex, start) });
              }
              const { href, label } = resolveHref(m[1]);
              parts.push({
                type: 'link',
                url: href,
                title: label,
                children: [{ type: 'text', value: label }]
              });
              lastIndex = end;
            }
            if (lastIndex === 0) {
              nextChildren.push(child);
            } else {
              if (lastIndex < text.length) {
                parts.push({ type: 'text', value: text.slice(lastIndex) });
              }
              nextChildren.push(...parts);
            }
          } else {
            visitChildren(child);
            nextChildren.push(child);
          }
        }
        node.children = nextChildren;
      };

      visitChildren(tree);
      return tree;
    };
  };

  // --- 动态代码块组件 ---
  const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
      navigator.clipboard.writeText(codeString).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    };

    // 1. 行内代码 (Inline Code) - 蓝白风格 vs 深色风格
    if (inline) {
      return (
        <code 
          className={`
            px-1.5 py-0.5 rounded-md text-sm font-mono border transition-colors duration-300
            ${darkMode 
              ? 'bg-gray-800 text-blue-300 border-gray-700' // 深色模式
              : 'bg-blue-50 text-blue-700 border-blue-100'  // 亮色模式：蓝底蓝字
            }
          `} 
          {...props}
        >
          {children}
        </code>
      );
    }

    // 2. 块级代码 (Block Code) - 核心差异化样式
    return (
      <div 
        className={`
          my-6 rounded-xl overflow-hidden border shadow-sm transition-colors duration-300
          ${darkMode 
            ? 'bg-[#1e1e1e] border-gray-800' // 深色模式：纯黑/深灰背景
            : 'bg-white border-blue-200'     // 亮色模式：白底 + 浅蓝边框
          }
        `}
      >
        {/* 顶部栏 */}
        <div 
          className={`
            flex items-center justify-between px-4 py-2.5 border-b transition-colors duration-300
            ${darkMode
              ? 'bg-[#252526] border-gray-800 text-gray-400' // 深色头
              : 'bg-blue-50/50 border-blue-100 text-blue-600' // 亮色头：浅蓝背景
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider opacity-90">
              {language}
            </span>
          </div>
          
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all
              ${darkMode
                ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                : 'hover:bg-blue-100 text-blue-500 hover:text-blue-700'
              }
            `}
          >
            {isCopied ? <Check size={13} /> : <Copy size={13} />}
            <span>{isCopied ? '已复制' : '复制'}</span>
          </button>
        </div>

        {/* 代码高亮区域 */}
        <SyntaxHighlighter
          language={language}
          // 核心切换逻辑：如果是 darkMode 就用 vscDarkPlus，否则用 oneLight
          style={darkMode ? vscDarkPlus : oneLight}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent', // 透明背景，透出外层容器的颜色
            fontSize: '0.9rem',
            lineHeight: '1.6',
            fontFamily: "'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          }}
          wrapLines={true}
          showLineNumbers={true} // 开启行号更专业
          lineNumberStyle={{ 
            minWidth: '2.5em', 
            paddingRight: '1em', 
            color: darkMode ? '#6e7681' : '#a0a0a0', // 行号颜色也要适配
            textAlign: 'right'
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkWikiLinks]}
        components={{
          code: CodeBlock,
          
          // --- 其他元素样式 ---
          h1: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return <h1 id={id} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-6 first:mt-0 tracking-tight transition-colors">{children}</h1>;
          },
          h2: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return <h2 id={id} className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 transition-colors">{children}</h2>;
          },
          h3: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return <h3 id={id} className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3 transition-colors">{children}</h3>;
          },
          h4: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return <h4 id={id} className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 transition-colors">{children}</h4>;
          },
          h5: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return <h5 id={id} className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2 transition-colors">{children}</h5>;
          },
          h6: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return <h6 id={id} className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2 transition-colors">{children}</h6>;
          },
          p: ({ children }) => <p className="mb-5 leading-7 text-gray-600 dark:text-gray-300 text-[16px] transition-colors">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-gray-600 dark:text-gray-300 transition-colors">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-gray-600 dark:text-gray-300 transition-colors">{children}</ol>,
          li: ({ children }) => <li className="leading-7">{children}</li>,
          a: ({ children, href }) => {
            const isInternal = href && href.startsWith('/knowledge/');
            if (isInternal && onInternalLinkClick) {
              const id = decodeURIComponent(String(href).replace('/knowledge/', ''));
              return (
                <a
                  href={href}
                  onClick={(e) => { e.preventDefault(); onInternalLinkClick(id); }}
                  className="text-blue-600 dark:text-blue-400 hover:underline decoration-2 underline-offset-2 transition-all font-medium"
                >
                  {children}
                </a>
              );
            }
            if (href && href.startsWith('/')) {
              return (
                <Link href={href} className="text-blue-600 dark:text-blue-400 hover:underline decoration-2 underline-offset-2 transition-all font-medium">
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline decoration-2 underline-offset-2 transition-all font-medium" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-500/50 pl-4 py-3 pr-4 my-6 rounded-r-lg italic text-gray-600 dark:text-gray-400 transition-colors">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-sm text-left">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-6 py-3 whitespace-nowrap">{children}</th>,
          td: ({ children }) => <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{children}</td>,
          hr: () => <hr className="my-10 border-gray-200 dark:border-gray-800" />,
          img: ({ src, alt }) => (
            <div className="my-8 group">
              <img src={src} alt={alt} className="rounded-xl shadow-md border border-gray-100 dark:border-gray-800 mx-auto max-h-[500px] object-contain bg-white dark:bg-gray-800 transition-transform duration-300 group-hover:scale-[1.01]" />
              {alt && <p className="text-center text-sm text-gray-500 mt-2 italic">{alt}</p>}
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
