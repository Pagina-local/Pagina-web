import { useEffect, useMemo, useState } from 'react';
import {
  Lock, LogOut, Eye, EyeOff, Trash2, Star, Package, MessageSquare, Check, X, Search,
  Pencil, Loader2, Tag, Plus, FolderTree, AlertTriangle,
} from 'lucide-react';
import type { Product, Review, Category, Promotion } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatCOP, formatDate } from '@/lib/utils';
import { saveProductEdit, clearProductOverride } from '@/lib/productStore';
import ProductEditModal from './ProductEditModal';
import CategoryEditModal from './CategoryEditModal';
import PromotionTab from './PromotionTab';

interface AdminDashboardProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  reviews: Review[];
  promotion: Promotion;
  onProductsChange: (products: Product[]) => void;
  onCategoriesChange: (categories: Category[]) => void;
  onReviewsChange: (reviews: Review[]) => void;
  onPromotionChange: (promotion: Promotion) => void;
}

type Flash = { kind: 'success' | 'error'; text: string } | null;

export default function AdminDashboard({
  open, onClose, products, categories, reviews, promotion,
  onProductsChange, onCategoriesChange, onReviewsChange, onPromotionChange,
}: AdminDashboardProps) {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<'products' | 'categories' | 'reviews' | 'promotions'>('products');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | null | undefined>(undefined);
  const [flash, setFlash] = useState<Flash>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'product' | 'category'; item: Product | Category } | null>(null);

  // Restore an existing admin session (stays signed in across reloads)
  useEffect(() => {
    if (!isSupabaseConfigured || !open) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true);
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (open) {
      setAuthError(null);
      setTab('products');
      setSearch('');
      setEditingProduct(undefined);
      setEditingCategory(undefined);
      setFlash(null);
      setConfirmDelete(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && authed && !editingProduct && !editingCategory) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, authed, onClose, editingProduct, editingCategory]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (!open) return null;

  const showFlash = (kind: 'success' | 'error', text: string) => {
    setFlash({ kind, text });
    if (kind === 'success') setTimeout(() => setFlash(null), 4000);
  };

  const handleLogin = async () => {
    if (!isSupabaseConfigured) {
      setAuthError('La base de datos no está configurada en esta instalación.');
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) setAuthError(err.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : `No se pudo iniciar sesión: ${err.message}`);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    setAuthed(false);
    onClose();
  };

  const persistProductInsert = (created: Product) => {
    setBusy(created.id);
    supabase.from('products').insert({
      id: created.id,
      category_id: created.category_id,
      name: created.name,
      description: created.description,
      base_price: created.base_price,
      image_url: created.image_url,
      variations: created.variations,
      extras: created.extras,
      available: created.available,
      sort_order: created.sort_order,
    }).then(
      ({ error }) => {
        setBusy(null);
        if (error) {
          onProductsChange(products.filter((p) => p.id !== created.id));
          showFlash('error', `No se pudo crear el producto: ${error.message}`);
        } else {
          showFlash('success', `Producto "${created.name}" creado.`);
        }
      },
      (err: unknown) => {
        setBusy(null);
        onProductsChange(products.filter((p) => p.id !== created.id));
        const reason = err instanceof Error && err.message ? err.message : 'Error desconocido';
        showFlash('error', `No se pudo crear el producto: ${reason}`);
      },
    );
  };

  const handleSaveProduct = (updated: Product) => {
    setEditingProduct(undefined);
    const exists = products.some((p) => p.id === updated.id);
    if (exists) {
      saveProductEdit(updated);
      onProductsChange(products.map((p) => (p.id === updated.id ? updated : p)));
      setBusy(updated.id);
      supabase.from('products').update({
        name: updated.name,
        description: updated.description,
        base_price: updated.base_price,
        image_url: updated.image_url,
        category_id: updated.category_id,
        available: updated.available,
        variations: updated.variations,
        extras: updated.extras,
        sort_order: updated.sort_order,
      }).eq('id', updated.id).then(
        ({ error }) => {
          setBusy(null);
          if (error) showFlash('error', `Los cambios no se guardaron: ${error.message}`);
          else showFlash('success', `Producto "${updated.name}" actualizado.`);
        },
        (err: unknown) => {
          setBusy(null);
          const reason = err instanceof Error && err.message ? err.message : 'Error desconocido';
          showFlash('error', `Los cambios no se guardaron: ${reason}`);
        },
      );
    } else {
      onProductsChange([...products, updated]);
      persistProductInsert(updated);
    }
  };

  const toggleAvailability = (product: Product) => {
    const next = { ...product, available: !product.available };
    saveProductEdit(next);
    onProductsChange(products.map((p) => (p.id === next.id ? next : p)));
    setBusy(product.id);
    supabase.from('products').update({ available: next.available }).eq('id', product.id).then(
      ({ error }) => {
        setBusy(null);
        if (error) {
          saveProductEdit(product);
          onProductsChange(products.map((p) => (p.id === product.id ? product : p)));
          showFlash('error', `No se pudo actualizar la disponibilidad: ${error.message}`);
        }
      },
      (err: unknown) => {
        setBusy(null);
        saveProductEdit(product);
        onProductsChange(products.map((p) => (p.id === product.id ? product : p)));
        const reason = err instanceof Error && err.message ? err.message : 'Error desconocido';
        showFlash('error', `No se pudo actualizar la disponibilidad: ${reason}`);
      },
    );
  };

  const deleteProductConfirmed = (product: Product) => {
    setConfirmDelete(null);
    setBusy(product.id);
    const previous = products;
    onProductsChange(products.filter((p) => p.id !== product.id));
    supabase.from('products').delete().eq('id', product.id).then(
      ({ error }) => {
        setBusy(null);
        if (error) {
          onProductsChange(previous);
          showFlash('error', `No se pudo eliminar "${product.name}": ${error.message}`);
        } else {
          clearProductOverride(product.id);
          showFlash('success', `Producto "${product.name}" eliminado.`);
        }
      },
      (err: unknown) => {
        setBusy(null);
        onProductsChange(previous);
        const reason = err instanceof Error && err.message ? err.message : 'Error desconocido';
        showFlash('error', `No se pudo eliminar "${product.name}": ${reason}`);
      },
    );
  };

  const persistCategoryInsert = (created: Category) => {
    setBusy(created.id);
    supabase.from('categories').insert({
      id: created.id,
      name: created.name,
      slug: created.slug,
      sort_order: created.sort_order,
    }).then(
      ({ error }) => {
        setBusy(null);
        if (error) {
          onCategoriesChange(categories.filter((c) => c.id !== created.id));
          showFlash('error', `No se pudo crear la categoría: ${error.message}`);
        } else {
          showFlash('success', `Categoría "${created.name}" creada.`);
        }
      },
      (err: unknown) => {
        setBusy(null);
        onCategoriesChange(categories.filter((c) => c.id !== created.id));
        const reason = err instanceof Error && err.message ? err.message : 'Error desconocido';
        showFlash('error', `No se pudo crear la categoría: ${reason}`);
      },
    );
  };

  const handleSaveCategory = (updated: Category) => {
    setEditingCategory(undefined);
    const exists = categories.some((c) => c.id === updated.id);
    if (exists) {
      onCategoriesChange(categories.map((c) => (c.id === updated.id ? updated : c)));
      setBusy(updated.id);
      supabase.from('categories').update({
        name: updated.name,
        slug: updated.slug,
        sort_order: updated.sort_order,
      }).eq('id', updated.id).then(
        ({ error }) => {
          setBusy(null);
          if (error) showFlash('error', `No se pudo actualizar la categoría: ${error.message}`);
          else showFlash('success', `Categoría "${updated.name}" actualizada.`);
        },
        (err: unknown) => {
          setBusy(null);
          const reason = err instanceof Error && err.message ? err.message : 'Error desconocido';
          showFlash('error', `No se pudo actualizar la categoría: ${reason}`);
        },
      );
    } else {
      onCategoriesChange([...categories, updated]);
      persistCategoryInsert(updated);
    }
  };

  const deleteCategoryConfirmed = (category: Category) => {
    setConfirmDelete(null);
    setBusy(category.id);
    const previous = categories;
    onCategoriesChange(categories.filter((c) => c.id !== category.id));
    supabase.from('categories').delete().eq('id', category.id).then(
      ({ error }) => {
        setBusy(null);
        if (error) {
          onCategoriesChange(previous);
          showFlash('error', `No se pudo eliminar la categoría "${category.name}": ${error.message}`);
        } else {
          showFlash('success', `Categoría "${category.name}" eliminada.`);
        }
      },
      (err: unknown) => {
        setBusy(null);
        onCategoriesChange(previous);
        const reason = err instanceof Error && err.message ? err.message : 'Error desconocido';
        showFlash('error', `No se pudo eliminar la categoría "${category.name}": ${reason}`);
      },
    );
  };

  const setReviewStatus = async (id: string, status: 'approved' | 'hidden') => {
    setBusy(id);
    try {
      const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
      if (!error) {
        onReviewsChange(reviews.map((r) => (r.id === id ? { ...r, status } : r)));
        showFlash('success', status === 'approved' ? 'Reseña aprobada y visible.' : 'Reseña oculta.');
      } else {
        showFlash('error', `No se pudo actualizar la reseña: ${error.message}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const deleteReview = async (id: string) => {
    setBusy(id);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (!error) {
        onReviewsChange(reviews.filter((r) => r.id !== id));
        showFlash('success', 'Reseña eliminada.');
      } else {
        showFlash('error', `No se pudo eliminar la reseña: ${error.message}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';
  const confirmItem = confirmDelete?.item;
  const confirmLabel = confirmItem && 'base_price' in confirmItem ? confirmItem.name : confirmItem?.name ?? '';

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
            onClick={handleLogout}
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
            <p className="mt-1 text-center text-sm text-slate-400">
              Ingresá con tu cuenta de administrador para gestionar la tienda.
            </p>
            <div className="mt-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && !authBusy && handleLogin()}
                placeholder="Correo del administrador"
                autoComplete="email"
                className="w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none border-purple-500/25 focus:border-brand-mustard/50"
              />
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && !authBusy && handleLogin()}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    authError ? 'border-brand-red/60' : 'border-purple-500/25 focus:border-brand-mustard/50'
                  }`}
                />
                <button
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {authError && <p className="text-xs text-brand-red-light">{authError}</p>}
              <button
                onClick={handleLogin}
                disabled={authBusy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-mustard to-brand-mustard-dark px-5 py-3 text-sm font-bold text-base-950 transition hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              >
                {authBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Ingresar
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-full px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
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
          <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-purple-500/25 bg-base-900 p-1.5">
            <TabBtn active={tab === 'products'} onClick={() => setTab('products')} icon={Package} label={`Productos (${products.length})`} />
            <TabBtn active={tab === 'categories'} onClick={() => setTab('categories')} icon={FolderTree} label={`Categorías (${categories.length})`} />
            <TabBtn active={tab === 'reviews'} onClick={() => setTab('reviews')} icon={MessageSquare} label={`Reseñas (${reviews.length})`} />
            <TabBtn active={tab === 'promotions'} onClick={() => setTab('promotions')} icon={Tag} label="Promociones" />
          </div>

          {flash && (
            <p className={`mb-3 animate-slide-up rounded-xl px-4 py-2 text-xs ${
              flash.kind === 'success' ? 'bg-green-500/15 text-green-300' : 'bg-brand-red/15 text-brand-red-light'
            }`}>
              {flash.text}
            </p>
          )}

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
                  onClick={() => setEditingProduct(null)}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-mustard to-brand-mustard-dark px-4 py-2.5 text-sm font-bold text-base-950 transition hover:scale-[1.02] active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>

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
                      <button
                        onClick={() => setConfirmDelete({ kind: 'product', item: p })}
                        disabled={busy === p.id}
                        className="flex items-center gap-1.5 rounded-full bg-brand-red/15 px-3 py-2 text-xs font-bold text-brand-red-light transition hover:bg-brand-red/25 disabled:opacity-50"
                        aria-label={`Eliminar ${p.name}`}
                      >
                        {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'categories' && (
            <div className="animate-fade-in">
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-mustard to-brand-mustard-dark px-4 py-2.5 text-sm font-bold text-base-950 transition hover:scale-[1.02] active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>
              <div className="space-y-2">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-purple-500/25 bg-base-900 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-mustard/15">
                      <FolderTree className="h-5 w-5 text-brand-mustard" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{c.name}</p>
                      <p className="truncate text-xs text-slate-400">
                        /{c.slug} · {products.filter((p) => p.category_id === c.id).length} productos
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setEditingCategory(c)}
                        className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-mustard/15 hover:text-brand-mustard-light"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ kind: 'category', item: c })}
                        disabled={busy === c.id}
                        className="flex items-center gap-1.5 rounded-full bg-brand-red/15 px-3 py-2 text-xs font-bold text-brand-red-light transition hover:bg-brand-red/25 disabled:opacity-50"
                        aria-label={`Eliminar categoría ${c.name}`}
                      >
                        {busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'promotions' && (
            <PromotionTab promotion={promotion} products={products} onPromotionChange={onPromotionChange} />
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

      {/* Product edit / create modal (null = new product) */}
      {editingProduct !== undefined && (
        <ProductEditModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => setEditingProduct(undefined)}
        />
      )}

      {/* Category edit / create modal (null = new category) */}
      {editingCategory !== undefined && (
        <CategoryEditModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => setEditingCategory(undefined)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && confirmItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-3xl border border-purple-500/25 bg-base-900 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/15">
              <AlertTriangle className="h-7 w-7 text-brand-red-light" />
            </div>
            <h3 className="mt-4 font-display text-xl tracking-wide text-white">
              ¿Eliminar {confirmDelete.kind === 'product' ? 'producto' : 'categoría'}?
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Vas a eliminar "{confirmLabel}". Esta acción no se puede deshacer
              {confirmDelete.kind === 'category' ? ' y sus productos quedarán sin categoría.' : '.'}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-11 flex-1 rounded-full border border-white/15 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete.kind === 'product'
                  ? deleteProductConfirmed(confirmItem as Product)
                  : deleteCategoryConfirmed(confirmItem as Category)}
                className="h-11 flex-1 rounded-full bg-brand-red text-sm font-bold text-white transition hover:bg-brand-red-dark"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
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
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
