import type { Product } from '@/types';
import { fallbackProducts } from './fallbackData';

const STORAGE_KEY = 'fastfood_products_overrides_v1';

type ProductOverrides = Record<string, Partial<Product>>;

function loadOverrides(): ProductOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: ProductOverrides): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore quota errors
  }
}

export function getMergedProducts(): Product[] {
  const overrides = loadOverrides();
  return fallbackProducts.map((p) =>
    overrides[p.id] ? { ...p, ...overrides[p.id] } : p,
  );
}

export function saveProductEdit(product: Product): void {
  const overrides = loadOverrides();
  overrides[product.id] = {
    name: product.name,
    description: product.description,
    base_price: product.base_price,
    image_url: product.image_url,
    category_id: product.category_id,
    available: product.available,
    variations: product.variations,
    extras: product.extras,
    sort_order: product.sort_order,
  };
  saveOverrides(overrides);
}

export function clearProductOverride(id: string): void {
  const overrides = loadOverrides();
  delete overrides[id];
  saveOverrides(overrides);
}

export function resetAllOverrides(): Product[] {
  saveOverrides({});
  return [...fallbackProducts];
}
