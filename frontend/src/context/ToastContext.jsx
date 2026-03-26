import { createContext, useContext, useState, useCallback, useRef } from 'react';

export const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'ok') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => { setToast(null); timerRef.current = null; }, 2500);
  }, []);

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      {toast && (
        <div className={`toast ${toast.type === 'err' ? 'ter' : toast.type === 'warn' ? 'tow' : 'tok'}`}>
          {toast.message}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
