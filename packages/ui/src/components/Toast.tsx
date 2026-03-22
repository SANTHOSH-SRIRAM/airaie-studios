import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../utils/cn';

// --- Types ---

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

export interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

// --- Context ---

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

// --- Icons & styles per variant ---

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; containerClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    containerClass: 'border-l-emerald-500 bg-emerald-50',
    iconClass: 'text-emerald-600',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'border-l-status-danger bg-red-50',
    iconClass: 'text-status-danger',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-l-amber-500 bg-amber-50',
    iconClass: 'text-amber-600',
  },
  info: {
    icon: Info,
    containerClass: 'border-l-brand-primary bg-surface-layer',
    iconClass: 'text-brand-primary',
  },
};

// --- Single Toast ---

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  const config = variantConfig[item.variant];
  const Icon = config.icon;

  useEffect(() => {
    const duration = item.duration ?? 5000;
    if (duration <= 0) return;
    const timer = setTimeout(() => onDismiss(item.id), duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 px-4 py-3 border border-surface-border border-l-4 shadow-lg',
        'rounded-none animate-in slide-in-from-right-full duration-300',
        'min-w-[320px] max-w-[420px]',
        config.containerClass
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-content-primary">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs text-content-secondary">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="p-0.5 text-content-muted hover:text-content-primary transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// --- Provider & Toaster ---

let idCounter = 0;

export interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${++idCounter}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...item, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toaster container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite" aria-label="Notifications">
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

ToastProvider.displayName = 'ToastProvider';
