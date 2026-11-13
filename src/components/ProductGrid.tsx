import { SearchX } from 'lucide-react';
import type { Category, Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  onProductClick: (product: Product) => void;
}

export default function ProductGrid({ products, categories, searchQuery, onProductClick }: ProductGridProps) {
  const isSearching = searchQuery.trim().length > 0;
  const q = searchQuery.trim().toLowerCase();

  if (isSearching) {
    const filtered = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-purple-500/20 bg-slate-900/70 backdrop-blur-md py-16 text-center">
          <SearchX className="h-10 w-10 text-slate-500" />
          <p className="mt-3 font-semibold text-white">Sin resultados para "{searchQuery}"</p>
          <p className="mt-1 text-sm text-slate-400">Probá con otro nombre o categoría.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onClick={onProductClick} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {categories.map((cat) => {
        const items = products
          .filter((p) => p.category_id === cat.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        if (items.length === 0) return null;
        return (
          <section key={cat.id} id={`cat-${cat.slug}`} className="scroll-mt-32">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-display text-2xl tracking-wide text-white text-glow-purple sm:text-3xl">{cat.name}</h2>
              <span className="rounded-full bg-brand-purple/15 px-2.5 py-0.5 text-xs font-semibold text-brand-purple-light">
                {items.length}
              </span>
              <div className="ml-1 h-px flex-1 bg-gradient-to-r from-brand-purple/30 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} onClick={onProductClick} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
