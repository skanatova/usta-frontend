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
  Layers, 
  Boxes, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete
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
  const totalStockCost = (product.costPrice || 0) * (product.quantity || 0);
  const totalStockRetail = (product.price || 0) * (product.quantity || 0);
  const totalStockProfit = totalStockRetail - totalStockCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono bg-slate-800 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                ID #{product.id}
              </span>
              {product.categoryName && (
                <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-md font-medium">
                  {product.categoryName}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Barcode / SKU Card */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Штрихкод / SKU</div>
                <div className="text-sm font-mono font-bold text-amber-400">{product.barcode}</div>
              </div>
            </div>
            <button
              onClick={handleCopyBarcode}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              title="Скопировать штрихкод"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Pricing & Margins Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Закупочная цена</span>
              <span className="text-lg font-bold text-slate-200">{product.costPrice.toLocaleString()} сом</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Цена продажи</span>
              <span className="text-lg font-bold text-amber-400">{product.price.toLocaleString()} сом</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
              <span className="text-[11px] text-emerald-400 block mb-0.5">Прибыль с единицы</span>
              <span className="text-lg font-bold text-emerald-400">+{marginAmount.toLocaleString()} сом</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
              <span className="text-[11px] text-emerald-400 block mb-0.5">Маржинальность</span>
              <span className="text-lg font-bold text-emerald-400">{Number(marginPercent).toFixed(1)}%</span>
            </div>
          </div>

          {/* Stock Metrics */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-slate-400" />
                Текущий остаток:
              </span>
              <span className="font-bold text-white text-sm">
                {product.quantity} {product.unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <span className="text-slate-400">Оценка остатка в закупке:</span>
              <span className="font-medium text-slate-300">{totalStockCost.toLocaleString()} сом</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Потенциальная выручка:</span>
              <span className="font-bold text-emerald-400">{totalStockRetail.toLocaleString()} сом</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Ожидаемая чистая прибыль:</span>
              <span className="font-bold text-amber-400">+{totalStockProfit.toLocaleString()} сом</span>
            </div>
          </div>

          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Характеристики товара
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(product.attributes).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 text-xs">
                    <span className="text-slate-400 block text-[10px]">{k}</span>
                    <span className="font-semibold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={() => {
              onClose();
              onDelete(product);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Закрыть
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Редактировать
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
