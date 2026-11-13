import { useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Target, Package, AlertTriangle,
  Check, X, Clock, Shield, Settings2, Users, FileLock2, Calendar, Truck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ReplenishmentStatus, AuditLogEntry, GlobalConfig } from '../types';

type TabKey = 'dashboard' | 'aprobaciones' | 'usuarios' | 'auditoria' | 'config';

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'dashboard', label: 'Dashboard Estrategico', icon: BarChart3 },
  { key: 'aprobaciones', label: 'Aprobaciones', icon: Check },
  { key: 'usuarios', label: 'Gestion de Usuarios', icon: Users },
  { key: 'auditoria', label: 'Auditoria', icon: FileLock2 },
  { key: 'config', label: 'Configuracion', icon: Settings2 },
];

export default function GerenteView() {
  const {
    products, orders, replenishments, auditLogs, config, updateConfig,
    updateReplenishmentStatus, pendingReplenishments, criticalProducts,
  } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [dateRange, setDateRange] = useState('30');

  const classA = products.filter((p) => p.abcClass === 'A');
  const classB = products.filter((p) => p.abcClass === 'B');
  const classC = products.filter((p) => p.abcClass === 'C');
  const totalSold = products.reduce((s, p) => s + p.soldCount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pendiente');
  const preventiveOrders = orders.filter((o) => o.createdBy !== 'Sistema');
  const confirmedPreventive = orders.filter((o) => o.status === 'confirmado' || o.status === 'despachado');
  const effectiveness = preventiveOrders.length > 0
    ? Math.round((confirmedPreventive.length / preventiveOrders.length) * 100)
    : 100;
  const stockBreaks = products.filter((p) => p.stock === 0).length;
  const periodSales = products.reduce((s, p) => s + p.soldCount * p.price, 0);

  function renderDashboard() {
    const maxSold = Math.max(...products.map((p) => p.soldCount), 1);
    const sortedByRotation = [...products].sort((a, b) => b.soldCount - a.soldCount);
    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-frost-400">Efectividad Preventiva</p>
                <p className={`mt-1 font-display text-3xl font-bold ${effectiveness >= config.preventiveEffectivenessTarget ? 'text-emerald-600' : 'text-amber-600'}`}>{effectiveness}%</p>
                <p className="mt-0.5 text-xs text-frost-400">Meta: {config.preventiveEffectivenessTarget}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100"><Target className="h-6 w-6 text-emerald-600" /></div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-frost-400">Roturas de Stock</p>
                <p className={`mt-1 font-display text-3xl font-bold ${stockBreaks === 0 ? 'text-emerald-600' : 'text-red-600'}`}>{stockBreaks}</p>
                <p className="mt-0.5 text-xs text-frost-400">Meta: {config.stockBreakTarget}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-frost-400">Ventas del Periodo</p>
                <p className="mt-1 font-display text-3xl font-bold text-frost-800">${(periodSales / 1000).toFixed(1)}K</p>
                <p className="mt-0.5 text-xs text-frost-400">{totalSold} unidades vendidas</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ice-100"><TrendingUp className="h-6 w-6 text-ice-600" /></div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-frost-400">Ordenes Pendientes</p>
                <p className="mt-1 font-display text-3xl font-bold text-frost-800">{pendingOrders.length + pendingReplenishments.length}</p>
                <p className="mt-0.5 text-xs text-frost-400">{pendingOrders.length} pedidos + {pendingReplenishments.length} reabast.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100"><Clock className="h-6 w-6 text-amber-600" /></div>
            </div>
          </div>
        </div>

        {/* ABC Chart */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
            <BarChart3 className="h-5 w-5 text-ice-600" />
            <h3 className="font-display text-base font-semibold text-frost-800">Rotacion ABC de Productos</h3>
            <select className="ml-auto input-field py-1.5 text-sm w-auto" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="7">Ultimos 7 dias</option>
              <option value="30">Ultimos 30 dias</option>
              <option value="90">Ultimos 90 dias</option>
            </select>
          </div>
          {/* ABC Distribution bar */}
          <div className="p-5">
            <div className="mb-4 flex h-8 overflow-hidden rounded-lg">
              <div className="flex items-center justify-center bg-gradient-to-r from-ice-400 to-ice-600 text-xs font-bold text-white" style={{ width: `${(classA.length / products.length) * 100}%` }}>
                A ({classA.length})
              </div>
              <div className="flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-500 text-xs font-bold text-white" style={{ width: `${(classB.length / products.length) * 100}%` }}>
                B ({classB.length})
              </div>
              <div className="flex items-center justify-center bg-gradient-to-r from-frost-300 to-frost-400 text-xs font-bold text-white" style={{ width: `${(classC.length / products.length) * 100}%` }}>
                C ({classC.length})
              </div>
            </div>
            <div className="space-y-3">
              {sortedByRotation.map((p) => {
                const percentage = (p.soldCount / maxSold) * 100;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-44 shrink-0">
                      <p className="text-sm font-medium text-frost-700 truncate">{p.name}</p>
                      <p className="text-xs text-frost-400">{p.sku}</p>
                    </div>
                    <div className="flex-1">
                      <div className="relative h-7 rounded-lg bg-frost-100 overflow-hidden">
                        <div className={`h-full rounded-lg transition-all duration-700 ${
                          p.abcClass === 'A' ? 'bg-gradient-to-r from-ice-400 to-ice-600' :
                          p.abcClass === 'B' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          'bg-gradient-to-r from-frost-300 to-frost-400'
                        }`} style={{ width: `${percentage}%` }} />
                        <div className="absolute inset-0 flex items-center justify-between px-3">
                          <span className={`text-xs font-semibold ${p.abcClass === 'A' ? 'text-ice-700' : p.abcClass === 'B' ? 'text-amber-700' : 'text-frost-600'}`}>
                            Clase {p.abcClass}
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
        </div>

        {/* ABC Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5 border-l-4 border-l-ice-500">
            <div className="flex items-center gap-2 mb-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ice-100"><TrendingUp className="h-4 w-4 text-ice-600" /></div><h4 className="font-display font-semibold text-frost-800">Clase A - Alta Rotacion</h4></div>
            <p className="text-3xl font-bold text-ice-600">{classA.length}</p>
            <p className="text-sm text-frost-400">{classA.reduce((s, p) => s + p.soldCount, 0)} unidades vendidas</p>
          </div>
          <div className="card p-5 border-l-4 border-l-amber-400">
            <div className="flex items-center gap-2 mb-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100"><BarChart3 className="h-4 w-4 text-amber-600" /></div><h4 className="font-display font-semibold text-frost-800">Clase B - Media Rotacion</h4></div>
            <p className="text-3xl font-bold text-amber-600">{classB.length}</p>
            <p className="text-sm text-frost-400">{classB.reduce((s, p) => s + p.soldCount, 0)} unidades vendidas</p>
          </div>
          <div className="card p-5 border-l-4 border-l-frost-300">
            <div className="flex items-center gap-2 mb-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-frost-100"><TrendingDown className="h-4 w-4 text-frost-600" /></div><h4 className="font-display font-semibold text-frost-800">Clase C - Baja Rotacion</h4></div>
            <p className="text-3xl font-bold text-frost-500">{classC.length}</p>
            <p className="text-sm text-frost-400">{classC.reduce((s, p) => s + p.soldCount, 0)} unidades vendidas</p>
          </div>
        </div>
      </div>
    );
  }

  function renderAprobaciones() {
    return (
      <div className="space-y-6">
        {/* Order approvals */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
            <Package className="h-5 w-5 text-ice-600" />
            <h3 className="font-display text-base font-semibold text-frost-800">Aprobacion de Pedidos</h3>
            {pendingOrders.length > 0 && <span className="ml-auto badge bg-amber-100 text-amber-700">{pendingOrders.length} pendientes</span>}
          </div>
          <div className="divide-y divide-frost-50">
            {orders.map((o) => (
              <div key={o.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-frost-700">Pedido #{o.id.slice(-4)}</p>
                      <span className={`badge ${o.status === 'pendiente' ? 'bg-amber-100 text-amber-700' : o.status === 'aprobado' ? 'bg-emerald-100 text-emerald-700' : o.status === 'rechazado' ? 'bg-red-100 text-red-700' : 'bg-frost-100 text-frost-500'}`}>
                        {o.status === 'pendiente' && <Clock className="h-3 w-3" />}
                        {o.status === 'aprobado' && <Check className="h-3 w-3" />}
                        {o.status === 'rechazado' && <X className="h-3 w-3" />}
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-frost-400 mb-2">{o.createdAt} - {o.createdBy}{o.clientName && ` | Cliente: ${o.clientName}`}</p>
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
                      <button onClick={() => updateReplenishmentStatus(o.id, 'recibida' as ReplenishmentStatus)} className="btn-success text-xs"><Check className="h-3.5 w-3.5" /> Aprobar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Replenishment approvals */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
            <Truck className="h-5 w-5 text-ice-600" />
            <h3 className="font-display text-base font-semibold text-frost-800">Aprobacion de Reabastecimiento</h3>
            {pendingReplenishments.length > 0 && <span className="ml-auto badge bg-amber-100 text-amber-700">{pendingReplenishments.length} pendientes</span>}
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
                        {r.status === 'pendiente_aprobacion' ? 'Pendiente' : r.status === 'enviada' ? 'Enviada' : r.status === 'en_transito' ? 'En transito' : 'Recibida'}
                      </span>
                      {r.requiresApproval && <span className="badge bg-red-100 text-red-700">Requiere aprobacion (>${config.approvalThreshold})</span>}
                    </div>
                    <p className="text-xs text-frost-400 mb-2">{r.supplier} | {r.createdAt} | {r.createdBy}</p>
                    <div className="space-y-1">
                      {r.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm text-frost-500">
                          <span>{item.productName}</span>
                          <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-bold text-ice-600">Total: ${r.total.toFixed(2)}</p>
                  </div>
                  {r.status === 'pendiente_aprobacion' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => updateReplenishmentStatus(r.id, 'enviada' as ReplenishmentStatus)} className="btn-success text-xs"><Check className="h-3.5 w-3.5" /> Aprobar y enviar</button>
                      <button onClick={() => updateReplenishmentStatus(r.id, 'enviada' as ReplenishmentStatus)} className="btn-danger text-xs"><X className="h-3.5 w-3.5" /> Rechazar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {replenishments.length === 0 && <div className="px-5 py-12 text-center text-frost-400"><Truck className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No hay solicitudes de reabastecimiento.</p></div>}
          </div>
        </div>
      </div>
    );
  }

  function renderUsuarios() {
    return (
      <div className="space-y-6">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
            <Users className="h-5 w-5 text-ice-600" />
            <h3 className="font-display text-base font-semibold text-frost-800">Gestion de Usuarios</h3>
          </div>
          <div className="divide-y divide-frost-50">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ice-100 text-ice-700 font-bold">M</div>
                <div>
                  <p className="text-sm font-semibold text-frost-700">Marta Rivas</p>
                  <p className="text-xs text-frost-400">gerente@helados.test</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-ice-100 text-ice-700">Gerente</span>
                <span className="badge bg-emerald-100 text-emerald-700">Activo</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">C</div>
                <div>
                  <p className="text-sm font-semibold text-frost-700">Carlos Bodega</p>
                  <p className="text-xs text-frost-400">bodeguero@helados.test</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-amber-100 text-amber-700">Bodeguero</span>
                <button className="relative h-6 w-11 rounded-full bg-emerald-500"><span className="absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">A</div>
                <div>
                  <p className="text-sm font-semibold text-frost-700">Ana Torres</p>
                  <p className="text-xs text-frost-400">vendedor@helados.test</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-emerald-100 text-emerald-700">Vendedor</span>
                <button className="relative h-6 w-11 rounded-full bg-emerald-500"><span className="absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-frost-100 text-frost-600 font-bold">P</div>
                <div>
                  <p className="text-sm font-semibold text-frost-700">Pedro Leon</p>
                  <p className="text-xs text-frost-400">cliente@helados.test</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-frost-100 text-frost-600">Cliente</span>
                <button className="relative h-6 w-11 rounded-full bg-emerald-500"><span className="absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white" /></button>
              </div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-ice-600 mt-0.5" />
            <div>
              <h4 className="font-display text-sm font-semibold text-frost-800">Politica de Activacion</h4>
              <p className="mt-1 text-sm text-frost-500">No se permite desactivar al ultimo Gerente activo. Los usuarios desactivados pierden acceso al sistema pero sus registros se conservan.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderAuditoria() {
    return (
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <FileLock2 className="h-5 w-5 text-ice-600 mt-0.5" />
            <div>
              <h4 className="font-display text-sm font-semibold text-frost-800">Bitacora de Auditoria Inmutable</h4>
              <p className="mt-1 text-sm text-frost-500">Registro automatico de todos los cambios manuales de stock, modificaciones de punto de reorden y cambios de estado de usuarios. Solo lectura.</p>
            </div>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-frost-100 bg-frost-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Fecha/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Accion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Entidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Valor Anterior</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-frost-400">Valor Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-frost-50">
                {auditLogs.map((log: AuditLogEntry) => (
                  <tr key={log.id} className="transition-colors hover:bg-frost-50">
                    <td className="px-4 py-3 text-sm font-medium text-frost-700">{log.user}</td>
                    <td className="px-4 py-3 text-sm text-frost-500">{new Date(log.timestamp).toLocaleString('es')}</td>
                    <td className="px-4 py-3"><span className="badge bg-ice-100 text-ice-700">{log.action}</span></td>
                    <td className="px-4 py-3 text-sm text-frost-600">{log.entity}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{log.oldValue}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600">{log.newValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderConfig() {
    return <ConfigPanel config={config} onSave={updateConfig} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ice-600">Panel estrategico</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-frost-900">Gerencia de Operaciones</h2>
      </div>

      <div className="flex flex-wrap gap-1 rounded-2xl border border-frost-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-ice-600 text-white' : 'text-frost-600 hover:bg-frost-100'
              }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'aprobaciones' && renderAprobaciones()}
      {activeTab === 'usuarios' && renderUsuarios()}
      {activeTab === 'auditoria' && renderAuditoria()}
      {activeTab === 'config' && renderConfig()}
    </div>
  );
}

function ConfigPanel({ config, onSave }: { config: GlobalConfig; onSave: (updates: Partial<GlobalConfig>) => void }) {
  const [form, setForm] = useState(config);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-frost-200 px-5 py-4">
          <Settings2 className="h-5 w-5 text-ice-600" />
          <h3 className="font-display text-base font-semibold text-frost-800">Umbrales Globales</h3>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-frost-600">Monto de Aprobacion de Compras (USD)</label>
            <p className="mb-2 text-xs text-frost-400">Las solicitudes de reabastecimiento que superen este monto requieren aprobacion explicita del Gerente.</p>
            <input type="number" className="input-field" value={form.approvalThreshold} onChange={(e) => setForm({ ...form, approvalThreshold: parseInt(e.target.value) || 0 })} min={0} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-frost-600">Dias de Expiracion de Borradores</label>
            <p className="mb-2 text-xs text-frost-400">Los borradores de pedido expiran automaticamente despues de este numero de dias.</p>
            <input type="number" className="input-field" value={form.draftExpiryDays} onChange={(e) => setForm({ ...form, draftExpiryDays: parseInt(e.target.value) || 0 })} min={1} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-frost-600">Meta de Efectividad Preventiva (%)</label>
              <input type="number" className="input-field" value={form.preventiveEffectivenessTarget} onChange={(e) => setForm({ ...form, preventiveEffectivenessTarget: parseInt(e.target.value) || 0 })} min={0} max={100} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-frost-600">Meta de Roturas de Stock</label>
              <input type="number" className="input-field" value={form.stockBreakTarget} onChange={(e) => setForm({ ...form, stockBreakTarget: parseInt(e.target.value) || 0 })} min={0} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} className="btn-primary"><Check className="h-4 w-4" /> Guardar Configuracion</button>
            {saved && <span className="text-sm text-emerald-600 animate-fade-in">Configuracion guardada correctamente.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
