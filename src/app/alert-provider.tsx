'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: AlertType;
    duration?: number;
}

interface ConfirmConfig {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    resolve: (value: boolean) => void;
}

type AlertContextType = {
    showAlert: (message: string, type?: AlertType) => void;
    showConfirm: (message: string, title?: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

    const showAlert = (message: string, type: AlertType = 'error') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const showConfirm = (
        message: string, 
        title: string = 'Confirmación', 
        confirmText: string = 'Aceptar', 
        cancelText: string = 'Cancelar'
    ): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirm({
                title,
                message,
                confirmText,
                cancelText,
                resolve
            });
        });
    };

    // Override window.alert for compatibility and automatic styling across the application
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.alert = (msg: string) => {
                const messageStr = String(msg);
                // Smart type detection based on keywords
                const isSuccess = /éxito|exitosamente|guardado|actualizado|creado|enviado/i.test(messageStr);
                const isWarning = /debe|campos|inválido|no coinciden|caracteres|vacío/i.test(messageStr);
                const type: AlertType = isSuccess ? 'success' : isWarning ? 'warning' : 'error';
                showAlert(messageStr, type);
            };
        }
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
                {toasts.map(toast => (
                    <ToastComponent 
                        key={toast.id} 
                        toast={toast} 
                        onClose={() => removeToast(toast.id)} 
                    />
                ))}
            </div>

            {/* Custom Confirm Dialog Modal */}
            {confirm && (
                <ConfirmModal 
                    config={confirm} 
                    onClose={(val) => {
                        confirm.resolve(val);
                        setConfirm(null);
                    }} 
                />
            )}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert debe ser usado dentro de un AlertProvider');
    }
    return context;
}

// Toast Component with micro-animations and premium design
function ToastComponent({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, toast.duration || 5000);
        return () => clearTimeout(timer);
    }, [toast.duration, onClose]);

    const styles = {
        success: {
            bg: 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900/50',
            text: 'text-emerald-800 dark:text-emerald-200',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
            progress: 'bg-emerald-500'
        },
        error: {
            bg: 'bg-rose-50/90 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900/50',
            text: 'text-rose-800 dark:text-rose-200',
            icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
            progress: 'bg-rose-500'
        },
        warning: {
            bg: 'bg-amber-50/90 dark:bg-amber-950/90 border-amber-200 dark:border-amber-900/50',
            text: 'text-amber-800 dark:text-amber-200',
            icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
            progress: 'bg-amber-500'
        },
        info: {
            bg: 'bg-blue-50/90 dark:bg-blue-950/90 border-blue-200 dark:border-blue-900/50',
            text: 'text-blue-800 dark:text-blue-200',
            icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
            progress: 'bg-blue-500'
        }
    };

    const currentStyle = styles[toast.type];

    return (
        <div className={`pointer-events-auto flex gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg ${currentStyle.bg} animate-in slide-in-from-top-4 fade-in duration-300 relative overflow-hidden`}>
            {currentStyle.icon}
            <div className="flex-1 text-xs font-semibold leading-relaxed pr-3 select-none">
                {toast.message}
            </div>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
            <div 
                className={`absolute bottom-0 left-0 h-1 ${currentStyle.progress} transition-all duration-[5000ms] ease-linear`}
                style={{ width: '0%', animation: 'shrinkWidth 5s linear forwards' }}
            />
            <style jsx global>{`
                @keyframes shrinkWidth {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}

// Premium Confirm Dialog Modal
function ConfirmModal({ config, onClose }: { config: ConfirmConfig; onClose: (val: boolean) => void }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleConfirm = () => {
        onClose(true);
    };

    const handleCancel = () => {
        onClose(false);
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                onClick={handleCancel}
                className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`} 
            />

            {/* Dialog Content */}
            <div className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl transition-all duration-300 transform ${isMounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100/50 dark:border-rose-900/30">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {config.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                            {config.message}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6 justify-end">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                    >
                        {config.cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer active:scale-95"
                    >
                        {config.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
