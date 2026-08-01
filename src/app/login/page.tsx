"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        identifiant: username,
        password,
        redirect: false,
      });

      if (res?.error) {
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'Invalid system ID or password.',
          confirmButtonColor: '#2563eb'
        });
      } else {
        window.location.href = callbackUrl;
      }
    } catch (error) {
        Swal.fire('Error', 'System synchronization failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6 md:space-y-10 w-full">
        <div className="space-y-6">
            <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-widest ml-1">
                    IDENTIFIANT
                </label>
                <input
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 md:py-5 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-4 focus:ring-blue-600/20 transition-all shadow-inner"
                    placeholder="Enter your system ID"
                />
            </div>

            <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-widest ml-1">
                    PASSWORD
                </label>
                <div className="relative">
                    <input
                        required
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 md:py-5 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-4 focus:ring-blue-600/20 transition-all shadow-inner"
                        placeholder="••••••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
                    >
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
        </div>

        <button
            disabled={loading}
            type="submit"
            className="w-full h-14 md:h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] font-black uppercase tracking-widest text-sm"
        >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <>LOGIN <ArrowRight size={18} /></>}
        </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="h-screen w-screen flex bg-black transition-colors duration-700 selection:bg-blue-500/30 font-sans overflow-hidden relative text-left">

      {/* UNIFIED FULL-SCREEN BACKGROUND (To provide texture for glassmorphism) */}
      <div className="absolute inset-0 z-0">
          <Image
              src="/login-bg-v2.png"
              alt="Industrial Environment"
              fill
              className="object-cover opacity-100"
              style={{ objectPosition: 'center 20%' }}
              priority
          />
          {/* Theme-reactive global overlay (10%) to anchor the glass */}
          <div className="absolute inset-0 bg-white/10 dark:bg-black/10 transition-colors duration-700" />
      </div>

      <div className="w-full h-full flex flex-col lg:flex-row relative z-10">

        {/* LEFT AREA: BRANDING (Bottom-Left weighted) */}
        <div className="hidden lg:flex lg:w-[60%] h-full relative flex-col justify-end items-start pb-20 pl-24 overflow-hidden">
            {/* Dark gradient for text legibility over image */}
            <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/40 via-transparent to-transparent z-0" />

            <div className="relative z-10 space-y-1 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="w-16 h-1 bg-blue-600 mb-6" />
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                    MONITORING <br /> <span className="text-blue-600 drop-shadow-none">PLATFORM</span>
                </h1>
                <div className="max-w-md mt-10">
                    <p className="text-white font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed text-justify drop-shadow-lg">
                        INTEGRATED ELECTRICITY AND WATER CONSUMPTION MONITORING REPORT for Novarea Textiles Benin.
                    </p>
                </div>
            </div>
        </div>

        {/* RIGHT AREA: AUTHENTICATION (Full Workspace Glassmorphism) */}
        <div className="w-full lg:w-[40%] h-full flex flex-col items-center justify-center p-6 md:p-20 overflow-y-auto custom-scrollbar relative">

            {/* IMMERSIVE GLASS SURFACE OVER THE FULL RIGHT PANEL (Thinner/Natural) */}
            <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-md border-l border-white/20 dark:border-white/5 hidden lg:block z-0 shadow-2xl" />

            {/* AUTH CARD (Nested inside the glass panel) */}
            <div className="w-full max-w-[420px] relative z-10 bg-white/10 dark:bg-black/30 lg:bg-transparent lg:dark:bg-transparent backdrop-blur-xl lg:backdrop-blur-0 p-8 md:p-12 lg:p-0 rounded-[2.5rem] lg:rounded-none border border-white/20 dark:border-white/10 lg:border-none shadow-2xl lg:shadow-none space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000">

                <div className="space-y-6 md:space-y-8 text-center lg:text-left text-zinc-900 dark:text-white">
                    <div className="flex justify-center lg:justify-start">
                        <div className="w-16 h-16 relative">
                            <Image src="/logo-site.png" alt="Logo" fill className="object-contain filter drop-shadow-2xl" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none drop-shadow-md">AUTHENTICATION</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-widest mt-2 drop-shadow-sm">ACCESS YOUR SECURE WORKSPACE</p>
                    </div>
                </div>

                <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
                    <LoginForm />
                </Suspense>

                <div className="pt-2 text-center lg:text-left">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest opacity-60">
                        Industrial Monitoring Infrastructure Benin
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
