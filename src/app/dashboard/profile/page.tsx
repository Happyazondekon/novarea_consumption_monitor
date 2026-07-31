"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  User, Mail, Phone, Shield, Camera,
  Lock, CheckCircle2, ChevronRight, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    Swal.fire({
        title: 'Updated',
        text: 'Your profile has been successfully updated.',
        icon: 'success',
        confirmButtonColor: '#2563eb'
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">
             Personal Space
          </p>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
             User Profile
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="space-y-6">
          <Card className="apple-card flex flex-col items-center text-center py-10">
             <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-blue-600 border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden">
                    <User size={64} />
                </div>
                <button className="absolute bottom-1 right-1 w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95">
                    <Camera size={18} />
                </button>
             </div>
             <div className="mt-6 space-y-1">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{user?.name}</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{user?.role}</p>
             </div>
             <div className="mt-8 pt-8 border-t border-zinc-50 w-full">
                <div className="flex justify-between items-center px-2">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">ID Reference</span>
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">{user?.id?.substring(0, 8).toUpperCase()}</span>
                </div>
             </div>
          </Card>

          <Card className="p-6 bg-zinc-900 text-white rounded-[2rem] border-none shadow-xl overflow-hidden relative">
             <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Shield size={20} className="text-blue-400" />
                </div>
                <h3 className="font-black uppercase text-sm tracking-widest">Security Status</h3>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="w-full h-full bg-green-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-green-400">Secure</span>
                </div>
                <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest transition-all">
                    Update Password
                </button>
             </div>
             <Lock size={120} className="absolute right-[-20px] bottom-[-40px] text-white/5" />
          </Card>
        </div>

        {/* Right Column: Editable Info & Instructions */}
        <div className="lg:col-span-2 space-y-8">
           <Card className="apple-card space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Account Details</h3>
                 {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] font-black text-blue-600 uppercase"
                    >
                        Edit Details
                    </button>
                 ) : (
                    <button
                        onClick={() => setIsEditing(false)}
                        className="text-[10px] font-black text-zinc-400 uppercase"
                    >
                        Cancel
                    </button>
                 )}
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                            <input
                                type="email"
                                value={email}
                                disabled={!isEditing}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-600/10 transition-all outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                            <input
                                type="tel"
                                value={phone}
                                disabled={!isEditing}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-600/10 transition-all outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>
                 </div>

                 {isEditing && (
                    <button type="submit" className="btn-primary w-full md:w-auto px-12">
                        Save Changes
                    </button>
                 )}
              </form>
           </Card>

           {user?.instructions && (
             <Card className="p-8 bg-blue-50 border-none rounded-[2rem] shadow-sm relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Active Instructions</h3>
                    <div className="p-5 bg-white rounded-2xl shadow-sm border border-blue-100 italic font-medium text-zinc-600 leading-relaxed">
                        "{user.instructions}"
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                        <Info size={12} />
                        Assigned by System Administrator
                    </div>
                </div>
                <Info size={120} className="absolute right-[-20px] bottom-[-20px] text-blue-100/50" />
             </Card>
           )}
        </div>
      </div>
    </div>
  );
}
