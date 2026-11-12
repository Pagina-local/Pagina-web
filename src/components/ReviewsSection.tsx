import { useEffect, useMemo, useState } from 'react';
import { Star, ImagePlus, X, Send, Loader2, Filter, ThumbsUp } from 'lucide-react';
import type { Review } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface ReviewsSectionProps {
  reviews: Review[];
  onNewReview: (review: Review) => void;
}

interface FormState {
  name: string;
  rating: number;
  comment: string;
  imageDataUrl: string | null;
}

const emptyForm: FormState = { name: '', rating: 0, comment: '', imageDataUrl: null };

function StarRow({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`transition ${onChange ? 'hover:scale-110' : 'cursor-default'}`}
          aria-label={`${n} estrellas`}
        >
          <Star
            className={`${dim} ${n <= value ? 'fill-brand-mustard text-brand-mustard' : 'text-slate-600'}`}
            strokeWidth={2}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ reviews, onNewReview }: ReviewsSectionProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const approvedReviews = useMemo(
    () => reviews.filter((r) => r.status === 'approved').sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [reviews],
  );

  const filtered = useMemo(
    () => (filter === 'all' ? approvedReviews : approvedReviews.filter((r) => r.rating === filter)),
    [approvedReviews, filter],
  );

  const avg = approvedReviews.length > 0
    ? approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length
    : 0;

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approvedReviews.forEach((r) => { counts[r.rating] = (counts[r.rating] ?? 0) + 1; });
    return counts;
  }, [approvedReviews]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [lightbox]);

  const handleFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setError(null);
    if (!form.name.trim()) return setError('Por favor escribí tu nombre.');
    if (form.rating === 0) return setError('Elegí una calificación de 1 a 5 estrellas.');
    if (!form.comment.trim()) return setError('Escribí un comentario sobre tu pedido.');

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (form.imageDataUrl) {
        const filePath = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error: upErr } = await supabase.storage.from('reviews').upload(filePath, dataUrlToBlob(form.imageDataUrl), {
          contentType: 'image/jpeg',
          upsert: false,
        });
        if (upErr) throw new Error('No se pudo subir la imagen. Intentá de nuevo.');
        const { data: pub } = supabase.storage.from('reviews').getPublicUrl(filePath);
        imageUrl = pub.publicUrl;
      }

      const { data, error: insErr } = await supabase
        .from('reviews')
        .insert({
          customer_name: form.name.trim(),
          rating: form.rating,
          comment: form.comment.trim(),
          image_url: imageUrl,
          status: 'approved',
        })
        .select()
        .single();

      if (insErr) throw insErr;
      onNewReview(data as Review);
      setForm(emptyForm);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error al enviar tu reseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-white sm:text-4xl">Reseñas de Clientes</h2>
          <p className="mt-1 text-sm text-slate-400">Lo que dicen quienes ya disfrutaron nuestro sabor.</p>
        </div>
      </div>

      {/* Rating summary */}
      <div className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-base-900 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center justify-center border-white/10 sm:border-r sm:pr-8">
          <span className="font-display text-6xl text-brand-mustard">{avg.toFixed(1)}</span>
          <StarRow value={Math.round(avg)} />
          <span className="mt-1 text-xs text-slate-400">{approvedReviews.length} reseñas</span>
        </div>
        <div className="space-y-2 sm:pl-4">
          {[5, 4, 3, 2, 1].map((n) => {
            const count = ratingCounts[n] ?? 0;
            const pct = approvedReviews.length ? (count / approvedReviews.length) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-3 text-xs">
                <span className="flex w-10 items-center gap-1 text-slate-400">
                  {n} <Star className="h-3 w-3 fill-brand-mustard text-brand-mustard" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-brand-mustard transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Form */}
        <div className="h-fit rounded-2xl border border-white/10 bg-base-900 p-6">
          <h3 className="flex items-center gap-2 font-display text-xl tracking-wide text-white">
            <ThumbsUp className="h-5 w-5 text-brand-mustard" /> Dejar una Reseña
          </h3>
          <p className="mt-1 text-xs text-slate-400">Contanos cómo estuvo tu pedido.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-red/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Calificación</label>
              <div
                onMouseLeave={() => setHoverRating(0)}
                className="flex gap-1.5"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: n }))}
                    onMouseEnter={() => setHoverRating(n)}
                    className="transition hover:scale-110"
                    aria-label={`${n} estrellas`}
                  >
                    <Star
                      className={`h-8 w-8 ${(hoverRating || form.rating) >= n ? 'fill-brand-mustard text-brand-mustard' : 'text-slate-600'}`}
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Comentario</label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                rows={3}
                placeholder="Contanos tu experiencia..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-red/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Foto del pedido (opcional)</label>
              {form.imageDataUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-white/10">
                  <img src={form.imageDataUrl} alt="Vista previa" className="h-32 w-full object-cover" />
                  <button
                    onClick={() => setForm((f) => ({ ...f, imageDataUrl: null }))}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-5 text-center transition hover:border-brand-mustard/50 hover:bg-white/10">
                  <ImagePlus className="h-7 w-7 text-slate-400" />
                  <span className="mt-2 text-xs text-slate-400">Subir foto (máx. 4MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </label>
              )}
            </div>

            {error && <p className="rounded-lg bg-brand-red/15 px-3 py-2 text-xs text-brand-red-light">{error}</p>}
            {success && (
              <p className="animate-slide-up rounded-lg bg-green-500/15 px-3 py-2 text-xs text-green-300">
                ¡Gracias! Tu reseña fue publicada.
              </p>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-mustard to-brand-mustard-dark px-5 py-3 text-sm font-bold text-base-950 shadow-lg shadow-brand-mustard/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publicar Reseña
            </button>
          </div>
        </div>

        {/* Reviews list + gallery */}
        <div>
          {/* Filter */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto">
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Filter className="h-4 w-4" /> Filtrar:
            </span>
            {(['all', 5, 4, 3, 2, 1] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? 'bg-brand-mustard text-base-950'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 5 ? '5 ★' : `${f} ★`}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-base-900 py-12 text-center text-sm text-slate-400">
              No hay reseñas con esta calificación todavía.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((r) => (
                <article key={r.id} className="animate-fade-in rounded-2xl border border-white/10 bg-base-900 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{r.customer_name}</p>
                      <StarRow value={r.rating} />
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{formatDate(r.created_at)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{r.comment}</p>
                  {r.image_url && (
                    <button
                      onClick={() => setLightbox(r.image_url)}
                      className="mt-3 overflow-hidden rounded-xl border border-white/10 transition hover:opacity-80"
                    >
                      <img src={r.image_url} alt="Foto del cliente" className="h-40 w-full object-cover" loading="lazy" />
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="Foto ampliada" className="max-h-[90vh] max-w-full rounded-2xl object-contain animate-scale-in" />
        </div>
      )}
    </section>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
