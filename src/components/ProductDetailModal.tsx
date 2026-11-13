import { useEffect, useMemo, useState } from 'react';
import { X, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import type { Product, CartItem } from '@/types';
import { formatCOP, calculateUnitPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart();
  const [variationId, setVariationId] = useState<string | null>(null);
  const [extras, setExtras] = useState<Record<string, { name: string; price: number; quantity: number }>>({});
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setVariationId(product.variations[0]?.id ?? null);
      setExtras({});
      setNotes('');
      setQuantity(1);
      setAdded(false);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [product, onClose]);

  const variation = useMemo(
    () => product?.variations.find((v) => v.id === variationId) ?? null,
    [product, variationId],
  );

  const unitPrice = useMemo(
    () => (product ? calculateUnitPrice(product.base_price, variation, extras) : 0),
    [product, variation, extras],
  );

  if (!product) return null;

  const toggleExtra = (extra: { id: string; name: string; price: number }) => {
    setExtras((prev) => {
      const next = { ...prev };
      if (next[extra.id]) {
        delete next[extra.id];
      } else {
        next[extra.id] = { name: extra.name, price: extra.price, quantity: 1 };
      }
      return next;
    });
  };

  const setExtraQty = (extra: { id: string; name: string; price: number }, qty: number) => {
    setExtras((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[extra.id];
      } else {
        next[extra.id] = { name: extra.name, price: extra.price, quantity: qty };
      }
      return next;
    });
  };

  const handleAdd = () => {
    const item: CartItem = {
      lineId: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      image_url: product.image_url,
      basePrice: product.base_price,
      variation: variation ? { id: variation.id, name: variation.name, priceDelta: variation.priceDelta } : null,
      extras,
      notes: notes.trim(),
      quantity,
      unitPrice,
    };
    addItem(item);
    setAdded(true);
    setTimeout(() => onClose(), 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-purple-500/25 bg-base-900 sm:animate-scale-in sm:rounded-3xl">
        {/* Image */}
        <div className="relative h-48 shrink-0 overflow-hidden sm:h-64">
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-base-900 via-base-900/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (scroll) */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-3 sm:px-7">
          <h2 className="font-display text-3xl tracking-wide text-white">{product.name}</h2>
          <p className="mt-1.5 text-sm text-slate-400">{product.description}</p>

          {/* Variations */}
          {product.variations.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Elige un tamaño</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {product.variations.map((v) => {
                  const active = v.id === variationId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVariationId(v.id)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? 'border-brand-red bg-brand-red/15'
                          : 'border-purple-500/25 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm font-semibold text-white">{v.name}</span>
                      <span className={`text-xs font-bold ${active ? 'text-brand-mustard-light' : 'text-slate-400'}`}>
                        {v.priceDelta > 0 ? `+${formatCOP(v.priceDelta)}` : 'Base'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras */}
          {product.extras.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Adicionales</h3>
              <div className="space-y-2">
                {product.extras.map((extra) => {
                  const selected = !!extras[extra.id];
                  const qty = extras[extra.id]?.quantity ?? 0;
                  return (
                    <div
                      key={extra.id}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                        selected ? 'border-brand-mustard/40 bg-brand-mustard/10' : 'border-purple-500/25 bg-white/5'
                      }`}
                    >
                      <button onClick={() => toggleExtra(extra)} className="flex flex-1 items-center gap-3 text-left">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                            selected ? 'border-brand-mustard bg-brand-mustard text-base-950' : 'border-white/30'
                          }`}
                        >
                          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <span className="text-sm font-medium text-white">{extra.name}</span>
                        <span className="text-xs font-bold text-brand-mustard-light">+{formatCOP(extra.price)}</span>
                      </button>
                      {selected && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExtraQty(extra, qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-white">{qty}</span>
                          <button
                            onClick={() => setExtraQty(extra, qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Notas para la cocina</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej: sin cebolla, salsa aparte, término de la carne..."
              className="w-full resize-none rounded-xl border border-purple-500/25 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-brand-red/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-purple-500/25 bg-base-900/95 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full border border-white/15 bg-white/5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-base font-bold text-white">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={!product.available || added}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/30 transition hover:scale-[1.02] active:scale-95 disabled:from-brand-mustard disabled:to-brand-mustard-dark disabled:text-base-950"
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> ¡Agregado!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Agregar · {formatCOP(unitPrice * quantity)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
