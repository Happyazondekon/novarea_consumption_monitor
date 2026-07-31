"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Calendar,
  History,
  MessageSquare,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <aside className="bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 w-64 h-full" />
  );

  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMINISTRATEUR';

  const menuItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Calendar, label: 'Daily Events', href: '/dashboard/events' },
    { icon: FileText, label: 'Global Reports', href: '/dashboard/reports' },
    { icon: MessageSquare, label: 'Instructions', href: '/dashboard/instructions' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: History, label: 'My History', href: '/dashboard/history' },
    { icon: MessageSquare, label: 'Instructions', href: '/dashboard/instructions' },
  ];

  return (
    <aside
      id="sidebar-nav"
      className={cn(
        "bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col h-full",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0">
                <Image
                    src="/logo-site.png"
                    alt="Novarea Logo"
                    fill
                    className="object-contain"
                />
            </div>
            <div className="flex flex-col text-left">
                <span className="font-black text-sm tracking-tight leading-none text-zinc-900 dark:text-zinc-100 uppercase text-blue-600">Novarea</span>
                <span className="text-[9px] text-zinc-400 mt-1 font-semibold uppercase">Monitoring</span>
            </div>
          </div>
        )}
        {collapsed && (
            <div className="relative w-8 h-8 mx-auto">
                <Image
                    src="/logo-site.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                />
            </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              )}
            >
              <item.icon size={18} className={cn("shrink-0", isActive ? "text-blue-600" : "text-zinc-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
        <Link
          href="/dashboard/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
            pathname === '/dashboard/settings'
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          )}
        >
          <Settings size={18} className={cn("shrink-0", pathname === '/dashboard/settings' ? "text-blue-600" : "text-zinc-400")} />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
