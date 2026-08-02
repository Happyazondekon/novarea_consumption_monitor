"use client";

import React, { useState, useEffect } from "react";
import { UserNav } from "@/components/UserNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [scrolled, setScrolled] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const fetchNotifications = async () => {
      try {
          const res = await fetch("/api/notifications/count");
          if (res.ok) {
              const data = await res.json();
              setNotifCount(data.count);
          }
      } catch (err) {
          console.error("Notif fetch failed");
      }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Initial fetch and poll every 30s
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
        window.removeEventListener("scroll", handleScroll);
        clearInterval(interval);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-[110] w-full transition-all duration-300 px-4 md:px-8 h-16 flex items-center justify-between",
        scrolled ? "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 shadow-sm" : "bg-transparent"
      )}
    >
      {/* LEFT: LOGO & MOBILE GREETING */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden w-8 h-8 relative shrink-0">
             <Image src="/logo-site.png" alt="Logo" fill className="object-contain" />
        </div>
        <div className="flex flex-col text-left">
           <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Welcome back,</span>
           <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{user?.name || 'User'}</span>
        </div>
      </div>

      {/* CENTER: SEARCH (DESKTOP) */}
      <div className="hidden lg:flex flex-1 max-w-md mx-12">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search diagnostics..."
            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2 pl-12 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600/10 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-2 md:gap-5">
        <div className="flex items-center gap-1 md:gap-2 mr-1 md:mr-4 border-r border-zinc-100 dark:border-zinc-800 pr-3 lg:pr-4">
            <Link
                href={user?.role === 'ADMINISTRATEUR' ? "/dashboard/reports" : "/dashboard/instructions"}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
            >
                <Bell size={20} />
                {notifCount > 0 && (
                    <div className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                        <span className="text-[8px] font-black text-white px-0.5">{notifCount > 9 ? '9+' : notifCount}</span>
                    </div>
                )}
            </Link>
            <ThemeToggle />
        </div>

        <div className="flex items-center gap-3">
            <UserNav />
        </div>
      </div>
    </header>
  );
}
