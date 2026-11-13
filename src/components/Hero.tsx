import { ArrowRight, Clock, Truck } from 'lucide-react';

interface HeroProps {
  promoTitle: string;
  promoSubtitle: string;
  promoBadge: string;
  onOrder: () => void;
}

export default function Hero({ promoTitle, promoSubtitle, promoBadge, onOrder }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-purple-500/25">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/18111567/pexels-photo-18111567.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt=""
          className="h-full w-full object-cover opacity-30"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base-950 via-base-950/85 to-base-950/40" />
        <div className="absolute inset-0 bg-nebula opacity-80" />
        <div className="absolute inset-0 bg-stars opacity-40" />
        <div className="animate-float absolute -right-24 top-1/2 hidden h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-purple/40 via-brand-indigo/20 to-brand-mustard/30 opacity-70 blur-2xl lg:block" />
        <div className="absolute right-24 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full border border-brand-purple/40 shadow-neon-purple lg:block" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          {promoBadge && (
            <span className="inline-flex animate-bounce-in items-center gap-2 rounded-full bg-brand-mustard/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-mustard-light ring-1 ring-brand-mustard/30">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-mustard" />
              {promoBadge}
            </span>
          )}
          <h1 className="text-glow-purple mt-5 font-display text-4xl leading-[1.05] tracking-wide text-white sm:text-6xl lg:text-7xl">
            {promoTitle || 'Comida rápida que enciende tu día'}
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            {promoSubtitle || 'Hamburguesas a la parrilla, salchipapas crujientes y combos para compartir. Pedí por WhatsApp y recibí en minutos.'}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onOrder}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark px-6 py-3.5 text-sm font-bold text-white shadow-neon-magenta transition hover:scale-[1.03] hover:shadow-[0_0_36px_-4px_rgba(217,70,239,0.8)] active:scale-95"
            >
              Pedir Ahora
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-brand-mustard" />
                Domicilio rápido
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-mustard" />
                Abierto hasta las 11pm
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
