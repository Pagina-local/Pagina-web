import { useEffect, useMemo, useState } from 'react';
import {
  Lock, LogOut, Eye, EyeOff, Trash2, Star, Package, MessageSquare, Check, X, Search,
  Pencil, Save, ImagePlus, RotateCcw, Loader2, Tag, DollarSign, FileText, FolderTree,
} from 'lucide-react';
import type { Product, Review, Category } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatCOP, formatDate } from '@/lib/utils';
import { saveProductEdit, resetAllOverrides } from '@/lib/productStore';
import ProductEditModal from './ProductEditModal';

interface AdminDashboardProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  reviews: Review[];
  onProductsChange: (products: Product[]) => void;
  onReviewsChange: (reviews: Review[]) => void;
}

const ADMIN_PASSWORD = 'UNIVERSO22*';

export default function AdminDashboard({
  open, onClose, products, categories, reviews, onProductsChange, onReviewsChange,
}: AdminDashboardProps) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [tab, setTab] = useState<'products' | 'reviews'>('products');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [resetFlash, setResetFlash] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setAuthError(false);
      setTab('products');
      setSearch('');
      setEditingProduct(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && authed && !editingProduct) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, authed, onClose, editingProduct]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (!open) return null;

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const applyProductUpdate = (updated: Product) => {
    saveProductEdit(updated);
    onProductsChange(products.map((p) => (p.id === updated.id ? updated : p)));
  };

  const toggleAvailability = (product: Product) => {
    setBusy(product.id);
    const next = { ...product, available: !product.available };
    applyProductUpdate(next);
    void supabase.from('products').update({ available: next.available }).eq('id', product.id)
      .then(() => setBusy(null));
  };

  const handleSaveEdit = (updated: Product) => {
    applyProductUpdate(updated);
    setEditingProduct(null);
  };

  const handleResetAll = () => {
    if (!confirm('¿Restaurar todos los productos a sus valores originales? Se perderán los cambios guardados localmente.')) return;
    const original = resetAllOverrides();
    onProductsChange(original);
    setResetFlash(true);
    setTimeout(() => setResetFlash(false), 2500);
  };

  const setReviewStatus = async (id: string, status: 'approved' | 'hidden') => {
    setBusy(id);
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
    setBusy(null);
    if (error) return;
    onReviewsChange(reviews.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const deleteReview = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña y su foto de forma permanente?')) return;
    setBusy(id);
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    setBusy(null);
    if (error) return;
    onReviewsChange(reviews.filter((r) => r.id !== id));
  };

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-base-950">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-purple-500/25 bg-base-950/95 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-mustard to-brand-mustard-dark text-base-950">
            <Package className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display text-xl tracking-wide text-white">Panel de Administración</h2>
            <p className="text-xs text-slate-400">UNIVERSO 22 — gestión de tienda</p>
          </div>
        </div>
        {authed && (
          <button
            onClick={() => { setAuthed(false); onClose(); }}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        )}
      </div>

      {!authed ? (
        /* Login */
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-5">
          <div className="w-full max-w-sm rounded-3xl border border-purple-500/25 bg-base-900 p-8 animate-scale-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mustard/15">
              <Lock className="h-7 w-7 text-brand-mustard" />
            </div>
            <h3 className="mt-4 text-center font-display text-2xl tracking-wide text-white">Acceso restringido</h3>
            <p className="mt-1 text-center text-sm text-slate-400">Ingresá la contraseña de administrador.</p>
            <div className="mt-6">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Contraseña"
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    authError ? 'border-brand-red/60' : 'border-purple-500/25 focus:border-brand-mustard/50'
                  }`}
                />
                <button
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {authError && <p className="mt-2 text-xs text-brand-red-light">Contraseña incorrecta.</p>}
              <p className="mt-2 text-xs text-slate-500">Demo: admin123</p>
              <button
                onClick={handleLogin}
                className="mt-4 w-full rounded-full bg-gradient-to-br from-brand-mustard to-brand-mustard-dark px-5 py-3 text-sm font-bold text-base-950 transition hover:scale-[1.02] active:scale-95"
              >
                Ingresar
              </button>
              <button
                onClick={onClose}
                className="mt-2 w-full rounded-full px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
              >
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dashboard */
        <div className="mx-auto max-w-5xl px-5 py-6">
          {/* Tabs */}
          <div className="mb-6 flex gap-2 rounded-2xl border border-purple-500/25 bg-base-900 p-1.5">
            <TabBtn active={tab === 'products'} onClick={() => setTab('products')} icon={Package} label={`Productos (${products.length})`} />
            <TabBtn active={tab === 'reviews'} onClick={() => setTab('reviews')} icon={MessageSquare} label={`Reseñas (${reviews.length})`} />
          </div>

          {tab === 'products' && (
            <div className="animate-fade-in">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full rounded-xl border border-purple-500/25 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-mustard/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleResetAll}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-purple-500/25 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" /> Restaurar
                </button>
              </div>

              {resetFlash && (
                <p className="mb-3 animate-slide-up rounded-xl bg-green-500/15 px-4 py-2 text-xs text-green-300">
                  Productos restaurados a los valores originales.
                </p>
              )}

              <div className="space-y-2">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-purple-500/25 bg-base-900 p-3 sm:flex-nowrap">
                    <img src={p.image_url} alt={p.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{p.name}</p>
                      <p className="truncate text-xs text-slate-400">{categoryName(p.category_id)} · {formatCOP(p.base_price)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-mustard/15 hover:text-brand-mustard-light"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => toggleAvailability(p)}
                        disabled={busy === p.id}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                          p.available
                            ? 'bg-green-500/15 text-green-300 hover:bg-green-500/25'
                            : 'bg-brand-red/15 text-brand-red-light hover:bg-brand-red/25'
                        }`}
                      >
                        {p.available ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {p.available ? 'Disponible' : 'Agotado'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="animate-fade-in space-y-3">
              {reviews.length === 0 && (
                <p className="rounded-2xl border border-purple-500/25 bg-base-900 py-12 text-center text-sm text-slate-400">
                  No hay reseñas todavía.
                </p>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-purple-500/25 bg-base-900 p-4">
                  <div className="flex items-start gap-3">
                    {r.image_url && (
                      <img src={r.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{r.customer_name}</p>
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-brand-mustard text-brand-mustard" />
                          ))}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          r.status === 'approved' ? 'bg-green-500/15 text-green-300' : 'bg-slate-600/30 text-slate-300'
                        }`}>
                          {r.status === 'approved' ? 'Visible' : 'Oculta'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{r.comment}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setReviewStatus(r.id, 'approved')}
                      disabled={busy === r.id || r.status === 'approved'}
                      className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-300 transition hover:bg-green-500/25 disabled:opacity-40"
                    >
                      <Eye className="h-3.5 w-3.5" /> Aprobar
                    </button>
                    <button
                      onClick={() => setReviewStatus(r.id, 'hidden')}
                      disabled={busy === r.id || r.status === 'hidden'}
                      className="flex items-center gap-1.5 rounded-full bg-slate-600/30 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-600/50 disabled:opacity-40"
                    >
                      <EyeOff className="h-3.5 w-3.5" /> Ocultar
                    </button>
                    <button
                      onClick={() => deleteReview(r.id)}
                      disabled={busy === r.id}
                      className="flex items-center gap-1.5 rounded-full bg-brand-red/15 px-3 py-1.5 text-xs font-semibold text-brand-red-light transition hover:bg-brand-red/25 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveEdit}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

function TabBtn({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: typeof Package; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
        active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
