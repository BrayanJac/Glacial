export type Role = 'bodeguero' | 'vendedor' | 'gerente' | 'cliente';

export type NotificationCategory = 'stock' | 'pedido' | 'recompra' | 'sistema' | 'despacho';
export type NotificationPriority = 'alta' | 'media' | 'normal';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
}

export type MovementType = 'entrada' | 'salida' | 'ajuste';

export type ProductCategory = 'Paletas' | 'Vasos' | 'Litros' | 'Conos' | 'Especiales';
export type ABCClass = 'A' | 'B' | 'C';
export type StockStatus = 'normal' | 'critico' | 'sin_configurar';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  flavor: string;
  size: string;
  price: number;
  stock: number;
  minStock: number;
  reorderPoint: number;
  image: string;
  color: string;
  soldCount: number;
  expiryDate: string;
  batch: string;
  abcClass: ABCClass;
  isActive: boolean;
  has3DModel: boolean;
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
  justification?: string;
  comprobante?: string;
  saldoResultante?: number;
}

export interface OrderDraftItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'borrador' | 'pendiente' | 'aprobado' | 'rechazado' | 'confirmado' | 'despachado' | 'en_transito';

export interface OrderDraft {
  id: string;
  items: OrderDraftItem[];
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
  clientId?: string;
  clientName?: string;
  total: number;
  dispatchDate?: string;
}

export interface Client {
  id: string;
  name: string;
  lastPurchaseDate: string;
  purchaseCount: number;
  avgFrequencyDays: number;
  estimatedStockOutDate: string;
  status: 'urgente' | 'proximo' | 'normal';
  suggestedProducts: string[];
}

export type ReplenishmentStatus = 'pendiente_aprobacion' | 'enviada' | 'en_transito' | 'recibida';

export interface ReplenishmentRequest {
  id: string;
  items: OrderDraftItem[];
  total: number;
  status: ReplenishmentStatus;
  createdAt: string;
  createdBy: string;
  supplier: string;
  requiresApproval: boolean;
  note?: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  timestamp: string;
  action: string;
  entity: string;
  oldValue: string;
  newValue: string;
}

export interface GlobalConfig {
  approvalThreshold: number;
  draftExpiryDays: number;
  preventiveEffectivenessTarget: number;
  stockBreakTarget: number;
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

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  Paletas: 'Paletas',
  Vasos: 'Vasos',
  Litros: 'Litros',
  Conos: 'Conos',
  Especiales: 'Especiales',
};
