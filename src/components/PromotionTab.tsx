import { useEffect, useState } from 'react';
import { Check, Image as ImageIcon, Save, Sparkles } from 'lucide-react';
import type { Product, Promotion } from '@/types';
import { formatCOP } from '@/lib/utils';
import { savePromotion } from '@/lib/promotionStore';

interface PromotionTabProps {
  promotion: Promotion;
  products: Product[];
  onPromotionChange: (promotion: Promotion) => void;
}

export default function PromotionTab({ promotion, products, onPromotionChange }: PromotionTabProps) {
  const [draft, setDraft] = useState(promotion);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(promotion), [promotion]);

  const selectedProduct = products.find((product) => product.id === draft.productId);
  const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-brand-mustard/50 focus:outline-none';

  const update = (patch: Partial<Promotion>) => setDraft((current) => ({ ...current, ...patch }));

  const handleSave = () => {
    const next: Promotion = {
      ...draft,
      title: draft.title.trim() || '¡Promo Estelar del Día!',
      description: draft.description.trim(),
      promotionalPrice: Math.max(0, Number(draft.promotionalPrice) || 0),
    };
    savePromotion(next);
    onPromotionChange(next);
    setDraft(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="rounded-2xl border border-purple-500/25 bg-base-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg tracking-wide text-white">
              <Sparkles className="h-5 w-5 text-brand-mustard" /> Promoción Estelar
            </h3>
            <p className="mt-1 text-xs text-slate-400">Controla la oferta que aparece al entrar a la tienda.</p>
          </div>
          <button
            type="button"
            onClick={() => update({ active: !draft.active })}
            aria-pressed={draft.active}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${
              draft.active ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-slate-400'
            }`}
          >
            <span className={`relative h-5 w-9 rounded-full transition ${draft.active ? 'bg-green-500' : 'bg-slate-600'}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${draft.active ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
            {draft.active ? 'Activa' : 'Inactiva'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Título</span>
            <input value={draft.title} onChange={(e) => update({ title: e.target.value })} className={inputClass} placeholder="¡Promo Estelar del Día!" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Descripción</span>
            <textarea value={draft.description} onChange={(e) => update({ description: e.target.value })} rows={3} className={`${inputClass} resize-none`} placeholder="Describe la oferta para tus clientes" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Precio promocional</span>
            <input type="number" min="0" step="100" value={draft.promotionalPrice} onChange={(e) => update({ promotionalPrice: Number(e.target.value) })} className={inputClass} />
            <span className="mt-1 block text-xs text-slate-500">Vista previa: {formatCOP(draft.promotionalPrice || 0)}</span>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Producto asociado</span>
            <select value={draft.productId} onChange={(e) => update({ productId: e.target.value })} className={inputClass}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-purple-500/25 bg-base-900 p-5">
        <h4 className="flex items-center gap-2 font-semibold text-white"><ImageIcon className="h-4 w-4 text-brand-mustard" /> Imagen de la promoción</h4>
        <p className="mt-1 text-xs text-slate-400">Puedes usar una imagen propia o la del producto asociado.</p>
        <input value={draft.imageUrl} onChange={(e) => update({ imageUrl: e.target.value })} className={`${inputClass} mt-4`} placeholder="https://... (opcional)" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {(draft.imageUrl || selectedProduct?.image_url) ? <img src={draft.imageUrl || selectedProduct?.image_url} alt="Vista previa de la promoción" className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center text-sm text-slate-500">Sin imagen</div>}
        </div>
      </div>

      <button type="button" onClick={handleSave} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-mustard to-brand-mustard-dark px-5 py-3 text-sm font-bold text-base-950 shadow-lg shadow-brand-mustard/20 transition hover:scale-[1.01] active:scale-95">
        {saved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
        {saved ? '¡Promoción guardada!' : 'Guardar Promoción'}
      </button>
    </div>
  );
}
