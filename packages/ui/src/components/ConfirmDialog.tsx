import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { cn } from '../utils/cn';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  /** Red styling for destructive actions */
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  destructive = false,
  confirmLabel,
  cancelLabel = 'Cancel',
  loading = false,
}) => {
  return (
    <Modal open={open} onClose={onClose} width="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {destructive && (
            <div className="shrink-0 mt-0.5 p-2 bg-red-50 border border-red-200">
              <AlertTriangle size={18} className="text-status-danger" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-content-primary">{title}</h3>
            <p className="mt-1 text-sm text-content-secondary">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? (destructive ? 'Delete' : 'Confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
