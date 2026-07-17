import { AlertCircle, CheckCircle, X } from 'lucide-react';

export interface StatusToastAction {
    label: string;
    onClick: () => void;
}

export interface StatusToastState {
    variant?: 'success' | 'error';
    title: string;
    message: string;
    action?: StatusToastAction;
}

interface StatusToastProps {
    toast: StatusToastState | null;
    onClose: () => void;
}

export function StatusToast({ toast, onClose }: StatusToastProps) {
    if (!toast) return null;
    const isError = toast.variant === 'error';

    return (
        <div
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            className={`fixed right-6 top-6 z-50 w-[min(420px,calc(100vw-3rem))] rounded-lg border shadow-lg ${isError ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
        >
            <div className="flex items-start gap-3 p-4">
                {isError ? (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                ) : (
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                )}
                <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold ${isError ? 'text-red-900' : 'text-green-900'}`}>{toast.title}</div>
                    <div className={`mt-1 whitespace-pre-line text-sm ${isError ? 'text-red-800' : 'text-green-800'}`}>{toast.message}</div>
                    {toast.action && (
                        <button
                            type="button"
                            onClick={toast.action.onClick}
                            className={`mt-3 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors ${isError ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'}`}
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className={`rounded-md p-1 transition-colors ${isError ? 'text-red-700 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'}`}
                    aria-label="Chiudi notifica"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
