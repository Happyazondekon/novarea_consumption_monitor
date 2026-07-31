"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Zap,
  Droplets,
  Calendar,
  History,
  LogOut,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMINISTRATEUR';

  const menuItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Calendar, label: 'Daily Events', href: '/dashboard/events' },
    { icon: FileText, label: 'Global Reports', href: '/dashboard/reports' },
    { icon: Users, label: 'Electricians', href: '/dashboard/users' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Zap, label: 'Power Readings', href: '/dashboard/power' },
    { icon: Droplets, label: 'Water Readings', href: '/dashboard/water' },
    { icon: History, label: 'My History', href: '/dashboard/history' },
  ];

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-80 bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Logo" width={32} height={32} />
                <span className="font-black text-sm uppercase tracking-tighter text-blue-600">Novarea</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <Link
                href="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                  pathname === '/dashboard/settings' ? "bg-zinc-100 dark:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                )}
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => { setIsOpen(false); signOut({ callbackUrl: '/login' }); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
