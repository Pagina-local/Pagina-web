export const formatCOP = (value: number): string => {
  return '$' + Math.round(value).toLocaleString('es-CO');
};

export const calculateUnitPrice = (
  basePrice: number,
  variation: { priceDelta: number } | null,
  extras: Record<string, { price: number; quantity: number }>,
): number => {
  let price = basePrice + (variation?.priceDelta ?? 0);
  for (const e of Object.values(extras)) {
    price += e.price * e.quantity;
  }
  return price;
};

export const calculateCartSubtotal = (items: { unitPrice: number; quantity: number }[]): number => {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
};

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};
