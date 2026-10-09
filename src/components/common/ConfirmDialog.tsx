import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  confirmVariant?: string;
  loading?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = 'নিশ্চিত করুন (Confirm)',
  cancelText = 'বাতিল (Cancel)',
  isDestructive = true,
  confirmVariant,
  loading = false,
  isLoading = false,
}) => {
  const handleClose = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  const isSpinning = loading || isLoading;
  const isDanger = confirmVariant ? confirmVariant === 'danger' : isDestructive;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSpinning}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSpinning}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            {isSpinning ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
