import { useState } from 'react';
import {
  Box, Search, Bell, Check, Clock, Package, X, ShoppingCart,
  History, Plus, Minus, AlertTriangle, Truck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Product, OrderDraft } from '../types';
import Viewer3DModal from '../components/Viewer3DModal';

type ClienteTab = 'catalogo' | 'recordatorios' | 'historial';

export default function ClienteView() {
  const { products, orders, confirmOrder, clients, profile } = useApp();
  const [selected3D, setSelected3D] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ClienteTab>('catalogo');
  const [confirmingOrder, setConfirmingOrder] = useState<OrderDraft | null>(null);
  const [adjustQty, setAdjustQty] = useState<Record<string, number>>({});
  const [confirmError, setConfirmError] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState('');

  const activeProducts = products.filter((p) => p.isActive);
  const filteredProducts = activeProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.flavor.toLowerCase().includes(search.toLowerCase()),
  );

  // Find this client's pending orders (drafts sent by vendedor)
  const myPendingOrders = orders.filter((o) => o.status === 'pendiente');
  const myConfirmedOrders = orders.filter((o) => o.status === 'confirmado' || o.status === 'despachado');

  // Simulated reminder: pick first urgent client's suggested products
  const reminderClient = clients.find((c) => c.status === 'urgente');
  const daysToStockOut = reminderClient
    ? Math.ceil((new Date(reminderClient.estimatedStockOutDate).getTime() - new Date('2026-11-13').getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  function openConfirm(order: OrderDraft) {
    const initial: Record<string, number> = {};
    order.items.forEach((item) => { initial[item.productId] = item.quantity; });
    setAdjustQty(initial);
    setConfirmingOrder(order);
    setConfirmError('');
  }

  function adjustConfirmQty(pid: string, delta: number) {
    const product = products.find((p) => p.id === pid);
    if (!product) return;
    setAdjustQty((prev) => {
      const current = prev[pid] ?? 0;
      const next = Math.max(0, Math.min(product.stock, current + delta));
      return { ...prev, [pid]: next };
    });
  }

  function executeConfirm() {
    if (!confirmingOrder) return;
    setConfirmError('');
    const result = confirmOrder(confirmingOrder.id);
    if (!result.success) {
      setConfirmError(result.error || 'No se pudo confirmar el pedido.');
      return;
    }
    setConfirmSuccess(`Pedido #${confirmingOrder.id.slice(-4)} confirmado. Stock reservado correctamente.`);
    setConfirmingOrder(null);
    setTimeout(() => setConfirmSuccess(''), 5000);
  }

  function renderCatalogo() {
    return (
      <div className="space-y-6">
        {/* Reminder Banner */}
        {reminderClient && (
          <div className="card overflow-hidden border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-cream-50">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-semibold text-frost-800">
                  Hola{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! Estimamos que tu stock se agota en {daysToStockOut} dias.
                </p>
                <p className="text-xs text-frost-500 mt-0.5">
                  Confirma tu pedido sugerido para asegurar tu abastecimiento de {reminderClient.suggestedProducts.map((pid) => products.find((p) => p.id === pid)?.name).filter(Boolean).join(', ')}.
                </p>
              </div>
              {myPendingOrders.length > 0 && (
                <button onClick={() => setActiveTab('recordatorios')} className="btn-primary text-xs whitespace-nowrap">
                  <Check className="h-3.5 w-3.5" /> Confirmar Pedido
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-frost-400" />
          <input className="input-field pl-10" placeholder="Buscar helados por nombre o sabor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => {
            const isLow = p.stock <= p.reorderPoint;
            return (
              <div key={p.id} className="card card-hover overflow-hidden group">
                <div className="relative h-48 overflow-hidden bg-frost-100">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3">
                    <span className={`badge ${isLow ? 'bg-red-500 text-white' : 'bg-white/90 text-emerald-700'}`}>
                      {isLow ? <><Clock className="h-3 w-3" /> Bajo stock</> : <><Package className="h-3 w-3" /> {p.stock} disp.</>}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="badge bg-white/90 text-ice-700">{p.size}</span>
                  </div>
                  {!p.has3DModel && (
                    <div className="absolute bottom-3 right-3">
                      <span className="badge bg-frost-800/80 text-white">Solo foto</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm font-semibold text-frost-800 leading-snug">{p.name}</h3>
                  <p className="mt-0.5 text-xs text-frost-400">Sabor: {p.flavor} | {p.category}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-frost-400">Precio</p>
                      <p className="font-display text-lg font-bold text-ice-600">${p.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-frost-400">Stock</p>
                      <p className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>{p.stock} / min. {p.minStock}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setSelected3D(p)} className="btn-secondary flex-1 justify-center text-xs">
                      <Box className="h-3.5 w-3.5" />
                      {p.has3DModel ? 'Ver en 3D / RA' : 'Ver detalle'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredProducts.length === 0 && (
          <div className="card p-12 text-center"><p className="text-frost-400">No se encontraron productos con "{search}".</p></div>
        )}
      </div>
    );
  }

  function renderRecordatorios() {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ice-600">Bandeja de confirmacion</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-frost-900">Borradores Pendientes</h2>
          <p className="mt-2 text-sm text-frost-500">Confirma o ajusta tus pedidos sugeridos. Al confirmar, el stock se reserva automaticamente.</p>
        </div>

        {confirmSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-slide-up">
            <Check className="mr-2 inline h-4 w-4" />{confirmSuccess}
          </div>
        )}

        {myPendingOrders.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-frost-300" />
            <p className="mt-3 text-sm text-frost-500">No tienes borradores pendientes.</p>
            <p className="text-xs text-frost-400 mt-1">Los recordatorios de recompra apareceran aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myPendingOrders.map((o) => (
              <div key={o.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 border-b border-frost-100 bg-amber-50 px-5 py-3">
                  <Bell className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-frost-700">Pedido sugerido #{o.id.slice(-4)}</p>
                  <span className="ml-auto badge bg-amber-100 text-amber-700"><Clock className="h-3 w-3" /> Pendiente confirmacion</span>
                </div>
                <div className="p-5">
                  <p className="text-xs text-frost-400 mb-3">Creado: {o.createdAt} | Por: {o.createdBy}</p>
                  <div className="space-y-2 mb-4">
                    {o.items.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      const stockOk = product ? product.stock >= item.quantity : false;
                      return (
                        <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-frost-200 p-3">
                          {product && <img src={product.image} alt={item.productName} className="h-10 w-10 rounded-lg object-cover" />}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-frost-700">{item.productName}</p>
                            <p className="text-xs text-frost-400">${item.price.toFixed(2)} c/u | Stock: {product?.stock ?? '?'}</p>
                            {!stockOk && <p className="text-xs text-red-600">Stock insuficiente</p>}
                          </div>
                          <span className="text-sm font-semibold text-frost-700">{item.quantity} u.</span>
                          <span className="text-sm font-bold text-ice-600">${(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between border-t border-frost-100 pt-3">
                    <span className="font-display font-semibold text-frost-800">Total</span>
                    <span className="font-display text-xl font-bold text-ice-600">${o.total.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => openConfirm(o)} className="btn-primary flex-1 justify-center">
                      <Check className="h-4 w-4" /> Confirmar Pedido
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderHistorial() {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ice-600">Mis pedidos</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-frost-900">Historial de Pedidos</h2>
        </div>
        {myConfirmedOrders.length === 0 ? (
          <div className="card p-12 text-center">
            <History className="mx-auto h-12 w-12 text-frost-300" />
            <p className="mt-3 text-sm text-frost-500">No tienes pedidos confirmados aun.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myConfirmedOrders.map((o) => (
              <div key={o.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-frost-700">Pedido #{o.id.slice(-4)}</p>
                    <span className={`badge ${
                      o.status === 'confirmado' ? 'bg-emerald-100 text-emerald-700' :
                      o.status === 'despachado' ? 'bg-ice-100 text-ice-700' :
                      'bg-frost-100 text-frost-500'
                    }`}>
                      {o.status === 'confirmado' && <Check className="h-3 w-3" />}
                      {o.status === 'despachado' && <Truck className="h-3 w-3" />}
                      {o.status === 'confirmado' ? 'Confirmado' : o.status === 'despachado' ? 'Despachado' : o.status}
                    </span>
                  </div>
                  <span className="text-xs text-frost-400">{o.createdAt}{o.dispatchDate && ` | Despachado: ${o.dispatchDate}`}</span>
                </div>
                <div className="space-y-1">
                  {o.items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm text-frost-500">
                      <span>{item.productName}</span>
                      <span>{item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between border-t border-frost-100 pt-2">
                  <span className="text-xs text-frost-400">Solicitado por {o.createdBy}</span>
                  <span className="text-sm font-bold text-ice-600">${o.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-frost-200 bg-white p-2 shadow-sm">
        {([
          { key: 'catalogo' as ClienteTab, label: 'Catalogo 3D / RA', icon: Box },
          { key: 'recordatorios' as ClienteTab, label: 'Recordatorios', icon: Bell },
          { key: 'historial' as ClienteTab, label: 'Historial', icon: History },
        ]).map((tab) => {
          const Icon = tab.icon;
          const hasPending = tab.key === 'recordatorios' && myPendingOrders.length > 0;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key ? 'bg-ice-600 text-white' : 'text-frost-600 hover:bg-frost-100'
              }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
              {hasPending && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{myPendingOrders.length}</span>}
            </button>
          );
        })}
      </div>

      {activeTab === 'catalogo' && renderCatalogo()}
      {activeTab === 'recordatorios' && renderRecordatorios()}
      {activeTab === 'historial' && renderHistorial()}

      {/* 3D Modal */}
      {selected3D && <Viewer3DModal product={selected3D} onClose={() => setSelected3D(null)} />}

      {/* Confirm Order Modal */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md mx-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-frost-800">Confirmar Pedido</h3>
                  <p className="text-xs text-frost-400">Ajusta cantidades y confirma. El stock se reservara al instante.</p>
                </div>
                <button onClick={() => setConfirmingOrder(null)} className="text-frost-400 hover:text-frost-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-3">
                {confirmError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{confirmError}</div>}
                {confirmingOrder.items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  const qty = adjustQty[item.productId] ?? item.quantity;
                  return (
                    <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-frost-200 p-3">
                      {product && <img src={product.image} alt={item.productName} className="h-10 w-10 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-frost-700 truncate">{item.productName}</p>
                        <p className="text-xs text-frost-400">Stock: {product?.stock ?? 0} | ${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => adjustConfirmQty(item.productId, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-frost-200 text-frost-500 hover:bg-frost-50"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-10 text-center text-sm font-semibold text-frost-700">{qty}</span>
                        <button onClick={() => adjustConfirmQty(item.productId, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-frost-200 text-frost-500 hover:bg-frost-50"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between border-t border-frost-100 pt-3">
                  <span className="font-display font-semibold text-frost-800">Total</span>
                  <span className="font-display text-xl font-bold text-ice-600">
                    ${confirmingOrder.items.reduce((s, item) => s + (adjustQty[item.productId] ?? item.quantity) * item.price, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setConfirmingOrder(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                  <button onClick={executeConfirm} className="btn-success flex-1 justify-center"><Check className="h-4 w-4" /> Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
