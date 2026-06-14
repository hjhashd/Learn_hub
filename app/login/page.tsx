"use client";

import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Github, 
  Chrome, 
  ArrowRight,
  Sun,
  Moon,
  Library
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from system preference or local storage
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // For demo purposes, any login works
      router.push('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--content-bg)] transition-theme p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary-indigo)] opacity-[0.03] rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--primary-indigo)] opacity-[0.03] rounded-full blur-[120px]" />

      {/* Theme Toggle */}
      <button 
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 p-2 rounded-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-icon)]/20 text-[var(--sidebar-text)] hover:text-[var(--primary-indigo)] transition-all duration-300"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--primary-indigo)] text-white mb-4 shadow-lg shadow-indigo-500/20">
            <Library size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">欢迎回来</h1>
          <p className="text-[var(--sidebar-text)]">
            登录 LearnHub 开启您的知识之旅
          </p>
        </div>

        <div className="bg-[var(--sidebar-bg)] rounded-3xl border border-[var(--sidebar-icon)]/10 shadow-xl p-8 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--sidebar-text)] ml-1">
                邮箱地址
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sidebar-icon)] group-focus-within:text-[var(--primary-indigo)] transition-colors">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-12 bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-[var(--primary-indigo)] transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-[var(--sidebar-text)]">
                  密码
                </label>
                <Link 
                  href="#" 
                  className="text-xs text-[var(--primary-indigo)] hover:underline font-medium"
                >
                  忘记密码?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sidebar-icon)] group-focus-within:text-[var(--primary-indigo)] transition-colors">
                  <Lock size={18} />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-[var(--primary-indigo)] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sidebar-icon)] hover:text-[var(--sidebar-text)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-1">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-gray-300 text-[var(--primary-indigo)] focus:ring-[var(--primary-indigo)] cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-[var(--sidebar-text)] cursor-pointer">
                记住登录状态
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold bg-[var(--primary-indigo)] hover:opacity-90 transition-all shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  正在登录...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  登录 <ArrowRight size={20} />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--sidebar-icon)]/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--sidebar-bg)] px-2 text-[var(--sidebar-text)]">
                  或者通过以下方式
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-11 bg-transparent border-[var(--sidebar-icon)]/20 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                <Github className="mr-2" size={18} />
                GitHub
              </Button>
              <Button variant="outline" className="h-11 bg-transparent border-[var(--sidebar-icon)]/20 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                <Chrome className="mr-2" size={18} />
                Google
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--sidebar-text)]">
          还没有账号?{' '}
          <Link href="#" className="text-[var(--primary-indigo)] font-semibold hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
