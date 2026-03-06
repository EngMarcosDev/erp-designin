import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const storageKey = user?.email ? `abacaxita_cart:${user.email.toLowerCase()}` : "abacaxita_cart:guest";
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const readCart = (key: string) => {
    if (typeof window === "undefined") return [] as CartItem[];
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [] as CartItem[];
    }
  };

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    const current = readCart(storageKey);
    if (user?.email) {
      const guest = readCart("abacaxita_cart:guest");
      if (guest.length > 0) {
        const mergedMap = new Map<number, CartItem>();
        [...current, ...guest].forEach((item) => {
          const existing = mergedMap.get(item.id);
          if (existing) {
            mergedMap.set(item.id, { ...existing, quantity: existing.quantity + item.quantity });
          } else {
            mergedMap.set(item.id, item);
          }
        });
        const merged = Array.from(mergedMap.values());
        setItems(merged);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(merged));
          window.localStorage.removeItem("abacaxita_cart:guest");
        } catch {
          // ignore storage errors
        }
        return;
      }
    }
    setItems(current);
  }, [storageKey, user?.email]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Ignore storage errors to avoid breaking the app
    }
  }, [items, storageKey]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
