'use client';

import React from 'react';
import { Product } from '@/types';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CircleDollarSign,
  Boxes,
  ArrowUpRight
} from 'lucide-react';

interface ProductStatsProps {
  products: Product[];
}

export function ProductStats({ products }: ProductStatsProps) {
  const totalProducts = products.length;

  const totalStockUnits = products.reduce((acc, p) => acc + (p.quantity || 0), 0);

  const totalRetailValue = products.reduce(
    (acc, p) => acc + (p.price || 0) * (p.quantity || 0),
    0
  );

  const totalCostValue = products.reduce(
    (acc, p) => acc + (p.costPrice || 0) * (p.quantity || 0),
    0
  );

  const totalExpectedProfit = totalRetailValue - totalCostValue;

  const avgMargin = totalCostValue > 0
    ? ((totalExpectedProfit / totalCostValue) * 100).toFixed(1)
    : '0.0';

  const lowStockProducts = products.filter((p) => (p.quantity || 0) <= 5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 0
    }).format(val) + ' сом';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Всего товаров */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Всего наименований</span>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white">{totalProducts}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-slate-500" />
            <span>Всего единиц на складе: <strong className="text-slate-300">{totalStockUnits.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Оценка склада (Себестоимость / Продажа) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Стоимость склада</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-400">{formatCurrency(totalRetailValue)}</div>
          <div className="text-xs text-slate-400 mt-1">
            Закуп: <span className="text-slate-300 font-medium">{formatCurrency(totalCostValue)}</span>
          </div>
        </div>
      </div>

      {/* 3. Ожидаемая прибыль & Наценка */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ожидаемая прибыль</span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-400">{formatCurrency(totalExpectedProfit)}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="inline-flex items-center text-emerald-400 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{avgMargin}%
            </span>
            <span>средняя маржинальность</span>
          </div>
        </div>
      </div>

      {/* 4. Заканчивающиеся товары */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Низкий остаток (&le; 5)</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
            lowStockProducts.length > 0 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-black ${lowStockProducts.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {lowStockProducts.length} позиций
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {lowStockProducts.length > 0 ? 'Требуется пополнение запасов' : 'Все остатки в норме'}
          </div>
        </div>
      </div>
    </div>
  );
}
