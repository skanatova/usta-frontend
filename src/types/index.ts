export interface Product {
  id: number;
  barcode: string;
  categoryId: number | null;
  categoryName?: string | null;
  name: string;
  price: number;
  costPrice: number;
  suggestedPrice?: number; // 35% markup to costPrice (costPrice * 1.35)
  quantity: number;
  unit: string;
  attributes: Record<string, string>;
  marginAmount?: number;
  marginPercent?: number;
}

export interface ProductInput {
  barcode?: string;
  categoryId?: number | null;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  attributes: Record<string, string>;
}

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
}

export type UnitType = 'шт' | 'кг' | 'м' | 'л' | 'упак' | 'компл' | 'рулон' | 'мешок';

export type PaymentMethod = 'CASH' | 'CARD' | 'MBANK' | 'O_DENGI';

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Discount in money per unit (e.g. 50 som discount)
  customPrice?: number; // Custom unit selling price if manually overridden
  effectivePrice: number; // actual price - discount
  total: number; // effectivePrice * quantity
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  discount?: number;
  customPrice?: number;
}

export interface SaleCheckoutRequest {
  items: SaleItemRequest[];
  paymentType: PaymentMethod | string;
}

export interface SaleRecord {
  id: number;
  totalAmount: number;
  paymentType: string;
  createdAt: string;
  items: {
    id?: number;
    productId: number;
    productName: string;
    unit: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

