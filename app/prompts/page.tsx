"use client";

import React from 'react';
import PromptUniverse from '@/components/PromptUniverse';

export default function PromptsPage() {
  return (
    <div className="h-screen w-full bg-[#F0F4F8] dark:bg-[#131314]">
      <PromptUniverse darkMode={false} /> {/* Default to light or detect system preference if needed */}
    </div>
  );
}
