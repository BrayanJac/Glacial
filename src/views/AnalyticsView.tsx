import {
  BarChart3, TrendingUp, TrendingDown, Calendar, Check, X, Clock,
  ShoppingCart, Package, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AnalyticsView() {
  const { products, movements, orders, updateOrderStatus } = useApp();

  const sorted = [...products].sort((a, b) => b.soldCount - a.soldCount);
  const maxSold = Math.max(...sorted.map((p) => p.soldCount), 1);
  const pendingOrders = orders.filter((o) => o.status === 'pendiente');

  // Expiry calculation
  const today = new Date('2026-10-22');
  const expiryData = products
    .map((p) => {
      const expiry = new Date(p.expiryDate);
      const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...p, daysToExpiry: days };
    })
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  // Monthly movement summary
  const entranceCount = movements.filter((m) => m.type === 'entrada').length;
  const exitCount = movements.filter((m) => m.type === 'salida').length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-frost-400">Entradas (Mes)</p>
              <p className="font-display text-2xl font-bold text-frost-800">{entranceCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-frost-400">Salidas (Mes)</p>
              <p className="font-display text-2xl font-bold text-frost-800">{exitCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-frost-400">Pedidos Pendientes</p>
              <p className="font-display text-2xl font-bold text-frost-800">{pendingOrders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rotation Chart */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
          <BarChart3 className="h-5 w-5 text-ice-600" />
          <h3 className="font-display text-base font-semibold text-frost-800">Rotacion de Productos</h3>
          <span className="ml-auto badge bg-frost-100 text-frost-500">Mas vendidos vs. menos vendidos</span>
        </div>
        <div className="p-5 space-y-3">
          {sorted.map((p, idx) => {
            const percentage = (p.soldCount / maxSold) * 100;
            const isTop = idx < 3;
            const isLow = idx >= sorted.length - 2;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-44 shrink-0">
                  <p className="text-sm font-medium text-frost-700 truncate">{p.name}</p>
                  <p className="text-xs text-frost-400">{p.flavor}</p>
                </div>
                <div className="flex-1">
                  <div className="relative h-7 rounded-lg bg-frost-100 overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-700 ${
                        isTop ? 'bg-gradient-to-r from-ice-400 to-ice-600' :
                        isLow ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                        'bg-gradient-to-r from-frost-300 to-frost-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs font-semibold text-frost-700">
                        {isTop && <span className="text-ice-700">Top {idx + 1}</span>}
                      </span>
                      <span className="text-xs font-bold text-frost-700">{p.soldCount} u.</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expiry Alerts */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
          <Calendar className="h-5 w-5 text-amber-600" />
          <h3 className="font-display text-base font-semibold text-frost-800">Proximidad a Fecha de Caducidad</h3>
        </div>
        <div className="divide-y divide-frost-50">
          {expiryData.map((p) => {
            const isUrgent = p.daysToExpiry <= 14;
            const isWarning = p.daysToExpiry > 14 && p.daysToExpiry <= 30;
            return (
              <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex items-center gap-3">
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-medium text-frost-700">{p.name}</p>
                    <p className="text-xs text-frost-400">Lote: {p.batch}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-frost-400">Vence</p>
                    <p className="text-sm font-medium text-frost-700">{p.expiryDate}</p>
                  </div>
                  <span className={`badge ${
                    isUrgent ? 'bg-red-100 text-red-700' :
                    isWarning ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isUrgent && <AlertTriangle className="h-3 w-3" />}
                    {p.daysToExpiry} dias
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Approval Section */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
          <Package className="h-5 w-5 text-ice-600" />
          <h3 className="font-display text-base font-semibold text-frost-800">Aprobacion de Pedidos</h3>
          {pendingOrders.length > 0 && (
            <span className="ml-auto badge bg-amber-100 text-amber-700">
              {pendingOrders.length} pendientes
            </span>
          )}
        </div>
        <div className="divide-y divide-frost-50">
          {orders.map((o) => (
            <div key={o.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-frost-700">Pedido #{o.id.slice(-4)}</p>
                    <span className={`badge ${
                      o.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                      o.status === 'aprobado' ? 'bg-emerald-100 text-emerald-700' :
                      o.status === 'rechazado' ? 'bg-red-100 text-red-700' :
                      'bg-frost-100 text-frost-500'
                    }`}>
                      {o.status === 'pendiente' && <Clock className="h-3 w-3" />}
                      {o.status === 'aprobado' && <Check className="h-3 w-3" />}
                      {o.status === 'rechazado' && <X className="h-3 w-3" />}
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-frost-400 mb-2">
                    {o.createdAt} - Solicitado por {o.createdBy}
                  </p>
                  <div className="space-y-1">
                    {o.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm text-frost-500">
                        <span>{item.productName}</span>
                        <span>{item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm font-bold text-ice-600">Total: ${o.total.toFixed(2)}</p>
                </div>
                {o.status === 'pendiente' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => updateOrderStatus(o.id, 'aprobado')}
                      className="btn-success text-xs"
                    >
                      <Check className="h-3.5 w-3.5" /> Aprobar
                    </button>
                    <button
                      onClick={() => updateOrderStatus(o.id, 'rechazado')}
                      className="btn-danger text-xs"
                    >
                      <X className="h-3.5 w-3.5" /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="px-5 py-12 text-center text-frost-400">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay pedidos registrados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
