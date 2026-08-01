"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Users,
  Plus,
  Mail,
  Phone,
  Shield,
  Trash2,
  Pencil,
  Search,
  X,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    role: "ELECTRICIEN",
    password: "",
    instructions: "",
    isActive: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenForm = (user: any = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        email: user.email || "",
        role: user.role,
        password: "",
        instructions: user.instructions || "",
        isActive: user.isActive
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: "",
        username: "",
        email: "",
        role: "ELECTRICIEN",
        password: "",
        instructions: "",
        isActive: true
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ id: selectedUser?.id, ...formData })
      });
      if (res.ok) {
        Swal.fire({ title: 'Success', text: selectedUser ? 'Account Updated' : 'Account Created', icon: 'success', timer: 1500, showConfirmButton: false });
        setShowForm(false);
        fetchUsers();
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 lg:py-6 px-4 lg:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] mb-1">Human Resources</p>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Team Management</h1>
          <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest mt-2">Oversee technician credentials and access</p>
        </div>
        {!showForm && (
            <button onClick={() => handleOpenForm()} className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg shadow-blue-500/10 text-[10px] font-black uppercase">
                <Plus size={16} /> Add Personnel
            </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-6 lg:p-10 space-y-8 shadow-xl animate-in slide-in-from-bottom-4 duration-500 mx-2">
            <div className="flex items-center justify-between">
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase hover:text-blue-600 transition-all">
                    <ArrowLeft size={16} /> Back to Directory
                </button>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                    {selectedUser ? "Modify Credentials" : "Initialize New Account"}
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Full Name</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">System Identifier</label><input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Corporate Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all" /></div>
                </div>
                <div className="space-y-6">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Operational Role</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-6 text-sm font-bold appearance-none outline-none"><option value="ELECTRICIEN">FIELD TECHNICIAN</option><option value="ADMINISTRATEUR">SYSTEM ADMINISTRATOR</option></select></div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Security Key {selectedUser && "(Leave blank to keep current)"}</label>
                        <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-6 text-sm font-bold" placeholder="••••••••" />
                    </div>
                    <div className="flex items-center gap-4 pt-4">
                        <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={cn("px-6 py-3 rounded-xl text-[9px] font-black uppercase transition-all", formData.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                            {formData.isActive ? "Account Active" : "Account Locked"}
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-4">
                    <button type="submit" disabled={loading} className="btn-primary px-12 py-4 rounded-2xl text-xs font-black">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                        Save Personnel Profile
                    </button>
                </div>
            </form>
        </div>
      ) : (
        <div className="space-y-6 px-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search Directory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600/5 transition-all"
                    />
                </div>
            </div>

            {/* MOBILE-ONLY LIST VIEW */}
            <div className="lg:hidden grid grid-cols-1 gap-3 pb-20">
                {filteredUsers.map(u => (
                    <div key={u.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.substring(0,2)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase leading-none truncate">{u.name}</p>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1">@{u.username} • {u.role === 'ADMINISTRATEUR' ? 'Admin' : 'Tech'}</p>
                            </div>
                        </div>
                        <button onClick={() => handleOpenForm(u)} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 active:text-blue-600 transition-all"><Pencil size={16} /></button>
                    </div>
                ))}
            </div>

            {/* DESKTOP-ONLY TABLE VIEW */}
            <div className="hidden lg:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/20 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Personnel Identity</th>
                        <th className="px-8 py-5">Operational Role</th>
                        <th className="px-8 py-5">System Access</th>
                        <th className="px-8 py-5 text-right pr-12">Audit</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-all">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.substring(0,2)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-zinc-900 dark:text-white uppercase leading-none">{u.name}</span>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase mt-1">@{u.username}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                u.role === 'ADMINISTRATEUR' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-zinc-50 text-zinc-500 border-zinc-200"
                            )}>
                                {u.role === 'ADMINISTRATEUR' ? "System Admin" : "Field Technician"}
                            </span>
                        </td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", u.isActive ? "bg-green-500" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]")} />
                                <span className="text-[9px] font-black uppercase text-zinc-500">{u.isActive ? "Authorized" : "Revoked"}</span>
                            </div>
                        </td>
                        <td className="px-8 py-5 text-right pr-12">
                            <button
                                onClick={() => handleOpenForm(u)}
                                className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            >
                                <Pencil size={16} />
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">No personnel records matched your search</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
