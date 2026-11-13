import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, Product, KardexMovement, OrderDraft, OrderDraftItem } from '../types';
import { seedProducts, seedMovements, seedOrders } from '../data/seedData';

interface AppContextValue {
  role: Role;
  setRole: (r: Role) => void;
  products: Product[];
  movements: KardexMovement[];
  orders: OrderDraft[];
  addMovement: (m: Omit<KardexMovement, 'id'>) => void;
  addOrder: (items: OrderDraftItem[]) => void;
  updateOrderStatus: (id: string, status: OrderDraft['status']) => void;
  draftCart: OrderDraftItem[];
  addToDraftCart: (productId: string, quantity: number) => void;
  removeFromDraftCart: (productId: string) => void;
  clearDraftCart: () => void;
  pendingOrderCount: number;
  totalStock: number;
  criticalAlerts: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('bodeguero');
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [movements, setMovements] = useState<KardexMovement[]>(seedMovements);
  const [orders, setOrders] = useState<OrderDraft[]>(seedOrders);
  const [draftCart, setDraftCart] = useState<OrderDraftItem[]>([]);

  const addMovement = useCallback((m: Omit<KardexMovement, 'id'>) => {
    const newMov: KardexMovement = { ...m, id: `m${Date.now()}` };
    setMovements((prev) => [newMov, ...prev]);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === m.productId
          ? {
              ...p,
              stock: m.type === 'entrada' ? p.stock + m.quantity : Math.max(0, p.stock - m.quantity),
              soldCount: m.type === 'salida' ? p.soldCount + m.quantity : p.soldCount,
            }
          : p,
      ),
    );
  }, []);

  const addToDraftCart = useCallback(
    (productId: string, quantity: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      setDraftCart((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i,
          );
        }
        return [
          ...prev,
          { productId, productName: product.name, quantity, price: product.price },
        ];
      });
    },
    [products],
  );

  const removeFromDraftCart = useCallback((productId: string) => {
    setDraftCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearDraftCart = useCallback(() => setDraftCart([]), []);

  const addOrder = useCallback(
    (items: OrderDraftItem[]) => {
      if (items.length === 0) return;
      const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
      const newOrder: OrderDraft = {
        id: `o${Date.now()}`,
        items,
        status: 'pendiente',
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'Ana Torres',
        total,
      };
      setOrders((prev) => [newOrder, ...prev]);
      setDraftCart([]);
    },
    [],
  );

  const updateOrderStatus = useCallback((id: string, status: OrderDraft['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const pendingOrderCount = orders.filter((o) => o.status === 'pendiente').length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const criticalAlerts = products.filter((p) => p.stock < p.minStock).length;

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        products,
        movements,
        orders,
        addMovement,
        addOrder,
        updateOrderStatus,
        draftCart,
        addToDraftCart,
        removeFromDraftCart,
        clearDraftCart,
        pendingOrderCount,
        totalStock,
        criticalAlerts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
