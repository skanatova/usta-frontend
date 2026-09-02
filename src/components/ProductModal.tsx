'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductInput, Category, UnitType } from '@/types';
import { 
  X, 
  Sparkles, 
  Barcode, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Layers, 
  Save, 
  Tag,
  DollarSign,
  TrendingUp,
  Boxes
} from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductInput) => Promise<void>;
  initialData?: Product | null;
  categories: Category[];
  onQuickAddCategory: (name: string) => Promise<Category>;
}

const COMMON_UNITS: UnitType[] = ['шт', 'кг', 'м', 'л', 'упак', 'компл', 'рулон', 'мешок'];

const SUGGESTED_ATTRIBUTES = [
  'Бренд',
  'Размер',
  'Цвет',
  'Материал',
  'Мощность',
  'Артикул',
  'Страна'
];

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  onQuickAddCategory
}: ProductModalProps) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState<string>('шт');
  const [attributes, setAttributes] = useState<Array<{ key: string; value: string }>>([]);

  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setBarcode(initialData.barcode || '');
      setCategoryId(initialData.categoryId || '');
      setPrice(initialData.price ?? '');
      setCostPrice(initialData.costPrice ?? '');
      setQuantity(initialData.quantity ?? '');
      setUnit(initialData.unit || 'шт');

      if (initialData.attributes) {
        const attrs = Object.entries(initialData.attributes).map(([k, v]) => ({
          key: k,
          value: v
        }));
        setAttributes(attrs.length > 0 ? attrs : [{ key: '', value: '' }]);
      } else {
        setAttributes([]);
      }
    } else {
      setName('');
      setBarcode('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setPrice('');
      setCostPrice('');
      setQuantity(1);
      setUnit('шт');
      setAttributes([]);
    }
    setError(null);
    setShowAddCat(false);
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  // Margin calculation
  const numericPrice = Number(price) || 0;
  const numericCost = Number(costPrice) || 0;
  const marginAmount = numericPrice - numericCost;
  const marginPercent = numericCost > 0 ? ((marginAmount / numericCost) * 100).toFixed(1) : '0';

  const handleGenerateBarcode = () => {
    const randomSku = `INT-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setBarcode(randomSku);
  };

  const handleAddAttribute = (suggestedKey?: string) => {
    setAttributes([...attributes, { key: suggestedKey || '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', value: string) => {
    const next = [...attributes];
    next[index][field] = value;
    setAttributes(next);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await onQuickAddCategory(newCatName.trim());
      setCategoryId(created.id);
      setNewCatName('');
      setShowAddCat(false);
    } catch (e: any) {
      setError(e.message || 'Ошибка создания категории');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Укажите название товара');
      return;
    }
    if (numericPrice <= 0) {
      setError('Цена продажи должна быть больше 0');
      return;
    }

    const attrsMap: Record<string, string> = {};
    attributes.forEach(attr => {
      if (attr.key.trim() && attr.value.trim()) {
        attrsMap[attr.key.trim()] = attr.value.trim();
      }
    });

    const payload: ProductInput = {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      categoryId: categoryId ? Number(categoryId) : null,
      price: numericPrice,
      costPrice: numericCost,
      quantity: Number(quantity) || 0,
      unit: unit.trim() || 'шт',
      attributes: attrsMap
    };

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения товара');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData ? 'Редактировать товар' : 'Новый товар на склад'}
              </h2>
              <p className="text-xs text-slate-400">
                {initialData ? `ID: #${initialData.id} • SKU: ${initialData.barcode}` : 'Заполните параметры товара и характеристики'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* 1. Name */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Название товара <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Например: Перфоратор Makita HR2470"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* 2. Barcode & SKU */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-slate-400" />
                Штрихкод / Артикул
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Сгенерировать SKU
              </button>
            </div>
            <input
              type="text"
              placeholder="Штрихкод со сканера или оставьте пустым для автогенерации"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Если штрихкод не указан, система автоматически создаст внутренний SKU (напр. INT-123456789)
            </p>
          </div>

          {/* 3. Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-400" />
                Категория
              </label>
              <button
                type="button"
                onClick={() => setShowAddCat(!showAddCat)}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                {showAddCat ? 'Отмена' : '+ Создать категорию'}
              </button>
            </div>

            {showAddCat ? (
              <div className="flex gap-2 p-2 bg-slate-800/40 rounded-xl border border-slate-700/60 mb-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Новая категория (напр. Сантехника)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Добавить
                </button>
              </div>
            ) : null}

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            >
              <option value="">-- Без категории --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Pricing & Real-time Margin Calculation */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Ценообразование и маржинальность
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Закупочная цена (Себестоимость)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">сом</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Цена продажи (Розница) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">сом</span>
                </div>
              </div>
            </div>

            {/* Margin Calculation Preview */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Прибыль с 1 единицы:</span>
                <span className={`font-bold ${marginAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {marginAmount >= 0 ? '+' : ''}{marginAmount.toFixed(2)} сом
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Наценка:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                  Number(marginPercent) >= 30
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : Number(marginPercent) > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {marginPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* 5. Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-slate-400" />
                Количество на складе
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Единица измерения
              </label>
              <div className="flex gap-1.5">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 6. Dynamic Custom Attributes (Map<String, String>) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Дополнительные характеристики (Атрибуты)
                </label>
                <p className="text-[11px] text-slate-400">Бренд, цвет, размер, артикул, материал и т.д.</p>
              </div>
              <button
                type="button"
                onClick={() => handleAddAttribute()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Добавить
              </button>
            </div>

            {/* Quick suggested chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-500 self-center">Быстро добавить:</span>
              {SUGGESTED_ATTRIBUTES.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddAttribute(sug)}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                >
                  +{sug}
                </button>
              ))}
            </div>

            {/* Attributes Inputs */}
            {attributes.length > 0 && (
              <div className="space-y-2">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Параметр (напр. Бренд)"
                      value={attr.key}
                      onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                      className="w-1/3 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Значение (напр. Makita)"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Сохранение...' : initialData ? 'Обновить товар' : 'Сохранить товар'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
