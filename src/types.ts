export type Role = 'bodeguero' | 'vendedor' | 'gerente' | 'cliente';

export type MovementType = 'entrada' | 'salida';

export interface Product {
  id: string;
  name: string;
  flavor: string;
  size: string;
  price: number;
  stock: number;
  minStock: number;
  image: string;
  color: string;
  soldCount: number;
  expiryDate: string;
  batch: string;
}

export interface KardexMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  responsible: string;
  note?: string;
}

export interface OrderDraftItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'borrador' | 'pendiente' | 'aprobado' | 'rechazado';

export interface OrderDraft {
  id: string;
  items: OrderDraftItem[];
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
  total: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  bodeguero: 'Bodeguero',
  vendedor: 'Vendedor',
  gerente: 'Gerente de Operaciones',
  cliente: 'Cliente',
};

export const ROLE_ICONS: Record<Role, string> = {
  bodeguero: 'Warehouse',
  vendedor: 'ShoppingCart',
  gerente: 'BarChart3',
  cliente: 'User',
};
