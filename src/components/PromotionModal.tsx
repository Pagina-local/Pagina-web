import { useEffect } from 'react';
import { Check, Rocket, ShoppingCart, X } from 'lucide-react';
import type { Product, Promotion, CartItem } from '@/types';
import { formatCOP } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface PromotionModalProps {
  promotion: Promotion;
  product: Product;
  onClose: () => void;
  onAdded: () => void;
}

export default function PromotionModal({ promotion, product, onClose, onAdded }: PromotionModalProps) {
  const { addItem } = useCart();
  const imageUrl = promotion.imageUrl || product.image_url;
  const price = promotion.promotionalPrice > 0 ? promotion.promotionalPrice : product.base_price;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleAdd = () => {
    const item: CartItem = {
      lineId: `promotion-${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      image_url: imageUrl,
      basePrice: price,
      variation: null,
      extras: {},
      notes: 'Promoción estelar',
      quantity: 1,
      unitPrice: price,
    };
    addItem(item);
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="promotion-title">
      <div className="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-scale-in overflow-hidden rounded-3xl border border-purple-400/40 bg-base-900 shadow-2xl shadow-purple-950/60">
        <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-12 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative h-56 overflow-hidden sm:h-64">
          <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-base-900 via-base-900/20 to-transparent" />
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-brand-mustard/40 bg-base-950/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-mustard-light backdrop-blur-sm">
            <Rocket className="h-3.5 w-3.5" /> Oferta Estelar
          </div>
          <button onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/75" aria-label="Cerrar promoción">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative px-5 pb-6 pt-4 sm:px-7 sm:pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-mustard">Recomendación del Comandante</p>
          <h2 id="promotion-title" className="mt-2 font-display text-3xl tracking-wide text-white sm:text-4xl">{promotion.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{promotion.description}</p>
          <div className="mt-5 flex items-end justify-between gap-4 rounded-2xl border border-purple-400/20 bg-white/5 p-4">
            <div><p className="text-xs uppercase tracking-wider text-slate-400">Incluye</p><p className="mt-1 font-semibold text-white">{product.name}</p></div>
            <p className="text-2xl font-bold text-brand-mustard-light">{formatCOP(price)}</p>
          </div>
          <button onClick={handleAdd} disabled={!product.available} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/30 transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
            {product.available ? <><ShoppingCart className="h-5 w-5" /> ¡Agregar al Carrito / Pedir Ahora!</> : 'Producto agotado'}
          </button>
          <button onClick={onClose} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"><Check className="h-4 w-4" /> Continuar viendo el menú</button>
        </div>
      </div>
    </div>
  );
}
