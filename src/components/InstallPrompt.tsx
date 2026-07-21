import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

let globalPrompt: any = null;

// Global event listener so it catches early
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    globalPrompt = e;
    window.dispatchEvent(new Event('pwa-prompt-ready'));
  });
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!globalPrompt);

  useEffect(() => {
    const handleReady = () => setCanInstall(true);
    window.addEventListener('pwa-prompt-ready', handleReady);
    return () => window.removeEventListener('pwa-prompt-ready', handleReady);
  }, []);

  const install = async () => {
    if (!globalPrompt) return;
    globalPrompt.prompt();
    await globalPrompt.userChoice;
    globalPrompt = null;
    setCanInstall(false);
  };

  return { canInstall, install };
}

export function InstallPrompt() {
  const { canInstall, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[var(--card)] text-[var(--text)] p-4 pr-12 rounded-2xl shadow-2xl border border-[var(--border)] animate-fade-in flex items-center gap-4">
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        <X size={16} />
      </button>
      <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center shrink-0">
        <Download size={24} className="text-[var(--primary)]" />
      </div>
      <div>
        <h4 className="font-bold text-sm">Install WorkForce Pro</h4>
        <p className="text-xs text-[var(--text-muted)] mb-2">Get the standalone app experience.</p>
        <button 
          onClick={() => void install()}
          className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Install Now
        </button>
      </div>
    </div>
  );
}
