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
} from '../types';
import { seedProducts, seedMovements, seedOrders } from '../data/seedData';
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
  // auth
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (fullName: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  // data
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
  // notifications
  notifications: NotificationItem[];
  unreadNotifications: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  pushNotification: (n: Omit<NotificationItem, 'id' | 'user_id' | 'is_read' | 'created_at'>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [movements, setMovements] = useState<KardexMovement[]>(seedMovements);
  const [orders, setOrders] = useState<OrderDraft[]>(seedOrders);
  const [draftCart, setDraftCart] = useState<OrderDraftItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const role: Role = profile?.role ?? 'cliente';

  // Restore session + subscribe to auth changes
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
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (!newSession?.user) {
          setProfile(null);
          setNotifications([]);
        }
      })();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load profile when user changes
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
    return () => {
      active = false;
    };
  }, [user]);

  // Load notifications when profile changes
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
    return () => {
      active = false;
    };
  }, [user, profile]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [
            payload.new as NotificationItem,
            ...prev,
          ]);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as NotificationItem;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n)),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Correo o contraseña incorrectos.' };
    return {};
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: errorMessage(error, 'No se pudo crear la cuenta.') };
    const newUser = data.user;
    if (newUser) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: newUser.id,
        full_name: fullName,
        email,
        role: 'cliente',
        is_active: true,
      });
      if (profileError) {
        return { error: 'La cuenta se creó, pero el perfil no pudo guardarse.' };
      }
      return { message: 'Cuenta creada. Revisa tu correo si la confirmación está habilitada, luego inicia sesión.' };
    }
    return { message: 'Cuenta creada. Ahora puedes iniciar sesión.' };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setNotifications([]);
    setDraftCart([]);
  }, []);

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
        createdBy: profile?.full_name ?? 'Usuario',
        total,
      };
      setOrders((prev) => [newOrder, ...prev]);
      setDraftCart([]);
    },
    [profile],
  );

  const updateOrderStatus = useCallback((id: string, status: OrderDraft['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const pushNotification = useCallback(
    async (n: Omit<NotificationItem, 'id' | 'user_id' | 'is_read' | 'created_at'>) => {
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .insert({
          title: n.title,
          message: n.message,
          category: n.category,
          priority: n.priority,
        })
        .select('id, user_id, title, message, category, priority, is_read, created_at')
        .single();
      if (data) setNotifications((prev) => [data as NotificationItem, ...prev]);
    },
    [user],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    [],
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }, [user]);

  const pendingOrderCount = orders.filter((o) => o.status === 'pendiente').length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const criticalAlerts = products.filter((p) => p.stock < p.minStock).length;
  const unreadNotifications = notifications.filter((n) => !n.is_read).length;

  return (
    <AppContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        authReady,
        signIn,
        signUp,
        signOut,
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
        notifications,
        unreadNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        pushNotification,
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
