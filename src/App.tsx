import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CartProvider, useCart } from '@/context/CartContext';
import { fallbackCategories } from '@/lib/fallbackData';
import { getMergedProducts } from '@/lib/productStore';
import { getMergedSettings } from '@/lib/settingsStore';
import type { Category, Product, Review, StoreSettings } from '@/types';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import CategoryTabs from '@/components/CategoryTabs';
import ProductGrid from '@/components/ProductGrid';
import ProductDetailModal from '@/components/ProductDetailModal';
import ReviewsSection from '@/components/ReviewsSection';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import AdminDashboard from '@/components/AdminDashboard';
import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';
import { Truck, Instagram, Facebook, Clock, MapPin, MessageCircle } from 'lucide-react';

function StoreApp() {
  const { totalItems } = useCart();
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [products, setProducts] = useState<Product[]>(getMergedProducts);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(getMergedSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSlug, setActiveSlug] = useState('combos');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes, revRes, setRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('products').select('*').order('sort_order'),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('store_settings').select('*').limit(1).maybeSingle(),
      ]);

      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;
      if (revRes.error) throw revRes.error;
      if (setRes.error) throw setRes.error;

      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data as Category[]);
      if (prodRes.data && prodRes.data.length > 0) {
        // Preserve local admin overrides on top of DB data
        const dbProducts = prodRes.data as Product[];
        const merged = getMergedProducts();
        const mergedById = new Map(merged.map((p) => [p.id, p]));
        setProducts(dbProducts.map((p) => mergedById.get(p.id) ?? p));
      }
      if (revRes.data) setReviews(revRes.data as Review[]);
      if (setRes.data) {
        // Preserve local admin overrides on top of DB settings
        const local = getMergedSettings();
        setSettings({ ...(setRes.data as StoreSettings), ...local });
      }
      setError(null);
    } catch (e) {
      // Keep fallback data; reviews just won't load from DB.
      setError(e instanceof Error ? e.message : 'No se pudo sincronizar con el servidor.');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync browser tab title with store name
  useEffect(() => {
    const name = settings?.store_name ?? 'Urban Bites';
    document.title = `${name} — Comida Rápida a Domicilio`;
  }, [settings?.store_name]);

  const scrollToMenu = useCallback(() => {
    setCartOpen(false);
    setAdminOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToReviews = useCallback(() => {
    setCartOpen(false);
    setAdminOpen(false);
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleCheckoutComplete = useCallback(() => {
    setToast('¡Pedido enviado por WhatsApp! Te contactaremos pronto.');
  }, []);

  const deliveryFee = settings?.delivery_fee ?? 5000;
  const whatsappNumber = settings?.whatsapp_number ?? '573001112233';

  return (
    <div className="min-h-screen bg-base-950 pb-20 lg:pb-0">
      <Header
        cartCount={totalItems}
        onCartClick={() => setCartOpen(true)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onNavReviews={scrollToReviews}
        onNavMenu={scrollToMenu}
        onNavAdmin={() => setAdminOpen(true)}
        storeName={settings?.store_name ?? 'URBAN BITES'}
        tagline={settings?.tagline ?? 'Fast & Furious Food'}
        logoUrl={settings?.logo_url ?? ''}
        logoType={settings?.logo_type ?? 'icon'}
      />

      <Hero
        promoTitle={settings?.promo_title ?? ''}
        promoSubtitle={settings?.promo_subtitle ?? ''}
        promoBadge={settings?.promo_badge ?? ''}
        onOrder={scrollToMenu}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <>
            <div className="mb-6">
              <CategoryTabs
                categories={categories}
                activeSlug={activeSlug}
                onSelect={(slug) => {
                  setActiveSlug(slug);
                  setSearchQuery('');
                  if (slug) {
                    requestAnimationFrame(() => {
                      document.getElementById(`cat-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                  }
                }}
              />
            </div>

            <ProductGrid
              products={products}
              categories={categories}
              searchQuery={searchQuery}
              onProductClick={setDetailProduct}
            />

            <div className="my-16 h-px bg-white/10" />

            <ReviewsSection
              reviews={reviews}
              onNewReview={(r) => setReviews((prev) => [r, ...prev])}
            />
          </>
        )}
      </main>

      <Footer settings={settings} />

      {/* Overlays */}
      <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
        deliveryFee={deliveryFee}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        deliveryFee={deliveryFee}
        whatsappNumber={whatsappNumber}
        onComplete={handleCheckoutComplete}
      />
      <AdminDashboard
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        products={products}
        categories={categories}
        reviews={reviews}
        settings={settings}
        onProductsChange={setProducts}
        onReviewsChange={setReviews}
        onSettingsChange={setSettings}
      />

      <BottomNav
        cartCount={totalItems}
        onMenu={scrollToMenu}
        onReviews={scrollToReviews}
        onCart={() => setCartOpen(true)}
        onAdmin={() => setAdminOpen(true)}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-base-900">
            <div className="aspect-square animate-pulse bg-white/5" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-full animate-pulse rounded bg-white/5" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-base-900 py-16 text-center">
      <p className="font-semibold text-white">No pudimos cargar el menú</p>
      <p className="mt-1 text-sm text-slate-400">{message}</p>
      <button
        onClick={onRetry}
        className="mt-5 rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
      >
        Reintentar
      </button>
    </div>
  );
}

function Footer({ settings }: { settings: StoreSettings | null }) {
  const storeName = settings?.store_name ?? 'URBAN BITES';
  const tagline = settings?.tagline ?? 'Fast & Furious Food';
  const logoUrl = settings?.logo_url ?? '';
  const logoType = settings?.logo_type ?? 'icon';
  return (
    <footer className="border-t border-white/10 bg-base-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              {logoType === 'image' && logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-red to-brand-red-dark">
                  <Truck className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-display text-xl tracking-wide text-white">{storeName}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-mustard">{tagline}</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-slate-400">
              Comida rápida urbana hecha con ingredientes frescos. Hamburguesas a la parrilla, salchipapas crujientes y combos para compartir.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white">Horario</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-mustard" /> Lun-Jue: 11am — 11pm</li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-mustard" /> Vie-Dom: 11am — 2am</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white">Ubicación</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-mustard" /> Cra 45 # 12-34, Centro</li>
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand-mustard" /> Domicilio a toda la ciudad</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <CartProvider>
      <StoreApp />
    </CartProvider>
  );
}
