import { Product, ProductInput, Category, SaleCheckoutRequest, SaleRecord } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://usta-backend-hpqg.onrender.com/api/v1';

// Initial mock data for offline fallback / demo
const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Электроинструменты' },
  { id: 2, name: 'Крепеж и метизы' },
  { id: 3, name: 'Лакокрасочные материалы' },
  { id: 4, name: 'Сантехника' },
  { id: 5, name: 'Электрика и кабели' },
  { id: 6, name: 'Ручной инструмент' }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    barcode: '4601234567890',
    categoryId: 1,
    categoryName: 'Электроинструменты',
    name: 'Перфоратор Makita HR2470 SDS-Plus',
    price: 9500,
    costPrice: 7200,
    suggestedPrice: 9720,
    quantity: 14,
    unit: 'шт',
    attributes: { 'Бренд': 'Makita', 'Мощность': '780 Вт', 'Патрон': 'SDS-Plus', 'Страна': 'Япония' },
    marginAmount: 2300,
    marginPercent: 31.94
  },
  {
    id: 2,
    barcode: '4609876543211',
    categoryId: 1,
    categoryName: 'Электроинструменты',
    name: 'Дрель-шуруповерт DeWalt DCD771C2',
    price: 8200,
    costPrice: 5900,
    suggestedPrice: 7965,
    quantity: 8,
    unit: 'шт',
    attributes: { 'Бренд': 'DeWalt', 'Напряжение': '18 В', 'АКБ': '2x1.3 Ач', 'Крутящий момент': '42 Нм' },
    marginAmount: 2300,
    marginPercent: 38.98
  },
  {
    id: 3,
    barcode: 'INT-88392019482',
    categoryId: 2,
    categoryName: 'Крепеж и метизы',
    name: 'Саморезы по дереву 3.5х45 мм (черные, 1000 шт)',
    price: 450,
    costPrice: 280,
    suggestedPrice: 378,
    quantity: 120,
    unit: 'упак',
    attributes: { 'Размер': '3.5x45 мм', 'Тип': 'Потайная головка', 'Покрытие': 'Фосфатированное' },
    marginAmount: 170,
    marginPercent: 60.71
  },
  {
    id: 4,
    barcode: 'INT-77492018374',
    categoryId: 3,
    categoryName: 'Лакокрасочные материалы',
    name: 'Краска интерьерная Tikkurila Euro Power 7 (9 л)',
    price: 4800,
    costPrice: 3600,
    suggestedPrice: 4860,
    quantity: 25,
    unit: 'шт',
    attributes: { 'Бренд': 'Tikkurila', 'Объем': '9 л', 'Степень блеска': 'Матовая', 'Цвет': 'Белый' },
    marginAmount: 1200,
    marginPercent: 33.33
  },
  {
    id: 5,
    barcode: 'INT-66382019284',
    categoryId: 5,
    categoryName: 'Электрика и кабели',
    name: 'Кабель силовой ВВГ-Пнг(А) 3х2.5 ГОСТ',
    price: 85,
    costPrice: 58,
    suggestedPrice: 78.3,
    quantity: 350.5,
    unit: 'м',
    attributes: { 'Сечение': '3х2.5 мм²', 'Материал': 'Медь', 'Стандарт': 'ГОСТ 31996-2012' },
    marginAmount: 27,
    marginPercent: 46.55
  },
  {
    id: 6,
    barcode: '4603456789123',
    categoryId: 6,
    categoryName: 'Ручной инструмент',
    name: 'Набор отверток профессиональный Kraftool Expert (6 шт)',
    price: 1350,
    costPrice: 850,
    suggestedPrice: 1147.5,
    quantity: 3,
    unit: 'компл',
    attributes: { 'Бренд': 'Kraftool', 'Кол-во': '6 шт', 'Материал': 'Cr-V сталь' },
    marginAmount: 500,
    marginPercent: 58.82
  }
];

// Helper to get local data from browser storage
function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  const stored = localStorage.getItem('usta_products');
  if (!stored) {
    localStorage.setItem('usta_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

function saveLocalProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('usta_products', JSON.stringify(products));
  }
}

