import { useEffect, useState } from 'react';
import {
  Store, Image as ImageIcon, ImagePlus, Phone, Save, Loader2, RotateCcw,
  Type, Sparkles, Check,
} from 'lucide-react';
import type { StoreSettings } from '@/types';
import { supabase } from '@/lib/supabase';
import { saveSettings, resetSettings } from '@/lib/settingsStore';

interface SettingsTabProps {
  settings: StoreSettings;
  onSettingsChange: (settings: StoreSettings) => void;
}

export default function SettingsTab({ settings, onSettingsChange }: SettingsTabProps) {
  const [storeName, setStoreName] = useState(settings.store_name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [logoType, setLogoType] = useState<'icon' | 'image'>(settings.logo_type);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStoreName(settings.store_name);
    setTagline(settings.tagline);
    setLogoType(settings.logo_type);
    setLogoUrl(settings.logo_url);
    setWhatsappNumber(settings.whatsapp_number);
  }, [settings]);

  const handleUpload = async (file: File) => {
    setUploadError(null);
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('La imagen es muy grande. Máximo 4MB.');
      return;
    }
    setUploading(true);
    try {
      const filePath = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop() || 'png'}`;
      const { error: upErr } = await supabase.storage.from('reviews').upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw new Error('No se pudo subir el logo. Intentá de nuevo.');
      const { data: pub } = supabase.storage.from('reviews').getPublicUrl(filePath);
      setLogoUrl(pub.publicUrl);
      setLogoType('image');
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Error al subir el logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    setError(null);
    const trimmedName = storeName.trim();
    if (!trimmedName) return setError('El nombre del local es obligatorio.');
    const trimmedPhone = whatsappNumber.replace(/\D/g, '');
    if (!trimmedPhone) return setError('El número de WhatsApp es obligatorio.');

    const updated: StoreSettings = {
      ...settings,
      store_name: trimmedName,
      tagline: tagline.trim(),
      logo_type: logoType,
      logo_url: logoUrl.trim(),
      whatsapp_number: trimmedPhone,
    };
    saveSettings(updated);
    onSettingsChange(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (!confirm('¿Restaurar la configuración a los valores originales?')) return;
    const original = resetSettings();
    onSettingsChange(original);
    setStoreName(original.store_name);
    setTagline(original.tagline);
    setLogoType(original.logo_type);
    setLogoUrl(original.logo_url);
    setWhatsappNumber(original.whatsapp_number);
  };

  const inputCls = 'w-full rounded-xl border border-purple-500/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-brand-purple/50 focus:outline-none';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Branding card */}
      <div className="rounded-2xl border border-purple-500/25 bg-slate-900/60 backdrop-blur-md p-5">
        <h3 className="flex items-center gap-2 font-display text-lg tracking-wide text-white text-glow-purple">
          <Store className="h-5 w-5 text-brand-purple-light" /> Identidad del Local
        </h3>
        <p className="mt-1 text-xs text-slate-400">Estos datos aparecen en el encabezado, el banner y el pie de página.</p>

        <div className="mt-5 space-y-4">
          {/* Store name */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Type className="h-3.5 w-3.5" /> Nombre del local
            </label>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputCls} placeholder="Ej: Universo 22" />
          </div>

          {/* Tagline */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Sparkles className="h-3.5 w-3.5" /> Subtítulo / Eslogan
            </label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} placeholder="Ej: Sabor de otro planeta" />
          </div>

          {/* Logo */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ImageIcon className="h-3.5 w-3.5" /> Logo
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLogoType('icon')}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  logoType === 'icon' ? 'border-brand-purple bg-brand-purple/15 text-brand-purple-light' : 'border-purple-500/20 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Ícono (Cohete)
              </button>
              <button
                onClick={() => setLogoType('image')}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  logoType === 'image' ? 'border-brand-purple bg-brand-purple/15 text-brand-purple-light' : 'border-purple-500/20 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Imagen propia
              </button>
            </div>

            {logoType === 'image' && (
              <div className="mt-3 flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-purple-500/20 bg-white/5">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-600" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://... (URL del logo)"
                    className={inputCls}
                  />
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500/25 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-brand-purple/50 hover:bg-white/10">
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</>
                    ) : (
                      <><ImagePlus className="h-4 w-4" /> Subir logo</>
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
            )}
          </div>
        </div>
      </div>

      {/* Contact card */}
      <div className="rounded-2xl border border-purple-500/25 bg-slate-900/60 backdrop-blur-md p-5">
        <h3 className="flex items-center gap-2 font-display text-lg tracking-wide text-white text-glow-purple">
          <Phone className="h-5 w-5 text-brand-purple-light" /> Contacto y Pedidos
        </h3>
        <p className="mt-1 text-xs text-slate-400">Número de WhatsApp al que se envían los pedidos confirmados.</p>
        <div className="mt-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Phone className="h-3.5 w-3.5" /> Número de WhatsApp
          </label>
          <input
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className={inputCls}
            placeholder="Ej: 573001112233 (código de país + número)"
            inputMode="numeric"
          />
          <p className="mt-1 text-xs text-slate-500">Incluye el código de país sin signos. Ej: 57 para Colombia.</p>
        </div>
      </div>

      {error && <p className="rounded-lg bg-brand-red/15 px-3 py-2 text-xs text-brand-red-light">{error}</p>}
      {saved && (
        <p className="animate-slide-up rounded-lg bg-green-500/15 px-3 py-2 text-xs text-green-300">
          ¡Configuración guardada! Los cambios ya se ven en toda la tienda.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-full border border-purple-500/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
        >
          <RotateCcw className="h-4 w-4" /> Restaurar
        </button>
        <button
          onClick={handleSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-purple to-brand-indigo px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-purple/30 transition hover:scale-[1.02] active:scale-95"
        >
          {saved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          {saved ? '¡Guardado!' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}
