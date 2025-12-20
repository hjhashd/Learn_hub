"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, Star, Search, Copy, Plus, Trash2, Pencil, 
  Check, X, Sparkles, Feather, Scroll, Wand2, BookOpen 
} from 'lucide-react';
import { PromptItem } from '@/types/knowledge';
import { getAllPrompts, searchPromptsApi, savePrompt, deletePrompt } from '@/lib/api-client';

interface PromptUniverseProps {
  darkMode?: boolean;
}

export default function PromptUniverse({ darkMode = false }: PromptUniverseProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PromptItem | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formTags, setFormTags] = useState('');
  const [formContent, setFormContent] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Copy Feedback State for Modal
  const [modalCopied, setModalCopied] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = searchTerm.trim();
      if (q.length >= 2) {
        try {
          const items = await searchPromptsApi(q);
          setPrompts(items);
        } catch {}
      } else {
        try {
          const items = await getAllPrompts(1, 500);
          setPrompts(items);
        } catch {}
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const cardColor = (p: PromptItem) => {
    const key = (p.category || (p.tags[0] || '')).toLowerCase();
    if (key.includes('角色') || key.includes('character')) return darkMode ? 'bg-pink-900/30 text-pink-300' : 'bg-pink-100 text-pink-600';
    if (key.includes('场景') || key.includes('scenery')) return darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600';
    if (key.includes('赛博') || key.includes('cyber')) return darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-600';
    if (key.includes('设定') || key.includes('setting')) return darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-600';
    return darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-600';
  };

  const filteredPrompts = useMemo(() => {
    const byTab = (p: PromptItem) => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Character') return (p.category.toLowerCase().includes('character')) || p.tags.some(t => t.toLowerCase().includes('character'));
      if (activeTab === 'Scenery') return (p.category.toLowerCase().includes('scenery')) || p.tags.some(t => t.toLowerCase().includes('scenery'));
      if (activeTab === 'Cyberpunk') return (p.category.toLowerCase().includes('cyber')) || p.tags.some(t => t.toLowerCase().includes('cyber'));
      if (activeTab === 'Magical') return (p.category.toLowerCase().includes('magical')) || p.tags.some(t => t.toLowerCase().includes('magical'));
      return true;
    };
    const q = searchTerm.trim().toLowerCase();
    return prompts.filter(p => byTab(p) && (q === '' || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)));
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
    setLikes(prev => ({ ...prev, [id]: !prev[id] }));
    const target = prompts.find(p => p.id === id);
    if (target) {
      try {
        await savePrompt({ ...target, favorite: !target.favorite });
        const items = await getAllPrompts(1, 500);
        setPrompts(items);
      } catch {}
    }
  };

  const openCreate = () => {
    setCreating(true);
    setFormTitle('');
    setFormCategory('general');
    setFormTags('');
    setFormContent('');
    setModalCopied(false);
  };

  const openEdit = (p: PromptItem) => {
    setEditing(p);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormTags((p.tags || []).join(', '));
    setFormContent(p.content);
    setModalCopied(false);
  };

  const closePanel = () => {
    setCreating(false);
    setEditing(null);
  };

  const submitForm = async () => {
    if (!formTitle || !formContent) return;
    setSaving(true);
    try {
      const tags = formTags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
      const newItem: PromptItem = {
        id: editing ? editing.id : Date.now().toString(),
        title: formTitle,
        category: formCategory,
        tags,
        content: formContent,
        favorite: editing ? editing.favorite : false,
      };
      await savePrompt(newItem);
      const items = await getAllPrompts(1, 500);
      setPrompts(items);
      closePanel();
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setSaving(false);
    }
  };

  const removePrompt = async (id: string) => {
    if (!confirm('确定要让这道咒语消散吗？')) return;
    try {
      await deletePrompt(id);
      const items = await getAllPrompts(1, 500);
      setPrompts(items);
    } catch {}
  };

  const tabDisplayMap: Record<string, string> = {
    'All': '森罗万象',
    'Character': '众生绘卷',
    'Scenery': '山河秘境',
    'Cyberpunk': '霓虹幻梦',
    'Magical': '奇迹之术'
  };

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'text-slate-200' : 'text-slate-600'}`}>
      
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 sticky top-0 z-10 p-2 backdrop-blur-md bg-opacity-80 rounded-xl transition-all">
         <div className={`flex items-center gap-4 rounded-full px-6 py-3 shadow-sm border flex-1 transition-all focus-within:ring-2 duration-500
           ${darkMode 
             ? 'bg-[#1e1e20] border-slate-700 focus-within:ring-blue-500/50' 
             : 'bg-white border-slate-100 focus-within:ring-pink-200'}
         `}>
           <Search size={18} className="text-slate-400" />
           <input 
             type="text" 
             placeholder="寻觅失落的奥秘... / Search Spells" 
             className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
         
         <button 
            onClick={openCreate} 
            className={`
              px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all flex items-center gap-2 shrink-0 group
              ${darkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20' 
                : 'bg-slate-800 text-white shadow-slate-200 hover:bg-slate-700 hover:scale-105'}
            `}
         >
           <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
           <span className="hidden sm:inline">镌刻新篇章</span>
         </button>
      </div>

      {/* Categories */}
      <div className="pb-6 flex gap-3 overflow-x-auto scrollbar-hide">
         {['All', 'Character', 'Scenery', 'Cyberpunk', 'Magical'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap
               ${activeTab === tab 
                 ? (darkMode 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 scale-105' 
                    : 'bg-white text-pink-500 shadow-md shadow-pink-100 scale-105')
                 : (darkMode 
                    ? 'bg-[#1e1e20] text-slate-400 hover:bg-[#2a2a2c]' 
                    : 'bg-white/40 text-slate-500 hover:bg-white/60')}
             `}
           >
             {tabDisplayMap[tab] || tab}
           </button>
         ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
         {filteredPrompts.map(p => (
           <SpellCard 
             key={p.id} 
             data={{
               id: p.id,
               title: p.title,
               tag: (p.tags && p.tags[0]) ? p.tags[0] : (p.category || 'Prompt'),
               color: cardColor(p),
               content: p.content,
               likes: 1000 + (p.id ? (parseInt(String(p.id).slice(-2), 10) || 0) : 0)
             }} 
             darkMode={darkMode}
             onCopy={handleCopy} 
             isLiked={!!likes[p.id]}
             onLike={() => handleLike(p.id)}
             onEdit={() => openEdit(p)}
             onDelete={() => removePrompt(p.id)}
           />
         ))}
      </div>

      {/* Modal for Create/Edit */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all duration-300">
          <div className={`w-full max-w-2xl rounded-[2rem] border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all
            ${darkMode ? 'bg-[#1e1e20] border-slate-700 shadow-blue-900/20' : 'bg-white border-slate-100 shadow-xl'}
          `}>
            {/* Header */}
            <div className={`px-8 pt-8 pb-4 shrink-0 flex justify-between items-center ${darkMode ? 'border-b border-slate-800' : 'border-b border-slate-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-50 text-pink-500'}`}>
                  {editing ? <Feather size={24} /> : <Wand2 size={24} />}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {editing ? '重塑奥秘' : '镌刻新篇章'}
                  </h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {editing ? '修改已有的魔法纹路' : '将新的灵感编织成咒语'}
                  </p>
                </div>
              </div>
              <button 
                onClick={closePanel}
                className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>奥秘之名 / Name</label>
                  <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2
                    ${darkMode 
                      ? 'bg-[#2a2a2c] border-slate-700 text-slate-200 focus-within:ring-blue-500/30' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 focus-within:ring-pink-200'}
                  `}>
                    <Scroll size={16} className="mr-3 text-slate-400 shrink-0" />
                    <input 
                      className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400"
                      value={formTitle} 
                      onChange={e => setFormTitle(e.target.value)} 
                      placeholder="赋予此咒语一个名字..." 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>魔力源流 / Category</label>
                  <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2
                    ${darkMode 
                      ? 'bg-[#2a2a2c] border-slate-700 text-slate-200 focus-within:ring-blue-500/30' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 focus-within:ring-pink-200'}
                  `}>
                    <BookOpen size={16} className="mr-3 text-slate-400 shrink-0" />
                    <input 
                      className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400"
                      value={formCategory} 
                      onChange={e => setFormCategory(e.target.value)} 
                      placeholder="归属于哪个派系..." 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className={`text-xs font-bold ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>元素印记 / Tags</label>
                <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2
                  ${darkMode 
                    ? 'bg-[#2a2a2c] border-slate-700 text-slate-200 focus-within:ring-blue-500/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 focus-within:ring-pink-200'}
                `}>
                  <Sparkles size={16} className="mr-3 text-slate-400 shrink-0" />
                  <input 
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400"
                    value={formTags} 
                    onChange={e => setFormTags(e.target.value)} 
                    placeholder="添加标签，用逗号分隔..." 
                  />
                </div>
              </div>
              
              <div className="space-y-2 h-[240px] flex flex-col">
                 <div className="flex justify-between items-center px-1">
                    <label className={`text-xs font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>咒文咏唱 / Incantation</label>
                    <button 
                      onClick={handleModalCopy}
                      className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-md
                        ${modalCopied 
                           ? 'text-green-500 bg-green-500/10' 
                           : (darkMode ? 'text-slate-500 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-400 hover:text-pink-500 hover:bg-pink-50')}
                      `}
                    >
                      {modalCopied ? <Check size={12} /> : <Copy size={12} />}
                      {modalCopied ? '已复刻' : '复制咒文'}
                    </button>
                 </div>
                 <div className={`relative flex-1 rounded-2xl border transition-all focus-within:ring-2 overflow-hidden
                    ${darkMode 
                      ? 'bg-[#131314] border-slate-800 focus-within:ring-blue-500/30' 
                      : 'bg-[#fafafa] border-slate-200 focus-within:ring-pink-200'}
                 `}>
                    <textarea 
                      className={`w-full h-full p-4 text-sm font-mono leading-relaxed outline-none resize-none bg-transparent custom-scrollbar
                        ${darkMode ? 'text-slate-300' : 'text-slate-600'}
                      `}
                      value={formContent} 
                      onChange={e => setFormContent(e.target.value)} 
                      placeholder="// 在此铭刻你的咒语..." 
                      spellCheck={false}
                    />
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 flex justify-end gap-3 border-t shrink-0 ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
              <button 
                onClick={closePanel} 
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-colors 
                  ${darkMode 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                    : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'}
                `}
              >
                暂且搁置
              </button>
              <button 
                onClick={submitForm} 
                disabled={saving || !formTitle || !formContent} 
                className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg active:scale-95 flex items-center gap-2
                  ${darkMode 
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed' 
                    : 'bg-slate-800 hover:bg-slate-700 shadow-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'}
                `}
              >
                {saving ? '铭刻中...' : '永恒铭记'}
                {!saving && <Sparkles size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual Spell Card with internal copy state
const SpellCard = ({ data, onCopy, isLiked, onLike, onEdit, onDelete, darkMode }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCardCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`
      rounded-[2rem] p-6 shadow-sm border transition-all duration-500 group relative overflow-hidden flex flex-col
      ${darkMode 
        ? 'bg-[#1e1e20] border-slate-700 hover:border-slate-600 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1' 
        : 'bg-white border-slate-100 hover:shadow-xl hover:shadow-pink-100 hover:-translate-y-1'}
    `}>
      
      {/* Decorative BG */}
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-all duration-700 translate-x-12 -translate-y-12 pointer-events-none opacity-0 group-hover:opacity-100
        ${data.color.includes('pink') ? 'bg-pink-500/20' : ''}
        ${data.color.includes('blue') ? 'bg-blue-500/20' : ''}
        ${data.color.includes('purple') ? 'bg-purple-500/20' : ''}
        ${data.color.includes('orange') ? 'bg-orange-500/20' : ''}
        ${data.color.includes('indigo') ? 'bg-indigo-500/20' : ''}
      `}></div>

      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${data.color.replace('text-', 'border-').replace('bg-', 'border-opacity-20 ')} bg-opacity-10`}>
          {data.tag}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={onLike}
            className={`p-2 rounded-full transition-all duration-300 ${isLiked 
              ? 'bg-red-500/10 text-red-500 scale-110' 
              : (darkMode ? 'text-slate-600 hover:bg-slate-800 hover:text-red-400' : 'text-slate-300 hover:bg-pink-50 hover:text-red-400')}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-pulse" : ""} />
          </button>
          {onEdit && (
            <button onClick={onEdit} className={`p-2 rounded-full transition-all ${darkMode ? 'text-slate-600 hover:bg-slate-800 hover:text-blue-400' : 'text-slate-300 hover:bg-blue-50 hover:text-blue-500'}`}>
              <Pencil size={18} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className={`p-2 rounded-full transition-all ${darkMode ? 'text-slate-600 hover:bg-slate-800 hover:text-red-400' : 'text-slate-300 hover:bg-red-50 hover:text-red-500'}`}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <h3 className={`text-lg font-bold mb-3 transition-colors line-clamp-1 ${darkMode ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-800 group-hover:text-pink-500'}`}>
        {data.title}
      </h3>

      {/* Code Area */}
      <div className={`rounded-2xl p-5 mb-5 font-mono text-sm leading-relaxed border relative transition-all duration-300 flex-1
        ${darkMode 
          ? 'bg-[#131314] text-slate-400 border-slate-800 group-hover:border-slate-700' 
          : 'bg-slate-50 text-slate-600 border-slate-100 group-hover:border-pink-100'}
      `}>
        <p className="line-clamp-4 opacity-80">{data.content}</p>
        
        {/* Overlay gradient for text cutoff */}
        <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t rounded-b-2xl pointer-events-none
          ${darkMode ? 'from-[#131314] to-transparent' : 'from-slate-50 to-transparent'}
        `}></div>
      </div>

      <div className="flex items-center justify-between relative z-10 mt-auto">
         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-500/5 px-3 py-1.5 rounded-full">
           <Star size={12} className="text-yellow-400" fill="currentColor" />
           {data.likes + (isLiked ? 1 : 0)}
         </div>

         <button 
           onClick={handleCardCopy}
           className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 group/btn
             ${copied
               ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
               : (darkMode 
                 ? 'bg-slate-800 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-900/30' 
                 : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white hover:shadow-lg hover:shadow-slate-300')}
           `}
         >
           {copied ? <Check size={14} className="animate-bounce" /> : <Copy size={14} className="group-hover/btn:-rotate-12 transition-transform" />}
           {copied ? '已复刻' : '复刻咒语'}
         </button>
      </div>
    </div>
  );
};
