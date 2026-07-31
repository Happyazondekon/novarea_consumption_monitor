"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users, Plus, Pencil, Search,
  CheckCircle2, XCircle, Loader2, Save,
  ArrowLeft, Shield, Mail, Phone, Lock, Info,
  Zap, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    role: "ELECTRICIEN",
    password: "",
    instructions: "",
    isActive: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenForm = (u: any = null) => {
    if (u) {
      setSelectedUser(u);
      setFormData({
        username: u.username,
        name: u.name,
        email: u.email || "",
        phone: u.phone || "",
        role: u.role,
        password: "",
        instructions: u.instructions || "",
        isActive: u.isActive
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: "",
        name: "",
        email: "",
        phone: "",
        role: "ELECTRICIEN",
        password: "",
        instructions: "",
        isActive: true
      });
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
            id: selectedUser?.id,
            ...formData
        })
      });
      if (res.ok) {
        Swal.fire({ title: 'Success', text: 'Account updated successfully', icon: 'success', timer: 1500 });
        setShowForm(false);
        fetchUsers();
      } else {
        Swal.fire('Error', 'Failed to save account', 'error');
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
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-1">Human Resources</p>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Team Management</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2">Oversee technician access and field assignments</p>
        </div>
        {!showForm && (
            <button onClick={() => handleOpenForm()} className="btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20">
                <Plus size={18} /> New Account
            </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[3rem] p-8 md:p-12 space-y-10 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 px-4">
            <div className="flex items-center justify-between">
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                    <ArrowLeft size={16} /> <span>Back to List</span>
                </button>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                    {selectedUser ? `Editing ${formData.name}` : "Create New Professional Account"}
                </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={12}/> Full Name</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="John Doe" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Lock size={12}/> Username (System ID)</label>
                        <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="jdoe_novarea" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Mail size={12}/> Contact Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="john@novarea.com" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Shield size={12}/> Access Privilege</label>
                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 outline-none appearance-none cursor-pointer">
                            <option value="ELECTRICIEN">FIELD TECHNICIAN</option>
                            <option value="ADMINISTRATEUR">SYSTEM ADMINISTRATOR</option>
                        </select>
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Info size={12}/> Special Instructions / Missions</label>
                        <textarea rows={3} value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none resize-none" placeholder="Assigned sector, maintenance notes..." />
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-50 dark:border-zinc-800 flex justify-end gap-4">
                    <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 transition-all">Cancel</button>
                    <button disabled={loading} type="submit" className="btn-primary flex items-center gap-2 px-10 py-3 rounded-2xl">
                         {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                         <span>{selectedUser ? "Update Professional Profile" : "Activate Account"}</span>
                    </button>
                </div>
            </form>
        </div>
      ) : (
        <div className="space-y-6 px-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-2 flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                      type="text"
                      placeholder="SEARCH PROFESSIONAL DIRECTORY..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                    />
                </div>
            </div>

            <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl shadow-zinc-200/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                <th className="px-8 py-6">Member Name</th>
                                <th className="px-8 py-6">Professional Role</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6 text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black uppercase overflow-hidden border border-zinc-50 dark:border-zinc-700">
                                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.substring(0,2)}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">{u.name}</p>
                                                <p className="text-[9px] font-bold text-zinc-400 mt-1.5 lowercase italic tracking-wide">{u.email || `@${u.username}`}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                            u.role === 'ADMINISTRATEUR' ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                        )}>
                                            {u.role === 'ADMINISTRATEUR' ? "Admin" : "Technician"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {u.isActive ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-zinc-300" />}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{u.isActive ? "Active" : "Locked"}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button onClick={() => handleOpenForm(u)} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 transition-all shadow-sm">
                                            <Pencil size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
}