function getLocalCategories(): Category[] {
  if (typeof window === 'undefined') return INITIAL_CATEGORIES;
  const stored = localStorage.getItem('usta_categories');
  if (!stored) {
    localStorage.setItem('usta_categories', JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_CATEGORIES;
  }
}

function saveLocalCategories(categories: Category[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('usta_categories', JSON.stringify(categories));
  }
}

function getLocalSales(): SaleRecord[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('usta_sales');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalSales(sales: SaleRecord[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('usta_sales', JSON.stringify(sales));
  }
}

export async function checkBackendHealth(): Promise<{ online: boolean; url: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return { online: res.ok || res.status === 200, url: API_BASE_URL };
  } catch {
    return { online: false, url: API_BASE_URL };
  }
}

// Compute margin amounts and 35% suggested price
function enrichProduct(p: ProductInput & { id: number; barcode: string; categoryName?: string; suggestedPrice?: number }): Product {
  const marginAmount = Number((p.price - p.costPrice).toFixed(2));
  const marginPercent = p.costPrice > 0 ? Number(((marginAmount / p.costPrice) * 100).toFixed(2)) : 0;
  const suggestedPrice = p.suggestedPrice ?? (p.costPrice > 0 ? Number((p.costPrice * 1.35).toFixed(2)) : p.price);
  return {
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    categoryId: p.categoryId ?? null,
    categoryName: p.categoryName,
    price: p.price,
    costPrice: p.costPrice,
    suggestedPrice,
    quantity: p.quantity,
    unit: p.unit,
    attributes: p.attributes,
    marginAmount,
    marginPercent
  };
}

export const api = {
  async getProducts(query?: string, categoryId?: number): Promise<{ products: Product[]; isBackend: boolean }> {
    try {
      let url = `${API_BASE_URL}/products`;
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { products: data, isBackend: true };
    } catch {
      // Offline fallback
      let list = getLocalProducts();
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          Object.values(p.attributes || {}).some(v => v.toLowerCase().includes(q))
        );
      }
      if (categoryId) {
        const categories = getLocalCategories();
        const validIds = new Set<number>([categoryId]);
        const queue = [categoryId];
        while (queue.length > 0) {
          const current = queue.shift()!;
          for (const c of categories) {
            if (c.parentId === current && !validIds.has(c.id)) {
              validIds.add(c.id);
              queue.push(c.id);
            }
          }
        }
        list = list.filter(p => p.categoryId && validIds.has(p.categoryId));
      }
      return { products: list, isBackend: false };
    }
  },

  async getProductById(id: number): Promise<{ product: Product; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { product: data, isBackend: true };
    } catch {
      const list = getLocalProducts();
      const item = list.find(p => p.id === id);
      if (!item) throw new Error('Товар не найден');
      return { product: item, isBackend: false };
    }
  },

  async createProduct(input: ProductInput): Promise<{ product: Product; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return { product: data, isBackend: true };
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      // Offline fallback creation
      const list = getLocalProducts();
      const categories = getLocalCategories();
      const cat = categories.find(c => c.id === input.categoryId);
      const newId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
      const barcode = input.barcode && input.barcode.trim()
        ? input.barcode.trim()
        : `INT-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const newProduct = enrichProduct({
        ...input,
        id: newId,
        barcode,
        categoryName: cat ? cat.name : undefined
      });

      list.unshift(newProduct);
      saveLocalProducts(list);
      return { product: newProduct, isBackend: false };
    }
  },

  async updateProduct(id: number, input: ProductInput): Promise<{ product: Product; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return { product: data, isBackend: true };
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      const list = getLocalProducts();
      const categories = getLocalCategories();
      const idx = list.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Товар не найден');

      const cat = categories.find(c => c.id === input.categoryId);
      const barcode = input.barcode && input.barcode.trim() ? input.barcode.trim() : list[idx].barcode;

      const updated = enrichProduct({
        ...input,
        id,
        barcode,
        categoryName: cat ? cat.name : undefined
      });

      list[idx] = updated;
      saveLocalProducts(list);
      return { product: updated, isBackend: false };
    }
  },

  async deleteProduct(id: number): Promise<{ success: boolean; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, isBackend: true };
    } catch {
      const list = getLocalProducts();
      const filtered = list.filter(p => p.id !== id);
      saveLocalProducts(filtered);
      return { success: true, isBackend: false };
    }
  },

  async getCategories(): Promise<{ categories: Category[]; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { categories: data, isBackend: true };
    } catch {
      return { categories: getLocalCategories(), isBackend: false };
    }
  },

  async createCategory(name: string, parentId?: number | null): Promise<{ category: Category; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { category: data, isBackend: true };
    } catch {
      const categories = getLocalCategories();
      const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
      const newCat: Category = { id: newId, name: name.trim(), parentId };
      categories.push(newCat);
      saveLocalCategories(categories);
      return { category: newCat, isBackend: false };
    }
  },

  async deleteCategory(id: number): Promise<{ success: boolean; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, isBackend: true };
    } catch {
      const categories = getLocalCategories();
      const filtered = categories.filter(c => c.id !== id);
      saveLocalCategories(filtered);
      return { success: true, isBackend: false };
    }
  },

  async checkout(request: SaleCheckoutRequest): Promise<{ saleId: number; message: string; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/pos/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Ошибка сервера: HTTP ${res.status}`);
      }
      const data = await res.json();
      return { saleId: data.saleId, message: data.message || `Продажа #${data.saleId} успешно проведена`, isBackend: true };
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      // Offline fallback checkout
      const list = getLocalProducts();
      let grandTotal = 0;
      const saleItems: SaleRecord['items'] = [];

      for (const item of request.items) {
        const product = list.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Товар с ID ${item.productId} не найден в базе данных!`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Недостаточно товара "${product.name}" на складе! В наличии: ${product.quantity} ${product.unit}, Запрошено: ${item.quantity}`);
        }

        // Deduct quantity
        product.quantity = Math.max(0, Number((product.quantity - item.quantity).toFixed(2)));

        // Price calculation with discount in money
        let effectivePrice = product.price;
        if (item.customPrice !== undefined && item.customPrice >= 0) {
          effectivePrice = item.customPrice;
        } else if (item.discount !== undefined && item.discount > 0) {
          effectivePrice = Math.max(0, product.price - item.discount);
        }

        const itemTotal = Number((effectivePrice * item.quantity).toFixed(2));
        grandTotal += itemTotal;

        saleItems.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          quantity: item.quantity,
          price: effectivePrice,
          total: itemTotal
        });
      }

      saveLocalProducts(list);

      const saleId = Math.floor(100000 + Math.random() * 900000);
      const newSale: SaleRecord = {
        id: saleId,
        totalAmount: Number(grandTotal.toFixed(2)),
        paymentType: request.paymentType,
        createdAt: new Date().toISOString(),
        items: saleItems
      };

      const sales = getLocalSales();
      sales.unshift(newSale);
      saveLocalSales(sales);

      return {
        saleId,
        message: `Продажа #${saleId} успешно проведена (Офлайн-режим)`,
        isBackend: false
      };
    }
  },

  async getSales(): Promise<{ sales: SaleRecord[]; isBackend: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/pos/sales`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { sales: data, isBackend: true };
    } catch {
      return { sales: getLocalSales(), isBackend: false };
    }
  }
};
