import { useEffect, useState } from 'react';
import { X, Save, ImagePlus, Loader2, Tag, DollarSign, FileText, FolderTree } from 'lucide-react';
import type { Product, Category } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatCOP } from '@/lib/utils';

interface ProductEditModalProps {
  product: Product | null;
  categories: Category[];
  onSave: (updated: Product) => void;
  onClose: () => void;
}

function emptyProduct(categoryId: string): Product {
  return {
    id: '',
    category_id: categoryId,
    name: '',
    description: '',
    base_price: 0,
    image_url: '',
    variations: [],
    extras: [],
    available: true,
    sort_order: 0,
  };
}

export default function ProductEditModal({ product, categories, onSave, onClose }: ProductEditModalProps) {
  const isNew = !product || !product.id;
  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(String(product?.base_price ?? '0'));
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? '');
  const [available, setAvailable] = useState(product?.available ?? true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleUpload = async (file: File) => {
    setUploadError(null);
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('La imagen es muy grande. Máximo 4MB.');
      return;
    }
    setUploading(true);
    try {
      const filePath = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop() || 'jpg'}`;
      const { error: upErr } = await supabase.storage.from('reviews').upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw new Error('No se pudo subir la imagen. Intentá de nuevo.');
      const { data: pub } = supabase.storage.from('reviews').getPublicUrl(filePath);
      setImageUrl(pub.publicUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) return setError('El nombre es obligatorio.');
    const numPrice = Number(price.replace(/[^\d]/g, ''));
    if (Number.isNaN(numPrice) || numPrice < 0) return setError('El precio no es válido.');
    if (!imageUrl.trim()) return setError('La imagen es obligatoria.');

    setSaving(true);
    const base = product ?? emptyProduct(categoryId);
    const payload = {
      ...base,
      name: trimmedName,
      base_price: numPrice,
      description: description.trim(),
      image_url: imageUrl.trim(),
      category_id: categoryId,
      available,
    };

    if (isNew) {
      const { data, error: dbErr } = await supabase
        .from('products')
        .insert({
          name: payload.name,
          description: payload.description,
          base_price: payload.base_price,
          image_url: payload.image_url,
          category_id: payload.category_id,
          available: payload.available,
          variations: [],
          extras: [],
        })
        .select('*')
        .maybeSingle();

      setSaving(false);
      if (dbErr || !data) return setError('No se pudo crear el producto. Intentá de nuevo.');
      onSave(data as Product);
    } else {
      const { error: dbErr } = await supabase
        .from('products')
        .update({
          name: payload.name,
          base_price: payload.base_price,
          description: payload.description,
          image_url: payload.image_url,
          category_id: payload.category_id,
          available: payload.available,
        })
        .eq('id', payload.id);

      setSaving(false);
      if (dbErr) return setError('No se pudo guardar. Intentá de nuevo.');
      onSave(payload);
    }
  };

  const inputCls = 'w-full rounded-xl border border-purple-500/25 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-brand-mustard/50 focus:outline-none';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-purple-500/25 bg-base-900 sm:animate-scale-in sm:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-purple-500/25 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-white">
            <Tag className="h-6 w-6 text-brand-mustard" /> {isNew ? 'Agregar Producto' : 'Editar Producto'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">
          {/* Image preview + upload */}
          <div className="mb-5">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ImagePlus className="h-3.5 w-3.5" /> Imagen
            </label>
            <div className="flex gap-3">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="h-24 w-24 shrink-0 rounded-xl border border-purple-500/25 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-purple-500/25 bg-white/5">
                  <ImagePlus className="h-6 w-6 text-slate-600" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (URL de la imagen)"
                  className={inputCls}
                />
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-brand-mustard/50 hover:bg-white/10">
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</>
                  ) : (
                    <><ImagePlus className="h-4 w-4" /> Subir imagen</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                  />
                </label>
                {uploadError && <p className="text-xs text-brand-red-light">{uploadError}</p>}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Tag className="h-3.5 w-3.5" /> Nombre del producto
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ej: Hamburguesa Supernova" />
          </div>

          {/* Price + Category */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <DollarSign className="h-3.5 w-3.5" /> Precio (COP)
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                inputMode="numeric"
                className={inputCls}
                placeholder="15000"
              />
              <p className="mt-1 text-xs text-slate-500">{formatCOP(Number(price.replace(/[^\d]/g, '')) || 0)}</p>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <FolderTree className="h-3.5 w-3.5" /> Categoría
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`${inputCls} cursor-pointer appearance-none`}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-base-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <FileText className="h-3.5 w-3.5" /> Descripción / Ingredientes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`resize-none ${inputCls}`}
              placeholder="Descripción del producto..."
            />
          </div>

          {/* Availability toggle */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Disponibilidad</label>
            <button
              type="button"
              onClick={() => setAvailable((v) => !v)}
              aria-pressed={available}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${available ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-slate-400'}`}
            >
              <span className={`relative h-5 w-9 rounded-full transition ${available ? 'bg-green-500' : 'bg-slate-600'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${available ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
              {available ? 'Disponible' : 'Agotado'}
            </button>
          </div>

          {error && <p className="mt-3 rounded-lg bg-brand-red/15 px-3 py-2 text-xs text-brand-red-light">{error}</p>}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-purple-500/25 bg-base-950/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex h-12 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-mustard to-brand-mustard-dark px-5 text-sm font-bold text-base-950 shadow-lg shadow-brand-mustard/20 transition hover:scale-[1.02] active:scale-95 disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? 'Guardando...' : isNew ? 'Crear Producto' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
