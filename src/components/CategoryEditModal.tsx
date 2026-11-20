import { useEffect, useState } from 'react';
import { X, FolderTree, Save } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryEditModalProps {
  category: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
}

export default function CategoryEditModal({ category, onSave, onClose }: CategoryEditModalProps) {
  const isNew = category === null;
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleSave = () => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) return setError('El nombre es obligatorio.');
    const cleanSlug = (slug.trim() || trimmedName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!cleanSlug) return setError('No se pudo generar un identificador válido.');

    onSave({
      id: category?.id ?? crypto.randomUUID(),
      name: trimmedName,
      slug: cleanSlug,
      sort_order: Number(sortOrder) || 0,
    });
  };

  const inputCls = 'w-full rounded-xl border border-purple-500/25 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-brand-mustard/50 focus:outline-none';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md animate-slide-up rounded-t-3xl border border-purple-500/25 bg-base-900 p-6 sm:animate-scale-in sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-white">
            <FolderTree className="h-6 w-6 text-brand-mustard" /> {isNew ? 'Nueva Categoría' : 'Editar Categoría'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Combos"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Identificador (URL)
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="combos"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-slate-500">Se genera automáticamente si lo dejas vacío.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Orden de aparición
            </label>
            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="1"
              className={inputCls}
            />
          </div>

          {error && <p className="rounded-lg bg-brand-red/15 px-3 py-2 text-xs text-brand-red-light">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-mustard to-brand-mustard-dark text-sm font-bold text-base-950 transition hover:scale-[1.02] active:scale-95"
            >
              <Save className="h-4 w-4" /> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
