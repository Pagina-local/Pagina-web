import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from '@/types';

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'fastfood_cart_v1';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (item: CartItem) => {
      setItems((prev) => {
        const matchIdx = prev.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.variation?.id === item.variation?.id &&
            JSON.stringify(i.extras) === JSON.stringify(item.extras) &&
            i.notes === item.notes,
        );
        if (matchIdx >= 0) {
          const next = [...prev];
          next[matchIdx] = { ...next[matchIdx], quantity: next[matchIdx].quantity + item.quantity };
          return next;
        }
        return [...prev, item];
      });
    };

    const removeItem = (lineId: string) => {
      setItems((prev) => prev.filter((i) => i.lineId !== lineId));
    };

    const updateQuantity = (lineId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.lineId !== lineId));
        return;
      }
      setItems((prev) => prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)));
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, addItem, removeItem, updateQuantity, clearCart, totalItems };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
