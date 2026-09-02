'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Удалить товар?</h3>
            <p className="text-xs text-slate-400">Это действие нельзя будет отменить</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-5">
          <div className="text-sm font-semibold text-white">{product.name}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>SKU: {product.barcode}</span>
            <span>•</span>
            <span>Остаток: {product.quantity} {product.unit}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Удаление...' : 'Да, удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
