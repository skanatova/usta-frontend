'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, CartItem, PaymentMethod, SaleCheckoutRequest } from '@/types';
import { api } from '@/lib/api';
import { 
  X, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  Percent, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Sparkles, 
  AlertCircle,
  Package,
  Layers,
  TrendingUp,
  Tag,
  Receipt
} from 'lucide-react';

interface POSModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCheckoutSuccess: (saleId: number, message: string) => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'CASH', label: 'Наличные', icon: <Banknote className="w-4 h-4" />, color: 'hover:border-emerald-500 hover:text-emerald-400' },
  { id: 'CARD', label: 'Карта / Элкарт', icon: <CreditCard className="w-4 h-4" />, color: 'hover:border-blue-500 hover:text-blue-400' },
  { id: 'MBANK', label: 'MBank (QR)', icon: <Smartphone className="w-4 h-4" />, color: 'hover:border-teal-500 hover:text-teal-400' },
  { id: 'O_DENGI', label: 'О!Деньги', icon: <Smartphone className="w-4 h-4" />, color: 'hover:border-rose-500 hover:text-rose-400' },
];

export function POSModal({
  isOpen,
  onClose,
  products,
  categories,
  cart,
  setCart,
  onCheckoutSuccess
}: POSModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Receipt State
  const [completedSale, setCompletedSale] = useState<{
    saleId: number;
    items: CartItem[];
    paymentMethod: PaymentMethod;
    totalAmount: number;
    totalDiscount: number;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // Filter products for the picker
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        const matchesCat = p.categoryName?.toLowerCase().includes(q);
        const matchesAttrs = Object.values(p.attributes || {}).some(v => v.toLowerCase().includes(q));
        if (!matchesName && !matchesBarcode && !matchesCat && !matchesAttrs) return false;
      }

      if (selectedCategoryId !== 'all') {
        if (p.categoryId !== selectedCategoryId) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategoryId]);

  if (!isOpen) return null;

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      setError(`Товар "${product.name}" отсутствует на складе`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const newQty = existing.quantity + 1;
        const discount = existing.discount || 0;
        const effectivePrice = Math.max(0, product.price - discount);
        const total = Number((effectivePrice * newQty).toFixed(2));
        
        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          effectivePrice,
          total
        };
        return updated;
      } else {
        const discount = 0;
        const effectivePrice = product.price;
        const newCartItem: CartItem = {
          product,
          quantity: 1,
          discount: 0,
          effectivePrice,
          total: effectivePrice
        };
        return [newCartItem, ...prev];
      }
    });
    setError(null);
  };

  // Update quantity of an item in cart
  const handleUpdateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const discount = item.discount || 0;
          const effectivePrice = Math.max(0, item.product.price - discount);
          return {
            ...item,
            quantity: newQty,
            effectivePrice,
            total: Number((effectivePrice * newQty).toFixed(2))
          };
        }
        return item;
      })
    );
  };

  // Update discount in money per item
  const handleUpdateDiscount = (productId: number, discountAmount: number) => {
    const validDiscount = Math.max(0, isNaN(discountAmount) ? 0 : discountAmount);
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const effectivePrice = Math.max(0, item.product.price - validDiscount);
          return {
            ...item,
            discount: validDiscount,
            effectivePrice,
            total: Number((effectivePrice * item.quantity).toFixed(2))
          };
        }
        return item;
      })
    );
  };

  // Remove single item from cart
  const handleRemoveFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setCart([]);
  };

  // Cart financial summary calculations
  const originalSubtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const grandTotal = cart.reduce((acc, item) => acc + item.total, 0);
  const totalDiscountMoney = originalSubtotal - grandTotal;
  const totalCost = cart.reduce((acc, item) => acc + ((item.product.costPrice || 0) * item.quantity), 0);
  const totalEstimatedProfit = grandTotal - totalCost;

  // Process Sale Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Корзина пуста! Добавьте товары для продажи.');
      return;
    }

    // Check stock availability
    for (const item of cart) {
      if (item.quantity > item.product.quantity) {
        setError(`Недостаточно товара "${item.product.name}". В наличии: ${item.product.quantity}, в корзине: ${item.quantity}`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const payload: SaleCheckoutRequest = {
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        discount: item.discount > 0 ? item.discount : undefined,
        customPrice: item.customPrice
      })),
      paymentType: paymentMethod
    };

    try {
      const res = await api.checkout(payload);
      
      // Save sale receipt details for modal print/view
      setCompletedSale({
        saleId: res.saleId,
        items: [...cart],
        paymentMethod,
        totalAmount: grandTotal,
        totalDiscount: totalDiscountMoney,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      onCheckoutSuccess(res.saleId, res.message);
      setCart([]);
    } catch (err: any) {
      setError(err.message || 'Ошибка проведения продажи');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewSale = () => {
    setCompletedSale(null);
    setCart([]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[95vh] sm:h-[90vh] bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <ShoppingCart className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  Касса / Продажа товаров
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  POS Оформление
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Поиск, корзина нескольких категорий, скидка в сомах и списание остатков
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: If completed sale, show receipt view, otherwise show 2-column POS workspace */}
        {completedSale ? (
          /* RECEIPT SUCCESS VIEW */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200">
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Продажа завершена!</h3>
                <p className="text-xs text-slate-400 mt-1">Чек #{completedSale.saleId} • {completedSale.createdAt}</p>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-800 text-amber-300 font-mono text-xs font-bold border border-slate-700">
                  Оплата: {PAYMENT_METHODS.find(p => p.id === completedSale.paymentMethod)?.label || completedSale.paymentMethod}
                </div>
              </div>

              {/* Items in Receipt */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-left space-y-2 max-h-48 overflow-y-auto">
                {completedSale.items.map((item) => {
                  const hasDiscount = item.discount > 0;
                  return (
                    <div key={item.product.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-200 truncate">{item.product.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.quantity} {item.product.unit} × {item.effectivePrice.toLocaleString()} с
                          {hasDiscount && (
                            <span className="text-rose-400 ml-1">(-{item.discount} с скидка)</span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-white font-mono whitespace-nowrap">
                        {item.total.toLocaleString()} с
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total breakdown */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs text-left">
                {completedSale.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Скидка продавца:</span>
                    <span className="font-bold font-mono">-{completedSale.totalDiscount.toLocaleString()} сом</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800">
                  <span>Итого к оплате:</span>
                  <span className="text-amber-400 font-mono">{completedSale.totalAmount.toLocaleString()} сом</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  Печать чека
                </button>
                <button
                  onClick={handleStartNewSale}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Новая продажа
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* TWO-COLUMN POS WORKSPACE (Catalog & Cart) */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* LEFT COLUMN: Product Catalog & Search (lg:w-7/12) */}
            <div className="flex-1 lg:w-7/12 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-950/40">
              
              {/* Search & Category Filter Header */}
              <div className="p-3.5 sm:p-4 bg-slate-900/80 border-b border-slate-800 space-y-2.5 shrink-0">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Поиск товара по названию, штрихкоду, характеристикам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Chips Horizontal Scroll */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none no-scrollbar">
                  <button
                    onClick={() => setSelectedCategoryId('all')}
                    className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium text-xs shrink-0 ${
                      selectedCategoryId === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    Все ({products.length})
                  </button>
                  {categories.filter(c => !c.parentId).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium text-xs shrink-0 ${
                        selectedCategoryId === cat.id
                          ? 'bg-orange-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid / List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Товары не найдены</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {filteredProducts.map((p) => {
                      const inCart = cart.find(item => item.product.id === p.id);
                      const isOutOfStock = p.quantity <= 0;
                      const suggested35 = p.suggestedPrice ?? (p.costPrice ? Number((p.costPrice * 1.35).toFixed(0)) : p.price);

                      return (
                        <div
                          key={p.id}
                          onClick={() => !isOutOfStock && handleAddToCart(p)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer select-none relative flex flex-col justify-between ${
                            isOutOfStock
                              ? 'bg-slate-900/30 border-slate-800/40 opacity-50 cursor-not-allowed'
                              : inCart
                              ? 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/15 shadow-sm'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                          }`}
                        >
                          {/* Top: Category and stock badge */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {p.categoryName || 'Без категории'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              isOutOfStock
                                ? 'bg-rose-500/10 text-rose-400'
                                : p.quantity <= 5
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {p.quantity} {p.unit}
                            </span>
                          </div>

                          {/* Product Name */}
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug mb-2">
                            {p.name}
                          </h4>

                          {/* 3 Price Info Display */}
                          <div className="grid grid-cols-3 gap-1 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[10px] mb-2">
                            <div>
                              <span className="text-slate-500 block text-[9px]">Закуп:</span>
                              <span className="text-slate-400 font-mono font-medium">{p.costPrice.toLocaleString()} с</span>
                            </div>
                            <div>
                              <span className="text-teal-400/80 block text-[9px] font-semibold">+35% реком:</span>
                              <span className="text-teal-300 font-mono font-semibold">{suggested35.toLocaleString()} с</span>
                            </div>
                            <div className="text-right">
                              <span className="text-amber-400/80 block text-[9px] font-semibold">Розница:</span>
                              <span className="text-amber-300 font-mono font-black">{p.price.toLocaleString()} с</span>
                            </div>
                          </div>

                          {/* Bottom Action */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                            <span className="text-[10px] font-mono text-slate-500 truncate">
                              {p.barcode}
                            </span>
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                isOutOfStock
                                  ? 'bg-slate-800 text-slate-600'
                                  : inCart
                                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                                  : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-slate-700'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {inCart ? `${inCart.quantity} в чеке` : 'Добавить'}
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: POS Cart & Checkout Panel (lg:w-5/12) */}
            <div className="flex-1 lg:w-5/12 flex flex-col bg-slate-900/90 overflow-hidden">
              
              {/* Cart Header */}
              <div className="p-3.5 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-400" />
                  <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Чек продажи
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)} шт
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline font-medium transition-colors"
                  >
                    Очистить корзину
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-tight">{error}</span>
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <ShoppingCart className="w-12 h-12 mb-3 opacity-30 text-amber-400" />
                    <h4 className="text-sm font-bold text-slate-400">Корзина пуста</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Выберите товары слева или используйте поиск, чтобы добавить позиции в чек
                    </p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const hasDiscount = item.discount > 0;
                    const stockExceeded = item.quantity > item.product.quantity;

                    return (
                      <div
                        key={item.product.id}
                        className={`p-3 rounded-xl border transition-all space-y-2 ${
                          stockExceeded
                            ? 'bg-rose-950/20 border-rose-800/80'
                            : 'bg-slate-950/70 border-slate-800'
                        }`}
                      >
                        {/* Top: Item Title & Delete */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {item.product.categoryName && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 truncate">
                                  {item.product.categoryName}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-500 truncate">
                                {item.product.barcode}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs sm:text-sm text-white leading-tight mt-0.5">
                              {item.product.name}
                            </h5>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                            title="Удалить из чека"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Middle Controls: Quantity + Price + Discount Input in Money */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 items-center">
                          
                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-1 bg-slate-900 rounded-lg border border-slate-700/80 p-0.5 w-fit">
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95 transition-all"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.product.id, parseFloat(e.target.value) || 0)}
                              className="w-12 text-center font-mono text-xs font-black bg-transparent text-white focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 pr-1">{item.product.unit}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.quantity}
                              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95 disabled:opacity-30 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                          </div>

                          {/* Discount in Money Input (сом) */}
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">Скидка:</span>
                            <div className="relative w-24">
                              <input
                                type="number"
                                min="0"
                                max={item.product.price}
                                placeholder="0"
                                value={item.discount || ''}
                                onChange={(e) => handleUpdateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                                className="w-full pl-2 pr-5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-500"
                              />
                              <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 font-mono">с</span>
                            </div>
                          </div>

                        </div>

                        {/* Price Details row */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/40">
                          <div className="flex items-center gap-2">
                            {hasDiscount ? (
                              <div className="flex items-center gap-1.5">
                                <span className="line-through text-slate-500 font-mono">
                                  {item.product.price} с
                                </span>
                                <span className="font-bold text-rose-400 font-mono">
                                  {item.effectivePrice} с / {item.product.unit}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">
                                {item.product.price} с / {item.product.unit}
                              </span>
                            )}
                          </div>

                          {/* Line Total */}
                          <div className="text-right">
                            <span className="font-black text-amber-400 text-xs sm:text-sm font-mono">
                              {item.total.toLocaleString()} сом
                            </span>
                          </div>
                        </div>

                        {stockExceeded && (
                          <p className="text-[10px] text-rose-400 font-bold">
                            ⚠️ На складе всего {item.product.quantity} {item.product.unit}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Checkout Panel Footer */}
              {cart.length > 0 && (
                <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
                  
                  {/* Financial calculation breakdown */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Сумма без скидки:</span>
                      <span className="font-mono">{originalSubtotal.toLocaleString()} сом</span>
                    </div>

                    {totalDiscountMoney > 0 && (
                      <div className="flex justify-between text-rose-400 font-medium">
                        <span>Скидка продавца:</span>
                        <span className="font-mono font-bold">-{totalDiscountMoney.toLocaleString()} сом</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Чистая прибыль с чека:</span>
                      <span className={`font-mono font-bold ${totalEstimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        +{totalEstimatedProfit.toLocaleString()} сом
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-sm sm:text-base font-black text-white">
                      <span>ИТОГО К ОПЛАТЕ:</span>
                      <span className="text-lg sm:text-xl text-amber-400 font-mono">
                        {grandTotal.toLocaleString()} сом
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector Buttons */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Способ оплаты:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                            paymentMethod === pm.id
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {pm.icon}
                          <span className="truncate">{pm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Final Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-5 h-5 text-slate-950" />
                    <span>{isSubmitting ? 'Проведение продажи...' : `Оформить продажу (${grandTotal.toLocaleString()} с)`}</span>
                  </button>

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
