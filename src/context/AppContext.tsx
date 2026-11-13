import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type {
  Role,
  Product,
  KardexMovement,
  OrderDraft,
  OrderDraftItem,
  NotificationItem,
  Client,
  ReplenishmentRequest,
  AuditLogEntry,
  GlobalConfig,
  MovementType,
  ReplenishmentStatus,
  OrderStatus,
} from '../types';
import {
  seedProducts, seedMovements, seedOrders, seedClients,
  seedReplenishments, seedAuditLogs, seedConfig,
} from '../data/seedData';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

interface AuthResult {
  error?: string;
  message?: string;
}

interface AppContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (fullName: string, email: string, password: string) => Promise<AuthResult>;
  ensureDemoUser: (email: string, password: string, fullName: string, role: Role) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  // data
  products: Product[];
  movements: KardexMovement[];
  orders: OrderDraft[];
  clients: Client[];
  replenishments: ReplenishmentRequest[];
  auditLogs: AuditLogEntry[];
  config: GlobalConfig;
  addMovement: (m: Omit<KardexMovement, 'id' | 'saldoResultante'>) => { success: boolean; error?: string };
  addOrder: (items: OrderDraftItem[], clientId?: string, clientName?: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  confirmOrder: (id: string) => { success: boolean; error?: string };
  dispatchOrder: (id: string) => void;
  draftCart: OrderDraftItem[];
  addToDraftCart: (productId: string, quantity: number) => void;
  removeFromDraftCart: (productId: string) => void;
  clearDraftCart: () => void;
  pendingOrderCount: number;
  totalStock: number;
  criticalAlerts: number;
  // notifications
  notifications: NotificationItem[];
  unreadNotifications: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  pushNotification: (n: Omit<NotificationItem, 'id' | 'user_id' | 'is_read' | 'created_at'>) => Promise<void>;
  // replenishment
  createReplenishment: (items: OrderDraftItem[], supplier: string, note?: string) => { success: boolean; requiresApproval: boolean };
  updateReplenishmentStatus: (id: string, status: ReplenishmentStatus) => void;
  // product management
  updateProduct: (id: string, updates: Partial<Product>) => void;
  toggleProductActive: (id: string) => void;
  // audit
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  // config
  updateConfig: (updates: Partial<GlobalConfig>) => void;
  // derived
  criticalProducts: Product[];
  pendingReplenishments: ReplenishmentRequest[];
}

const AppContext = createContext<AppContextValue | null>(null);

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}

