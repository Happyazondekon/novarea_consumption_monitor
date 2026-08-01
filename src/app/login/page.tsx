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
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-300 uppercase tracking-widest ml-1">
                    IDENTIFIANT
                </label>
                <input
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl px-6 py-4 md:py-5 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner backdrop-blur-sm"
                    placeholder="Enter your system ID"
                />
            </div>

            <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-300 uppercase tracking-widest ml-1">
                    PASSWORD
                </label>
                <div className="relative">
                    <input
                        required
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl px-6 py-4 md:py-5 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner backdrop-blur-sm"
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
    <div className="h-screen w-screen flex bg-black transition-colors duration-500 selection:bg-blue-500/30 font-sans overflow-hidden relative">

      {/* GLOBAL BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Image
            src="/login-bg.png"
            alt="Branding"
            fill
            className="object-cover opacity-60 lg:opacity-70 transition-transform duration-[30s] scale-110"
            style={{ objectPosition: 'center 25%' }}
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-black/40 to-black/80 lg:bg-gradient-to-r lg:from-black/60 lg:to-transparent" />
      </div>

      <div className="w-full h-full flex flex-col lg:flex-row relative z-10">

        {/* DESKTOP BRANDING (Bottom-Left weighted on Desktop) */}
        <div className="hidden lg:flex lg:w-[55%] h-full flex-col justify-end items-start pb-20 pl-24">
            <div className="space-y-1 text-left animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="w-16 h-1 bg-blue-600 mb-6" />
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                    MONITORING <br /> <span className="text-blue-500">PLATFORM</span>
                </h1>
                <div className="max-w-md mt-10">
                    <p className="text-zinc-200 font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed text-justify opacity-80">
                        INTEGRATED ELECTRICITY AND WATER CONSUMPTION MONITORING REPORT for Novarea Textiles Benin.
                    </p>
                </div>
            </div>
        </div>

        {/* AUTHENTICATION CORE (Glassmorphism Right Panel) */}
        <div className="w-full lg:w-[45%] h-full flex flex-col items-center lg:items-end justify-center p-6 md:p-20 overflow-y-auto custom-scrollbar lg:pr-32">
            <div className="w-full max-w-[440px] bg-white/10 dark:bg-zinc-900/40 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000">

                <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                    <div className="flex justify-center lg:justify-start">
                        <div className="w-16 h-16 relative">
                            <Image src="/logo-site.png" alt="Logo" fill className="object-contain filter drop-shadow-2xl" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">AUTHENTICATION</h2>
                        <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mt-2">ACCESS YOUR SECURE WORKSPACE</p>
                    </div>
                </div>

                <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
                    <LoginForm />
                </Suspense>

                <div className="pt-2 text-center lg:text-left">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest opacity-60">
                        Industrial Monitoring Infrastructure Benin
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
