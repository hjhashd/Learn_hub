"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Monitor, Tablet, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    DocsAPI?: any;
  }
}

export default function DocPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const path = searchParams.get('path');
  const name = searchParams.get('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    if (!path || !name) {
      setError('缺少文档路径或名称');
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'http://localhost:8888/web-apps/apps/api/documents/api.js';
    script.async = true;
    script.onload = () => initEditor();
    script.onerror = () => {
      setError('无法加载 OnlyOffice API，请确保 OnlyOffice 服务已启动 (localhost:8888)');
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [path, name]);

  const initEditor = () => {
    if (!window.DocsAPI || !editorRef.current) return;

    const fileType = name?.split('.').pop()?.toLowerCase() || '';
    let documentType = 'word';
    if (['xls', 'xlsx'].includes(fileType)) documentType = 'cell';
    else if (['ppt', 'pptx'].includes(fileType)) documentType = 'slide';
    else if (fileType === 'pdf') documentType = 'pdf';

    // In a real app, 'key' should be unique for each version of the file
    const key = `${path}-${new Date().getTime()}`;

    // Construct the URL for OnlyOffice to download the file
    // Since OnlyOffice is in Docker, it might not reach 'localhost'
    // We try to use the current origin, but if it fails, the user might need to use their local IP
    const fileUrl = `${window.location.origin}/api/docs/raw/${path}`;

    try {
      new window.DocsAPI.DocEditor("onlyoffice-editor", {
        document: {
          fileType: fileType,
          key: key,
          title: name,
          url: fileUrl,
        },
        documentType: documentType,
        editorConfig: {
          lang: "zh-CN",
          mode: "view", // Force view mode for preview
          customization: {
            autosave: false,
            chat: false,
            comments: false,
            help: false,
            hideRightMenu: true,
          }
        },
        height: "100%",
        width: "100%",
        events: {
          onAppReady: () => setLoading(false),
          onError: (event: any) => {
            console.error('OnlyOffice Error:', event);
            setError(`OnlyOffice 错误: ${event.data?.error || '未知错误'}`);
            setLoading(false);
          }
        }
      });
    } catch (err) {
      console.error('Editor init failed:', err);
      setError('编辑器初始化失败');
      setLoading(false);
    }
  };

  const getViewWidth = () => {
    switch (viewMode) {
      case 'tablet': return 'max-w-3xl';
      case 'mobile': return 'max-w-sm';
      default: return 'max-w-full';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-medium truncate max-w-[200px] md:max-w-md">{name}</h1>
            <p className="text-[10px] text-zinc-500">在线预览</p>
          </div>
        </div>

        <div className="hidden md:flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-700">
          <Button 
            variant={viewMode === 'desktop' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-3"
            onClick={() => setViewMode('desktop')}
          >
            <Monitor size={16} className="mr-2" />
            桌面
          </Button>
          <Button 
            variant={viewMode === 'tablet' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-3"
            onClick={() => setViewMode('tablet')}
          >
            <Tablet size={16} className="mr-2" />
            平板
          </Button>
          <Button 
            variant={viewMode === 'mobile' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-3"
            onClick={() => setViewMode('mobile')}
          >
            <Phone size={16} className="mr-2" />
            手机
          </Button>
        </div>

        <div className="w-[40px]"></div> {/* Spacer */}
      </div>

      {/* Editor Container */}
      <div className="flex-1 flex justify-center bg-zinc-900 overflow-hidden">
        <div className={`relative w-full h-full transition-all duration-300 ${getViewWidth()}`}>
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
              <p className="text-zinc-400">正在准备预览...</p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900 p-6 text-center">
              <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-4">
                <ArrowLeft size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">预览失败</h2>
              <p className="text-zinc-400 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>重试</Button>
            </div>
          )}

          <div id="onlyoffice-editor" className="w-full h-full"></div>
        </div>
      </div>
    </div>
  );
}
