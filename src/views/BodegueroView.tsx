import { useState } from 'react';
import {
  Package, AlertTriangle, Plus, Minus, ArrowUpCircle, ArrowDownCircle,
  Settings2, X, Check, FileText, Truck, Mail, Clock, Search, SlidersHorizontal,
} from 'lucide-react';
import { useApp, getStockStatus } from '../context/AppContext';
import type { MovementType, Product, ReplenishmentStatus } from '../types';

function KpiCard({ icon: Icon, label, value, sublabel, color }: {
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

export default function BodegueroView() {
  const {
    products, movements, addMovement, orders, dispatchOrder,
    criticalProducts, replenishments, createReplenishment, updateReplenishmentStatus,
    updateProduct, toggleProductActive, config, addAuditLog, profile,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState<Product | null>(null);
  const [showReplenish, setShowReplenish] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [reorderQty, setReorderQty] = useState(0);
  const [replenishItems, setReplenishItems] = useState<Record<string, number>>({});
  const [replenishSupplier, setReplenishSupplier] = useState('Helados Industrial S.A.');
  const [replenishNote, setReplenishNote] = useState('');
  const [replenishResult, setReplenishResult] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    productId: '', type: 'entrada' as MovementType, quantity: 1,
    responsible: '', note: '', justification: '', comprobante: '',
  });

  const categories = ['all', 'Paletas', 'Vasos', 'Litros', 'Conos', 'Especiales'];
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const confirmedOrders = orders.filter((o) => o.status === 'confirmado');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!formData.productId || formData.quantity < 1) return;
    const product = products.find((p) => p.id === formData.productId);
    if (!product) return;

    if (formData.type === 'salida' && formData.quantity > product.stock) {
      setFormError(`Stock insuficiente. Disponible: ${product.stock} unidades.`);
      return;
    }
    if (formData.type === 'ajuste' && !formData.justification.trim()) {
      setFormError('La justificacion es obligatoria para ajustes de inventario.');
      return;
    }

    const result = addMovement({
      date: new Date().toISOString().split('T')[0],
      productId: product.id,
      productName: product.name,
      type: formData.type,
      quantity: formData.quantity,
      responsible: formData.responsible || profile?.full_name || 'Usuario actual',
      note: formData.note,
      justification: formData.justification,
      comprobante: formData.comprobante,
    });

    if (!result.success) {
      setFormError(result.error || 'Error al registrar movimiento.');
      return;
    }
    setShowForm(false);
    setFormData({ productId: '', type: 'entrada', quantity: 1, responsible: '', note: '', justification: '', comprobante: '' });
  }

  function generateReplenishment() {
    const items = Object.entries(replenishItems)
      .filter(([, qty]) => qty > 0)
      .map(([pid, qty]) => {
        const p = products.find((pr) => pr.id === pid)!;
        return { productId: pid, productName: p.name, quantity: qty, price: p.price };
      });
    if (items.length === 0) return;
    const result = createReplenishment(items, replenishSupplier, replenishNote);
    if (result.requiresApproval) {
      setReplenishResult(`Solicitud de $${items.reduce((s, i) => s + i.quantity * i.price, 0).toFixed(2)} creada. Supera el umbral de $${config.approvalThreshold} - requiere aprobacion del Gerente.`);
    } else {
      setReplenishResult(`Solicitud de $${items.reduce((s, i) => s + i.quantity * i.price, 0).toFixed(2)} enviada por correo al proveedor ${replenishSupplier}.`);
    }
    setReplenishItems({});
    setTimeout(() => { setReplenishResult(''); setShowReplenish(false); }, 4000);
  }

  function openReplenishFromAlert() {
    const initial: Record<string, number> = {};
    criticalProducts.forEach((p) => {
      initial[p.id] = p.reorderPoint - p.stock + p.minStock;
    });
    setReplenishItems(initial);
    setShowReplenish(true);
  }

  function openReorderModal(p: Product) {
    setShowReorderModal(p);
    setReorderQty(p.reorderPoint - p.stock + p.minStock);
  }

  function applyReorder() {
    if (!showReorderModal) return;
    updateProduct(showReorderModal.id, { reorderPoint: reorderQty });
    setShowReorderModal(null);
  }

  const totalStock = products.reduce((s, p) => s + p.stock, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Package} label="Stock Total" value={totalStock} sublabel="unidades en bodega" color="bg-ice-100 text-ice-600" />
        <KpiCard icon={AlertTriangle} label="Alertas Criticas" value={criticalProducts.length} sublabel="productos bajo reorden" color="bg-red-100 text-red-600" />
        <KpiCard icon={Truck} label="Por Despachar" value={confirmedOrders.length} sublabel="pedidos confirmados" color="bg-amber-100 text-amber-600" />
        <KpiCard icon={FileText} label="Movimientos Kardex" value={movements.length} sublabel="registros totales" color="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Critical Alerts */}
      {criticalProducts.length > 0 && (
        <div className="card overflow-hidden border-l-4 border-l-red-500">
          <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-display text-base font-semibold text-red-800">
                Alertas de Stock Critico ({criticalProducts.length})
              </h3>
            </div>
            <button onClick={openReplenishFromAlert} className="btn-danger text-xs">
              <Truck className="h-3.5 w-3.5" /> Generar Solicitud de Compra
            </button>
          </div>
          <div className="divide-y divide-frost-100">
            {criticalProducts.map((p) => {
              const urgency = p.stock < p.reorderPoint / 2 ? 'critical' : 'warning';
              const deficit = p.reorderPoint - p.stock;
              return (
                <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${urgency === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-frost-800">{p.name}</p>
                      <p className="text-xs text-frost-400">{p.sku} | Lote: {p.batch}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-frost-400">Actual / Reorden</p>
                      <p className="text-sm">
                        <span className={`font-bold ${urgency === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>{p.stock}</span>
                        <span className="text-frost-400"> / {p.reorderPoint}</span>
                      </p>
                    </div>
                    <span className={`badge ${urgency === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      Faltan {deficit} u.
                    </span>
                    <button onClick={() => openReorderModal(p)} className="btn-secondary text-xs" title="Ajustar punto de reorden">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dispatch Console */}
      {confirmedOrders.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
            <Truck className="h-5 w-5 text-amber-600" />
            <h3 className="font-display text-base font-semibold text-frost-800">Consola de Despacho</h3>
            <span className="ml-auto badge bg-amber-100 text-amber-700">{confirmedOrders.length} por despachar</span>
          </div>
          <div className="divide-y divide-frost-50">
            {confirmedOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-frost-700">Pedido #{o.id.slice(-4)}</p>
                    {o.clientName && <span className="text-xs text-frost-400">- {o.clientName}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {o.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm text-frost-500">
                        <span>{item.productName}</span>
                        <span>{item.quantity} u.</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ice-600">${o.total.toFixed(2)}</p>
                  <button onClick={() => dispatchOrder(o.id)} className="btn-success text-xs mt-1">
                    <Check className="h-3.5 w-3.5" /> Marcar Despachado
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Replenishment requests */}
      {replenishments.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
            <Truck className="h-5 w-5 text-ice-600" />
            <h3 className="font-display text-base font-semibold text-frost-800">Solicitudes de Reabastecimiento</h3>
          </div>
          <div className="divide-y divide-frost-50">
            {replenishments.map((r) => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-frost-700">Solicitud #{r.id.slice(-4)}</p>
                      <span className={`badge ${
                        r.status === 'pendiente_aprobacion' ? 'bg-amber-100 text-amber-700' :
                        r.status === 'enviada' ? 'bg-ice-100 text-ice-700' :
                        r.status === 'en_transito' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.status === 'pendiente_aprobacion' && <Clock className="h-3 w-3" />}
                        {r.status === 'enviada' && <Mail className="h-3 w-3" />}
                        {r.status === 'en_transito' && <Truck className="h-3 w-3" />}
                        {r.status === 'pendiente_aprobacion' ? 'Pendiente aprobacion' :
                         r.status === 'enviada' ? 'Enviada al proveedor' :
                         r.status === 'en_transito' ? 'En transito' : 'Recibida'}
                      </span>
                    </div>
                    <p className="text-xs text-frost-400 mb-1">{r.supplier} | {r.createdAt} | {r.createdBy}</p>
                    <div className="space-y-0.5">
                      {r.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm text-frost-500">
                          <span>{item.productName}</span>
                          <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-sm font-bold text-ice-600">Total: ${r.total.toFixed(2)}</p>
                  </div>
                  {r.status === 'enviada' && (
                    <button onClick={() => updateReplenishmentStatus(r.id, 'en_transito' as ReplenishmentStatus)} className="btn-secondary text-xs">
                      <Truck className="h-3.5 w-3.5" /> Marcar en transito
                    </button>
                  )}
                  {r.status === 'en_transito' && (
                    <button onClick={() => updateReplenishmentStatus(r.id, 'recibida' as ReplenishmentStatus)} className="btn-success text-xs">
                      <Check className="h-3.5 w-3.5" /> Marcar recibida
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-frost-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-ice-600" />
            <h3 className="font-display text-base font-semibold text-frost-800">Catalogo de Productos</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-frost-400" />
              <input className="input-field pl-9 py-2 text-sm" placeholder="Buscar por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-field py-2 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'Todas' : c}</option>)}
            </select>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Movimiento
            </button>
            <button onClick={() => setShowReplenish(true)} className="btn-secondary">
              <Truck className="h-4 w-4" /> Reabastecer
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-frost-100 bg-frost-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Categoria</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-frost-400">Precio</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-frost-400">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-frost-400">Reorden</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-frost-400">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-frost-400">ABC</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-frost-400">Activo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-frost-50">
              {filteredProducts.map((p) => {
                const status = getStockStatus(p);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-frost-50">
                    <td className="px-4 py-3 text-sm font-medium text-frost-600">{p.sku}</td>
                    <td className="px-4 py-3 text-sm font-medium text-frost-700">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-frost-500">{p.category}</td>
                    <td className="px-4 py-3 text-right text-sm text-frost-600">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-frost-700">{p.stock}</td>
                    <td className="px-4 py-3 text-right text-sm text-frost-500">{p.reorderPoint}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${
                        status === 'critico' ? 'bg-red-100 text-red-700' :
                        status === 'sin_configurar' ? 'bg-frost-100 text-frost-500' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {status === 'critico' ? 'Critico' : status === 'sin_configurar' ? 'Sin configurar' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${
                        p.abcClass === 'A' ? 'bg-ice-100 text-ice-700' :
                        p.abcClass === 'B' ? 'bg-amber-100 text-amber-700' :
                        'bg-frost-100 text-frost-500'
                      }`}>Clase {p.abcClass}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleProductActive(p.id)} className={`relative h-6 w-11 rounded-full transition-colors ${p.isActive ? 'bg-emerald-500' : 'bg-frost-300'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${p.isActive ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kardex History */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
          <FileText className="h-5 w-5 text-ice-600" />
          <h3 className="font-display text-base font-semibold text-frost-800">Kardex - Historial de Movimientos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-frost-100 bg-frost-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-frost-400">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-frost-400">Saldo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Responsable</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-frost-50">
              {movements.slice(0, 20).map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-frost-50">
                  <td className="px-4 py-3 text-sm text-frost-500">{m.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-frost-700">{m.productName}</td>
                  <td className="px-4 py-3">
                    {m.type === 'entrada' ? (
                      <span className="badge bg-emerald-100 text-emerald-700"><ArrowUpCircle className="h-3 w-3" /> Entrada</span>
                    ) : m.type === 'salida' ? (
                      <span className="badge bg-red-100 text-red-700"><ArrowDownCircle className="h-3 w-3" /> Salida</span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700"><Settings2 className="h-3 w-3" /> Ajuste</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-frost-700">{m.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm text-frost-600">{m.saldoResultante ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-frost-600">{m.responsible}</td>
                  <td className="px-4 py-3 text-sm text-frost-400">
                    {m.note || m.justification || '-'}
                    {m.comprobante && <span className="ml-1 text-frost-500">({m.comprobante})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md mx-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
                <h3 className="font-display text-base font-semibold text-frost-800">Registrar Movimiento Kardex</h3>
                <button onClick={() => setShowForm(false)} className="text-frost-400 hover:text-frost-700"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Producto</label>
                  <select className="input-field" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} required>
                    <option value="">Seleccionar producto...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Tipo de Movimiento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['entrada', 'salida', 'ajuste'] as MovementType[]).map((t) => (
                      <button key={t} type="button" onClick={() => setFormData({ ...formData, type: t })}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-sm font-semibold transition-all ${
                          formData.type === t ?
                            t === 'entrada' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                            t === 'salida' ? 'border-red-500 bg-red-50 text-red-700' :
                            'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-frost-200 text-frost-500 hover:border-frost-300'
                        }`}>
                        {t === 'entrada' ? <ArrowUpCircle className="h-4 w-4" /> : t === 'salida' ? <ArrowDownCircle className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                        {t === 'entrada' ? 'Entrada' : t === 'salida' ? 'Salida' : 'Ajuste'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">
                    {formData.type === 'ajuste' ? 'Nuevo Saldo' : 'Cantidad'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setFormData({ ...formData, quantity: Math.max(formData.type === 'ajuste' ? 0 : 1, formData.quantity - 1) })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-frost-200 text-frost-500 hover:bg-frost-50"><Minus className="h-4 w-4" /></button>
                    <input type="number" className="input-field text-center" value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Math.max(formData.type === 'ajuste' ? 0 : 1, parseInt(e.target.value) || 1) })}
                      min={formData.type === 'ajuste' ? 0 : 1} required />
                    <button type="button" onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-frost-200 text-frost-500 hover:bg-frost-50"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                {formData.type === 'entrada' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-frost-600">Guia de Remision / Comprobante</label>
                    <input className="input-field" value={formData.comprobante} onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })} placeholder="Ej. GR-2026-050" />
                  </div>
                )}
                {formData.type === 'ajuste' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-frost-600">Justificacion (obligatoria)</label>
                    <input className="input-field" value={formData.justification} onChange={(e) => setFormData({ ...formData, justification: e.target.value })} placeholder="Motivo del ajuste..." required />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Responsable</label>
                  <input className="input-field" value={formData.responsible} onChange={(e) => setFormData({ ...formData, responsible: e.target.value })} placeholder="Nombre del responsable..." />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Nota (opcional)</label>
                  <input className="input-field" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Detalle del movimiento..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                  <button type="submit" className="btn-primary flex-1 justify-center"><Check className="h-4 w-4" /> Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Replenishment Modal */}
      {showReplenish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg mx-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
                <h3 className="font-display text-base font-semibold text-frost-800">Solicitud de Reabastecimiento</h3>
                <button onClick={() => setShowReplenish(false)} className="text-frost-400 hover:text-frost-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                {replenishResult && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{replenishResult}</div>}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Proveedor</label>
                  <input className="input-field" value={replenishSupplier} onChange={(e) => setReplenishSupplier(e.target.value)} placeholder="Nombre del proveedor..." />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Productos a solicitar</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-xl border border-frost-200 p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-frost-700 truncate">{p.name}</p>
                          <p className="text-xs text-frost-400">Stock: {p.stock} | ${p.price.toFixed(2)}</p>
                        </div>
                        <input type="number" min={0} className="w-16 rounded-lg border border-frost-200 px-2 py-1 text-center text-sm" value={replenishItems[p.id] ?? 0}
                          onChange={(e) => setReplenishItems((prev) => ({ ...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Nota (opcional)</label>
                  <input className="input-field" value={replenishNote} onChange={(e) => setReplenishNote(e.target.value)} placeholder="Motivo de la solicitud..." />
                </div>
                <div className="flex justify-between border-t border-frost-100 pt-3">
                  <span className="text-sm text-frost-500">Umbral de aprobacion: <strong className="text-frost-700">${config.approvalThreshold}</strong></span>
                  <span className="text-sm font-bold text-ice-600">
                    Total: ${Object.entries(replenishItems).reduce((s, [pid, qty]) => {
                      const p = products.find((pr) => pr.id === pid);
                      return s + (p ? qty * p.price : 0);
                    }, 0).toFixed(2)}
                  </span>
                </div>
                <button onClick={generateReplenishment} className="btn-primary w-full justify-center">
                  <Truck className="h-4 w-4" /> Generar Solicitud
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Point Modal */}
      {showReorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm mx-4 animate-slide-up">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
                <h3 className="font-display text-base font-semibold text-frost-800">Ajustar Punto de Reorden</h3>
                <button onClick={() => setShowReorderModal(null)} className="text-frost-400 hover:text-frost-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-frost-600">{showReorderModal.name} ({showReorderModal.sku})</p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-frost-600">Nuevo punto de reorden</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setReorderQty(Math.max(0, reorderQty - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-frost-200 text-frost-500 hover:bg-frost-50"><Minus className="h-4 w-4" /></button>
                    <input type="number" className="input-field text-center" value={reorderQty} onChange={(e) => setReorderQty(Math.max(0, parseInt(e.target.value) || 0))} min={0} />
                    <button type="button" onClick={() => setReorderQty(reorderQty + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-frost-200 text-frost-500 hover:bg-frost-50"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <button onClick={applyReorder} className="btn-primary w-full justify-center"><Check className="h-4 w-4" /> Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
