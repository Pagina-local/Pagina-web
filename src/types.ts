export interface Variation {
  id: string;
  name: string;
  priceDelta: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  variations: Variation[];
  extras: Extra[];
  available: boolean;
  sort_order: number;
}

export interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  image_url: string | null;
  status: 'approved' | 'hidden';
  created_at: string;
}

export interface StoreSettings {
  id: number;
  whatsapp_number: string;
  delivery_fee: number;
  promo_title: string;
  promo_subtitle: string;
  promo_badge: string;
  store_name: string;
  tagline: string;
  logo_url: string;
  logo_type: 'icon' | 'image';
}

export interface CartItemExtras {
  [extraId: string]: { name: string; price: number; quantity: number };
}

export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  image_url: string;
  basePrice: number;
  variation: { id: string; name: string; priceDelta: number } | null;
  extras: CartItemExtras;
  notes: string;
  quantity: number;
  unitPrice: number;
}

export type DeliveryMode = 'domicilio' | 'recoger';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

export interface CheckoutDetails {
  deliveryMode: DeliveryMode;
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  addressNotes: string;
  paymentMethod: PaymentMethod;
  cashAmount: string;
}
