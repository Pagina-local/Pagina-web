import { useEffect, useState } from 'react';
import { X, Save, ImagePlus, Loader2, Tag, DollarSign, FileText, FolderTree } from 'lucide-react';
import type { Product, Category } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatCOP } from '@/lib/utils';

interface ProductEditModalProps {
  product: Product;
  categories: Category[];
  onSave: (updated: Product) => void;
  onClose: () => void;
}

export default function ProductEditModal({ product, categories, onSave, onClose }: ProductEditModalProps) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.base_price));
  const [description, setDescription] = useState(product.description);
  const [imageUrl, setImageUrl] = useState(product.image_url);
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = () => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) return setError('El nombre es obligatorio.');
    const numPrice = Number(price.replace(/[^\d]/g, ''));
    if (Number.isNaN(numPrice) || numPrice < 0) return setError('El precio no es válido.');
    if (!imageUrl.trim()) return setError('La imagen es obligatoria.');

    onSave({
      ...product,
      name: trimmedName,
      base_price: numPrice,
      description: description.trim(),
      image_url: imageUrl.trim(),
      category_id: categoryId,
    });
  };

  const inputCls = 'w-full rounded-xl border border-purple-500/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-brand-purple/50 focus:outline-none';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-purple-500/25 bg-slate-900/70 backdrop-blur-xl sm:animate-scale-in sm:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-purple-500/25 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-white text-glow-purple">
            <Tag className="h-6 w-6 text-brand-purple-light" /> Editar Producto
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
              <img
                src={imageUrl}
                alt="Vista previa"
                className="h-24 w-24 shrink-0 rounded-xl border border-purple-500/20 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
              />
              <div className="flex flex-1 flex-col gap-2">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (URL de la imagen)"
                  className={inputCls}
                />
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500/25 bg-white/5 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-brand-purple/50 hover:bg-white/10">
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
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ej: Hamburguesa Clásica" />
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
                placeholder="15900"
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
                  <option key={c.id} value={c.id} className="bg-base-950 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-2">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <FileText className="h-3.5 w-3.5" /> Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`resize-none ${inputCls}`}
              placeholder="Descripción del producto..."
            />
          </div>

          {error && <p className="mt-3 rounded-lg bg-brand-red/15 px-3 py-2 text-xs text-brand-red-light">{error}</p>}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-purple-500/25 bg-base-950/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex h-12 items-center rounded-full border border-purple-500/25 px-4 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-purple to-brand-indigo px-5 text-sm font-bold text-white shadow-lg shadow-brand-purple/30 transition hover:scale-[1.02] active:scale-95"
            >
              <Save className="h-5 w-5" /> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
