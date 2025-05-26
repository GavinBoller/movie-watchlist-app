import React, { createContext, useContext, useState, useEffect } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    // Limit to 1 toast at a time
    setToasts((prev) => [toast]);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <Toaster toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function Toaster({ toasts, dismissToast }) {
  return (
    <div className="fixed z-50 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 300); // Wait for animation to finish
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <div
      className={`pointer-events-auto fixed max-w-[420px] p-6 pr-8 rounded-md shadow-lg transition-all duration-300 ${
        toast.variant === 'destructive'
          ? 'bg-red-600 text-white border-red-700'
          : 'bg-gray-800 text-white border-gray-700'
      } ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } sm:bottom-4 sm:right-4 top-4 left-4 sm:top-auto sm:left-auto border w-[calc(100%-2rem)] sm:w-auto`}
    >
      {toast.title && <h3 className="font-semibold">{toast.title}</h3>}
      {toast.description && <p>{toast.description}</p>}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-2 sm:opacity-0 sm:group-hover:opacity-100 bg-gray-500 bg-opacity-50 rounded-full p-1"
        aria-label="Close toast"
      >
        ✕
      </button>
    </div>
  );
}
