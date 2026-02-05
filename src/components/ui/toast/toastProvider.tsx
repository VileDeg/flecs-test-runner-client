import React, { createContext, useState, useCallback, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastContextValue {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
      
      @keyframes fade-out {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(400px);
        }
      }
      
      .fade-out {
        animation: fade-out 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4 max-w-[400px]">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              "p-6 rounded-xl shadow-lg flex items-center gap-4 min-w-[300px] animate-slide-in",
              toast.type === 'success' 
                ? "bg-green-600 text-white" 
                : "bg-destructive text-white"
            )}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1 text-sm break-words">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};