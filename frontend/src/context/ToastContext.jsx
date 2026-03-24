import { createContext, useContext, useState, useCallback } from 'react';

export const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'ok') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
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
