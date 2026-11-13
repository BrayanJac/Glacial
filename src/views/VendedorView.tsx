import { useState } from 'react';
import {
  TrendingUp, Clock, AlertTriangle, ShoppingCart, Plus, Minus, Send,
  X, Check, Users, Calendar, FileText, Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Client, Product } from '../types';

export default function VendedorView() {
  const { clients, products, orders, addToDraftCart, draftCart, addOrder, pushNotification, user } = useApp();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [draftBuilderItems, setDraftBuilderItems] = useState<Record<string, number>>({});
  const [showOrders, setShowOrders] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  const urgentClients = clients.filter((c) => c.status === 'urgente');
  const upcomingClients = clients.filter((c) => c.status === 'proximo');
  const normalClients = clients.filter((c) => c.status === 'normal');

  function openBuilder(client: Client) {
    setSelectedClient(client);
    const initial: Record<string, number> = {};
    client.suggestedProducts.forEach((pid) => {
      const product = products.find((p) => p.id === pid);
      if (product && product.stock > 0) initial[pid] = 10;
    });
    setDraftBuilderItems(initial);
  }

  function adjustQty(pid: string, delta: number) {
    const product = products.find((p) => p.id === pid);
    if (!product) return;
    setDraftBuilderItems((prev) => {
      const current = prev[pid] ?? 0;
      const next = Math.max(0, Math.min(product.stock, current + delta));
      return { ...prev, [pid]: next };
    });
  }

  function sendDraft() {
    if (!selectedClient) return;
    const items = Object.entries(draftBuilderItems)
      .filter(([, qty]) => qty > 0)
      .map(([pid, qty]) => {
        const p = products.find((pr) => pr.id === pid)!;
        return { productId: pid, productName: p.name, quantity: qty, price: p.price };
      });
    if (items.length === 0) return;
    addOrder(items, selectedClient.id, selectedClient.name);
    setSentMsg(`Borrador enviado a ${selectedClient.name}. Recibira un recordatorio de confirmacion.`);
    setSelectedClient(null);
    setDraftBuilderItems({});
    setTimeout(() => setSentMsg(''), 5000);
  }

  function sendReminder(client: Client) {
    pushNotification({
      title: 'Recordatorio de recompra',
      message: `Estimamos que tu stock se agota pronto. Confirma tu pedido sugerido.`,
      category: 'recompra',
      priority: client.status === 'urgente' ? 'alta' : 'media',
    });
    setSentMsg(`Recordatorio preventivo enviado a ${client.name}.`);
    setTimeout(() => setSentMsg(''), 4000);
  }

  const activeProducts = products.filter((p) => p.isActive && p.stock > 0);

  function renderClientRow(client: Client) {
    const daysToStockOut = Math.ceil(
      (new Date(client.estimatedStockOutDate).getTime() - new Date('2026-11-13').getTime()) / (1000 * 60 * 60 * 24),
    );
    return (
      <div key={client.id} className="card card-hover p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              client.status === 'urgente' ? 'bg-red-100 text-red-600' :
              client.status === 'proximo' ? 'bg-amber-100 text-amber-600' :
              'bg-emerald-100 text-emerald-600'
            }`}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-frost-800">{client.name}</p>
              <p className="text-xs text-frost-400">
                Ultima compra: {client.lastPurchaseDate} | Frecuencia: {client.avgFrequencyDays} dias
                {client.purchaseCount === 1 && <span className="ml-1 text-ice-600">(Cliente nuevo - 14 dias)</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-frost-400">FEA</p>
              <p className={`text-sm font-semibold ${
                client.status === 'urgente' ? 'text-red-600' :
                client.status === 'proximo' ? 'text-amber-600' : 'text-frost-600'
              }`}>{client.estimatedStockOutDate}</p>
            </div>
            <span className={`badge ${
              client.status === 'urgente' ? 'bg-red-100 text-red-700' :
              client.status === 'proximo' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {client.status === 'urgente' && <AlertTriangle className="h-3 w-3" />}
              {client.status === 'proximo' && <Clock className="h-3 w-3" />}
              {client.status === 'urgente' ? 'Urgente' : client.status === 'proximo' ? 'Proximo' : 'Normal'}
              {client.status !== 'normal' && ` (${daysToStockOut}d)`}
            </span>
            <div className="flex gap-1.5">
              <button onClick={() => sendReminder(client)} className="btn-secondary text-xs" title="Enviar recordatorio">
                <Bell className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => openBuilder(client)} className="btn-primary text-xs">
                <ShoppingCart className="h-3.5 w-3.5" />
                Crear Borrador
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sentMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-slide-up">
          <Check className="mr-2 inline h-4 w-4" />{sentMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ice-600">Panel comercial</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-frost-900">Sugerencias de Recompra</h2>
        </div>
        <button onClick={() => setShowOrders(true)} className="btn-secondary relative">
          <FileText className="h-4 w-4" />
          Mis Pedidos
          {orders.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {orders.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-sm text-frost-400">Urgentes</p><p className="font-display text-2xl font-bold text-frost-800">{urgentClients.length}</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-sm text-frost-400">Proximos</p><p className="font-display text-2xl font-bold text-frost-800">{upcomingClients.length}</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-sm text-frost-400">Normal</p><p className="font-display text-2xl font-bold text-frost-800">{normalClients.length}</p></div>
          </div>
        </div>
      </div>

      {urgentClients.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" /> Recompra Urgente
          </h3>
          <div className="space-y-3">{urgentClients.map(renderClientRow)}</div>
        </div>
      )}

      {upcomingClients.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-amber-700">
            <Clock className="h-4 w-4" /> Proximos a Agotar
          </h3>
          <div className="space-y-3">{upcomingClients.map(renderClientRow)}</div>
        </div>
      )}

      {normalClients.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-emerald-700">
            <Check className="h-4 w-4" /> Stock Suficiente
          </h3>
          <div className="space-y-3">{normalClients.map(renderClientRow)}</div>
        </div>
      )}

      {/* Draft Builder Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg mx-4 animate-slide-up">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-frost-800">Borrador para {selectedClient.name}</h3>
                  <p className="text-xs text-frost-400">Selecciona cantidades - solo productos activos con stock</p>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-frost-400 hover:text-frost-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-5 space-y-3">
                {activeProducts.map((p: Product) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-frost-200 p-3">
                    <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-frost-700 truncate">{p.name}</p>
                      <p className="text-xs text-frost-400">Stock: {p.stock} | ${p.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => adjustQty(p.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-frost-200 text-frost-500 hover:bg-frost-50">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-frost-700">{draftBuilderItems[p.id] ?? 0}</span>
                      <button onClick={() => adjustQty(p.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-frost-200 text-frost-500 hover:bg-frost-50">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-frost-200 p-5">
                <button onClick={sendDraft} className="btn-primary w-full justify-center">
                  <Send className="h-4 w-4" />
                  Enviar borrador al cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg mx-4 animate-slide-up">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
                <h3 className="font-display text-base font-semibold text-frost-800">Pedidos Enviados</h3>
                <button onClick={() => setShowOrders(false)} className="text-frost-400 hover:text-frost-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-5 space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-frost-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-frost-700">Pedido #{o.id.slice(-4)}</p>
                      <span className={`badge ${
                        o.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                        o.status === 'confirmado' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'despachado' ? 'bg-ice-100 text-ice-700' :
                        'bg-frost-100 text-frost-500'
                      }`}>
                        {o.status === 'pendiente' && <Clock className="h-3 w-3" />}
                        {o.status === 'confirmado' && <Check className="h-3 w-3" />}
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    {o.clientName && <p className="text-xs text-frost-400 mb-1">Cliente: {o.clientName}</p>}
                    <div className="space-y-1">
                      {o.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm text-frost-500">
                          <span>{item.productName}</span>
                          <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between border-t border-frost-100 pt-2">
                      <span className="text-xs text-frost-400">{o.createdAt} - {o.createdBy}</span>
                      <span className="text-sm font-bold text-ice-600">${o.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-sm text-frost-400 text-center py-8">No hay pedidos.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
