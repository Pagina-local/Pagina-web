import type { Promotion } from '@/types';

const STORAGE_KEY = 'fastfood_promotion_v1';

export const defaultPromotion: Promotion = {
  active: true,
  title: '¡Promo Estelar del Día!',
  description: 'Una recomendación especial de la tripulación para disfrutar hoy.',
  promotionalPrice: 10200,
  imageUrl: '',
  productId: 'combo-1',
};

function loadPromotion(): Partial<Promotion> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as Partial<Promotion> : {};
  } catch {
    return {};
  }
}

export function getPromotion(): Promotion {
  return { ...defaultPromotion, ...loadPromotion() };
}

export function savePromotion(promotion: Promotion): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promotion));
  } catch {
    // ignore quota errors
  }
}
