'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 2;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        const newToast = { id, message, type };

        setToasts(prev => {
            // Keep only the most recent (MAX_TOASTS - 1) toasts to make room for the new one
            const updated = prev.length >= MAX_TOASTS ? prev.slice(-(MAX_TOASTS - 1)) : prev;
            return [...updated, newToast];
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
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

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 p-4 rounded-xl shadow-xl backdrop-blur-sm animate-fade-in-up ${toast.type === 'success'
                            ? 'bg-emerald-900/90 border border-emerald-500/30'
                            : toast.type === 'error'
                                ? 'bg-rose-900/90 border border-rose-500/30'
                                : 'bg-slate-800/90 border border-slate-600/30'
                        }`}
                >
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                    {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
                    {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />}

                    <span className={`text-sm flex-1 ${toast.type === 'success' ? 'text-emerald-100' :
                            toast.type === 'error' ? 'text-rose-100' : 'text-slate-100'
                        }`}>
                        {toast.message}
                    </span>

                    <button
                        onClick={() => onRemove(toast.id)}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                        title="Dismiss"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default ToastContainer;
