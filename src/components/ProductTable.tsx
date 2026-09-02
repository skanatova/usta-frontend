'use client';

import React, { useState, useMemo } from 'react';
import { Product, Category } from '@/types';
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  Barcode, 
  Copy, 
  Check, 
  Package, 
  X,
  ChevronRight,
  FolderTree
} from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onQuickUpdateStock: (product: Product, newQty: number) => Promise<void>;
  onOpenCreateModal: () => void;
}

type SortField = 'name' | 'price' | 'costPrice' | 'quantity' | 'marginPercent' | 'id';
type SortOrder = 'asc' | 'desc';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export function ProductTable({
  products,
  categories,
  isLoading,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickUpdateStock,
  onOpenCreateModal
}: ProductTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);

  const handleCopyBarcode = (barcode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);
    setTimeout(() => setCopiedBarcode(null), 1500);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Helper to recursively get all descendant category IDs for super-parent filtering
  const getSubcategoryIds = useMemo(() => {
    return (rootCatId: number): Set<number> => {
      const ids = new Set<number>([rootCatId]);
      const queue = [rootCatId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = categories.filter((c) => c.parentId === current);
        for (const child of children) {
          if (!ids.has(child.id)) {
            ids.add(child.id);
            queue.push(child.id);
          }
        }
      }
      return ids;
    };
  }, [categories]);

  // Count products in a category and all its subcategories
  const getCategoryProductCount = (catId: number) => {
    const validIds = getSubcategoryIds(catId);
    return products.filter((p) => p.categoryId && validIds.has(p.categoryId)).length;
  };

  // Root categories (categories with no parent)
  const rootCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  // Find currently active category object (if selected)
  const activeCategory = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find((c) => c.id === selectedCategory) || null;
  }, [selectedCategory, categories]);

  // Find root parent of active category
  const activeRootCategory = useMemo(() => {
    if (!activeCategory) return null;
    if (!activeCategory.parentId) return activeCategory;
    return categories.find((c) => c.id === activeCategory.parentId) || activeCategory;
  }, [activeCategory, categories]);

  // Subcategories of the active root category
  const activeSubcategories = useMemo(() => {
    if (!activeRootCategory) return [];
    return categories.filter((c) => c.parentId === activeRootCategory.id);
  }, [activeRootCategory, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        const matchesCategory = p.categoryName?.toLowerCase().includes(q);
        const matchesAttrs = Object.values(p.attributes || {}).some((v) =>
          v.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesBarcode && !matchesCategory && !matchesAttrs) {
          return false;
        }
      }

      // 2. Hierarchical Category filter (Super Parent includes ALL subcategories)
      if (selectedCategory !== 'all') {
        const validCategoryIds = getSubcategoryIds(selectedCategory);
        if (!p.categoryId || !validCategoryIds.has(p.categoryId)) {
          return false;
        }
      }

      // 3. Stock filter
      if (stockFilter === 'in_stock') {
        if ((p.quantity || 0) <= 0) return false;
      } else if (stockFilter === 'low_stock') {
        if ((p.quantity || 0) <= 0 || (p.quantity || 0) > 5) return false;
      } else if (stockFilter === 'out_of_stock') {
        if ((p.quantity || 0) > 0) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'marginPercent') {
        valA = a.marginPercent ?? ((a.price - a.costPrice) / (a.costPrice || 1));
        valB = b.marginPercent ?? ((b.price - b.costPrice) / (b.costPrice || 1));
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortField, sortOrder, getSubcategoryIds]);

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-900/70 border border-slate-800 rounded-xl sm:rounded-2xl backdrop-blur-sm space-y-2.5 sm:space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по названию, штрихкоду, бренду..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & Sorting on Mobile/Desktop */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            
            {/* Hierarchical Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full sm:w-auto px-3 py-2 sm:py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-amber-500 truncate"
            >
              <option value="all">Все категории ({products.length})</option>
              {rootCategories.map((root) => {
                const subCats = categories.filter((c) => c.parentId === root.id);
                const rootCount = getCategoryProductCount(root.id);
                return (
                  <React.Fragment key={root.id}>
                    <option value={root.id} className="font-bold text-amber-400">
                      📁 {root.name} ({rootCount})
                    </option>
                    {subCats.map((sub) => {
                      const subCount = getCategoryProductCount(sub.id);
                      return (
                        <option key={sub.id} value={sub.id} className="text-slate-300">
                          &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name} ({subCount})
                        </option>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="w-full sm:w-auto px-3 py-2 sm:py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="all">Все остатки</option>
              <option value="in_stock">В наличии (&gt;0)</option>
              <option value="low_stock">Мало (&le;5)</option>
              <option value="out_of_stock">Закончился (0)</option>
            </select>
          </div>

        </div>

        {/* Root Category Quick Chips (Horizontal Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium text-xs shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            Все ({products.length})
          </button>
          {rootCategories.map((root) => {
            const count = getCategoryProductCount(root.id);
            const isSelected = selectedCategory === root.id || (activeRootCategory && activeRootCategory.id === root.id);
            return (
              <button
                key={root.id}
                onClick={() => setSelectedCategory(root.id)}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium text-xs shrink-0 ${
                  isSelected
                    ? 'bg-orange-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                {root.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Subcategories Drill-Down Pill Bar (Appears when a Parent Category is active!) */}
        {activeRootCategory && activeSubcategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 border-t border-slate-800/60 text-xs">
            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-wider shrink-0 pl-1">
              <FolderTree className="w-3 h-3 text-orange-400" />
              Подкатегории:
            </span>
            <button
              onClick={() => setSelectedCategory(activeRootCategory.id)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] transition-colors whitespace-nowrap font-medium shrink-0 ${
                selectedCategory === activeRootCategory.id
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              Все в {activeRootCategory.name} ({getCategoryProductCount(activeRootCategory.id)})
            </button>
            {activeSubcategories.map((sub) => {
              const subCount = getCategoryProductCount(sub.id);
              const isSubSelected = selectedCategory === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedCategory(sub.id)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] transition-colors whitespace-nowrap font-medium shrink-0 ${
                    isSubSelected
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  ↳ {sub.name} ({subCount})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active category filter breadcrumb info */}
      {activeCategory && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-orange-950/20 border border-orange-800/30 rounded-xl text-xs text-orange-300">
          <div className="flex items-center gap-1.5 truncate">
            <span>Категория:</span>
            {activeCategory.parentId && activeRootCategory && (
              <>
                <span className="text-slate-400">{activeRootCategory.name}</span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </>
            )}
            <strong className="text-white font-bold">{activeCategory.name}</strong>
            {!activeCategory.parentId && (
              <span className="text-[10px] text-orange-400/80 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 ml-1">
                включая все подкатегории
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-[11px] text-orange-400 hover:text-white underline ml-2 shrink-0"
          >
            Сбросить
          </button>
        </div>
      )}

      {/* MOBILE CARDS VIEW (block md:hidden) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">Загрузка каталога...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-300">Товары не найдены</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {searchQuery || selectedCategory !== 'all' || stockFilter !== 'all'
                ? 'В выбранной категории или по данному запросу пока нет товаров'
                : 'В вашем складе еще нет добавленных позиций'}
            </p>
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Добавить товар
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const marginAmount = product.marginAmount ?? (product.price - product.costPrice);
            const marginPercent = product.marginPercent ?? (product.costPrice > 0 ? ((marginAmount / product.costPrice) * 100) : 0);
            const isLowStock = (product.quantity || 0) <= 5 && (product.quantity || 0) > 0;
            const isOutOfStock = (product.quantity || 0) <= 0;

            return (
              <div
                key={product.id}
                onClick={() => onViewProduct(product)}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-lg active:border-slate-700 transition-all"
              >
                {/* Header row: Category + Margin */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    {product.categoryName ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 truncate">
                        {product.categoryName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Без категории</span>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                    Number(marginPercent) >= 30
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : Number(marginPercent) > 0
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}>
                    +{Number(marginPercent).toFixed(1)}% маржа
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-bold text-sm text-slate-100 leading-snug">
                    {product.name}
                  </h3>
                  {/* Barcode chip */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={(e) => handleCopyBarcode(product.barcode, e)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300/90 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/80 active:bg-slate-700"
                    >
                      <Barcode className="w-3 h-3 text-amber-400" />
                      <span>{product.barcode}</span>
                      {copiedBarcode === product.barcode && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Attribute chips */}
                {product.attributes && Object.keys(product.attributes).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(product.attributes).slice(0, 3).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60"
                      >
                        <strong className="text-slate-300">{k}:</strong> {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Pricing & Profit Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Закуп</span>
                    <span className="font-semibold text-slate-300">{product.costPrice.toLocaleString()} с</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Продажа</span>
                    <span className="font-black text-amber-400">{product.price.toLocaleString()} с</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Прибыль</span>
                    <span className="font-bold text-emerald-400">+{marginAmount.toLocaleString()} с</span>
                  </div>
                </div>

                {/* Bottom Controls: Stock Stepper & Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 gap-2" onClick={(e) => e.stopPropagation()}>
                  
                  {/* Touch-optimized Stock Stepper */}
                  <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
                    <button
                      onClick={() => onQuickUpdateStock(product, Math.max(0, product.quantity - 1))}
                      disabled={product.quantity <= 0}
                      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center active:scale-95 disabled:opacity-30 transition-all"
                      title="Уменьшить остаток"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className={`px-2 font-mono text-xs font-black min-w-[50px] text-center ${
                      isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {product.quantity} {product.unit}
                    </span>
                    <button
                      onClick={() => onQuickUpdateStock(product, product.quantity + 1)}
                      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center active:scale-95 transition-all"
                      title="Увеличить остаток"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewProduct(product)}
                      className="p-2 text-slate-300 hover:text-amber-400 bg-slate-800 rounded-lg border border-slate-700 active:scale-95 transition-all"
                      title="Подробнее"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 active:scale-95 transition-all"
                      title="Редактировать"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product)}
                      className="p-2 text-rose-400 hover:text-rose-300 bg-slate-800 rounded-lg border border-slate-700 active:scale-95 transition-all"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Товар / Характеристики</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3">Штрихкод / SKU</th>
                <th className="py-3.5 px-3">Категория</th>
                <th
                  onClick={() => handleSort('costPrice')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Закуп</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Продажа</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('marginPercent')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Маржа</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Остаток</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Действия</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Загрузка каталога товаров...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-300">Товары не найдены</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      {searchQuery || selectedCategory !== 'all' || stockFilter !== 'all'
                        ? 'Попробуйте изменить параметры поиска или фильтров'
                        : 'В вашем складе еще нет добавленных позиций'}
                    </p>
                    <button
                      onClick={onOpenCreateModal}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить первый товар
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const marginAmount = product.marginAmount ?? (product.price - product.costPrice);
                  const marginPercent = product.marginPercent ?? (product.costPrice > 0 ? ((marginAmount / product.costPrice) * 100) : 0);
                  const isLowStock = (product.quantity || 0) <= 5 && (product.quantity || 0) > 0;
                  const isOutOfStock = (product.quantity || 0) <= 0;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => onViewProduct(product)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Name & Attributes */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                          {product.name}
                        </div>
                        {/* Attribute tags */}
                        {product.attributes && Object.keys(product.attributes).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(product.attributes).slice(0, 3).map(([k, v]) => (
                              <span
                                key={k}
                                className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60"
                              >
                                <strong className="text-slate-300 mr-1">{k}:</strong> {v}
                              </span>
                            ))}
                            {Object.keys(product.attributes).length > 3 && (
                              <span className="text-[10px] text-slate-500 self-center">
                                +{Object.keys(product.attributes).length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Barcode / SKU */}
                      <td className="py-3.5 px-3">
                        <button
                          onClick={(e) => handleCopyBarcode(product.barcode, e)}
                          title="Нажмите, чтобы скопировать штрихкод"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300/90 font-mono text-xs border border-slate-700/80 transition-colors"
                        >
                          <Barcode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{product.barcode}</span>
                          {copiedBarcode === product.barcode ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {product.categoryName ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            {product.categoryName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="text-xs text-slate-400 font-mono">
                          {product.costPrice.toLocaleString()} сом
                        </span>
                      </td>

                      {/* Retail Price */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="text-sm font-bold text-white font-mono">
                          {product.price.toLocaleString()} сом
                        </span>
                      </td>

                      {/* Margin % and Amount */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            Number(marginPercent) >= 30
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : Number(marginPercent) > 0
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}>
                            +{Number(marginPercent).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            +{marginAmount.toLocaleString()} сом
                          </span>
                        </div>
                      </td>

                      {/* Stock Quantity + Quick +/- */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-slate-800/60 border border-slate-700/60">
                          <button
                            onClick={() => onQuickUpdateStock(product, Math.max(0, product.quantity - 1))}
                            disabled={product.quantity <= 0}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 disabled:opacity-20 transition-colors"
                            title="Уменьшить остаток на 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className={`px-1.5 font-mono text-xs font-black ${
                            isOutOfStock 
                              ? 'text-rose-400' 
                              : isLowStock 
                              ? 'text-amber-400' 
                              : 'text-emerald-400'
                          }`}>
                            {product.quantity} {product.unit}
                          </span>

                          <button
                            onClick={() => onQuickUpdateStock(product, product.quantity + 1)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                            title="Увеличить остаток на 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Просмотреть"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Редактировать"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Footer info */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            Показано: <strong className="text-white">{filteredProducts.length}</strong> из <strong className="text-white">{products.length}</strong> товаров
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> В наличии (&gt;5)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Мало (&le;5)
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Нет (0)
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
