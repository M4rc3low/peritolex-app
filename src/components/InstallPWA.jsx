import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-sidebar text-sidebar-foreground px-4 py-3 rounded-xl shadow-xl border border-sidebar-border max-w-sm w-[calc(100%-2rem)]">
      <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
        <Download className="w-4 h-4 text-sidebar-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Instalar no PC</p>
        <p className="text-xs text-sidebar-foreground/60">Acesse como app nativo</p>
      </div>
      <Button size="sm" onClick={handleInstall} className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 flex-shrink-0">
        Instalar
      </Button>
      <button onClick={() => setShowBanner(false)} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
