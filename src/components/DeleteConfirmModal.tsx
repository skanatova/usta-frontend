'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteConfirmModal({
  isOpen,
  product,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(product.id);
      onClose();
    } catch {
      // handled in parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Удалить товар?</h3>
            <p className="text-[10px] sm:text-xs text-slate-400">Действие нельзя будет отменить</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-4">
          <div className="text-xs sm:text-sm font-semibold text-white">{product.name}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>SKU: {product.barcode}</span>
            <span>•</span>
            <span>Остаток: {product.quantity} {product.unit}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
