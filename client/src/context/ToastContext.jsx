import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((a) => [...a, { id, message, type }]);
    setTimeout(() => setItems((a) => a.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <ToastContext.Provider value={{ success: (m) => push(m), error: (m) => push(m, 'error') }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`flex max-w-sm items-start gap-2 rounded-2xl px-4 py-3 text-sm text-white shadow-lg ${t.type === 'error' ? 'bg-red-600' : 'bg-navy'}`}>
            {t.type === 'error' ? <XCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}{t.message}
          </div>))}
      </div>
    </ToastContext.Provider>
  );
}
