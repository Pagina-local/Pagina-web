import { Home, Star, ShoppingCart, Package } from 'lucide-react';

interface BottomNavProps {
  cartCount: number;
  onMenu: () => void;
  onReviews: () => void;
  onCart: () => void;
  onAdmin: () => void;
}

export default function BottomNav({ cartCount, onMenu, onReviews, onCart, onAdmin }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-base-950/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        <NavBtn icon={Home} label="Menú" onClick={onMenu} />
        <NavBtn icon={Star} label="Reseñas" onClick={onReviews} />
        <button
          onClick={onCart}
          className="relative flex -mt-4 h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/40 transition active:scale-95"
          aria-label="Carrito"
        >
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-mustard px-1 text-xs font-bold text-base-950 ring-2 ring-base-950">
              {cartCount}
            </span>
          )}
        </button>
        <NavBtn icon={Package} label="Admin" onClick={onAdmin} />
        <NavBtn icon={ShoppingCart} label="Pedir" onClick={onCart} />
      </div>
    </nav>
  );
}

function NavBtn({ icon: Icon, label, onClick }: { icon: typeof Home; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-slate-400 transition active:scale-95 active:text-white"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
