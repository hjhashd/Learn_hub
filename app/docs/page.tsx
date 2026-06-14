"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileType, 
  Upload, 
  Search, 
  ArrowLeft,
  Loader2,
  HardDrive,
  Clock,
  Download,
  MoreVertical,
  ChevronRight,
  Folder,
  History,
  Monitor,
  Layout,
  Plus,
  X,
  AlertCircle,
  Moon,
  Sun,
  Presentation,
  Files,
  Sparkles,
  Settings,
  HelpCircle,
  Check
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Types ---
interface DocFile {
  name: string;
  category: 'word' | 'excel' | 'pdf' | 'ppt';
  size: number;
  mtime: string;
  birthtime: string;
  extension: string;
  path: string;
  url: string;
}

declare global {
  interface Window {
    DocsAPI?: any;
  }
}

function DocsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- State ---
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState<DocFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const editorInstanceRef = useRef<any>(null);

  // --- JWT helpers for OnlyOffice Browser Token ---
  const base64UrlEncode = (input: string | Uint8Array) => {
    let str: string;
    if (input instanceof Uint8Array) {
      str = String.fromCharCode(...input);
      // @ts-ignore
      const b64 = btoa(str);
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } else {
      // @ts-ignore
      const b64 = btoa(unescape(encodeURIComponent(input)));
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  };
  const createJwtHS256 = async (payload: any, secret: string) => {
    const enc = new TextEncoder();
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const signatureB64 = base64UrlEncode(new Uint8Array(signature));
    return `${data}.${signatureB64}`;
  };

  // --- Initial Load ---
  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/docs');
      const data = await res.json();
      
      setDocs(data);
      
      const filePath = searchParams.get('file');
      if (filePath) {
        const doc = data.find((d: DocFile) => d.path === filePath);
        if (doc) setActiveDoc(doc);
      }
    } catch (error) {
      console.error('Failed to fetch docs:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- OnlyOffice Integration ---
  useEffect(() => {
    if (activeDoc) {
      const timer = setTimeout(() => {
        initEditor(activeDoc);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeDoc]);

  const initEditor = (doc: DocFile) => {
    if (editorInstanceRef.current) {
      try {
        editorInstanceRef.current.destroyEditor();
        editorInstanceRef.current = null;
      } catch (e) {
        console.warn('Destroy editor failed:', e);
      }
    }

    setPreviewLoading(true);
    setPreviewError(null);

    const scriptId = 'onlyoffice-api-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const setup = async () => {
      if (!window.DocsAPI) {
        setPreviewError('OnlyOffice API 无法加载，请检查服务是否正常运行');
        setPreviewLoading(false);
        return;
      }

      const fileType = doc.extension.replace('.', '');
      let documentType = 'word';
      if (['xls', 'xlsx', 'csv'].includes(doc.extension)) documentType = 'cell';
      else if (['ppt', 'pptx'].includes(doc.extension)) documentType = 'slide';
      else if (doc.extension === '.pdf') documentType = 'pdf';

      // 为文档生成唯一的 key，尽量避免非 ASCII 字符，长度限制在 128 字符内
      // 使用简单的哈希确保 key 的稳定性
      const generateKey = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16) + '_' + str.length;
      };
      
      const docKey = generateKey(doc.path);
      
      let origin = window.location.origin;
      const clientOrigin = window.location.origin; // 浏览器使用的原始地址 (localhost)
      
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        // OnlyOffice Server (Docker) 需要这个来访问宿主机
        origin = origin.replace(/localhost|127\.0\.0\.1/, 'host.docker.internal');
      }
      
      const fileUrl = `${origin}${doc.url}`;
      const callbackUrl = `${origin}/api/docs/callback?path=${encodeURIComponent(doc.path)}`;
      // 插件是由浏览器加载的，所以必须使用浏览器能访问的地址 (localhost)
      const pluginUrl = `${clientOrigin}/plugins/ai-insert/config.json`;

      const browserSecret = process.env.NEXT_PUBLIC_ONLYOFFICE_BROWSER_SECRET;
      let browserToken: string | undefined = undefined;
      
      if (browserSecret && browserSecret.length > 0) {
        try {
          // 在前端生成 JWT 仅供演示，生产环境建议从后端获取 Token
          console.warn('OnlyOffice JWT secret is set but client-side signing is limited. Please ensure Document Server allows unsigned requests or provides a token API.');
          
          const jwtPayload = {
            document: {
              key: docKey,
              permissions: {
                comment: true,
                download: true,
                edit: true,
                print: true,
                review: true
              },
              url: fileUrl
            },
            editorConfig: {
              callbackUrl: callbackUrl,
              mode: 'edit'
            }
          };
          browserToken = await createJwtHS256(jwtPayload, browserSecret);
        } catch (e) {
          console.error('生成浏览器令牌失败:', e);
        }
      }

      try {
        editorInstanceRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", {
          documentType: documentType,
          document: {
            fileType: fileType,
            key: docKey,
            title: doc.name,
            url: fileUrl,
            permissions: {
              comment: true,
              download: true,
              edit: true,
              print: true,
              review: true,
              chat: true
            }
          },
          editorConfig: {
            callbackUrl: callbackUrl,
            lang: "zh-CN",
            user: {
              id: "user-1",
              name: "管理员"
            },
            customization: {
              autosave: true,
              forcesave: true,
              comments: true,
              help: false,
              uiTheme: darkMode ? "theme-dark" : "theme-light",
              features: {
                spellcheck: spellCheckEnabled
              }
            },
            plugins: {
              autostart: ["asc.{6B7A6A6A-7A6A-4A6A-8A6A-7A6A6A6A6A6A}"],
              pluginsData: [pluginUrl]
            }
          },
          ...(browserToken ? { token: browserToken } : {}),
          height: "100%",
          width: "100%",
          events: {
            onAppReady: () => {
              setPreviewLoading(false);
            },
            onError: (err: any) => {
              console.error('OnlyOffice Detailed Error:', err);
              let msg = '未知错误';
              const code = err.data?.errorCode || err.data;
              
              if (code === -2 || code === -4) {
                msg = '文件下载失败。请确保 Docker 能够访问 host.docker.internal';
              } else if (code === -3 || code === -20) {
                msg = '安全令牌 (JWT) 验证失败。';
              } else if (code === -8) {
                msg = '文件大小超过限制';
              }
              
              setPreviewError(`预览错误: ${msg} (代码: ${code})`);
              setPreviewLoading(false);
            }
          }
        });
      } catch (err) {
        setPreviewError('编辑器初始化失败');
        setPreviewLoading(false);
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      const apiUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || 'http://localhost:8888/web-apps/apps/api/documents/api.js';
      script.src = apiUrl;
      script.async = true;
      script.onload = setup;
      script.onerror = () => {
        setPreviewError(`无法连接到 OnlyOffice 服务 (${apiUrl})`);
        setPreviewLoading(false);
      };
      document.body.appendChild(script);
    } else {
      // If script exists but window.DocsAPI is not yet loaded, wait for it
      if (window.DocsAPI) {
        setup();
      } else {
        script.onload = setup;
      }
    }
  };

  // --- Handlers ---
  const handleSelectDoc = (doc: DocFile) => {
    setActiveDoc(doc);
    const url = new URL(window.location.href);
    url.searchParams.set('file', doc.path);
    router.push(url.pathname + url.search);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);

    try {
      const res = await fetch('/api/docs/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('上传失败');
      
      const fileInput = document.getElementById('sidebar-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await fetchDocs();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // --- AI Handlers ---
  const handleAiToggle = () => {
    const newState = !showAiSidebar;
    setShowAiSidebar(newState);
    setSidebarCollapsed(newState);
  };

  const handleAiGenerate = () => {
    setIsGenerating(true);
    setAiText('');
    
    setTimeout(() => {
      const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. \n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.";
      setAiText(loremIpsum);
      setIsGenerating(false);
    }, 2000);
  };

  const handleApplyAndInsert = () => {
    if (!editorInstanceRef.current || !aiText || !activeDoc) return;

    // 检查是否为 Word 文档，因为 Api.GetDocument() 仅适用于 Word
    const isWord = ['.doc', '.docx'].includes(activeDoc.extension);
    if (!isWord) {
      alert('AI 插入功能目前仅支持 Word 文档');
      return;
    }

    try {
      // 检查 OnlyOffice 实例
      const editor = editorInstanceRef.current;
      if (!editor) throw new Error('编辑器未初始化');

      // 1. 尝试直接使用 callCommand (企业版/开发者版专用)
      const callCommand = editor.callCommand || (editor as any).connector?.callCommand;
      if (typeof callCommand === 'function') {
        console.log('检测到高级 API，正在直接插入...');
        const command = `
          var oDocument = Api.GetDocument();
          var oParagraph = Api.CreateParagraph();
          oParagraph.AddText(${JSON.stringify(aiText)});
          oDocument.InsertContent([oParagraph], true);
        `;
        callCommand.call(editor, command);
        setShowAiSidebar(false);
        setSidebarCollapsed(false);
        return;
      }

      // 2. 社区版黑科技：通过 BroadcastChannel 绕过 OnlyOffice 隔离直接对话插件
      console.warn('正在通过同源广播通道 (BroadcastChannel) 与插件通信...');
      const channel = new BroadcastChannel('onlyoffice-ai-channel');
      channel.postMessage({
        type: "ai-insert-text",
        text: aiText
      });
      
      // 给插件一点反应时间
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in duration-300';
      toast.innerHTML = `
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span class="font-bold">AI 正在注入文档...</span>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) document.body.removeChild(toast);
        setShowAiSidebar(false);
        setSidebarCollapsed(false);
        channel.close(); // 用完关闭通道
      }, 1000);

    } catch (e) {
      console.error('插入失败:', e);
      // 最终兜底：复制到剪贴板
      const fallbackCopy = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          alert('由于 OnlyOffice 版本限制，已将文本复制到剪贴板，请手动粘贴到文档中。');
        } catch (err) {
          alert('无法自动插入，请手动复制 AI 生成的内容。');
        }
        document.body.removeChild(textArea);
      };
      fallbackCopy(aiText);
    }
  };

  const handleSaveOptions = () => {
    setShowOptions(false);
    // 重启编辑器以应用设置
    if (activeDoc) {
      initEditor(activeDoc);
    }
  };

  // --- Helpers ---
  const getFileIcon = (doc: DocFile) => {
    const ext = doc.extension;
    if (['.doc', '.docx'].includes(ext)) return <FileText className="text-blue-500" />;
    if (['.xls', '.xlsx'].includes(ext)) return <FileSpreadsheet className="text-green-500" />;
    if (['.ppt', '.pptx'].includes(ext)) return <Presentation className="text-orange-500" />;
    if (ext === '.pdf') return <FileType className="text-red-500" />;
    return <FileText className="text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocs = docs.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render ---
  return (
    <div className={`flex h-screen w-full min-w-[1200px] overflow-hidden bg-[#F5F7F8] ${darkMode ? 'dark bg-[#121212]' : ''}`}>
      {/* 1. Sidebar - Document List (280px) */}
      <aside className={`${sidebarCollapsed ? 'w-0 opacity-0 -translate-x-full' : 'w-[280px] opacity-100 translate-x-0'} flex flex-col border-r border-black/5 dark:border-white/5 bg-white dark:bg-[#1E1E1E] transition-all duration-300 shrink-0 shadow-xl z-20 overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-black/5 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => router.push('/')}>
              <ArrowLeft size={18} />
            </Button>
            <span className="font-bold text-[#607D8B] dark:text-slate-200">文档中心</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>

        {/* Search & Upload */}
        <div className="p-4 space-y-3 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#607D8B] transition-colors" size={16} />
            <Input 
              placeholder="搜索文档..." 
              className="pl-9 h-9 bg-slate-50 dark:bg-zinc-800 border-transparent focus:border-[#607D8B] transition-all rounded-lg text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <input type="file" id="sidebar-upload" multiple className="hidden" onChange={(e) => handleUpload(e.dataTransfer?.files || e.target.files)} />
            <Button 
              className="w-full bg-[#607D8B] hover:bg-[#455A64] text-white rounded-lg shadow-sm transition-all h-10 flex items-center justify-center gap-2"
              onClick={() => document.getElementById('sidebar-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              <span>上传新文档</span>
            </Button>
          </div>
        </div>

        {/* Document Tree/List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Loader2 size={24} className="animate-spin mb-2" />
              <span className="text-xs">加载文档中...</span>
            </div>
          ) : (
            <div className="space-y-1">
              {['word', 'excel', 'ppt', 'pdf'].map(cat => {
                const catDocs = filteredDocs.filter(d => d.category === cat);
                if (catDocs.length === 0) return null;
                return (
                  <div key={cat} className="mb-4">
                    <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <Folder size={12} />
                      {cat}
                    </p>
                    {catDocs.map((doc) => (
                      <div 
                        key={doc.path}
                        onClick={() => handleSelectDoc(doc)}
                        className={`
                          group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                          ${activeDoc?.path === doc.path 
                            ? 'bg-[#607D8B]/10 text-[#607D8B] shadow-sm' 
                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}
                        `}
                      >
                        <div className="shrink-0">{getFileIcon(doc)}</div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${activeDoc?.path === doc.path ? 'font-semibold' : ''}`}>{doc.name}</p>
                          <p className="text-[10px] opacity-50">{formatSize(doc.size)} · {new Date(doc.mtime).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeDoc?.path === doc.path ? 'opacity-100' : ''}`} />
                      </div>
                    ))}
                  </div>
                );
              })}
              {filteredDocs.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <FileText size={40} className="mx-auto mb-2" />
                  <p className="text-xs">暂无匹配文档</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User / Info Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#607D8B] text-white flex items-center justify-center font-bold text-sm">H</div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Hua&apos;s LearnHub</p>
              <p className="text-[10px] text-slate-400">文档协作系统 v2.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace (Full space) */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-[#121212]">
        {activeDoc ? (
          <>
            {/* Editor Toolbar */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5 shrink-0 bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4 min-w-0">
                {sidebarCollapsed && (
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSidebarCollapsed(false)}>
                    <Files size={18} />
                  </Button>
                )}
                <div className="relative group">
                  <Button variant="ghost" size="sm" className="font-bold text-slate-700 dark:text-slate-200" onClick={() => setShowOptions(true)}>
                    文件
                  </Button>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg shrink-0">
                  {getFileIcon(activeDoc)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 dark:text-slate-100 truncate">{activeDoc.name}</h2>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> 最后修改: {new Date(activeDoc.mtime).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><HardDrive size={12} /> {formatSize(activeDoc.size)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* AI Circular Button */}
                <button 
                  onClick={handleAiToggle}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 transform
                    bg-gradient-to-br from-blue-400 to-blue-600 hover:scale-110 active:scale-95 shadow-lg
                    ${showAiSidebar ? 'ring-2 ring-blue-300 ring-offset-2' : ''}
                  `}
                >
                  <Sparkles size={20} className="text-white" />
                </button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="hidden md:flex gap-2" onClick={() => window.open(activeDoc.url, '_blank')}>
                    <Download size={14} />
                    下载
                  </Button>
                  <Button 
                    variant={showHistory ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <History size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical size={18} />
                  </Button>
                </div>
              </div>
            </header>

            {/* Editor Body */}
            <div key={activeDoc.path} className="flex-1 relative overflow-hidden flex">
              {/* OnlyOffice Area */}
              <div className="flex-1 relative bg-[#F0F2F5] dark:bg-[#0A0A0A]">
                <div id="onlyoffice-editor" className="w-full h-full"></div>
              </div>

              {/* AI Sidebar (Right) */}
              <aside className={`
                ${showAiSidebar ? 'w-[300px] border-l opacity-100' : 'w-0 opacity-0 border-none overflow-hidden'} 
                transition-all duration-300 bg-white dark:bg-[#1E1E1E] flex flex-col z-10 shadow-2xl
              `}>
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                      <Sparkles size={16} className="text-blue-500" />
                    </div>
                    <span className="font-bold text-sm">AI助手</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setShowAiSidebar(false);
                    setSidebarCollapsed(false);
                  }}>
                    <X size={16} />
                  </Button>
                </div>

                <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="flex flex-col h-16 gap-1 border-slate-200 dark:border-slate-800" onClick={handleAiGenerate}>
                      <Plus size={16} className="text-blue-500" />
                      <span className="text-[10px]">生成</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex flex-col h-16 gap-1 border-slate-200 dark:border-slate-800">
                      <Settings size={16} className="text-slate-500" />
                      <span className="text-[10px]">设置</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex flex-col h-16 gap-1 border-slate-200 dark:border-slate-800">
                      <HelpCircle size={16} className="text-slate-500" />
                      <span className="text-[10px]">帮助</span>
                    </Button>
                  </div>

                  {/* Input/Result Area */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">生成的文本</span>
                      {isGenerating && (
                        <div className="flex items-center gap-1.5 text-blue-500 text-[10px] font-medium animate-pulse">
                          <Loader2 size={10} className="animate-spin" />
                          正在生成...
                        </div>
                      )}
                    </div>
                    <textarea 
                      className={`
                        w-full h-[200px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 
                        bg-slate-50/50 dark:bg-white/5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20
                        custom-scrollbar transition-all duration-300
                        ${isGenerating ? 'opacity-50 grayscale' : 'opacity-100'}
                      `}
                      placeholder="AI 生成的内容将显示在这里..."
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 shadow-md shadow-blue-500/20"
                    disabled={!aiText || isGenerating}
                    onClick={handleApplyAndInsert}
                  >
                    应用并插入
                  </Button>
                </div>
              </aside>

              {/* Version History Sidebar (Right) */}
              {showHistory && (
                <aside className="w-[320px] border-l border-black/5 dark:border-white/5 bg-white dark:bg-[#1E1E1E] animate-in slide-in-from-right duration-300">
                  <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className="font-bold text-sm">版本历史</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(false)}>
                      <X size={16} />
                    </Button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="p-3 rounded-xl bg-[#607D8B]/5 border border-[#607D8B]/10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs font-bold">当前版本</span>
                      </div>
                      <p className="text-sm font-medium">{new Date(activeDoc.mtime).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Monitor size={10} /> 系统自动保存
                      </p>
                    </div>
                    <div className="text-center py-10 opacity-30 grayscale">
                      <History size={40} className="mx-auto mb-2" />
                      <p className="text-xs">暂无历史版本</p>
                    </div>
                  </div>
                </aside>
              )}
            </div>

            {/* Options Modal Simulation */}
            {showOptions && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-[600px] h-[400px] bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="flex-1 flex overflow-hidden">
                    {/* Modal Sidebar */}
                    <div className="w-[160px] bg-slate-50 dark:bg-black/20 p-4 border-r border-black/5 dark:border-white/5">
                      <div className="space-y-1">
                        {['常规', '显示', '校对', '保存', '语言', '高级'].map(item => (
                          <div 
                            key={item} 
                            className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${item === '校对' ? 'bg-[#607D8B] text-white' : 'hover:bg-slate-200 dark:hover:bg-white/5'}`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Modal Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                      <h3 className="text-lg font-bold mb-6">校对设置</h3>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">在 Word 中更正拼写和语法时</p>
                          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setSpellCheckEnabled(!spellCheckEnabled)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${spellCheckEnabled ? 'bg-[#607D8B] border-[#607D8B]' : 'border-slate-300 dark:border-slate-600 group-hover:border-[#607D8B]'}`}>
                              {spellCheckEnabled && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300">在文字下方显示红色下划线 (拼写检查)</span>
                          </div>
                          <div className="flex items-center gap-3 opacity-50 pointer-events-none">
                            <div className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                              <Check size={14} className="text-transparent" />
                            </div>
                            <span className="text-sm">键入时检查语法</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setShowOptions(false)}>取消</Button>
                    <Button className="bg-[#607D8B] hover:bg-[#455A64] text-white" onClick={handleSaveOptions}>确定并重启</Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#F8FAFB] dark:bg-[#121212] transition-colors">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-3xl bg-white dark:bg-[#1E1E1E] shadow-2xl flex items-center justify-center animate-bounce-slow">
                <Layout size={64} className="text-[#607D8B] opacity-20" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-[#607D8B] text-white flex items-center justify-center shadow-lg">
                <Files size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">欢迎来到文档中心</h2>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              在这里，您可以预览、编辑和协作处理各种办公文档。请从左侧列表中选择一个文件开始。
            </p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <Card className="p-4 bg-white dark:bg-[#1E1E1E] border-transparent hover:shadow-md transition-all cursor-pointer group" onClick={() => document.getElementById('sidebar-upload')?.click()}>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={20} />
                </div>
                <p className="text-sm font-bold">上传文件</p>
                <p className="text-[10px] text-slate-400">支持多文件拖放</p>
              </Card>
              <Card className="p-4 bg-white dark:bg-[#1E1E1E] border-transparent hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Monitor size={20} />
                </div>
                <p className="text-sm font-bold">在线编辑</p>
                <p className="text-[10px] text-slate-400">实时保存与预览</p>
              </Card>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function ProfessionalDocsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-[#F5F7F8] dark:bg-[#121212]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-[#607D8B]" />
          <p className="text-sm font-medium text-slate-500">正在进入文档中心...</p>
        </div>
      </div>
    }>
      <DocsContent />
    </Suspense>
  );
}
