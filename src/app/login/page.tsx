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
          text: 'Invalid system ID or security key.',
          confirmButtonColor: '#2563eb'
        });
      } else {
        // Use window.location for a hard redirect to bypass potential middleware/router loops in production
        window.location.href = callbackUrl;
      }
    } catch (error) {
        Swal.fire('Error', 'System synchronization failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-10">
        <div className="space-y-8">
            {/* Identifiant */}
            <div className="space-y-4 text-left">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                    IDENTIFIANT
                </label>
                <input
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#f4f4f5] dark:bg-[#1e2330] border-2 border-transparent dark:border-transparent rounded-2xl px-6 py-5 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner"
                    placeholder="Enter your system ID"
                />
            </div>

            {/* Security Key */}
            <div className="space-y-4 text-left">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                    SECURITY KEY
                </label>
                <div className="relative">
                    <input
                        required
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#f4f4f5] dark:bg-[#1e2330] border-2 border-transparent dark:border-transparent rounded-2xl px-6 py-5 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner"
                        placeholder="••••••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-blue-600 transition-colors"
                    >
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
        </div>

        <button
            disabled={loading}
            type="submit"
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] font-black uppercase tracking-widest text-sm"
        >
            {loading ? (
                <Loader2 className="animate-spin" size={24} />
            ) : (
                <>
                    LOGIN
                    <ArrowRight size={18} />
                </>
            )}
        </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-[#09090b] transition-colors duration-500 selection:bg-blue-500/30 font-sans">

      {/* LEFT SIDE: BRANDING PANEL (BOTTOM-LEFT ALIGNED) */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-zinc-50 dark:bg-zinc-900/20">
        <div className="absolute inset-0 z-0">
            <Image
                src="/login-bg.png"
                alt="Branding"
                fill
                className="object-cover opacity-80 transition-transform duration-[20s] hover:scale-105"
                priority
            />
            {/* Theme-aware signature bleed */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white dark:to-[#09090b] w-full" />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-start pt-[35%] pl-[45%] pr-16">
            <div className="space-y-1">
                {/* Horizontal bar ABOVE text */}
                <div className="w-16 h-1 bg-blue-600 mb-6" />
                <h1 className="text-6xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                    MONITORING <br /> <span className="text-blue-600">PLATFORM</span>
                </h1>
                <p className="text-zinc-900 dark:text-zinc-100 font-bold uppercase text-[10px] tracking-[0.2em] max-w-md mt-10 leading-relaxed">
                    INTEGRATED ELECTRICITY AND WATER CONSUMPTION MONITORING REPORT for Novarea Textiles.
                </p>
            </div>
        </div>
      </div>

      {/* RIGHT SIDE: AUTHENTICATION FORM (ENGLISH LOCALIZED) */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-20 relative z-20">
        <div className="w-full max-w-[420px] space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            <div className="space-y-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                    <Shield className="text-blue-600 dark:text-blue-500" size={24} />
                </div>
                <div className="space-y-1 text-left">
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">AUTHENTICATION</h2>
                    <p className="text-zinc-500 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-widest">ACCESS YOUR SECURE WORKSPACE</p>
                </div>
            </div>

            <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
                <LoginForm />
            </Suspense>
        </div>
      </div>
    </div>
  );
}
