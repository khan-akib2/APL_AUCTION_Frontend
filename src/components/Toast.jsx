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
          <div key={t.id} className="bg-[#0d1e3a] border border-[#c9a227]/30 text-white px-4 py-3 rounded-lg shadow-2xl text-sm font-medium animate-fade-in max-w-sm flex items-center gap-2">
            <span className="text-[#c9a227] text-xs font-bold uppercase tracking-wider border-r border-[#c9a227]/20 pr-2 mr-1">
              {t.type === 'success' ? 'OK' : t.type === 'error' ? 'ERR' : t.type === 'warning' ? 'WARN' : 'INFO'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
