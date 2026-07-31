"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { BottomNav } from '@/components/BottomNav';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] overflow-hidden">
      {/* Sidebar hidden on mobile, visible on LG screens */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 relative">
        <Topbar />

        <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 lg:pb-6">
          <div className="container mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>

        {/* Mobile-only Bottom Navigation for Technicians */}
        <BottomNav />
      </div>
    </div>
  );
}
