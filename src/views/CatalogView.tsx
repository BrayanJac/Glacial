import { useState } from 'react';
import {
  Box, ShoppingCart, Search, Plus, Minus, Trash2, Send, Check,
  Package, Clock, X, FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Product } from '../types';
import Viewer3DModal from '../components/Viewer3DModal';

export default function CatalogView() {
  const { products, draftCart, addToDraftCart, removeFromDraftCart, clearDraftCart, addOrder, orders, updateOrderStatus, role } = useApp();
  const [selected3D, setSelected3D] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  const isVendedor = role === 'vendedor';
  const isCliente = role === 'cliente';

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.flavor.toLowerCase().includes(search.toLowerCase()),
  );

  const cartTotal = draftCart.reduce((s, i) => s + i.quantity * i.price, 0);
  const cartCount = draftCart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Search + Cart bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-frost-400" />
          <input
            className="input-field pl-10"
            placeholder="Buscar helados por nombre o sabor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {isVendedor && (
            <>
              <button
                onClick={() => setShowOrders(true)}
                className="btn-secondary relative"
              >
                <FileText className="h-4 w-4" />
                Pedidos
                {orders.filter(o => o.status === 'pendiente').length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {orders.filter(o => o.status === 'pendiente').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="btn-primary relative"
              >
                <ShoppingCart className="h-4 w-4" />
                Borrador
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((p) => {
          const isLow = p.stock < p.minStock;
          return (
            <div key={p.id} className="card card-hover overflow-hidden group">
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-frost-100">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className={`badge ${
                    isLow ? 'bg-red-500 text-white' : 'bg-white/90 text-emerald-700'
                  }`}>
                    {isLow ? (
                      <><Clock className="h-3 w-3" /> Bajo stock</>
                    ) : (
                      <><Package className="h-3 w-3" /> {p.stock} disp.</>
                    )}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="badge bg-white/90 text-ice-700">{p.size}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-display text-sm font-semibold text-frost-800 leading-snug">{p.name}</h3>
                <p className="mt-0.5 text-xs text-frost-400">Sabor: {p.flavor}</p>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-frost-400">Precio</p>
                    <p className="font-display text-lg font-bold text-ice-600">${p.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-frost-400">Stock</p>
                    <p className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                      {p.stock} / min. {p.minStock}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelected3D(p)}
                    className="btn-secondary flex-1 justify-center text-xs"
                  >
                    <Box className="h-3.5 w-3.5" />
                    Ver en 3D / RA
                  </button>
                </div>

                {isVendedor && (
                  <button
                    onClick={() => addToDraftCart(p.id, 1)}
                    className="btn-primary mt-2 w-full justify-center"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar al borrador
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-frost-400">No se encontraron productos con "{search}".</p>
        </div>
      )}

      {/* 3D Modal */}
      {selected3D && (
        <Viewer3DModal
          product={selected3D}
          onClose={() => setSelected3D(null)}
          onAddToCart={(id) => addToDraftCart(id, 1)}
          showAddToCart={isVendedor}
        />
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="h-full w-full max-w-md animate-slide-in-right bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-ice-600" />
                <h3 className="font-display text-base font-semibold text-frost-800">Borrador de Pedido</h3>
              </div>
              <button onClick={() => setShowCart(false)} className="text-frost-400 hover:text-frost-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {draftCart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-frost-400">
                  <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">El borrador esta vacio</p>
                  <p className="text-xs mt-1">Agrega productos del catalogo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {draftCart.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-frost-200 p-3">
                        {product && (
                          <img src={product.image} alt={item.productName} className="h-12 w-12 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-frost-700 truncate">{item.productName}</p>
                          <p className="text-xs text-frost-400">${item.price.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) addToDraftCart(item.productId, -1);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-frost-200 text-frost-500 hover:bg-frost-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-frost-700">{item.quantity}</span>
                          <button
                            onClick={() => addToDraftCart(item.productId, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-frost-200 text-frost-500 hover:bg-frost-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromDraftCart(item.productId)}
                          className="text-frost-300 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {draftCart.length > 0 && (
              <div className="border-t border-frost-200 p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-frost-500">Productos</span>
                  <span className="font-medium text-frost-700">{cartCount} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-display text-base font-semibold text-frost-800">Total</span>
                  <span className="font-display text-xl font-bold text-ice-600">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    addOrder(draftCart);
                    setShowCart(false);
                  }}
                  className="btn-primary w-full justify-center"
                >
                  <Send className="h-4 w-4" />
                  Enviar a aprobacion del Gerente
                </button>
                <button onClick={clearDraftCart} className="btn-secondary w-full justify-center text-xs">
                  Vaciar borrador
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrders && isVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg mx-4 animate-slide-up">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-frost-200 bg-ice-50 px-5 py-4">
                <h3 className="font-display text-base font-semibold text-frost-800">Pedidos Enviados</h3>
                <button onClick={() => setShowOrders(false)} className="text-frost-400 hover:text-frost-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-5 space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-frost-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-frost-700">Pedido #{o.id.slice(-4)}</p>
                      <span className={`badge ${
                        o.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                        o.status === 'aprobado' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'rechazado' ? 'bg-red-100 text-red-700' :
                        'bg-frost-100 text-frost-500'
                      }`}>
                        {o.status === 'pendiente' && <Clock className="h-3 w-3" />}
                        {o.status === 'aprobado' && <Check className="h-3 w-3" />}
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </div>
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
