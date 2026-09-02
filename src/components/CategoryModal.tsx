'use client';

import React, { useState } from 'react';
import { Category, Product } from '@/types';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2, 
  FolderPlus,
  Boxes
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Категории товаров</h3>
              <p className="text-xs text-slate-400">Управление справочником категорий</p>
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
          
          {/* Add Category Input */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="Название новой категории..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCatName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50 transition-colors shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </form>

          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}

          {/* Category List */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
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
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
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
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Готово
          </button>
        </div>

      </div>
    </div>
  );
}
