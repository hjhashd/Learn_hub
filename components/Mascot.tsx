"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const AVATAR_URL = '/api/images/prompt-mascot.png';

interface MascotProps {
  darkMode?: boolean;
  mode: 'doc' | 'universe';
  className?: string;
}

const DEFAULT_DIALOGUES = {
  universeMode: "欢迎来到提示词宇宙！",
  idle: "这里有好多有趣的咒语哦~",
  hover: "Master，要找什么提示词吗？",
};

export default function Mascot({ darkMode, mode, className = '' }: MascotProps) {
  const [dialogue, setDialogue] = useState(DEFAULT_DIALOGUES.universeMode);
  const [isHovering, setIsHovering] = useState(false);

  // Switch dialogue based on mode
  useEffect(() => {
     setDialogue(DEFAULT_DIALOGUES.universeMode);
  }, [mode]);

  // Idle animation/dialogue
  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.7 && !isHovering) {
        setDialogue(DEFAULT_DIALOGUES.idle);
      } else if (!isHovering) {
         setDialogue(DEFAULT_DIALOGUES.universeMode);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [isHovering]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Dialogue Bubble - Only show when hovering or idle trigger */}
      <div className={`
        relative mb-4 transition-all duration-300 transform z-20
        ${isHovering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
      `}>
        <div className={`
          px-4 py-2 rounded-2xl rounded-bl-none shadow-lg border text-sm font-medium whitespace-nowrap
          ${darkMode 
            ? 'bg-[#1e1e20] border-slate-700 text-slate-200' 
            : 'bg-white border-pink-100 text-slate-600'}
        `}>
          {dialogue}
        </div>
        <div className={`absolute -bottom-2 left-4 w-4 h-4 transform rotate-45 border-b border-r
          ${darkMode 
            ? 'bg-[#1e1e20] border-slate-700' 
            : 'bg-white border-pink-100'}
        `}></div>
      </div>

      {/* Avatar */}
      <div 
        className="relative group cursor-pointer"
        onMouseEnter={() => {
          setIsHovering(true);
          setDialogue(DEFAULT_DIALOGUES.hover);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          setDialogue(DEFAULT_DIALOGUES.universeMode);
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-pink-200 rounded-full opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
        <Image 
          src={AVATAR_URL} 
          alt="Mascot" 
          width={160}
          height={160}
          className="w-40 h-40 object-cover rounded-xl drop-shadow-xl hover:scale-105 transition-transform duration-300 image-high-quality"
        />
        
        {/* Status Indicator */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-green-500 border border-white/20">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           Lv.99
        </div>
      </div>
    </div>
  );
}
