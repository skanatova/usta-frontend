'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/types';
import { 
  X, 
  ScanLine, 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  TrendingUp
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onQuickUpdateStock: (product: Product, newQty: number) => Promise<void>;
  onViewProduct: (product: Product) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  products,
  onQuickUpdateStock,
  onViewProduct
}: BarcodeScannerModalProps) {
  const [scannedCode, setScannedCode] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setScannedCode('');
      setFoundProduct(null);
      setNotFound(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookup = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setFoundProduct(null);
      setNotFound(false);
      return;
    }
    const match = products.find(
      (p) => p.barcode.toLowerCase() === trimmed.toLowerCase() ||
             p.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (match) {
      setFoundProduct(match);
      setNotFound(false);
    } else {
      setFoundProduct(null);
      setNotFound(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup(scannedCode);
    }
  };

  const handleAdjustStock = async (delta: number) => {
    if (!foundProduct) return;
    const newQty = Math.max(0, (foundProduct.quantity || 0) + delta);
    await onQuickUpdateStock(foundProduct, newQty);
    setFoundProduct({ ...foundProduct, quantity: newQty });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Сканер штрихкодов</h3>
              <p className="text-xs text-slate-400">Поиск товара и быстрое списание / приход</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Input Box */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Отсканируйте или введите штрихкод..."
              value={scannedCode}
              onChange={(e) => {
                setScannedCode(e.target.value);
                handleLookup(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border-2 border-amber-500/50 rounded-xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
            />
            <Barcode className="absolute left-3 top-3.5 w-4 h-4 text-amber-400" />
          </div>

          {/* Sample quick barcodes */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Примеры для тестирования:</span>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setScannedCode(p.barcode);
                    handleLookup(p.barcode);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-colors"
                >
                  {p.barcode}
                </button>
              ))}
            </div>
          </div>

          {/* Product Match Card */}
          {foundProduct && (
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-orange-400 font-semibold">{foundProduct.categoryName || 'Без категории'}</span>
                  <h4 className="text-sm font-bold text-white leading-snug">{foundProduct.name}</h4>
                  <span className="text-xs font-mono text-slate-400">{foundProduct.barcode}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-400">{foundProduct.price.toLocaleString()} сом</div>
                  <div className="text-[11px] text-slate-400">Закуп: {foundProduct.costPrice.toLocaleString()} сом</div>
                </div>
              </div>

              {/* Stock adjustment buttons */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs">
                  <span className="text-slate-400 block">Остаток на складе:</span>
                  <span className="text-base font-black text-white">
                    {foundProduct.quantity} {foundProduct.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjustStock(-1)}
                    disabled={foundProduct.quantity <= 0}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700 disabled:opacity-30 transition-colors"
                    title="Списать 1 ед."
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAdjustStock(1)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
                    title="Оприходовать +1 ед."
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onViewProduct(foundProduct);
                    }}
                    className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors ml-1"
                    title="Подробнее"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {notFound && scannedCode && (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center py-6">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-300">Товар не найден</div>
              <p className="text-xs text-slate-500 mt-1">Проверьте правильность штрихкода или добавьте товар</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}
