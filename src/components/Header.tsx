import { Menu, Search, ShoppingCart, Star, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onNavReviews: () => void;
  onNavMenu: () => void;
  onNavAdmin: () => void;
  storeName: string;
  tagline: string;
  logoUrl: string;
  logoType: 'icon' | 'image';
}

const navLinks = [
  { label: 'Combos', target: 'combos' },
  { label: 'Hamburguesas', target: 'hamburguesas' },
  { label: 'Salchipapas', target: 'salchipapas' },
  { label: 'Perros', target: 'perros-calientes' },
  { label: 'Bebidas', target: 'bebidas' },
  { label: 'Reseñas', target: 'reviews' },
];

export default function Header({
  cartCount,
  onCartClick,
  onSearch,
  searchQuery,
  onNavReviews,
  onNavMenu,
  onNavAdmin,
  storeName,
  tagline,
  logoUrl,
  logoType,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (target: string) => {
    if (target === 'reviews') {
      onNavReviews();
    } else {
      onNavMenu();
      const el = document.getElementById(`cat-${target}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-purple-500/25 bg-base-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
        {/* Logo */}
        <button onClick={() => onNavMenu()} className="flex shrink-0 items-center gap-2">
          {logoType === 'image' && logoUrl ? (
            <img src={logoUrl} alt={storeName} className="h-12 w-12 shrink-0 rounded-full object-contain" />
          ) : (
            <img src="/image.png" alt={storeName} className="h-12 w-12 shrink-0 rounded-full object-contain" />
          )}
          <div className="hidden sm:block text-left leading-none">
            <span className="text-glow-purple block font-display text-xl tracking-wider text-white">{storeName}</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-brand-mustard">{tagline}</span>
          </div>
        </button>

        {/* Search - desktop */}
        <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar hamburguesa, combo, bebida..."
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 transition focus:border-brand-red/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-red/20"
          />
        </div>

        {/* Nav links - desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => handleNav(link.target)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Admin + Cart */}
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button
            onClick={onNavAdmin}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white sm:block"
          >
            Admin
          </button>
          <button
            onClick={onCartClick}
            className="relative flex h-11 items-center gap-2 rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark px-4 text-sm font-semibold text-white shadow-lg shadow-brand-red/30 transition hover:scale-[1.03] hover:shadow-brand-red/50 active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] animate-bounce-in items-center justify-center rounded-full bg-brand-mustard px-1 text-xs font-bold text-base-950 shadow-md ring-2 ring-base-950">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search - mobile */}
      <div className="border-t border-white/5 px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-brand-red/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-slide-up border-t border-white/10 bg-base-900 px-4 py-3 lg:hidden">
          <nav className="grid grid-cols-2 gap-1">
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => handleNav(link.target)}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5"
              >
                {link.target === 'reviews' && <Star className="h-4 w-4 text-brand-mustard" />}
                {link.label}
              </button>
            ))}
            <button
              onClick={() => { onNavAdmin(); setMobileOpen(false); }}
              className="col-span-2 rounded-lg bg-white/5 px-3 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Panel de Administración
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
