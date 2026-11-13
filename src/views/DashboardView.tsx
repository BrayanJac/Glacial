import { useState } from 'react';
import {
  Package, AlertTriangle, ShoppingCart, TrendingUp, TrendingDown,
  Plus, Minus, ArrowUpCircle, ArrowDownCircle, FileText, X, Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { MovementType, Product } from '../types';

function KpiCard({
  icon: Icon, label, value, sublabel, color,
}: {
  icon: typeof Package; label: string; value: string | number; sublabel?: string; color: string;
}) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-frost-400">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold text-frost-800">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-frost-400">{sublabel}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { products, movements, addMovement, orders, pendingOrderCount, totalStock, criticalAlerts } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'entrada' as MovementType,
    quantity: 1,
    responsible: '',
    note: '',
  });

  const criticalProducts = products.filter((p) => p.stock < p.minStock);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.productId || formData.quantity < 1) return;
    const product = products.find((p) => p.id === formData.productId);
    if (!product) return;
    addMovement({
      date: new Date().toISOString().split('T')[0],
      productId: product.id,
      productName: product.name,
      type: formData.type,
      quantity: formData.quantity,
      responsible: formData.responsible || 'Usuario actual',
      note: formData.note,
    });
    setShowForm(false);
    setFormData({ productId: '', type: 'entrada', quantity: 1, responsible: '', note: '' });
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Package}
          label="Stock Total"
          value={totalStock}
          sublabel="unidades en bodega"
          color="bg-ice-100 text-ice-600"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Alertas Criticas"
          value={criticalAlerts}
          sublabel="productos bajo minimo"
          color="bg-red-100 text-red-600"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Pedidos Sugeridos"
          value={pendingOrderCount}
          sublabel="pendientes de aprobacion"
          color="bg-amber-100 text-amber-600"
        />
        <KpiCard
          icon={FileText}
          label="Movimientos Kardex"
          value={movements.length}
          sublabel="registros totales"
          color="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Critical Alerts Panel */}
      {criticalProducts.length > 0 && (
        <div className="card overflow-hidden border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-5 py-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-display text-base font-semibold text-red-800">
              Alertas de Stock Critico ({criticalProducts.length})
            </h3>
          </div>
          <div className="divide-y divide-frost-100">
            {criticalProducts.map((p) => {
              const deficit = p.minStock - p.stock;
              const urgency = p.stock < p.minStock / 2 ? 'critical' : 'warning';
              return (
                <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-2.5 w-2.5 rounded-full ${
                        urgency === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-frost-800">{p.name}</p>
                      <p className="text-xs text-frost-400">Lote: {p.batch}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-frost-400">Actual / Minimo</p>
                      <p className="text-sm">
                        <span className={`font-bold ${urgency === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                          {p.stock}
                        </span>
                        <span className="text-frost-400"> / {p.minStock}</span>
                      </p>
                    </div>
                    <span className={`badge ${
                      urgency === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      Faltan {deficit} u.
                    </span>
                    <button className="btn-primary whitespace-nowrap">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Generar Borrador
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kardex Table + Movement Form */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-frost-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-ice-600" />
            <h3 className="font-display text-base font-semibold text-frost-800">Kardex - Movimientos Recientes</h3>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Registrar Movimiento
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-frost-100 bg-frost-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Fecha</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Producto</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Tipo</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-frost-400">Cantidad</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Responsable</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-frost-50">
              {movements.slice(0, 15).map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-frost-50">
                  <td className="px-5 py-3 text-sm text-frost-500">{m.date}</td>
                  <td className="px-5 py-3 text-sm font-medium text-frost-700">{m.productName}</td>
                  <td className="px-5 py-3">
                    {m.type === 'entrada' ? (
                      <span className="badge bg-emerald-100 text-emerald-700">
                        <ArrowUpCircle className="h-3 w-3" /> Entrada
                      </span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">
                        <ArrowDownCircle className="h-3 w-3" /> Salida
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
                      m.type === 'entrada' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {m.type === 'entrada' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-frost-600">{m.responsible}</td>
                  <td className="px-5 py-3 text-sm text-frost-400">{m.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md mx-4 animate-slide-up">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
                <h3 className="font-display text-base font-semibold text-frost-800">Registrar Movimiento</h3>
                <button onClick={() => setShowForm(false)} className="text-frost-400 hover:text-frost-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Producto</label>
                  <select
                    className="input-field"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((p: Product) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Tipo de Movimiento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'entrada' })}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                        formData.type === 'entrada'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-frost-200 text-frost-500 hover:border-frost-300'
                      }`}
                    >
                      <ArrowUpCircle className="h-4 w-4" /> Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'salida' })}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                        formData.type === 'salida'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-frost-200 text-frost-500 hover:border-frost-300'
                      }`}
                    >
                      <ArrowDownCircle className="h-4 w-4" /> Salida
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Cantidad</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-frost-200 text-frost-500 hover:bg-frost-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      className="input-field text-center"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      min={1}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-frost-200 text-frost-500 hover:bg-frost-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Responsable</label>
                  <input
                    className="input-field"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    placeholder="Nombre del responsable..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Nota (opcional)</label>
                  <input
                    className="input-field"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Motivo del movimiento..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1 justify-center">
                    <Check className="h-4 w-4" /> Registrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pending Orders Summary */}
      {orders.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-4 font-display text-base font-semibold text-frost-800">Pedidos Sugeridos Pendientes</h3>
          <div className="space-y-3">
            {orders.filter(o => o.status === 'pendiente').map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-frost-700">Pedido #{o.id.slice(-4)}</p>
                  <p className="text-xs text-frost-400">{o.items.length} productos - ${o.total.toFixed(2)}</p>
                </div>
                <span className="badge bg-amber-200 text-amber-800">Pendiente</span>
              </div>
            ))}
            {orders.filter(o => o.status === 'pendiente').length === 0 && (
              <p className="text-sm text-frost-400">No hay pedidos pendientes.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
