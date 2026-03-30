import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, X, AlertTriangle, Info } from "lucide-react";

import { MessageType } from '@/common/types';

// 2. Configuration Map
const TOAST_CONFIG = {
  [MessageType.INFO]: {
    icon: <Info className="h-6 w-6" />,
    className: "bg-gray-600 text-white"
  },
  [MessageType.SUCCESS]: {
    icon: <CheckCircle className="h-6 w-6" />,
    className: "bg-green-600 text-white"
  },
  [MessageType.WARNING]: {
    icon: <AlertTriangle className="h-6 w-6" />,
    className: "bg-yellow-600 text-white"
  },
  [MessageType.ERROR]: {
    icon: <XCircle className="h-6 w-6" />,
    className: "bg-destructive text-white"
  }
} as const;

export interface Toast {
  id: string;
  message: string;
  type: MessageType;
  isExiting?: boolean; // Track the exit state
}

interface ToastContextValue {
  showToast: (message: string, type: MessageType) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const markForRemoval = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
  }, []);

  const finalizeRemoval = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = useCallback((message: string, type: MessageType) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => markForRemoval(id), 10000);
  }, [markForRemoval]);

  // Inject CSS once
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes slide-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
      .animate-slide-out { animation: slide-out 0.3s ease-in forwards; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4 max-w-[400px] overflow-hidden">
        {toasts.map(toast => {
          const config = TOAST_CONFIG[toast.type];
          return (
            <div
              key={toast.id}
              onAnimationEnd={() => toast.isExiting && finalizeRemoval(toast.id)}
              className={cn(
                "p-6 rounded-xl shadow-lg flex items-center gap-4 min-w-[300px]",
                toast.isExiting ? "animate-slide-out" : "animate-slide-in",
                config.className
              )}
            >
              <div className="flex-shrink-0">{config.icon}</div>
              <div className="flex-1 text-sm break-words">{toast.message}</div>
              <button 
                onClick={() => markForRemoval(toast.id)}
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};