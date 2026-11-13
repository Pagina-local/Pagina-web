import { Plus } from 'lucide-react';
import type { Product } from '@/types';
import { formatCOP } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={() => onClick(product)}
      disabled={!product.available}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-purple-500/25 bg-slate-900/60 backdrop-blur-md text-left transition duration-300 hover:border-brand-purple/50 hover:shadow-2xl hover:shadow-purple-900/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        {product.variations.length > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {product.variations.length} tamaños
          </span>
        )}
        {!product.available && (
          <span className="absolute inset-0 flex items-center justify-center bg-base-950/70 text-sm font-bold uppercase tracking-wider text-slate-300">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-white">{product.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-400">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-lg bg-brand-mustard/15 px-2.5 py-1 text-sm font-bold text-brand-mustard-light">
            {formatCOP(product.base_price)}
          </span>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              product.available
                ? 'bg-gradient-to-br from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/30 group-hover:scale-110'
                : 'bg-white/10 text-slate-500'
            }`}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  );
}
