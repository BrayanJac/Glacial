import { useMemo, useState } from 'react';
import { Bell, Check, CheckCheck, Filter, Package, ShoppingCart, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { NotificationCategory, NotificationItem } from '../types';

const categoryLabels: Record<NotificationCategory | 'todos', string> = { todos: 'Todas', stock: 'Stock', pedido: 'Pedidos', recompra: 'Recompra', sistema: 'Sistema' };

function iconFor(category: NotificationCategory) {
  if (category === 'stock') return Package;
  if (category === 'pedido') return ShoppingCart;
  if (category === 'recompra') return Sparkles;
  return Bell;
}

function timeLabel(date: string) {
  const hours = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 3600000));
  return hours < 24 ? `Hace ${hours} h` : `Hace ${Math.floor(hours / 24)} d`;
}

export default function NotificationsView() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [filter, setFilter] = useState<NotificationCategory | 'todos'>('todos');
  const filtered = useMemo(() => filter === 'todos' ? notifications : notifications.filter((item) => item.category === filter), [filter, notifications]);
  const unread = notifications.filter((item) => !item.is_read).length;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-ice-600">Centro de avisos</p><h2 className="mt-1 font-display text-3xl font-bold text-frost-900">Notificaciones</h2><p className="mt-2 text-sm text-frost-500">Mantente al día con el estado de tu operación.</p></div>
      <button onClick={markAllNotificationsRead} disabled={unread === 0} className="btn-secondary"><CheckCheck className="h-4 w-4" /> Marcar todas como leídas</button>
    </div>
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-frost-200 bg-white p-2 shadow-sm"><Filter className="ml-2 h-4 w-4 text-frost-400" />{(Object.keys(categoryLabels) as Array<NotificationCategory | 'todos'>).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${filter === item ? 'bg-ice-600 text-white' : 'text-frost-600 hover:bg-frost-100'}`}>{categoryLabels[item]}</button>)}</div>
    <div className="space-y-3">{filtered.map((item: NotificationItem) => { const Icon = iconFor(item.category); return <article key={item.id} className={`card flex gap-4 p-5 transition-all ${!item.is_read ? 'border-l-4 border-l-ice-500 bg-ice-50/30' : ''}`}><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.priority === 'alta' ? 'bg-red-100 text-red-600' : item.priority === 'media' ? 'bg-amber-100 text-amber-600' : 'bg-ice-100 text-ice-600'}`}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-frost-800">{item.title}</h3>{!item.is_read && <span className="badge bg-ice-100 text-ice-700">Nueva</span>}</div><p className="mt-1 text-sm leading-6 text-frost-500">{item.message}</p></div><span className="shrink-0 text-xs text-frost-400">{timeLabel(item.created_at)}</span></div><div className="mt-3 flex items-center justify-between"><span className={`badge ${item.priority === 'alta' ? 'bg-red-100 text-red-700' : item.priority === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-frost-100 text-frost-600'}`}>{item.priority === 'alta' ? 'Prioridad alta' : item.priority === 'media' ? 'Prioridad media' : 'Informativa'}</span>{!item.is_read ? <button onClick={() => markNotificationRead(item.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ice-700 hover:text-ice-900"><Check className="h-3.5 w-3.5" /> Marcar como leída</button> : <span className="inline-flex items-center gap-1.5 text-xs text-frost-400"><Check className="h-3.5 w-3.5" /> Leída</span>}</div></div></article> })}{filtered.length === 0 && <div className="card p-12 text-center"><X className="mx-auto h-10 w-10 text-frost-300" /><p className="mt-3 text-sm text-frost-500">No hay notificaciones en esta categoría.</p></div>}</div>
  </div>;
}
