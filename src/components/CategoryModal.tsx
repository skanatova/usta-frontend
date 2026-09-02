'use client';

import React, { useState } from 'react';
import { Category, Product } from '@/types';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2
} from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onCreateCategory: (name: string) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
}

export function CategoryModal({
  isOpen,
  onClose,
  categories,
  products,
  onCreateCategory,
  onDeleteCategory
}: CategoryModalProps) {
  const [newCatName, setNewCatName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateCategory(newCatName.trim());
      setNewCatName('');
    } catch (err: any) {
      setError(err.message || 'Ошибка добавления категории');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProductCountByCat = (catId: number) => {
    return products.filter((p) => p.categoryId === catId).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Категории товаров</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">Справочник разделов каталога</p>
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
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          
          {/* Add Category Input */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="Название категории..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCatName.trim()}
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50 transition-colors shadow-md shadow-orange-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </form>

          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}

          {/* Category List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Категорий пока нет. Создайте первую выше!
              </div>
            ) : (
              categories.map((cat) => {
                const count = getProductCountByCat(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] sm:text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                        {count} тов.
                      </span>
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Удалить категорию"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
          >
            Готово
          </button>
        </div>

      </div>
    </div>
  );
}
