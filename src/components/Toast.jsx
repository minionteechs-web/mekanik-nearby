import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(({ id, message, type }) => {
                    const Icon = icons[type] || Info;
                    return (
                        <div key={id} className={`toast toast-${type}`}>
                            <Icon size={18} />
                            <span>{message}</span>
                            <button className="toast-dismiss" onClick={() => dismiss(id)}>
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
