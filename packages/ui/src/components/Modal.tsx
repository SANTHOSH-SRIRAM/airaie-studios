import React, { useEffect, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Width class override, defaults to max-w-lg */
  width?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  className,
  width = 'max-w-lg',
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full bg-white border border-surface-border shadow-xl rounded-none',
          'mx-4 animate-in fade-in zoom-in-95 duration-200',
          width,
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <h2 className="text-base font-semibold text-content-primary">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-content-muted hover:text-content-primary transition-colors rounded-none focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Close button (no header) */}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1 text-content-muted hover:text-content-primary transition-colors rounded-none focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          >
            <X size={18} />
          </button>
        )}

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';

export default Modal;
