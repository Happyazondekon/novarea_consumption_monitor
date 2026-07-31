"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import {
  User, Mail, Phone, Shield, Camera,
  Lock, CheckCircle2, ChevronRight, Info, Loader2, Eye, EyeOff, Save,
  Users, Plus, Pencil, Search, XCircle, ArrowLeft, Zap, ShieldCheck, Fingerprint
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const sessionUser = session?.user as any;
  const isAdmin = sessionUser?.role === 'ADMINISTRATEUR';

  const [activeTab, setActiveTab] = useState<"PROFILE" | "TEAM">("PROFILE");

  // Profile State
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Team Management State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFormData, setUserFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    role: "ELECTRICIEN",
    password: "",
    instructions: "",
    isActive: true
  });

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setUsername(data.username || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAvatar(data.avatar || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingUser(false);
    }
  };

  const fetchAllUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    if (isAdmin) fetchAllUsers();
  }, [isAdmin]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      Swal.fire('Error', 'New passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("phone", phone);
      if (avatar) formData.append("avatar", avatar);
      if (oldPassword) formData.append("oldPassword", oldPassword);
      if (newPassword) formData.append("newPassword", newPassword);

      const res = await fetch("/api/settings/profile", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            username: data.user.username,
            email: data.user.email,
            hasAvatar: data.user.avatar ? Date.now() : 0
          }
        });
        Swal.fire({ title: 'Success', text: 'Profile updated', icon: 'success', timer: 1500, showConfirmButton: false });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Swal.fire('Error', data.error || 'Failed to update', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserForm = (u: any = null) => {
    if (u) {
      setSelectedUser(u);
      setUserFormData({
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
      setUserFormData({
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
    setShowUserForm(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ id: selectedUser?.id, ...userFormData })
      });
      if (res.ok) {
        Swal.fire({ title: 'Success', text: 'Account processed', icon: 'success', timer: 1500, showConfirmButton: false });
        setShowUserForm(false);
        fetchAllUsers();
      } else {
        Swal.fire('Error', 'Operation failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser) return (
    <div className="h-full flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 lg:py-6 px-4 lg:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] mb-1">Configuration</p>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Settings</h1>
        </div>

        {isAdmin && (
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto">
                <button onClick={() => setActiveTab("PROFILE")} className={cn("flex-1 sm:flex-initial px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", activeTab === "PROFILE" ? "bg-white dark:bg-zinc-700 text-blue-600 shadow-sm" : "text-zinc-400")}>My Profile</button>
                <button onClick={() => setActiveTab("TEAM")} className={cn("flex-1 sm:flex-initial px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", activeTab === "TEAM" ? "bg-white dark:bg-zinc-700 text-blue-600 shadow-sm" : "text-zinc-400")}>Team Control</button>
            </div>
        )}
      </div>

      {activeTab === "PROFILE" ? (
        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 px-2 pb-20 lg:pb-0">
            <div className="space-y-6">
                <Card className="apple-card flex flex-col items-center text-center py-8 bg-white dark:bg-zinc-900 border-none shadow-sm">
                    <div className="relative group">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <div onClick={handleAvatarClick} className="w-28 h-28 lg:w-32 lg:h-32 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-blue-600 border-4 border-white dark:border-zinc-850 shadow-xl overflow-hidden relative cursor-pointer">
                            {avatar ? <img src={avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <User size={40} className="opacity-20" />}
                        </div>
                        <button type="button" onClick={handleAvatarClick} className="absolute bottom-0 right-0 w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-lg"><Camera size={16} /></button>
                    </div>
                    <div className="mt-6 space-y-1">
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none truncate max-w-[200px]">{name}</h2>
                        <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest">{sessionUser?.role}</span>
                    </div>
                    <div className="mt-8 pt-6 border-t border-zinc-50 dark:border-zinc-800 w-full px-6 space-y-2">
                        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg"><span className="text-[7px] font-black text-zinc-400 uppercase">System ID</span><span className="text-[9px] font-black text-blue-600 uppercase">@{username}</span></div>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <Card className="apple-card space-y-6 bg-white dark:bg-zinc-900 border-none shadow-sm p-6 lg:p-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 border-l-2 border-blue-600 pl-3">Identity Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600/10" /></div>
                        <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">System Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600/10" /></div>
                        <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600/10" /></div>
                        <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Phone</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600/10" /></div>
                    </div>
                </Card>

                <Card className="apple-card space-y-6 bg-white dark:bg-zinc-900 border-none shadow-sm p-6 lg:p-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 border-l-2 border-blue-600 pl-3">Security Access</h3>
                    <div className="space-y-4">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Current Key</label>
                            <div className="relative"><input type={showPwd ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-xs font-bold" /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                            <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">New Key</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-xs font-bold" /></div>
                            <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Confirm</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-xs font-bold" /></div>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end pt-2 pb-10">
                    <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-12 py-3.5 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase shadow-lg shadow-blue-500/10">{loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Apply Modifications</button>
                </div>
            </div>
        </form>
      ) : (
        <div className="space-y-6 px-2 pb-20 lg:pb-0">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input type="text" placeholder="SEARCH TEAM..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600/10" />
                </div>
                {!showUserForm && <button onClick={() => handleOpenUserForm()} className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase"><Plus size={16} /> New Account</button>}
            </div>

            {showUserForm ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between"><button onClick={() => setShowUserForm(false)} className="flex items-center gap-2 text-[9px] font-black text-zinc-400 uppercase hover:text-blue-600"><ArrowLeft size={14} /> Back</button><h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">{selectedUser ? "Modify Access" : "Activation"}</h3></div>
                    <form onSubmit={handleSaveUser} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase">Full Name</label><input required value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none text-xs font-bold" /></div>
                            <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase">System ID</label><input required value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none text-xs font-bold" /></div>
                            <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase">Role</label><select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none text-xs font-bold outline-none appearance-none"><option value="ELECTRICIEN">FIELD TECHNICIAN</option><option value="ADMINISTRATEUR">SYSTEM ADMINISTRATOR</option></select></div>
                            <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-zinc-400 uppercase">Password</label><input type="password" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none text-xs font-bold" /></div>
                        </div>
                        <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800 flex justify-end gap-3"><button type="button" onClick={() => setShowUserForm(false)} className="px-6 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-[9px] font-black uppercase text-zinc-400">Cancel</button><button disabled={loading} type="submit" className="btn-primary flex items-center gap-2 px-8 py-2.5 rounded-xl text-[9px] font-black uppercase">{loading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Save</button></div>
                    </form>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    {/* MOBILE LIST */}
                    <div className="sm:hidden divide-y divide-zinc-50 dark:divide-zinc-800">
                        {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                            <div key={u.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black uppercase overflow-hidden">{u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.substring(0,2)}</div>
                                    <div><p className="text-[11px] font-black uppercase leading-none">{u.name}</p><p className="text-[8px] font-bold text-zinc-400 mt-1 uppercase">@{u.username} • {u.role === 'ADMINISTRATEUR' ? 'Admin' : 'Tech'}</p></div>
                                </div>
                                <button onClick={() => handleOpenUserForm(u)} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400"><Pencil size={14} /></button>
                            </div>
                        ))}
                    </div>
                    {/* DESKTOP TABLE */}
                    <table className="hidden sm:table w-full text-left border-collapse">
                        <thead><tr className="bg-zinc-50/50 dark:bg-zinc-800/30 text-[8px] font-black text-zinc-400 uppercase tracking-widest"><th className="px-6 py-4">Identity</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right pr-8">Audit</th></tr></thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                                <tr key={u.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20 transition-all"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black uppercase overflow-hidden">{u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.substring(0,2)}</div><div><p className="text-[11px] font-black uppercase leading-none">{u.name}</p><p className="text-[8px] font-bold text-zinc-400 mt-1 uppercase">@{u.username}</p></div></div></td><td className="px-6 py-4"><span className="text-[9px] font-black uppercase text-zinc-500">{u.role === 'ADMINISTRATEUR' ? "Admin" : "Tech"}</span></td><td className="px-6 py-4"><div className="flex items-center gap-2"><div className={cn("w-1.5 h-1.5 rounded-full", u.isActive ? "bg-green-500" : "bg-zinc-300")} /><span className="text-[9px] font-black uppercase text-zinc-500">{u.isActive ? "Active" : "Locked"}</span></div></td><td className="px-6 py-4 text-right pr-8"><button onClick={() => handleOpenUserForm(u)} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 transition-all ml-auto flex items-center justify-center"><Pencil size={14} /></button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
