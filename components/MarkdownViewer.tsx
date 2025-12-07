import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // 使用GitHub样式而不是dark版本
import { Check, Copy } from 'lucide-react';
import { HeadingSlugger } from '@/lib/utils';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

const getNodeText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (!node) return '';

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }

  if (React.isValidElement(node)) {
    return getNodeText(node.props.children);
  }

  return '';
};

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  const sluggerRef = useRef(new HeadingSlugger());
  sluggerRef.current.reset();

  return (
    <div className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return (
              <h1
                id={id}
                className="text-2xl font-bold text-card-foreground mt-8 mb-6 first:mt-0 leading-tight"
              >
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return (
              <h2
                id={id}
                className="text-xl font-semibold text-card-foreground mt-6 mb-4 border-b border-border pb-2"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return (
              <h3
                id={id}
                className="text-lg font-semibold text-card-foreground mt-4 mb-3"
              >
                {children}
              </h3>
            );
          },
          h4: ({ children }) => {
            const id = sluggerRef.current.slug(getNodeText(children) || 'section');
            return (
              <h4
                id={id}
                className="text-base font-medium text-card-foreground mt-4 mb-2"
              >
                {children}
              </h4>
            );
          },
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-muted-foreground text-base">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-none ml-0 mb-4 space-y-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-3 text-muted-foreground">
              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2.5 flex-shrink-0"></span>
              <span className="leading-relaxed">{children}</span>
            </li>
          ),
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !className?.includes('hljs')
            return isInline ? (
              <code className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-md text-sm font-mono border border-border" {...props}>
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }: any) => {
            const [isCopied, setIsCopied] = useState(false);

            const handleCopy = () => {
              if (typeof navigator === 'undefined') return;
              const codeContent = getNodeText(children).trimEnd();
              navigator.clipboard.writeText(codeContent)
                .then(() => {
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                })
                .catch(err => console.error('Failed to copy:', err));
            };

            const codeElement = children;
            const classList = codeElement.props.className?.split(/\s+/).filter(Boolean) ?? [];
            const languageClass = classList.find(cls => cls.startsWith('language-'));
            const fallbackClass = classList.find(cls => cls !== 'hljs');
            const rawLabel = languageClass?.replace('language-', '') || fallbackClass || 'plaintext';
            const language = rawLabel.replace('hljs', '').trim().toLowerCase() || 'plaintext';
            const languageLabel = language.toUpperCase();

            return (
              <div className="my-6 overflow-hidden rounded-xl border border-[#d0d7de] bg-[#f6f8fa] shadow-[0_1px_2px_rgba(16,24,40,0.08)] dark:border-[#30363d] dark:bg-[#0d1117]">
                <div className="flex items-center justify-between border-[#d0d7de] bg-[#f0f1f3] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#57606a] dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#8b949e]">
                  <div className="font-mono">{languageLabel}</div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-md border border-[#d0d7de] bg-white px-2 py-1 text-[11px] font-medium text-[#57606a] transition-colors hover:bg-[#f6f8fa] dark:border-[#30363d] dark:bg-[#1d2330] dark:text-[#c9d1d9] dark:hover:bg-[#242b38]"
                    aria-label="Copy code"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="text-[#57606a] dark:text-[#8b949e]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="m-0 max-h-[600px] overflow-auto bg-[#f6f8fa] px-4 py-3 text-sm leading-relaxed font-mono text-[#24292f] dark:bg-[#0d1117] dark:text-[#c9d1d9]">
                  {children}
                </pre>
              </div>
            );
          },
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary hover:text-primary/80 underline decoration-primary/30 underline-offset-2 hover:decoration-primary/50 transition-all duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-3 my-6 bg-accent rounded-r-lg italic text-muted-foreground leading-relaxed">
              {children}
            </blockquote>
          ),
          img: ({ src, alt }) => (
            <div className="my-6 text-center">
              <img 
                src={src} 
                alt={alt} 
                className="rounded-lg shadow-sm max-w-full mx-auto border border-border transition-transform duration-300 hover:scale-105" 
              />
              {alt && (
                <p className="text-sm text-muted-foreground mt-2 italic">{alt}</p>
              )}
            </div>
          ),
          table: ({ children }) => (
            <div className="my-6 rounded-lg border border-border overflow-hidden shadow-sm">
              <table className="w-full divide-y divide-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-accent">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-card divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-accent/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-card-foreground uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-muted-foreground">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-8 border-border border-t" />
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-card-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      
      <style jsx>{`
        .markdown-content {
          line-height: 1.6;
          font-size: 0.95rem;
        }
        
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4 {
          scroll-margin-top: 2rem;
        }
        
        .markdown-content pre code {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .markdown-content ul li::before {
          content: none;
        }
        
        .markdown-content *:last-child {
          margin-bottom: 0;
        }
        
        /* 优化滚动条 */
        .markdown-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .markdown-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .markdown-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        
        .markdown-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        .dark .markdown-content::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        
        .dark .markdown-content::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        
        /* === 新增核心修复代码 Start === */
        
        /* 1. 强制背景透明：去掉 highlight.js 自带的白底 */
        :global(.markdown-content pre code.hljs) {
          background-color: transparent !important;
          padding: 0 !important; /* 去掉内边距，否则文字会缩进两层 */
          margin: 0 !important;
        }

        /* 2. 确保文字颜色适配：避免在深色模式下看不清 */
        :global(.dark .markdown-content pre code.hljs) {
          background-color: transparent !important;
          color: inherit !important;
        }

        /* === 新增核心修复代码 End === */
      `}</style>
    </div>
  );
}
