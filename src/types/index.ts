export interface Product {
  id: number;
  barcode: string;
  categoryId: number | null;
  categoryName?: string | null;
  name: string;
  price: number;
  costPrice: number;
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

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
