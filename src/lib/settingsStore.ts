import type { StoreSettings } from '@/types';
import { fallbackSettings } from './fallbackData';

const STORAGE_KEY = 'fastfood_settings_overrides_v1';

type SettingsPatch = Partial<StoreSettings>;

function loadOverrides(): SettingsPatch {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveOverrides(patch: SettingsPatch): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patch));
  } catch {
    // ignore quota errors
  }
}

export function getMergedSettings(): StoreSettings {
  const overrides = loadOverrides();
  return { ...fallbackSettings, ...overrides };
}

export function saveSettings(settings: StoreSettings): void {
  saveOverrides({
    store_name: settings.store_name,
    tagline: settings.tagline,
    logo_url: settings.logo_url,
    logo_type: settings.logo_type,
    whatsapp_number: settings.whatsapp_number,
    delivery_fee: settings.delivery_fee,
    promo_title: settings.promo_title,
    promo_subtitle: settings.promo_subtitle,
    promo_badge: settings.promo_badge,
  });
}

export function resetSettings(): StoreSettings {
  saveOverrides({});
  return { ...fallbackSettings };
}
