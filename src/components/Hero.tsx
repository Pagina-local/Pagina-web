import { ArrowRight, Clock, Rocket, Sparkles, Star } from 'lucide-react';

interface HeroProps {
  promoTitle: string;
  promoSubtitle: string;
  promoBadge: string;
  onOrder: () => void;
}

export default function Hero({ promoTitle, promoSubtitle, promoBadge, onOrder }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-purple-500/20">
      {/* Cosmic background */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/20881655/pexels-photo-20881655.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt=""
          className="h-full w-full object-cover opacity-25"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base-950 via-base-950/80 to-base-950/30" />
        <div className="absolute inset-0 bg-stars opacity-50" />
        <div className="absolute inset-0 bg-nebula" />
      </div>

      {/* Floating decorative stars */}
      <div className="pointer-events-none absolute right-[8%] top-[20%] hidden md:block">
        <Star className="h-6 w-6 fill-brand-mustard text-brand-mustard animate-twinkle" />
      </div>
      <div className="pointer-events-none absolute right-[22%] top-[60%] hidden md:block">
        <Star className="h-4 w-4 fill-brand-purple text-brand-purple animate-twinkle [animation-delay:1s]" />
      </div>
      <div className="pointer-events-none absolute right-[12%] bottom-[18%] hidden lg:block">
        <Rocket className="h-10 w-10 text-brand-purple-light/40 animate-float" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          {promoBadge && (
            <span className="inline-flex animate-bounce-in items-center gap-2 rounded-full bg-brand-purple/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-purple-light ring-1 ring-brand-purple/40">
              <Sparkles className="h-3.5 w-3.5" />
              {promoBadge}
            </span>
          )}
          <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-wide text-white text-glow-purple sm:text-6xl lg:text-7xl">
            {promoTitle || 'Sabor de otro planeta'}
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            {promoSubtitle || 'Comida cósmica entregada directamente a tu nave. Pedí por WhatsApp.'}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onOrder}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-red/30 transition hover:scale-[1.03] hover:shadow-brand-red/50 active:scale-95"
            >
              Pedir Ahora
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Rocket className="h-4 w-4 text-brand-mustard" />
                Domicilio intergaláctico
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
