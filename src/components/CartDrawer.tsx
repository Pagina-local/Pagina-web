import { useEffect } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCOP, calculateCartSubtotal } from '@/lib/utils';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  deliveryFee: number;
}

export default function CartDrawer({ open, onClose, onCheckout, deliveryFee }: CartDrawerProps) {
  const { items, removeItem, updateQuantity } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const subtotal = calculateCartSubtotal(items);
  const total = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in-right flex-col border-l border-white/10 bg-base-900 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-white">
            <ShoppingBag className="h-6 w-6 text-brand-mustard" /> Tu Pedido
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <ShoppingBag className="h-9 w-9 text-slate-500" />
            </div>
            <p className="mt-4 font-semibold text-white">Tu carrito está vacío</p>
            <p className="mt-1 text-sm text-slate-400">Agregá productos del menú para empezar tu pedido.</p>
            <button
              onClick={onClose}
              className="mt-5 rounded-full bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver menú
            </button>
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.lineId} className="animate-fade-in rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex gap-3">
                      <img src={item.image_url} alt={item.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="truncate text-sm font-semibold text-white">{item.name}</h4>
                          <button
                            onClick={() => removeItem(item.lineId)}
                            className="shrink-0 text-slate-500 transition hover:text-brand-red-light"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {item.variation && (
                          <p className="mt-0.5 text-xs text-slate-400">Tamaño: {item.variation.name}</p>
                        )}
                        {Object.keys(item.extras).length > 0 && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            Adic: {Object.values(item.extras).map((e) => `${e.name}${e.quantity > 1 ? ` x${e.quantity}` : ''}`).join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-0.5 text-xs italic text-slate-500">"{item.notes}"</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-white/10 bg-base-950">
                            <button
                              onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-brand-mustard-light">
                            {formatCOP(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Summary + checkout */}
            <div className="shrink-0 space-y-3 border-t border-white/10 bg-base-950/80 px-5 py-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-medium text-white">{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Domicilio</span>
                  <span className="font-medium text-white">{formatCOP(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-brand-mustard-light">{formatCOP(total)}</span>
                </div>
              </div>
              <button
                onClick={onCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/30 transition hover:scale-[1.02] active:scale-95"
              >
                <ShoppingCart className="h-5 w-5" />
                Continuar al Pago
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
