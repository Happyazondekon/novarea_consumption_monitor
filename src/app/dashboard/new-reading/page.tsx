"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Droplets,
  Camera,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  Minus,
  Save,
  Info,
  ChevronRight,
  FileText,
  Eye,
  X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

export default function NewReadingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<"POWER" | "WATER" | null>(null);
  const [value, setValue] = useState(0.00);
  const [fileName, setFileName] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1024;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setPhotoData(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIncrement = () => setValue(prev => parseFloat((prev + 1).toFixed(2)));
  const handleDecrement = () => setValue(prev => parseFloat((Math.max(0, prev - 1)).toFixed(2)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !value || !photoData) {
        Swal.fire({ icon: 'warning', title: 'Incomplete Data', text: 'Please provide both the meter value and a proof photo.' });
        return;
    }
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append("category", category);
        formData.append("value", value.toString());
        formData.append("photo", photoData);
        formData.append("timeOfDay", new Date().getHours() < 13 ? "MORNING" : "EVENING");

        const res = await fetch("/api/readings", { method: "POST", body: formData });
        if (res.ok) setStep(3);
        else {
            if (res.status === 413) throw new Error("Photo size too large.");
            const error = await res.json();
            throw new Error(error.error || "Failed to save reading");
        }
    } catch (error: any) { Swal.fire('Error', error.message, 'error'); } finally { setLoading(false); }
  };

  return (
    <div className="w-full min-h-full py-6 pb-24 space-y-6 animate-fade-in px-4 lg:px-6 relative text-left overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">New Reading</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5">
               {step === 1 ? "Category Selection" : step === 2 ? "Data Entry" : "Confirmation"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-all"><ArrowLeft size={14} /><span>Cancel</span></Link>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-1">
        {[1, 2, 3].map((i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all duration-500", step === i ? "w-10 bg-blue-600 shadow-lg shadow-blue-500/20" : step > i ? "w-4 bg-blue-600/30" : "w-4 bg-zinc-200 dark:bg-zinc-800")} />
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">

          {step === 1 && (
            <div id="selection-cards" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <SelectionCard title="Electricity" icon={Zap} active={category === "POWER"} onClick={() => { setCategory("POWER"); setStep(2); }} />
                <SelectionCard title="Water" icon={Droplets} active={category === "WATER"} onClick={() => { setCategory("WATER"); setStep(2); }} />
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div id="meter-index-input" className="space-y-4">
                        <div className="flex items-center gap-2 mb-1"><div className="w-1 h-5 rounded-full bg-blue-600" /><h3 className="font-black text-[10px] uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Meter Index</h3></div>
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
                            <div className="flex items-center gap-4">
                                <button type="button" onClick={handleDecrement} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:text-red-500 transition-all active:scale-90"><Minus size={18} /></button>
                                <div className="text-center">
                                    <input type="number" step="0.01" autoFocus value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className="w-32 text-4xl font-black text-center bg-transparent border-none outline-none text-zinc-900 dark:text-white" />
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">{category === "POWER" ? "kWh" : "m³"}</p>
                                </div>
                                <button type="button" onClick={handleIncrement} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:text-green-500 transition-all active:scale-90"><Plus size={18} /></button>
                            </div>
                        </div>
                    </div>

                    <div id="photo-upload-zone" className="space-y-4">
                        <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><div className="w-1 h-5 rounded-full bg-blue-600" /><h3 className="font-black text-[10px] uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Photo Proof</h3></div></div>
                        <div className="relative group">
                            {!fileName && <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />}
                            <div className={cn("w-full py-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 overflow-hidden relative shadow-inner", fileName ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50")}>
                                {fileName ? (
                                    <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                                        <button type="button" onClick={() => setShowPreview(true)} className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group/btn"><FileText size={24} className="group-hover/btn:hidden" /><Eye size={24} className="hidden group-hover/btn:block" /></button>
                                        <div className="text-center"><p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate max-w-[180px]">{fileName}</p><button type="button" onClick={() => { setFileName(null); setPhotoData(null); }} className="text-[8px] font-bold text-red-500 uppercase tracking-widest mt-1 hover:underline">Change</button></div>
                                    </div>
                                ) : (
                                    <><div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center text-zinc-300 group-hover:text-blue-600 transition-all"><Camera size={20} /></div><div className="text-center px-4"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Select Proof</p></div></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <button type="button" onClick={() => setStep(1)} className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all">Back</button>
                    <button id="submit-reading-btn" type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-10 py-3.5 shadow-lg shadow-blue-500/10 text-[11px] font-black uppercase">{loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}<span>Submit Entry</span></button>
                </div>
            </form>
          )}

          {step === 3 && (
            <div id="success-screen" className="py-12 flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500 text-center">
                <div className="w-20 h-20 rounded-[1.5rem] bg-green-500 flex items-center justify-center text-white shadow-2xl shadow-green-500/20 rotate-12"><CheckCircle2 size={40} /></div>
                <div className="space-y-1"><h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Success</h2><p className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">Archived in global system.</p></div>
                <div className="pt-4"><Link href="/dashboard" className="btn-primary px-12 py-3.5 text-[11px] font-black uppercase">Finish</Link></div>
            </div>
          )}
        </div>
      </div>

      {showPreview && photoData && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300 p-8"><button onClick={() => setShowPreview(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-[160]"><X size={24} /></button><div className="relative w-full max-w-2xl h-full max-h-[70vh] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10 animate-in zoom-in-95 duration-300"><img src={photoData} alt="Meter Preview" className="w-full h-full object-contain" /></div></div>
      )}
    </div>
  );
}

function SelectionCard({ title, icon: Icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("p-8 flex flex-col items-center gap-4 rounded-[2rem] transition-all duration-300 border text-center group", active ? "bg-blue-600 border-blue-600 text-white shadow-xl -translate-y-1" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-200")}>
        <div className={cn("p-5 rounded-2xl transition-colors", active ? "bg-white/20" : "bg-zinc-200 dark:bg-zinc-800")}><Icon size={32} className={active ? "text-white" : "text-blue-600"} /></div>
        <div><span className="font-black uppercase tracking-widest text-sm block">{title}</span></div>
        <ChevronRight size={18} className={cn("mt-1 transition-transform group-hover:translate-x-1", active ? "text-white" : "text-zinc-200")} />
    </button>
  );
}
