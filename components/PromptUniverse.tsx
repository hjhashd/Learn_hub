"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Heart, Star, Search, Copy, Plus, Trash2, Pencil, 
  Check, X, Sparkles, Feather, Scroll, Wand2, BookOpen,
  ChevronRight, MoreHorizontal, Terminal, Lightbulb, 
  Coffee, Palette, Code, User, Zap, MessageSquare,
  Smile, Settings, Briefcase, GraduationCap
} from 'lucide-react';
import { PromptItem } from '@/types/knowledge';
import { getAllPrompts, searchPromptsApi, savePrompt, deletePrompt } from '@/lib/api-client';

// 可选图标列表
const ICON_OPTIONS = [
  { id: 'Sparkles', icon: Sparkles, label: '闪耀' },
  { id: 'Feather', icon: Feather, label: '羽毛' },
  { id: 'Terminal', icon: Terminal, label: '终端' },
  { id: 'Lightbulb', icon: Lightbulb, label: '灵感' },
  { id: 'Code', icon: Code, label: '代码' },
  { id: 'User', icon: User, label: '人设' },
  { id: 'MessageSquare', icon: MessageSquare, label: '对话' },
  { id: 'Wand2', icon: Wand2, label: '魔法' },
  { id: 'Coffee', icon: Coffee, label: '生活' },
  { id: 'Palette', icon: Palette, label: '艺术' },
  { id: 'Zap', icon: Zap, label: '快捷' },
  { id: 'BookOpen', icon: BookOpen, label: '学习' },
  { id: 'Settings', icon: Settings, label: '配置' },
  { id: 'Briefcase', icon: Briefcase, label: '职场' },
  { id: 'GraduationCap', icon: GraduationCap, label: '学术' },
];

interface PromptUniverseProps {
  darkMode?: boolean;
  onBackToChat?: () => void;
}

