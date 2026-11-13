import { useEffect, useMemo, useState } from 'react';
import {
  X, ArrowLeft, ArrowRight, Truck, Store, User, Phone, MapPin, Home, FileText,
  DollarSign, CreditCard, Smartphone, CheckCircle2, MessageCircle, Loader2,
} from 'lucide-react';
import type { CartItem, CheckoutDetails, DeliveryMode, PaymentMethod } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatCOP, calculateCartSubtotal } from '@/lib/utils';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  deliveryFee: number;
  whatsappNumber: string;
  onComplete: () => void;
}

const STEPS = ['Entrega', 'Tus datos', 'Pago', 'Confirmar'] as const;

const paymentLabels: Record<PaymentMethod, { label: string; icon: typeof DollarSign; hint: string }> = {
  efectivo: { label: 'Efectivo', icon: DollarSign, hint: 'Pagás al recibir el pedido' },
  transferencia: { label: 'Transferencia / Nequi / Daviplata', icon: Smartphone, hint: 'Transferís al recibir' },
  tarjeta: { label: 'Tarjeta al entregar', icon: CreditCard, hint: 'Datafono en el domicilio' },
};

export default function CheckoutModal({ open, onClose, deliveryFee, whatsappNumber, onComplete }: CheckoutModalProps) {
  const { items, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<CheckoutDetails>({
    deliveryMode: 'domicilio',
    name: '',
    phone: '',
    address: '',
    neighborhood: '',
    addressNotes: '',
    paymentMethod: 'efectivo',
    cashAmount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setErrors({});
      setSending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const subtotal = useMemo(() => calculateCartSubtotal(items), [items]);
  const isDelivery = details.deliveryMode === 'domicilio';
  const fee = isDelivery ? deliveryFee : 0;
  const total = subtotal + fee;

  if (!open) return null;

  const setField = <K extends keyof CheckoutDetails>(key: K, value: CheckoutDetails[K]) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!details.name.trim()) e.name = 'Requerido';
      if (!details.phone.trim()) e.phone = 'Requerido';
      if (isDelivery) {
        if (!details.address.trim()) e.address = 'Requerido';
        if (!details.neighborhood.trim()) e.neighborhood = 'Requerido';
      }
      if (details.paymentMethod === 'efectivo' && details.cashAmount.trim()) {
        const n = Number(details.cashAmount.replace(/[^\d]/g, ''));
        if (Number.isNaN(n) || n < total) e.cashAmount = 'Debe cubrir el total';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateStep(1)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const buildWhatsAppText = (): string => {
    const lines: string[] = [];
    lines.push('*NUEVO PEDIDO - UNIVERSO 22*');
    lines.push('');
    lines.push(`*Modalidad:* ${isDelivery ? 'Domicilio' : 'Recoger en local'}`);
    lines.push('');
    lines.push('*Detalle del pedido:*');
    items.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.name}${it.variation ? ` (${it.variation.name})` : ''} x${it.quantity} — ${formatCOP(it.unitPrice * it.quantity)}`);
      const extraList = Object.values(it.extras);
      if (extraList.length > 0) {
        lines.push(`   Adicionales: ${extraList.map((x) => `${x.name}${x.quantity > 1 ? ` x${x.quantity}` : ''}`).join(', ')}`);
      }
      if (it.notes) lines.push(`   Notas: ${it.notes}`);
    });
    lines.push('');
    lines.push(`*Subtotal:* ${formatCOP(subtotal)}`);
    if (isDelivery) lines.push(`*Domicilio:* ${formatCOP(deliveryFee)}`);
    lines.push(`*Total:* ${formatCOP(total)}`);
    lines.push('');
    lines.push('*Cliente:*');
    lines.push(`Nombre: ${details.name}`);
    lines.push(`Teléfono: ${details.phone}`);
    if (isDelivery) {
      lines.push(`Dirección: ${details.address}`);
      lines.push(`Barrio: ${details.neighborhood}`);
      if (details.addressNotes.trim()) lines.push(`Notas dirección: ${details.addressNotes}`);
    }
    lines.push('');
    const p = paymentLabels[details.paymentMethod];
    lines.push(`*Pago:* ${p.label}`);
    if (details.paymentMethod === 'efectivo' && details.cashAmount.trim()) {
      lines.push(`Paga con: $${details.cashAmount.replace(/[^\d]/g, '')}`);
    }
    return lines.join('\n');
  };

  const confirmOrder = () => {
    setSending(true);
    const text = encodeURIComponent(buildWhatsAppText());
    const phone = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, '_blank');
    clearCart();
    setSending(false);
    onComplete();
    onClose();
  };

  const inputCls = (key: string) =>
    `w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition focus:outline-none ${
      errors[key] ? 'border-brand-red/60' : 'border-purple-500/20 focus:border-brand-purple/50'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-purple-500/25 bg-base-900/95 backdrop-blur-xl sm:animate-scale-in sm:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-purple-500/25 px-5 py-4">
          <h2 className="font-display text-2xl tracking-wide text-white text-glow-purple">Finalizar Pedido</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="shrink-0 px-5 pt-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    i <= step ? 'bg-brand-red text-white' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`hidden text-xs font-medium sm:block ${i <= step ? 'text-white' : 'text-slate-500'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-gradient-to-r from-brand-purple to-brand-indigo' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">
          {step === 0 && (
            <div className="animate-fade-in space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">¿Cómo querés recibirlo?</h3>
              <DeliveryOption
                active={details.deliveryMode === 'domicilio'}
                onClick={() => setField('deliveryMode', 'domicilio' as DeliveryMode)}
                icon={Truck}
                title="A Domicilio"
                desc={`Entrega en tu dirección · ${formatCOP(deliveryFee)}`}
              />
              <DeliveryOption
                active={details.deliveryMode === 'recoger'}
                onClick={() => setField('deliveryMode', 'recoger' as DeliveryMode)}
                icon={Store}
                title="Recoger en Local"
                desc="Retirá tu pedido sin costo extra"
              />
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Tus datos de contacto</h3>
              <Field label="Nombre completo" icon={User} error={errors.name}>
                <input className={inputCls('name')} value={details.name} onChange={(e) => setField('name', e.target.value)} placeholder="Ej: Ana Martínez" />
              </Field>
              <Field label="Teléfono" icon={Phone} error={errors.phone}>
                <input className={inputCls('phone')} value={details.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="Ej: 300 123 4567" />
              </Field>
              {isDelivery && (
                <>
                  <Field label="Dirección de entrega" icon={MapPin} error={errors.address}>
                    <input className={inputCls('address')} value={details.address} onChange={(e) => setField('address', e.target.value)} placeholder="Calle 45 # 12-34" />
                  </Field>
                  <Field label="Barrio" icon={Home} error={errors.neighborhood}>
                    <input className={inputCls('neighborhood')} value={details.neighborhood} onChange={(e) => setField('neighborhood', e.target.value)} placeholder="Ej: Centro" />
                  </Field>
                  <Field label="Notas de dirección (opcional)" icon={FileText}>
                    <input className={inputCls('addressNotes')} value={details.addressNotes} onChange={(e) => setField('addressNotes', e.target.value)} placeholder="Ej: Casa azul, portería, referencia" />
                  </Field>
                </>
              )}

              <h3 className="pt-2 text-sm font-bold uppercase tracking-wider text-slate-400">Método de pago</h3>
              <div className="space-y-2">
                {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => {
                  const cfg = paymentLabels[method];
                  const Icon = cfg.icon;
                  const active = details.paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setField('paymentMethod', method)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        active ? 'border-brand-purple bg-brand-purple/15' : 'border-purple-500/20 bg-white/5 hover:border-brand-purple/40'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-brand-purple-light' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{cfg.label}</p>
                        <p className="text-xs text-slate-400">{cfg.hint}</p>
                      </div>
                      <span className={`h-4 w-4 rounded-full border-2 ${active ? 'border-brand-purple bg-brand-purple' : 'border-white/30'}`} />
                    </button>
                  );
                })}
              </div>
              {details.paymentMethod === 'efectivo' && (
                <Field label="¿Con cuánto vas a pagar? (para llevar cambio)" icon={DollarSign} error={errors.cashAmount}>
                  <input
                    className={inputCls('cashAmount')}
                    value={details.cashAmount}
                    onChange={(e) => setField('cashAmount', e.target.value)}
                    placeholder={`Ej: ${formatCOP(total)}`}
                    inputMode="numeric"
                  />
                </Field>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Resumen del pedido</h3>
              <div className="space-y-2 rounded-2xl border border-purple-500/20 bg-slate-900/50 backdrop-blur-md p-4">
                {items.map((it) => (
                  <div key={it.lineId} className="flex justify-between gap-2 text-sm">
                    <span className="text-slate-300">
                      {it.quantity}× {it.name}
                      {it.variation ? ` (${it.variation.name})` : ''}
                    </span>
                    <span className="shrink-0 font-medium text-white">{formatCOP(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 rounded-2xl border border-purple-500/20 bg-slate-900/50 backdrop-blur-md p-4 text-sm">
                <Row label="Subtotal" value={formatCOP(subtotal)} />
                {isDelivery && <Row label="Domicilio" value={formatCOP(deliveryFee)} />}
                <div className="my-1 h-px bg-purple-500/20" />
                <Row label="Total" value={formatCOP(total)} bold />
              </div>
              <div className="rounded-2xl border border-purple-500/20 bg-slate-900/50 backdrop-blur-md p-4 text-sm">
                <Row label="Modalidad" value={isDelivery ? 'Domicilio' : 'Recoger en local'} />
                <Row label="Nombre" value={details.name || '—'} />
                <Row label="Teléfono" value={details.phone || '—'} />
                {isDelivery && <Row label="Dirección" value={`${details.address || '—'}, ${details.neighborhood || '—'}`} />}
                <Row label="Pago" value={paymentLabels[details.paymentMethod].label} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in flex flex-col items-center py-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="mt-4 font-display text-2xl tracking-wide text-white text-glow-purple">¡Pedido listo!</h3>
              <p className="mt-2 max-w-xs text-sm text-slate-300">
                Al tocar el botón se abrirá WhatsApp con tu pedido listo para enviar. Confirmá el envío para que lo preparemos.
              </p>
              <div className="mt-4 w-full rounded-2xl border border-purple-500/20 bg-slate-900/50 backdrop-blur-md p-4 text-left text-sm">
                <Row label="Total a pagar" value={formatCOP(total)} bold />
                <Row label="Modalidad" value={isDelivery ? 'Domicilio' : 'Recoger en local'} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-purple-500/25 bg-base-950/80 px-5 py-4">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={back}
                className="flex h-12 items-center gap-1.5 rounded-full border border-purple-500/25 px-4 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" /> Atrás
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={next}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark px-5 text-sm font-bold text-white shadow-lg shadow-brand-red/30 transition hover:scale-[1.02] active:scale-95"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={confirmOrder}
                disabled={sending || items.length === 0}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-green-500 to-green-600 px-5 text-sm font-bold text-white shadow-lg shadow-green-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                Confirmar Pedido por WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryOption({
  active, onClick, icon: Icon, title, desc,
}: { active: boolean; onClick: () => void; icon: typeof Truck; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${
        active ? 'border-brand-purple bg-brand-purple/15' : 'border-purple-500/20 bg-white/5 hover:border-brand-purple/40'
      }`}
    >
      <Icon className={`h-6 w-6 ${active ? 'text-brand-purple-light' : 'text-slate-400'}`} />
      <div className="flex-1">
        <p className="font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <span className={`h-5 w-5 rounded-full border-2 ${active ? 'border-brand-purple bg-brand-purple' : 'border-white/30'}`} />
    </button>
  );
}

function Field({
  label, icon: Icon, error, children,
}: { label: string; icon: typeof User; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-brand-red-light">{error}</p>}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className={`${bold ? 'font-bold text-white' : 'text-slate-400'}`}>{label}</span>
      <span className={`${bold ? 'font-bold text-brand-mustard-light' : 'text-white'}`}>{value}</span>
    </div>
  );
}
