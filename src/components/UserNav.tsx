"use client";

import { useSession, signOut } from "next-auth/react";
import {
    User,
    Settings,
    LogOut,
    ChevronDown,
    Loader2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function UserNav() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const sessionUser = session?.user as any;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionUser) {
      fetchUserData();
    }
  }, [sessionUser?.hasAvatar, sessionUser?.name]); // Re-fetch if session flag changes

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!sessionUser) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
            "flex items-center gap-2 p-1.5 rounded-2xl transition-all duration-300",
            open ? "bg-zinc-100 dark:bg-zinc-800 shadow-inner" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
        )}
      >
        <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 overflow-hidden border border-zinc-100 dark:border-zinc-800 relative">
            {loading ? (
                <Loader2 size={14} className="animate-spin opacity-20" />
            ) : userData?.avatar ? (
                <img src={userData.avatar} alt={sessionUser.name || "Avatar"} className="w-full h-full object-cover" />
            ) : (
                <User size={18} />
            )}
        </div>
        <div className="hidden md:flex flex-col items-start pr-1 text-left">
            <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 leading-none">{sessionUser.name}</span>
            <span className="text-[7px] font-bold text-zinc-400 uppercase mt-0.5 tracking-tighter">{sessionUser.role}</span>
        </div>
        <ChevronDown size={14} className={cn("text-zinc-400 transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[200] overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase truncate">{sessionUser.name}</p>
                <p className="text-[8px] font-bold text-zinc-400 uppercase truncate mt-0.5">{sessionUser.email || "System Account"}</p>
            </div>

            <div className="p-2 space-y-1">
                <Link
                    href="/dashboard/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
                >
                    <Settings size={14} />
                    <span>My Profile</span>
                </Link>
            </div>

            <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                    <LogOut size={14} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
