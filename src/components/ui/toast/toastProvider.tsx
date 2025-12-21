import React, { createContext, useState, useCallback } from 'react';
import { ToastContainer as StyledToastContainer, Toast as StyledToast, ToastIcon, ToastMessage, ToastCloseButton } from './styles.ts';

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

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <StyledToastContainer>
        {toasts.map(toast => (
          <StyledToast key={toast.id} $type={toast.type}>
            <ToastIcon>{toast.type === 'success' ? '✓' : '✕'}</ToastIcon>
            <ToastMessage>{toast.message}</ToastMessage>
            <ToastCloseButton onClick={() => removeToast(toast.id)}>×</ToastCloseButton>
          </StyledToast>
        ))}
      </StyledToastContainer>
    </ToastContext.Provider>
  );
};