function getStockStatus(p: Product): 'normal' | 'critico' | 'sin_configurar' {
  if (p.reorderPoint <= 0) return 'sin_configurar';
  return p.stock <= p.reorderPoint ? 'critico' : 'normal';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [movements, setMovements] = useState<KardexMovement[]>(seedMovements);
  const [orders, setOrders] = useState<OrderDraft[]>(seedOrders);
  const [clients] = useState<Client[]>(seedClients);
  const [replenishments, setReplenishments] = useState<ReplenishmentRequest[]>(seedReplenishments);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(seedAuditLogs);
  const [config, setConfig] = useState<GlobalConfig>(seedConfig);
  const [draftCart, setDraftCart] = useState<OrderDraftItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const role: Role = profile?.role ?? 'cliente';

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (!newSession?.user) {
        setProfile(null);
        setNotifications([]);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, is_active')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error) return;
      if (data) setProfile(data as Profile);
    })();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, category, priority, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (!error && data) setNotifications(data as NotificationItem[]);
    })();
    return () => { active = false; };
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => { setNotifications((prev) => [payload.new as NotificationItem, ...prev]); },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as NotificationItem;
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addAuditLog = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      ...entry,
      id: `a${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: errorMessage(error, 'Correo o contrasena incorrectos.') };
    return {};
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: errorMessage(error, 'No se pudo crear la cuenta.') };
    const newUser = data.user;
    if (newUser) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: newUser.id, full_name: fullName, email, role: 'cliente', is_active: true,
      });
      if (profileError) return { error: 'La cuenta se creo, pero el perfil no pudo guardarse.' };
      return { message: 'Cuenta creada. Ahora puedes iniciar sesion.' };
    }
    return { message: 'Cuenta creada. Ahora puedes iniciar sesion.' };
  }, []);

  const ensureDemoUser = useCallback(async (demoEmail: string, demoPassword: string, fullName: string, demoRole: Role): Promise<AuthResult> => {
    // Try to sign up the demo user (creates them in GoTrue properly)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      // If user already exists, just return OK so caller can retry signIn
      if (signUpError.message.includes('already') || signUpError.message.includes('registered') || signUpError.message.includes('exists')) {
        return {};
      }
      return { error: errorMessage(signUpError, 'No se pudo configurar el usuario demo.') };
    }

    if (signUpData.user) {
      // Upsert profile with the correct role
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        full_name: fullName,
        email: demoEmail,
        role: demoRole,
        is_active: true,
      });

      // Confirm email via SECURITY DEFINER function (demo emails only)
      await supabase.rpc('confirm_demo_email', { p_email: demoEmail });

      // If signUp returned a session, sign out so caller's signIn creates a fresh one
      if (signUpData.session) {
        await supabase.auth.signOut();
      }
    }

    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setNotifications([]);
    setDraftCart([]);
  }, []);

  const addMovement = useCallback((m: Omit<KardexMovement, 'id' | 'saldoResultante'>): { success: boolean; error?: string } => {
    const product = products.find((p) => p.id === m.productId);
    if (!product) return { success: false, error: 'Producto no encontrado' };

    let newStock = product.stock;
    if (m.type === 'entrada') {
      newStock = product.stock + m.quantity;
    } else if (m.type === 'salida') {
      if (m.quantity > product.stock) {
        return { success: false, error: `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${m.quantity}` };
      }
      newStock = product.stock - m.quantity;
    } else if (m.type === 'ajuste') {
      newStock = m.quantity;
    }

    const newMov: KardexMovement = { ...m, id: `m${Date.now()}`, saldoResultante: newStock };
    setMovements((prev) => [newMov, ...prev]);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === m.productId
          ? {
              ...p,
              stock: newStock,
              soldCount: m.type === 'salida' ? p.soldCount + m.quantity : p.soldCount,
            }
          : p,
      ),
    );

    if (m.type === 'ajuste') {
      addAuditLog({
        user: m.responsible,
        action: 'Ajuste de inventario',
        entity: `${product.name} (${product.sku})`,
        oldValue: `${product.stock} unidades`,
        newValue: `${newStock} unidades`,
      });
    }

    return { success: true };
  }, [products, addAuditLog]);

  const addToDraftCart = useCallback(
    (productId: string, quantity: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      setDraftCart((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + quantity) } : i,
          );
        }
        return [...prev, { productId, productName: product.name, quantity: Math.max(1, quantity), price: product.price }];
      });
    },
    [products],
  );

  const removeFromDraftCart = useCallback((productId: string) => {
    setDraftCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearDraftCart = useCallback(() => setDraftCart([]), []);

  const addOrder = useCallback(
    (items: OrderDraftItem[], clientId?: string, clientName?: string) => {
      if (items.length === 0) return;
      const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
      const newOrder: OrderDraft = {
        id: `o${Date.now()}`,
        items,
        status: 'pendiente',
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: profile?.full_name ?? 'Usuario',
        clientId,
        clientName,
        total,
      };
      setOrders((prev) => [newOrder, ...prev]);
      setDraftCart([]);
    },
    [profile],
  );

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const confirmOrder = useCallback((id: string): { success: boolean; error?: string } => {
    const order = orders.find((o) => o.id === id);
    if (!order) return { success: false, error: 'Pedido no encontrado' };

    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return { success: false, error: `Producto ${item.productName} no encontrado` };
      if (product.stock < item.quantity) {
        return { success: false, error: `Stock insuficiente para ${item.productName}. Disponible: ${product.stock}` };
      }
    }

    setProducts((prev) =>
      prev.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (item) {
          return { ...p, stock: p.stock - item.quantity, soldCount: p.soldCount + item.quantity };
        }
        return p;
      }),
    );

    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'confirmado' as OrderStatus } : o)));
    return { success: true };
  }, [orders, products]);

  const dispatchOrder = useCallback((id: string) => {
    setOrders((prev) => prev.map((o) =>
      o.id === id ? { ...o, status: 'despachado' as OrderStatus, dispatchDate: new Date().toISOString().split('T')[0] } : o,
    ));
  }, []);

  const createReplenishment = useCallback(
    (items: OrderDraftItem[], supplier: string, note?: string): { success: boolean; requiresApproval: boolean } => {
      const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
      const requiresApproval = total > config.approvalThreshold;
      const newReq: ReplenishmentRequest = {
        id: `r${Date.now()}`,
        items,
        total,
        status: requiresApproval ? 'pendiente_aprobacion' : 'enviada',
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: profile?.full_name ?? 'Usuario',
        supplier,
        requiresApproval,
        note,
      };
      setReplenishments((prev) => [newReq, ...prev]);
      return { success: true, requiresApproval };
    },
    [profile, config],
  );

  const updateReplenishmentStatus = useCallback((id: string, status: ReplenishmentStatus) => {
    setReplenishments((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    const product = products.find((p) => p.id === id);
    if (product && updates.reorderPoint !== undefined && updates.reorderPoint !== product.reorderPoint) {
      addAuditLog({
        user: profile?.full_name ?? 'Usuario',
        action: 'Cambio de punto de reorden',
        entity: `${product.name} (${product.sku})`,
        oldValue: `${product.reorderPoint}`,
        newValue: `${updates.reorderPoint}`,
      });
    }
  }, [products, profile, addAuditLog]);

  const toggleProductActive = useCallback((id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
    addAuditLog({
      user: profile?.full_name ?? 'Usuario',
      action: product.isActive ? 'Desactivacion de producto' : 'Activacion de producto',
      entity: `${product.name} (${product.sku})`,
      oldValue: product.isActive ? 'Activo' : 'Inactivo',
      newValue: product.isActive ? 'Inactivo' : 'Activo',
    });
  }, [products, profile, addAuditLog]);

  const updateConfig = useCallback((updates: Partial<GlobalConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    if (updates.approvalThreshold !== undefined) {
      addAuditLog({
        user: profile?.full_name ?? 'Usuario',
        action: 'Cambio de configuracion global',
        entity: 'Umbral de aprobacion de compras',
        oldValue: `$${config.approvalThreshold}`,
        newValue: `$${updates.approvalThreshold}`,
      });
    }
  }, [config, profile, addAuditLog]);

  const pushNotification = useCallback(
    async (n: Omit<NotificationItem, 'id' | 'user_id' | 'is_read' | 'created_at'>) => {
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .insert({ title: n.title, message: n.message, category: n.category, priority: n.priority })
        .select('id, user_id, title, message, category, priority, is_read, created_at')
        .single();
      if (data) setNotifications((prev) => [data as NotificationItem, ...prev]);
    },
    [user],
  );

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  }, [user]);

  const criticalProducts = products.filter((p) => p.isActive && getStockStatus(p) === 'critico');
  const pendingOrderCount = orders.filter((o) => o.status === 'pendiente').length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const criticalAlerts = criticalProducts.length;
  const unreadNotifications = notifications.filter((n) => !n.is_read).length;
  const pendingReplenishments = replenishments.filter((r) => r.status === 'pendiente_aprobacion');

  return (
    <AppContext.Provider
      value={{
        session, user, profile, role, authReady,
        signIn, signUp, ensureDemoUser, signOut,
        products, movements, orders, clients, replenishments, auditLogs, config,
        addMovement, addOrder, updateOrderStatus, confirmOrder, dispatchOrder,
        draftCart, addToDraftCart, removeFromDraftCart, clearDraftCart,
        pendingOrderCount, totalStock, criticalAlerts,
        notifications, unreadNotifications,
        markNotificationRead, markAllNotificationsRead, pushNotification,
        createReplenishment, updateReplenishmentStatus,
        updateProduct, toggleProductActive,
        addAuditLog, updateConfig,
        criticalProducts, pendingReplenishments,
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

export { getStockStatus };
