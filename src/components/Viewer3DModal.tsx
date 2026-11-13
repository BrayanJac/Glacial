import { useState, Suspense } from 'react';
import { X, RotateCw, ZoomIn, Box, Smartphone } from 'lucide-react';
import type { Product } from '../types';
import Viewer3D from './Viewer3D';

interface Viewer3DModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart?: (productId: string) => void;
  showAddToCart?: boolean;
}

function getShape(size: string): 'tub' | 'cone' | 'bar' {
  if (size.includes('ml') && parseInt(size) <= 120) return 'bar';
  if (size.toLowerCase().includes('cono') || size.includes('120ml')) return 'cone';
  return 'tub';
}

export default function Viewer3DModal({
  product,
  onClose,
  onAddToCart,
  showAddToCart = false,
}: Viewer3DModalProps) {
  const [arMode, setArMode] = useState(false);
  const shape = getShape(product.size);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-frost-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl mx-4 animate-slide-up">
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-frost-200 bg-gradient-to-r from-ice-50 to-cream-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ice-100">
                <Box className="h-5 w-5 text-ice-600" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-frost-800">
                  Visor 3D / Realidad Aumentada
                </h3>
                <p className="text-sm text-frost-500">{product.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-frost-400 transition-colors hover:bg-frost-100 hover:text-frost-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
            {/* 3D Canvas */}
            <div className="relative h-[400px] bg-gradient-to-b from-ice-50 to-white lg:h-[500px]">
              {arMode ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-frost-900 to-frost-800 text-white">
                  <div className="relative">
                    <div className="absolute -inset-4 animate-pulse-slow rounded-full border-2 border-ice-400/30" />
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ice-500/20">
                      <Smartphone className="h-10 w-10 text-ice-300" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-ice-100 max-w-xs">
                    Apunta tu camara al espacio real para colocar el producto en Realidad Aumentada
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setArMode(false)}
                      className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      Volver a 3D
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-ice-300/60">Modo RA simulado (prototipo)</p>
                </div>
              ) : (
                <>
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-10 w-10 animate-spin-slow rounded-full border-4 border-ice-200 border-t-ice-600" />
                          <p className="text-sm text-frost-500">Cargando modelo 3D...</p>
                        </div>
                      </div>
                    }
                  >
                    <Viewer3D color={product.color} shape={shape} />
                  </Suspense>

                  {/* Controls hint */}
                  <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 text-xs text-frost-400">
                    <div className="flex items-center gap-2">
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Arrastra para rotar 360°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ZoomIn className="h-3.5 w-3.5" />
                      <span>Scroll para zoom</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar info */}
            <div className="border-l border-frost-200 bg-frost-50 p-5">
              <div className="space-y-4">
                <div>
                  <span className="badge bg-ice-100 text-ice-700">Producto</span>
                  <h4 className="mt-2 font-display text-base font-semibold text-frost-800">
                    {product.name}
                  </h4>
                  <p className="text-sm text-frost-500">Lote: {product.batch}</p>
                </div>

                <div className="space-y-2 border-t border-frost-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-frost-500">Sabor</span>
                    <span className="font-medium text-frost-700">{product.flavor}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-frost-500">Tamano</span>
                    <span className="font-medium text-frost-700">{product.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-frost-500">Precio</span>
                    <span className="font-semibold text-ice-600">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-frost-500">Stock</span>
                    <span
                      className={`badge ${
                        product.stock < product.minStock
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {product.stock} unidades
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-frost-200 pt-4">
                  <button
                    onClick={() => setArMode(!arMode)}
                    className="btn-primary w-full justify-center"
                  >
                    <Smartphone className="h-4 w-4" />
                    {arMode ? 'Volver a 3D' : 'Ver en RA (Espacio Real)'}
                  </button>
                  {showAddToCart && (
                    <button
                      onClick={() => {
                        onAddToCart?.(product.id);
                        onClose();
                      }}
                      className="btn-success w-full justify-center"
                    >
                      Agregar al borrador
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
