'use client';

import React from 'react';
import { 
  PlusCircle, 
  Layers, 
  ScanLine, 
  Server, 
  RefreshCw, 
  Hammer, 
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  isBackend: boolean;
  backendUrl: string;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenScannerModal: () => void;
  productCount: number;
}

export function Navbar({
  isBackend,
  backendUrl,
  onRefresh,
  onOpenCreateModal,
  onOpenCategoryModal,
  onOpenScannerModal,
  productCount
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-bold shrink-0">
              <Hammer className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 truncate">
                  USTA POS
                </span>
                <span className="hidden xs:inline-block text-[10px] sm:text-xs bg-slate-800 text-amber-400 border border-amber-500/30 font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                  Склад
                </span>
                {/* Mobile status dot */}
                <button
                  onClick={onRefresh}
                  className="inline-flex md:hidden items-center p-1 rounded-full hover:bg-slate-800 transition-colors"
                  title={isBackend ? 'Подключено к Render Supabase' : 'Демо-режим'}
                >
                  <span className={`w-2 h-2 rounded-full ${isBackend ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden xs:block">
                Управление товарами и остатками
              </p>
            </div>
          </div>

          {/* Backend Connection Status Badge (Desktop) */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1 text-xs">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Бэкенд:</span>
            {isBackend ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {backendUrl.includes('render') ? 'Render (Supabase)' : 'Spring Boot API'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium" title="Бэкенд недоступен, используется локальное хранилище">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Автономный режим (Demo)
              </span>
            )}
            <button
              onClick={onRefresh}
              title="Проверить подключение к бэкенду"
              className="p-1 hover:text-white text-slate-400 transition-colors ml-1 rounded-full hover:bg-slate-700"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={onOpenScannerModal}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95"
              title="Сканер штрихкодов"
            >
              <ScanLine className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline ml-1.5">Сканер</span>
            </button>

            <button
              onClick={onOpenCategoryModal}
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95"
              title="Категории товаров"
            >
              <Layers className="w-4 h-4 text-orange-400" />
              <span className="hidden md:inline ml-1.5">Категории</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Добавить</span>
              <span className="hidden sm:inline">товар</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
