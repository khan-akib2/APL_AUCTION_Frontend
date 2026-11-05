'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="bg-white border border-[#e8e2d5] text-[#111827] px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-fade-in max-w-sm flex items-center gap-2.5">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              t.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
              t.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
              'bg-[#f4efe6] text-[#0d3a24] border border-[#e8e2d5]'
            }`}>
              {t.type === 'success' ? 'OK' : t.type === 'error' ? 'ERR' : t.type === 'warning' ? 'WARN' : 'INFO'}
            </span>
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
