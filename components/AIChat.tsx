"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Sparkles, User, Bot, Copy, Check, Trash2, 
  Plus, MoreVertical, Clock, Zap, Heart, Star, 
  Download, RefreshCw, Mic, Paperclip, Image as ImageIcon,
  Smile, X, ChevronDown, ChevronUp, MessageSquare, FileText,
  Settings, History, BookMarked, Lightbulb, Wand2
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  likes?: number;
  isLiked?: boolean;
  attachments?: { type: 'image' | 'file'; name: string; url: string }[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatProps {
  darkMode?: boolean;
  onSwitchToPrompts?: () => void;
}

export default function AIChat({ darkMode = false, onSwitchToPrompts }: AIChatProps) {
  const { isMobile } = useSidebar();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(!isMobile);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= 200 && newWidth <= 450) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);
  const [sidebarDesign, setSidebarDesign] = useState<'classic' | 'modern' | 'compact'>('classic');
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    { id: 1, icon: Lightbulb, label: '解释概念', prompt: '请详细解释以下概念，并提供实际例子：' },
    { id: 2, icon: Wand2, label: '代码生成', prompt: '请帮我生成以下功能的代码：' },
    { id: 3, icon: BookMarked, label: '总结文档', prompt: '请帮我总结这篇文档的核心要点：' },
    { id: 4, icon: Sparkles, label: '创意写作', prompt: '请帮我创作一个关于' },
  ];

  useEffect(() => {
    const initialConversation: Conversation = {
      id: '1',
      title: '新对话',
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: '你好！我是你的 AI 助手，很高兴为你服务。我可以帮助你解答问题、生成内容、总结文档等。请问有什么我可以帮助你的吗？',
          timestamp: new Date(),
          likes: 0,
          isLiked: false,
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations([initialConversation]);
    setCurrentConversationId('1');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, currentConversationId]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === currentConversationId) {
          const updatedConv = {
            ...conv,
            messages: [...conv.messages, userMessage],
            updatedAt: new Date(),
          };
          if (conv.messages.length === 1) {
            updatedConv.title = inputMessage.slice(0, 20) + (inputMessage.length > 20 ? '...' : '');
          }
          return updatedConv;
        }
        return conv;
      });
    });

    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
        likes: 0,
        isLiked: false,
      };

      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        });
      });
      setIsTyping(false);
    }, 1500);
  }, [inputMessage, currentConversationId]);

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      `这是一个很好的问题！关于"${userInput.slice(0, 30)}..."，我可以从以下几个方面来解答...`,
      `让我来帮你分析一下。根据你的需求，我建议...`,
      `我理解你想要了解"${userInput.slice(0, 20)}..."。这里有几个要点需要考虑...`,
      `很高兴为你解答！关于这个问题，我的看法是...`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [
        {
          id: Date.now().toString() + '_welcome',
          role: 'assistant',
          content: '你好！我是你的 AI 助手，很高兴为你服务。我可以帮助你解答问题、生成内容、总结文档等。请问有什么我可以帮助你的吗？',
          timestamp: new Date(),
          likes: 0,
          isLiked: false,
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations([newConversation, ...conversations]);
    setCurrentConversationId(newConversation.id);
    setShowHistory(false);
  };

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (conversations.length === 1) {
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            title: '新对话',
            messages: [{
              id: Date.now().toString(),
              role: 'assistant',
              content: '你好！我是你的 AI 助手，很高兴为你服务。我可以帮助你解答问题、生成内容、总结文档等。请问有什么我可以帮助你的吗？',
              timestamp: new Date(),
            }],
            updatedAt: new Date(),
          };
        }
        return conv;
      }));
    } else {
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);
      if (currentConversationId === conversationId) {
        setCurrentConversationId(updatedConversations[0]?.id || null);
      }
    }
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleLikeMessage = (messageId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: conv.messages.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                likes: (msg.likes || 0) + (msg.isLiked ? -1 : 1),
                isLiked: !msg.isLiked,
              };
            }
            return msg;
          }),
        };
      }
      return conv;
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
    setShowQuickPrompts(false);
  };

  const toggleSidebarDesign = () => {
    const designs: ('classic' | 'modern' | 'compact')[] = ['classic', 'modern', 'compact'];
    const currentIndex = designs.indexOf(sidebarDesign);
    setSidebarDesign(designs[(currentIndex + 1) % designs.length]);
  };

  return (
    <div className="flex h-full bg-[var(--content-bg)] overflow-hidden relative">
      {/* 左侧对话历史侧边栏 */}
      <div 
        className={`
          absolute lg:relative z-40 lg:z-auto h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${showHistory ? 'translate-x-0 opacity-100' : '-translate-x-full lg:translate-x-0 lg:opacity-0'}
          ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}
          border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl lg:shadow-none
        `}
        style={{ width: showHistory ? `${sidebarWidth}px` : '0px' }}
      >
        {/* 侧边栏头部 */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-indigo)] flex items-center justify-center text-white">
              <History size={18} />
            </div>
            <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>对话历史</span>
          </div>
          <button 
            onClick={() => setShowHistory(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* 新建对话按钮 */}
        <div className="p-4">
          <button
            onClick={handleNewConversation}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold text-sm
              ${darkMode 
                ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' 
                : 'bg-[var(--primary-indigo)] hover:bg-indigo-600 text-white shadow-lg shadow-indigo-200'}
            `}
          >
            <Plus size={18} />
            <span>开启新对话</span>
          </button>
        </div>

        {/* 对话列表 */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-3 ${sidebarDesign === 'compact' ? 'space-y-0.5' : 'space-y-2'}`}>
          {conversations.length > 0 ? (
            conversations.map(conv => {
              const isActive = currentConversationId === conv.id;
              
              if (sidebarDesign === 'modern') {
                return (
                  <div
                    key={conv.id}
                    onClick={() => setCurrentConversationId(conv.id)}
                    className={`
                      group p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden
                      ${isActive
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none translate-x-1'
                        : 'bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                        ${isActive ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500'}
                      `}>
                        <MessageSquare size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                          {conv.title}
                        </p>
                        <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                          {conv.messages[conv.messages.length - 1]?.content || '开始新对话'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className={`
                          opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all shrink-0
                          ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500'}
                        `}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              if (sidebarDesign === 'compact') {
                return (
                  <div
                    key={conv.id}
                    onClick={() => setCurrentConversationId(conv.id)}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                      ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'}
                    `}
                  >
                    <MessageSquare size={14} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
                    <span className={`flex-1 text-xs truncate font-medium ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      {conv.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              }

              // Classic Design (Default)
              return (
                <div
                  key={conv.id}
                  onClick={() => setCurrentConversationId(conv.id)}
                  className={`
                    group p-3 rounded-xl cursor-pointer transition-all duration-200 relative border
                    ${isActive
                      ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'
                      : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare size={16} className={`
                      shrink-0 mt-0.5 ${isActive ? 'text-[var(--primary-indigo)]' : 'text-slate-400'}
                    `} />
                    <div className="flex-1 min-w-0">
                      <p className={`
                        font-bold text-sm truncate mb-0.5 ${isActive
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300'}
                      `}>
                        {conv.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {conv.messages[conv.messages.length - 1]?.content || '无消息'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-40">
              <Clock size={32} className="mb-2" />
              <p className="text-xs italic">暂无历史记录</p>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className={`
            absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-400/30 transition-colors z-50
            ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}
          `}
        />
      </div>

      {/* 主对话区域 */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* 顶部工具栏 */}
        <header className={`h-16 border-b transition-theme ${darkMode ? 'bg-[#131314]/80 border-white/5' : 'bg-white/80 border-black/5'} backdrop-blur-xl z-30`}>
          <div className="w-full max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[var(--primary-indigo)] transition-all animate-fade-in"
                  title="显示历史"
                >
                  <History size={20} />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--primary-indigo)]/10 text-[var(--primary-indigo)] flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className={`font-bold text-base leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    AI 智能助手
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">在线回复中</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchToPrompts}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                  ${darkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}
                `}
              >
                <Wand2 size={16} />
                <span>提示词库</span>
              </button>
              <button
                onClick={handleNewConversation}
                className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                title="新建对话"
              >
                <Plus size={22} />
              </button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
              <button
                onClick={toggleSidebarDesign}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm
                  ${darkMode 
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5' 
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}
                `}
                title={`切换布局 (当前: ${sidebarDesign === 'classic' ? '经典' : sidebarDesign === 'modern' ? '现代' : '紧凑'})`}
              >
                <History size={14} className="text-[var(--primary-indigo)]" />
                <span className="hidden sm:inline">
                  {sidebarDesign === 'classic' ? '经典布局' : sidebarDesign === 'modern' ? '现代布局' : '紧凑布局'}
                </span>
              </button>
              <button
                className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                title="对话设置"
              >
                <Settings size={22} />
              </button>
            </div>
          </div>
        </header>

        {/* 消息列表区域 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-transparent">
          <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
            {currentConversation?.messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-4 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {message.role === 'assistant' && (
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 shadow-sm
                    ${darkMode ? 'bg-slate-800 border border-white/5' : 'bg-white border border-slate-100'}
                  `}>
                    <Bot size={22} className="text-[var(--primary-indigo)]" />
                  </div>
                )}
                
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%]`}>
                  <div className={`
                    rounded-3xl px-6 py-4 shadow-sm transition-all text-sm leading-relaxed
                    ${message.role === 'user'
                      ? 'bg-[var(--primary-indigo)] text-white font-medium rounded-tr-none'
                      : (darkMode ? 'bg-[#1a1a1a] border border-white/10 text-slate-200 rounded-tl-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none')}
                  `}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* 消息工具栏 */}
                  <div className="flex items-center gap-4 mt-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.role === 'assistant' && (
                      <>
                        <button
                          onClick={() => handleLikeMessage(message.id)}
                          className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${message.isLiked ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <Heart size={14} fill={message.isLiked ? "currentColor" : "none"} />
                          {message.likes && message.likes > 0 ? message.likes : '赞'}
                        </button>
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className={`flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors`}
                        >
                          {copiedMessageId === message.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          {copiedMessageId === message.id ? '已复制' : '复制'}
                        </button>
                      </>
                    )}
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 shadow-sm
                    ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}
                  `}>
                    <User size={22} className={darkMode ? 'text-slate-300' : 'text-slate-500'} />
                  </div>
                )}
              </div>
            ))}
            
            {/* 打字中动画 */}
            {isTyping && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 shadow-sm
                  ${darkMode ? 'bg-slate-800 border border-white/5' : 'bg-white border border-slate-100'}
                `}>
                  <Bot size={22} className="text-[var(--primary-indigo)]" />
                </div>
                <div className={`
                  rounded-3xl px-6 py-4 flex items-center gap-1 rounded-tl-none
                  ${darkMode ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white border border-slate-100'}
                `}>
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--primary-indigo)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[var(--primary-indigo)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[var(--primary-indigo)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* 底部输入区域 */}
        <div className={`p-6 border-t ${darkMode ? 'border-white/10 bg-[#131314]' : 'border-slate-100 bg-white'}`}>
          <div className="w-full max-w-7xl mx-auto space-y-4">
            {/* 快速提示词标签 */}
            <div className="flex flex-wrap gap-2">
              {quickPrompts.slice(0, 4).map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => handleQuickPrompt(prompt.prompt)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all
                    ${darkMode ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100'}
                  `}
                >
                  <prompt.icon size={12} className="text-[var(--primary-indigo)]" />
                  <span>{prompt.label}</span>
                </button>
              ))}
              <button 
                onClick={() => setShowQuickPrompts(!showQuickPrompts)}
                className={`p-1.5 rounded-full ${darkMode ? 'bg-white/5' : 'bg-slate-50'} text-slate-400`}
              >
                <ChevronDown size={14} className={`transition-transform duration-200 ${showQuickPrompts ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* 输入框核心 */}
            <div className={`
              relative rounded-3xl border-2 transition-all duration-300 group
              ${darkMode 
                ? 'bg-[#1a1a1a] border-white/5 focus-within:border-[var(--primary-indigo)]/50 focus-within:ring-4 focus-within:ring-indigo-500/10' 
                : 'bg-slate-50 border-slate-100 focus-within:border-[var(--primary-indigo)] focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5'}
            `}>
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="询问任何问题..."
                rows={1}
                className="w-full px-6 py-4 pr-32 bg-transparent resize-none outline-none text-sm font-medium"
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />
              
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/10 text-slate-500' : 'hover:bg-slate-200/50 text-slate-400'}`}>
                  <Paperclip size={18} />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-2xl transition-all
                    ${inputMessage.trim() && !isTyping
                      ? 'bg-[var(--primary-indigo)] text-white shadow-lg shadow-indigo-500/30 scale-100 hover:scale-105 active:scale-95'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed scale-95'}
                  `}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 font-medium">
              AI 助手可能会产生错误，请核实重要信息。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
