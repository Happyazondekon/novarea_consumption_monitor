"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  History,
  MessageSquare,
  Settings,
  Plus,
  Calendar,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMINISTRATEUR';
  const isTech = role === 'ELECTRICIEN';

  // Different items per role
  const techItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: History, label: 'History', href: '/dashboard/history' },
    { icon: Plus, label: 'Log', href: '/dashboard/new-reading', center: true },
    { icon: MessageSquare, label: 'Mission', href: '/dashboard/instructions' },
    { icon: Settings, label: 'Profile', href: '/dashboard/settings' },
  ];

  const adminItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: Calendar, label: 'Events', href: '/dashboard/events' },
    { icon: Plus, label: 'New', href: '/dashboard/events', center: true }, // Re-routed to New Event
    { icon: FileText, label: 'Reports', href: '/dashboard/reports' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  const navItems = isAdmin ? adminItems : isTech ? techItems : [];

  if (navItems.length === 0) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.center) {
              return (
                <Link
                    key={item.href}
                    href={item.href}
                    className="relative -top-6"
                >
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/40 border-4 border-white dark:border-zinc-950 active:scale-90 transition-all">
                        <Plus size={28} />
                    </div>
                    <span className="sr-only">{item.label}</span>
                </Link>
              );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 min-w-[64px]",
                isActive ? "text-blue-600" : "text-zinc-400"
              )}
            >
              <item.icon size={18} className={cn("transition-transform", isActive && "scale-110")} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
