'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { 
  X, 
  Barcode, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Boxes, 
  TrendingUp, 
  DollarSign
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddToCart
}: ProductDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const marginAmount = product.marginAmount ?? (product.price - product.costPrice);
  const marginPercent = product.marginPercent ?? (product.costPrice > 0 ? ((marginAmount / product.costPrice) * 100) : 0);
  const suggested35 = product.suggestedPrice ?? (product.costPrice > 0 ? Number((product.costPrice * 1.35).toFixed(0)) : product.price);
  const totalStockCost = (product.costPrice || 0) * (product.quantity || 0);
  const totalStockRetail = (product.price || 0) * (product.quantity || 0);
  const totalStockProfit = totalStockRetail - totalStockCost;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <span className="text-[10px] sm:text-xs font-mono bg-slate-800 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                ID #{product.id}
              </span>
              {product.categoryName && (
                <span className="text-[10px] sm:text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-medium truncate">
                  {product.categoryName}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-white leading-snug">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Barcode / SKU Card */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <Barcode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Штрихкод / SKU</div>
                <div className="text-xs sm:text-sm font-mono font-bold text-amber-400 truncate">{product.barcode}</div>
              </div>
            </div>
            <button
              onClick={handleCopyBarcode}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors shrink-0"
              title="Скопировать"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* 3 Pricing Info Cards (Закуп, +35% Реком, Розница) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">Закуп</span>
              <span className="text-xs sm:text-base font-bold text-slate-200 font-mono">{product.costPrice.toLocaleString()} с</span>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-950/20 border border-teal-800/40 text-center">
              <span className="text-[10px] text-teal-400 block mb-0.5 uppercase font-semibold">+35% Реком</span>
              <span className="text-xs sm:text-base font-bold text-teal-300 font-mono">{suggested35.toLocaleString()} с</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-center">
              <span className="text-[10px] text-amber-400 block mb-0.5 uppercase font-semibold">Розница</span>
              <span className="text-xs sm:text-base font-black text-amber-400 font-mono">{product.price.toLocaleString()} с</span>
            </div>
          </div>

          {/* Profit & Margins */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
              <span className="text-[10px] sm:text-[11px] text-emerald-400 block mb-0.5">Прибыль / ед.</span>
              <span className="text-sm sm:text-lg font-bold text-emerald-400">+{marginAmount.toLocaleString()} сом</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
              <span className="text-[10px] sm:text-[11px] text-emerald-400 block mb-0.5">Маржинальность</span>
              <span className="text-sm sm:text-lg font-bold text-emerald-400">{Number(marginPercent).toFixed(1)}%</span>
            </div>
          </div>

          {/* Stock Metrics */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-slate-400" />
                Текущий остаток:
              </span>
              <span className="font-bold text-white text-sm">
                {product.quantity} {product.unit}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">Оценка в закупке:</span>
              <span className="font-medium text-slate-300">{totalStockCost.toLocaleString()} сом</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Потенциальная выручка:</span>
              <span className="font-bold text-emerald-400">{totalStockRetail.toLocaleString()} сом</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Чистая прибыль склада:</span>
              <span className="font-bold text-amber-400">+{totalStockProfit.toLocaleString()} сом</span>
            </div>
          </div>

          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Характеристики
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(product.attributes).map(([k, v]) => (
                  <div key={k} className="p-2 sm:p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 text-xs">
                    <span className="text-slate-400 block text-[10px]">{k}</span>
                    <span className="font-semibold text-white truncate block">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 shrink-0 gap-2">
          <button
            onClick={() => {
              onClose();
              onDelete(product);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>

          <div className="flex items-center gap-2">
            {onAddToCart && product.quantity > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onAddToCart(product);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <DollarSign className="w-4 h-4" />
                Продать товар
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Изменить
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
