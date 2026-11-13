import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 lg:bottom-6">
      <div className="animate-slide-up flex items-center gap-3 rounded-full border border-purple-500/30 bg-base-800/90 backdrop-blur-md py-3 pl-4 pr-3 shadow-2xl shadow-purple-900/30">
        <CheckCircle2 className="h-5 w-5 text-green-400" />
        <span className="text-sm font-medium text-white">{message}</span>
        <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
