import type { Category } from '@/types';

interface CategoryTabsProps {
  categories: Category[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export default function CategoryTabs({ categories, activeSlug, onSelect }: CategoryTabsProps) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-y border-white/10 bg-base-950/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {categories.map((cat) => {
          const active = cat.slug === activeSlug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${
                active
                  ? 'bg-gradient-to-br from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/30'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
