"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

export type ToastContextType = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-80 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : toast.type === "error"
                  ? "bg-red-600 text-white"
                  : toast.type === "warning"
                    ? "bg-amber-500 text-white"
                    : "bg-[#0F1D35] text-[#B8BCC8] border border-white/10"
            }`}
            onClick={() => dismiss(toast.id)}
          >
            <div className="flex items-center gap-2">
              <span>
                {toast.type === "success" && "✓"}
                {toast.type === "error" && "✕"}
                {toast.type === "warning" && "⚠"}
                {toast.type === "info" && "ℹ"}
              </span>
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
