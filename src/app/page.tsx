'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductInput, Category, CartItem, ToastMessage } from '@/types';
import { api, checkBackendHealth } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { ProductStats } from '@/components/ProductStats';
import { ProductTable } from '@/components/ProductTable';
import { ProductModal } from '@/components/ProductModal';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { CategoryModal } from '@/components/CategoryModal';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { POSModal } from '@/components/POSModal';
import { ToastContainer } from '@/components/Toast';
import { 
  Package, 
  Layers, 
  Plus, 
  ScanLine, 
  RefreshCw,
  ShoppingCart
} from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackend, setIsBackend] = useState<boolean>(false);
  const [backendUrl, setBackendUrl] = useState<string>('https://usta-backend-hpqg.onrender.com/api/v1');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // POS / Cart State
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const health = await checkBackendHealth();
      setIsBackend(health.online);
      setBackendUrl(health.url);

      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getProducts()
      ]);

      setCategories(catRes.categories);
      setProducts(prodRes.products);
      setIsBackend(prodRes.isBackend);
    } catch (err: any) {
      console.error('Data load error:', err);
      addToast('error', 'Не удалось загрузить данные: ' + (err.message || 'Ошибка сети'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Product CRUD
  const handleSaveProduct = async (data: ProductInput) => {
    try {
      if (editingProduct) {
        const { product } = await api.updateProduct(editingProduct.id, data);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? product : p))
        );
        addToast('success', `Товар "${product.name}" обновлен`);
      } else {
        const { product } = await api.createProduct(data);
        setProducts((prev) => [product, ...prev]);
        addToast('success', `Товар "${product.name}" добавлен`);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      addToast('error', err.message || 'Ошибка при сохранении товара');
      throw err;
    }
  };

  const handleConfirmDelete = async (id: number) => {
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      addToast('success', 'Товар удален');
    } catch (err: any) {
      addToast('error', err.message || 'Ошибка при удалении товара');
      throw err;
    }
  };

  const handleQuickUpdateStock = async (product: Product, newQty: number) => {
    try {
      const { product: updated } = await api.updateProduct(product.id, {
        name: product.name,
        barcode: product.barcode,
        categoryId: product.categoryId,
        price: product.price,
        costPrice: product.costPrice,
        quantity: newQty,
        unit: product.unit,
        attributes: product.attributes || {}
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updated : p))
      );
      addToast('info', `Остаток "${product.name}": ${newQty} ${product.unit}`);
    } catch (err: any) {
      addToast('error', 'Ошибка остатка: ' + err.message);
    }
  };

  // Category Management
  const handleQuickAddCategory = async (name: string): Promise<Category> => {
    try {
      const { category } = await api.createCategory(name);
      setCategories((prev) => [...prev, category]);
      addToast('success', `Категория "${name}" создана`);
      return category;
    } catch (err: any) {
      addToast('error', err.message || 'Ошибка создания категории');
      throw err;
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      addToast('success', 'Категория удалена');
    } catch (err: any) {
      addToast('error', err.message || 'Ошибка удаления категории');
      throw err;
    }
  };

  // POS & Cart Handlers
  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      addToast('error', `Товар "${product.name}" отсутствует на складе!`);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const item = prev[idx];
        const newQty = item.quantity + 1;
        const discount = item.discount || 0;
        const effectivePrice = Math.max(0, product.price - discount);
        const updated = [...prev];
        updated[idx] = {
          ...item,
          quantity: newQty,
          effectivePrice,
          total: Number((effectivePrice * newQty).toFixed(2))
        };
        return updated;
      } else {
        const effectivePrice = product.price;
        return [
          {
            product,
            quantity: 1,
            discount: 0,
            effectivePrice,
            total: effectivePrice
          },
          ...prev
        ];
      }
    });

    setIsPOSModalOpen(true);
    addToast('info', `Товар "${product.name}" добавлен в чек`);
  };

  const handleCheckoutSuccess = (saleId: number, message: string) => {
    addToast('success', message);
    loadData(); // Re-fetch to update inventory stock from DB
  };

  // Modal open handlers
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleTriggerDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 pb-20 sm:pb-8">
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Navigation Top Bar */}
      <Navbar
        isBackend={isBackend}
        backendUrl={backendUrl}
        onRefresh={loadData}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenPOSModal={() => setIsPOSModalOpen(true)}
        productCount={products.length}
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
        
        {/* Top Summary / KPIs */}
        <ProductStats products={products} />

        {/* Product Table and Mobile Cards */}
        <ProductTable
          products={products}
          categories={categories}
          isLoading={isLoading}
          onViewProduct={handleViewProduct}
          onEditProduct={handleOpenEditModal}
          onDeleteProduct={handleTriggerDelete}
          onQuickUpdateStock={handleQuickUpdateStock}
          onOpenCreateModal={handleOpenCreateModal}
          onAddToCart={handleAddToCart}
        />

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for easy thumb reach) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 block sm:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2">
        <div className="flex items-center justify-around">
          
          {/* Products */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-400 text-[10px] font-medium transition-colors"
          >
            <Package className="w-5 h-5" />
            <span>Склад</span>
          </button>

          {/* POS Sell / Касса */}
          <button
            onClick={() => setIsPOSModalOpen(true)}
            className="relative flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-400 text-[10px] font-medium transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </div>
            <span>Касса</span>
          </button>

          {/* Main Action FAB (Add Product) */}
          <button
            onClick={handleOpenCreateModal}
            className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            title="Добавить товар"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Categories */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-orange-400 text-[10px] font-medium transition-colors"
          >
            <Layers className="w-5 h-5" />
            <span>Категории</span>
          </button>

          {/* Scanner */}
          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-400 text-[10px] font-medium transition-colors"
          >
            <ScanLine className="w-5 h-5" />
            <span>Сканер</span>
          </button>

        </div>
      </nav>

      {/* Create / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        categories={categories}
        onQuickAddCategory={handleQuickAddCategory}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        onEdit={(prod) => {
          setIsDetailModalOpen(false);
          handleOpenEditModal(prod);
        }}
        onDelete={(prod) => {
          setIsDetailModalOpen(false);
          handleTriggerDelete(prod);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        product={productToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Category Management Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        products={products}
        onCreateCategory={handleQuickAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        products={products}
        onQuickUpdateStock={handleQuickUpdateStock}
        onViewProduct={handleViewProduct}
      />

      {/* POS Sell & Checkout Modal */}
      <POSModal
        isOpen={isPOSModalOpen}
        onClose={() => setIsPOSModalOpen(false)}
        products={products}
        categories={categories}
        cart={cart}
        setCart={setCart}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

    </div>
  );
}
