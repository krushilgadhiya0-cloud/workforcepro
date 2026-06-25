import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  hideClose?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', hideClose = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!hideClose ? onClose : undefined} />
      <div className={`relative w-full ${sizes[size]} glass-card rounded-2xl flex flex-col max-h-[90vh] animate-fade-in`}>
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
          {!hideClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--border)]/50 transition-colors cursor-pointer">
              <X size={20} className="text-[var(--text-muted)]" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-6 pb-6 flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
