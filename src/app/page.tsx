'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductInput, Category, ToastMessage } from '@/types';
import { api, checkBackendHealth } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { ProductStats } from '@/components/ProductStats';
import { ProductTable } from '@/components/ProductTable';
import { ProductModal } from '@/components/ProductModal';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { CategoryModal } from '@/components/CategoryModal';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { ToastContainer } from '@/components/Toast';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackend, setIsBackend] = useState<boolean>(false);
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:8080/api/v1');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
        const { product, isBackend: backendActive } = await api.updateProduct(editingProduct.id, data);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? product : p))
        );
        addToast('success', `Товар "${product.name}" успешно обновлен`);
      } else {
        const { product, isBackend: backendActive } = await api.createProduct(data);
        setProducts((prev) => [product, ...prev]);
        addToast('success', `Товар "${product.name}" успешно добавлен на склад`);
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
      addToast('success', 'Товар удален из каталога');
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
      addToast('error', 'Не удалось обновить остаток: ' + err.message);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Navigation */}
      <Navbar
        isBackend={isBackend}
        backendUrl={backendUrl}
        onRefresh={loadData}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        productCount={products.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Summary / KPIs */}
        <ProductStats products={products} />

        {/* Product Table and CRUD Toolbar */}
        <ProductTable
          products={products}
          categories={categories}
          isLoading={isLoading}
          onViewProduct={handleViewProduct}
          onEditProduct={handleOpenEditModal}
          onDeleteProduct={handleTriggerDelete}
          onQuickUpdateStock={handleQuickUpdateStock}
          onOpenCreateModal={handleOpenCreateModal}
        />

      </main>

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

    </div>
  );
}
