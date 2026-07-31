"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Écouter l'événement standard de navigateur pour l'installation
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Vérifier si l'utilisateur n'a pas déjà refusé cette session
      const hasDismissed = localStorage.getItem('pwa_dismissed');
      if (!hasDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_dismissed', 'true');
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[200] lg:hidden animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-zinc-900 text-white p-4 rounded-[1.8rem] shadow-2xl flex items-center justify-between border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-benin-green flex items-center justify-center shrink-0">
             <Download size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-tight">Installer l'application</p>
            <p className="text-[10px] text-zinc-400 font-medium">Accédez au suivi plus rapidement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-zinc-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 active:scale-95 transition-all"
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-zinc-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
