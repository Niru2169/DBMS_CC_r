import * as React from 'react';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from './toast';

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToasterContextType {
  toast: (opts: Omit<ToastItem, 'id'>) => void;
}

const ToasterContext = React.createContext<ToasterContextType>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToasterContext);
}

// ToasterProvider wraps the app and provides the toast() function via context
export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToasterContext.Provider value={{ toast }}>
      {children}
      <ToastProvider>
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant}>
            <div className="grid gap-1">
              {t.title && <ToastTitle>{t.title}</ToastTitle>}
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToasterContext.Provider>
  );
}

// Standalone Toaster component (no children) - kept for compatibility
export function Toaster({ children }: { children?: React.ReactNode }) {
  return <ToasterProvider>{children}</ToasterProvider>;
}