export default function PromptUniverse({ darkMode = false, onBackToChat }: PromptUniverseProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PromptItem | null>(null);
  const isInitialMount = useRef(true);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formTags, setFormTags] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIcon, setFormIcon] = useState('Sparkles');
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Copy Feedback State for Modal
  const [modalCopied, setModalCopied] = useState(false);

  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        const items = await getAllPrompts(1, 500);
        setPrompts(items);
        const initLikes: Record<string, boolean> = {};
        items.forEach(i => { initLikes[i.id] = !!i.favorite; });
        setLikes(initLikes);
      } catch (e) {
        console.error("Failed to load prompts", e);
      }
    };
    load();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
        setSelectedPrompt(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openDetail = (p: PromptItem) => {
    setSelectedPrompt(p);
  };

  const closeDetail = () => {
    setSelectedPrompt(null);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const t = setTimeout(async () => {
      const q = searchTerm.trim();
      if (q.length >= 2) {
        try {
          const items = await searchPromptsApi(q);
          setPrompts(items);
        } catch {}
      } else if (q.length === 0) {
        try {
          const items = await getAllPrompts(1, 500);
          setPrompts(items);
        } catch {}
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const getCardStyle = (p: PromptItem) => {
    const key = (p.category || (p.tags && p.tags[0] ? p.tags[0] : '')).toLowerCase();
    
    // Find icon component from p.icon or default by category
     const iconId = p.icon || '';
     const iconOption = ICON_OPTIONS.find(opt => opt.id === iconId);
     const IconComp = iconOption ? iconOption.icon : null;

    if (key.includes('roleplay') || key.includes('人设')) return { text: 'text-blue-600', bg: 'bg-blue-50', darkText: 'text-blue-400', darkBg: 'bg-blue-950/30', Icon: IconComp || User };
    if (key.includes('creative') || key.includes('创意')) return { text: 'text-purple-600', bg: 'bg-purple-50', darkText: 'text-purple-400', darkBg: 'bg-purple-950/30', Icon: IconComp || Sparkles };
    if (key.includes('prog') || key.includes('编程')) return { text: 'text-emerald-600', bg: 'bg-emerald-50', darkText: 'text-emerald-400', darkBg: 'bg-emerald-950/30', Icon: IconComp || Code };
    if (key.includes('life') || key.includes('生活')) return { text: 'text-orange-600', bg: 'bg-orange-50', darkText: 'text-orange-400', darkBg: 'bg-orange-950/30', Icon: IconComp || Coffee };
    
    return { text: 'text-slate-600', bg: 'bg-slate-50', darkText: 'text-slate-400', darkBg: 'bg-slate-900/50', Icon: IconComp || Sparkles };
  };

  const filteredPrompts = useMemo(() => {
    const byTab = (p: PromptItem) => {
      if (activeTab === 'All') return true;
      const cat = (p.category || '').toLowerCase();
      const tags = (p.tags || []).map(t => t.toLowerCase());
      
      if (activeTab === 'Roleplay') return cat.includes('roleplay') || tags.includes('roleplay') || cat.includes('人设') || tags.includes('人设');
      if (activeTab === 'Creative') return cat.includes('creative') || tags.includes('creative') || cat.includes('创意') || tags.includes('创意');
      if (activeTab === 'Programming') return cat.includes('prog') || tags.includes('prog') || cat.includes('编程') || tags.includes('编程');
      if (activeTab === 'Life') return cat.includes('life') || tags.includes('life') || cat.includes('生活') || tags.includes('生活');
      return true;
    };
    const q = searchTerm.trim().toLowerCase();
    return prompts.filter(p => byTab(p) && (q === '' || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)));
  }, [prompts, activeTab, searchTerm]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleModalCopy = () => {
    if (!formContent) return;
    navigator.clipboard.writeText(formContent);
    setModalCopied(true);
    setTimeout(() => setModalCopied(false), 2000);
  };

  const handleLike = async (id: string) => {
    const isLiked = !!likes[id];
    setLikes(prev => ({ ...prev, [id]: !isLiked }));
    
    // Proactively update prompts state to avoid full re-fetch
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, favorite: !isLiked } : p));
    
    const target = prompts.find(p => p.id === id);
    if (target) {
      try {
        await savePrompt({ ...target, favorite: !isLiked });
      } catch (e) {
        // Rollback on failure
        setLikes(prev => ({ ...prev, [id]: isLiked }));
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, favorite: isLiked } : p));
      }
    }
  };

  const uniqueCategories = useMemo(() => {
    const cats = new Set(prompts.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [prompts]);

  const openCreate = () => {
    setCreating(true);
    setFormTitle('');
    setFormCategory('general');
    setFormTags('');
    setFormContent('');
    setFormIcon('Sparkles');
    setFormErrors({});
    setModalCopied(false);
  };

  const openEdit = (p: PromptItem) => {
    setEditing(p);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormTags((p.tags || []).join(', '));
    setFormContent(p.content);
    setFormIcon(p.icon || 'Sparkles');
    setFormErrors({});
    setModalCopied(false);
  };

  const closePanel = () => {
    setCreating(false);
    setEditing(null);
  };

  const submitForm = async () => {
    // Validation
    const errors: Record<string, string> = {};
    if (!formTitle.trim()) errors.title = '请输入标题';
    if (!formContent.trim()) errors.content = '请输入提示词内容';
    if (!formCategory.trim()) errors.category = '请选择或输入分类';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setFormErrors({});
    
    try {
      const tags = formTags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
      const newItem: PromptItem = {
        id: editing ? editing.id : Date.now().toString(),
        title: formTitle,
        category: formCategory,
        tags,
        content: formContent,
        favorite: editing ? editing.favorite : false,
        icon: formIcon
      };
      
      await savePrompt(newItem);
      
      // Update local state proactively
      if (editing) {
        setPrompts(prev => prev.map(p => p.id === editing.id ? newItem : p));
      } else {
        setPrompts(prev => [newItem, ...prev]);
      }
      
      closePanel();
    } catch (e) {
      console.error("Failed to save", e);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const removePrompt = async (id: string) => {
    if (!confirm('确定要删除这个提示词吗？')) return;
    try {
      await deletePrompt(id);
      setPrompts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('删除失败');
    }
  };

  const tabDisplayMap: Record<string, string> = {
    'All': '全部',
    'Roleplay': '人设扮演',
    'Creative': '创意写作',
    'Programming': '编程助手',
    'Life': '生活应用'
  };

  return (
    <div className={`flex flex-col h-full font-sans ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
      
      {/* Header Area */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {onBackToChat && (
              <button
                onClick={onBackToChat}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${darkMode 
                    ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' 
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}
                `}
              >
                <ChevronRight size={16} className="rotate-180" />
                <span>返回 AI 对话</span>
              </button>
            )}
          </div>
          <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>提示词宇宙</h1>
          <p className="text-sm text-slate-500 mt-1">管理并发现高效的 AI 提示词</p>
        </div>
      </div>
      
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 sticky top-0 z-20 bg-inherit py-2 backdrop-blur-sm">
         <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-all duration-200 flex-1
           ${darkMode 
             ? 'bg-white/5 border-white/10 focus-within:border-[var(--primary-indigo)] focus-within:bg-white/10' 
             : 'bg-white border-slate-200 focus-within:border-[var(--primary-indigo)] focus-within:shadow-sm'}
         `}>
           <Search size={18} className="text-slate-400" />
           <input 
             type="text" 
             placeholder="搜索提示词..." 
             className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-500"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
         
         <button 
            onClick={openCreate} 
            className={`
              px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shrink-0 active:scale-[0.98] shadow-lg
              ${darkMode 
                ? 'bg-[var(--primary-indigo)] text-white hover:brightness-110 shadow-indigo-500/20' 
                : 'bg-[var(--primary-indigo)] text-white hover:brightness-110 shadow-indigo-500/20'}
            `}
         >
           <Plus size={18} />
           <span>新增提示词</span>
         </button>
      </div>

      {/* Categories */}
      <div className={`pb-6 flex gap-2 overflow-x-auto scrollbar-hide border-b mb-6 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
         {['All', 'Roleplay', 'Creative', 'Programming', 'Life'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
               ${activeTab === tab 
                 ? (darkMode 
                    ? 'bg-white/10 text-[var(--primary-indigo)]' 
                    : 'bg-indigo-50 text-[var(--primary-indigo)] shadow-sm')
                 : (darkMode 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}
             `}
           >
             {tabDisplayMap[tab] || tab}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
         {filteredPrompts.map(p => (
           <SpellCard 
             key={p.id} 
             data={{
               id: p.id,
               title: p.title,
               description: p.description || p.content.slice(0, 100) + '...',
               tag: (p.tags && p.tags[0]) ? p.tags[0] : (p.category || 'Prompt'),
               style: getCardStyle(p),
               content: p.content,
               likes: 1000 + (p.id ? (parseInt(String(p.id).slice(-2), 10) || 0) : 0)
             }} 
             darkMode={darkMode}
             onCopy={handleCopy} 
             isLiked={!!likes[p.id]}
             onLike={() => handleLike(p.id)}
             onEdit={() => openEdit(p)}
             onDelete={() => removePrompt(p.id)}
             onView={() => openDetail(p)}
           />
         ))}
      </div>

      {/* Modals - Rendered via Portal to ensure full screen coverage */}
      {mounted && createPortal(
        <>
          {/* Modal for Create/Edit */}
          {(creating || editing) && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300
                ${darkMode ? 'bg-[var(--sidebar-bg)] border-white/10' : 'bg-white border-slate-200'}
              `}>
                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center border-b ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {editing ? '编辑提示词' : '创建提示词'}
                  </h3>
                  <button onClick={closePanel} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">标题</label>
                    <input 
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none
                        ${darkMode 
                          ? 'bg-white/5 border-white/10 text-slate-200 focus:border-[var(--primary-indigo)] focus:bg-white/10' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[var(--primary-indigo)] focus:bg-white focus:shadow-sm'}
                        ${formErrors.title ? 'border-red-500 focus:border-red-500' : ''}
                      `}
                      value={formTitle} 
                      onChange={e => setFormTitle(e.target.value)} 
                      placeholder="提示词标题..." 
                    />
                    {formErrors.title && <p className="text-[10px] font-bold text-red-500 mt-1 ml-1">{formErrors.title}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">分类</label>
                      <div className="relative group/select">
                        <input 
                          className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none
                            ${darkMode 
                              ? 'bg-white/5 border-white/10 text-slate-200 focus:border-[var(--primary-indigo)] focus:bg-white/10' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[var(--primary-indigo)] focus:bg-white focus:shadow-sm'}
                            ${formErrors.category ? 'border-red-500 focus:border-red-500' : ''}
                          `}
                          value={formCategory} 
                          onChange={e => setFormCategory(e.target.value)} 
                          placeholder="选择或输入..." 
                        />
                        <div className={`absolute top-full left-0 w-full mt-2 border rounded-xl shadow-xl z-30 hidden group-focus-within/select:block overflow-hidden
                          ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}
                        `}>
                          <div className="max-h-40 overflow-y-auto p-1 custom-scrollbar">
                            {uniqueCategories.filter(c => c.toLowerCase().includes(formCategory.toLowerCase())).map(c => (
                              <button
                                key={c}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                                  ${darkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-600'}
                                `}
                                onClick={() => setFormCategory(c)}
                              >
                                {c}
                              </button>
                            ))}
                            {uniqueCategories.filter(c => c.toLowerCase().includes(formCategory.toLowerCase())).length === 0 && (
                              <div className="px-3 py-2 text-xs text-slate-500 italic">新建分类: {formCategory}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      {formErrors.category && <p className="text-[10px] font-bold text-red-500 mt-1 ml-1">{formErrors.category}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">图标</label>
                      <div className="relative group/icons">
                        <button 
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all outline-none
                            ${darkMode 
                              ? 'bg-white/5 border-white/10 text-slate-200 focus:border-[var(--primary-indigo)] focus:bg-white/10' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[var(--primary-indigo)] focus:bg-white focus:shadow-sm'}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = ICON_OPTIONS.find(opt => opt.id === formIcon)?.icon || Sparkles;
                              return <Icon size={18} className="text-[var(--primary-indigo)]" />;
                            })()}
                            <span className="font-medium">{ICON_OPTIONS.find(opt => opt.id === formIcon)?.label || '选择图标'}</span>
                          </div>
                          <ChevronRight size={16} className="rotate-90 text-slate-400" />
                        </button>
                        <div className={`absolute top-full left-0 w-full mt-2 border rounded-xl shadow-xl z-30 hidden group-focus-within/icons:block overflow-hidden
                          ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}
                        `}>
                          <div className="grid grid-cols-5 gap-1 p-2">
                            {ICON_OPTIONS.map(opt => {
                              const Icon = opt.icon;
                              return (
                                <button
                                  key={opt.id}
                                  title={opt.label}
                                  className={`p-2.5 rounded-lg transition-all flex items-center justify-center
                                    ${formIcon === opt.id 
                                      ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                                      : (darkMode ? 'hover:bg-white/5 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600')}
                                  `}
                                  onClick={() => setFormIcon(opt.id)}
                                >
                                  <Icon size={20} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">标签</label>
                    <input 
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none
                        ${darkMode 
                          ? 'bg-white/5 border-white/10 text-slate-200 focus:border-[var(--primary-indigo)] focus:bg-white/10' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[var(--primary-indigo)] focus:bg-white focus:shadow-sm'}
                      `}
                      value={formTags} 
                      onChange={e => setFormTags(e.target.value)} 
                      placeholder="标签，逗号分隔..." 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">提示词内容</label>
                    <textarea 
                      className={`w-full h-48 px-4 py-3 rounded-xl border text-sm font-mono transition-all outline-none resize-none
                        ${darkMode 
                          ? 'bg-white/5 border-white/10 text-slate-300 focus:border-[var(--primary-indigo)] focus:bg-white/10' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-[var(--primary-indigo)] focus:bg-white focus:shadow-sm'}
                        ${formErrors.content ? 'border-red-500 focus:border-red-500' : ''}
                      `}
                      value={formContent} 
                      onChange={e => setFormContent(e.target.value)} 
                      placeholder="在此输入提示词详情..." 
                      spellCheck={false}
                    />
                    {formErrors.content && <p className="text-[10px] font-bold text-red-500 mt-1 ml-1">{formErrors.content}</p>}
                  </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                  <button 
                    onClick={closePanel} 
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all
                      ${darkMode 
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}
                    `}
                  >
                    取消
                  </button>
                  <button 
                    onClick={submitForm} 
                    disabled={saving || !formTitle || !formContent} 
                    className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg
                      ${darkMode 
                        ? 'bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50' 
                        : 'bg-[var(--primary-indigo)] hover:bg-indigo-600 disabled:opacity-50 shadow-indigo-200'}
                    `}
                  >
                    {saving ? '保存中...' : '保存提示词'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal for Detail View */}
          {selectedPrompt && (
            <DetailModal 
              prompt={selectedPrompt} 
              onClose={closeDetail} 
              darkMode={darkMode} 
              onCopy={handleCopy}
              onEdit={openEdit}
            />
          )}
        </>,
        document.body
      )}
    </div>
  );
}

const SpellCard = ({ data, onCopy, isLiked, onLike, onEdit, onDelete, onView, darkMode }: any) => {
  const [copied, setCopied] = useState(false);
  const Icon = data.style.Icon || Sparkles;

  const handleCardCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={onView}
      className={`
      group relative flex flex-col p-5 transition-all duration-300 cursor-pointer border rounded-2xl overflow-hidden
      ${darkMode 
        ? 'bg-white/5 border-white/10 hover:border-[var(--primary-indigo)]/50 hover:bg-white/10 shadow-lg' 
        : 'bg-white border-slate-100 hover:border-[var(--primary-indigo)] hover:shadow-xl hover:shadow-indigo-500/5'}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${darkMode ? data.style.darkText + ' ' + data.style.darkBg : data.style.text + ' ' + data.style.bg}`}>
          <Icon size={14} />
          {data.tag}
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <h3 className={`text-base font-bold mb-2 line-clamp-1 transition-colors ${darkMode ? 'text-slate-100 group-hover:text-[var(--primary-indigo)]' : 'text-slate-900 group-hover:text-[var(--primary-indigo)]'}`}>
        {data.title}
      </h3>
      
      <p className={`text-xs leading-relaxed mb-6 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {data.description}
      </p>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className={`flex items-center gap-2 text-xs font-bold transition-all hover:scale-110 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            <span>{data.likes + (isLiked ? 1 : 0)}</span>
          </button>
        </div>

        <button 
          onClick={handleCardCopy}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95
            ${copied 
              ? 'bg-emerald-500 text-white' 
              : (darkMode 
                  ? 'bg-white/5 text-slate-300 hover:bg-[var(--primary-indigo)] hover:text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-[var(--primary-indigo)] hover:text-white')}
          `}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
    </div>
  );
};

// New Detail Modal Component
interface DetailModalProps {
  prompt: PromptItem;
  onClose: () => void;
  darkMode: boolean;
  onCopy: (text: string) => void;
  onEdit: (p: PromptItem) => void;
}

const DetailModal = ({ prompt, onClose, darkMode, onCopy, onEdit }: DetailModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const handleCopy = () => {
    onCopy(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300
        ${darkMode ? 'bg-[var(--sidebar-bg)] border-white/10' : 'bg-white border-slate-200'}
      `}>
        {/* Header */}
        <div className={`px-8 py-6 flex justify-between items-center border-b ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-6">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {prompt.title}
            </h3>
            <div className="flex gap-2">
              {(prompt.tags || []).map((t: string) => (
                <span key={t} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { onEdit(prompt); onClose(); }}
              className={`p-2.5 rounded-xl transition-all hover:scale-110 ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              title="编辑"
            >
              <Pencil size={20} />
            </button>
            <button 
              onClick={onClose}
              className={`p-2.5 rounded-full transition-all hover:scale-110 ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left side: Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Scroll size={16} /> 提示词内容
                  </h4>
                  <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm
                      ${copied 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                        : (darkMode ? 'bg-white/10 text-slate-200 hover:bg-[var(--primary-indigo)]' : 'bg-slate-900 text-slate-50 hover:bg-[var(--primary-indigo)]')}
                    `}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? '已复制' : '复制提示词'}
                  </button>
                </div>
                <div className={`p-6 rounded-2xl font-mono text-sm leading-relaxed border whitespace-pre-wrap shadow-inner
                  ${darkMode ? 'bg-black/20 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}
                `}>
                  {prompt.content}
                </div>
              </section>

              {prompt.description && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                    <Sparkles size={16} /> 核心逻辑 / Logic
                  </h4>
                  <div className={`p-6 rounded-2xl border leading-relaxed text-sm
                    ${darkMode ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-white border-slate-100 text-slate-600'}
                  `}>
                    {prompt.description}
                  </div>
                </section>
              )}
            </div>

            {/* Right side: Meta Info */}
            <div className="space-y-10">
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
                   <BookOpen size={16} /> 使用场景
                </h4>
                <div className="flex flex-wrap gap-2">
                  {prompt.scenarios && prompt.scenarios.length > 0 ? (
                    prompt.scenarios.map((s: string) => (
                      <span key={s} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                        ${darkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:border-[var(--primary-indigo)]'}
                      `}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed text-xs italic
                      ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}
                    `}>
                      未定义使用场景
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
                   <Zap size={16} /> 预期效果
                </h4>
                <div className="space-y-3">
                  {prompt.expected_outputs && prompt.expected_outputs.length > 0 ? (
                    prompt.expected_outputs.map((o: string, i: number) => (
                      <div key={i} className={`flex items-start gap-3 p-4 rounded-xl text-xs transition-all
                        ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md hover:shadow-slate-200/50'}
                      `}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary-indigo)] mt-1.5 shrink-0" />
                        {o}
                      </div>
                    ))
                  ) : (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed text-xs italic
                      ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}
                    `}>
                      未定义预期效果
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
                   <Terminal size={16} /> 参数说明
                </h4>
                <div className="space-y-4">
                  {prompt.parameters && prompt.parameters.length > 0 ? (
                    prompt.parameters.map((p: any) => (
                      <div key={p.name} className={`p-4 rounded-xl border transition-all
                        ${darkMode ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-white border-slate-100 hover:border-[var(--primary-indigo)] hover:shadow-lg hover:shadow-indigo-500/5'}
                      `}>
                        <code className={`text-xs font-bold px-2 py-0.5 rounded-md ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{`{${p.name}}`}</code>
                        <p className={`text-[11px] mt-2 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed text-xs italic
                      ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}
                    `}>
                      无需配置参数
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
