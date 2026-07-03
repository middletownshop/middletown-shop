import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (
    productId: string
  ) => void;
  updateQuantity: (
    productId: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext =
  createContext<CartContextType>({
    cartItems: [],
    addToCart: () => {},
    removeFromCart: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    cartTotal: 0,
  });

export const useCart = () =>
  useContext(CartContext);

export const CartProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();

  const [cartItems, setCartItems] =
    useState<CartItem[]>([]);

  /* Load user's cart */
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          `cartItems_${user.uid}`
        );

      setCartItems(
        saved ? JSON.parse(saved) : []
      );
    } catch {
      setCartItems([]);
    }
  }, [user]);

  /* Save user's cart */
  useEffect(() => {
    if (!user) return;

    localStorage.setItem(
      `cartItems_${user.uid}`,
      JSON.stringify(cartItems)
    );
  }, [cartItems, user]);

  const addToCart = (
    item: CartItem
  ) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.productId === item.productId
      );

      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity:
                  i.quantity +
                  item.quantity,
              }
            : i
        );
      }

      return [...prev, item];
    });
  };

  const removeFromCart = (
    productId: string
  ) => {
    setCartItems((prev) =>
      prev.filter(
        (i) =>
          i.productId !== productId
      )
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);

    if (user) {
      localStorage.removeItem(
        `cartItems_${user.uid}`
      );
    }
  };

  const cartTotal =
    cartItems.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};