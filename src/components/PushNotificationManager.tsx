"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, BellOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PUBLIC_VAPID_KEY = "BA-l5QNwNPDSadlNd8YFxharpn7qldla3LcTgoNhS38Yre1TpaMGxGLwrjF_0yubxfYZASka82avM1AiQQ-RuI8";

export function PushNotificationManager() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
    if (!sub && session?.user) {
        setShowBanner(true);
    }
  };

  const subscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      await fetch('/api/notifications/register', {
        method: 'POST',
        body: JSON.stringify(sub),
        headers: { 'Content-Type': 'application/json' }
      });

      setSubscription(sub);
      setShowBanner(false);
    } catch (err) {
      console.error('Failed to subscribe', err);
    }
  };

  if (!isSupported || subscription) return null;

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-[200] animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-zinc-900 border-2 border-blue-600 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                        <Bell className="animate-bounce" size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Enable Alerts</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Get real-time mission updates</p>
                    </div>
                </div>
                <button onClick={() => setShowBanner(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600"><X size={18}/></button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">Stay updated on consumption anomalies and new management instructions directly on your device.</p>
            <button
                onClick={subscribe}
                className="w-full btn-primary py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
            >
                Activate Notifications
            </button>
        </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
