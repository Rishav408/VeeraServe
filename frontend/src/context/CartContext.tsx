import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../utils/storageKeys";
import type { CartEntry, MenuItem } from "../types/domain";

interface CartState {
  items: CartEntry[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: MenuItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QTY"; payload: { id: string; quantity: number } }
  | { type: "REPLACE"; payload: CartEntry[] }
  | { type: "CLEAR" };

interface CartContextValue {
  items: CartEntry[];
  subtotal: number;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  replaceCart: (items: CartEntry[]) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = {
  items: []
};

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((entry) => entry.item.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((entry) =>
            entry.item.id === action.payload.id ? { ...entry, quantity: entry.quantity + 1 } : entry
          )
        };
      }
      return { ...state, items: [...state.items, { item: action.payload, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((entry) => entry.item.id !== action.payload) };
    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items
          .map((entry) =>
            entry.item.id === action.payload.id ? { ...entry, quantity: action.payload.quantity } : entry
          )
          .filter((entry) => entry.quantity > 0)
      };
    case "REPLACE":
      return { items: action.payload };
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
}

function loadState(): CartState {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.cart);
    if (saved) {
      return JSON.parse(saved) as CartState;
    }
  } catch {
    return initialState;
  }
  return initialState;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state));
  }, [state]);

  const subtotal = state.items.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      subtotal,
      addToCart: (item: MenuItem) => dispatch({ type: "ADD_ITEM", payload: item }),
      removeFromCart: (id: string) => dispatch({ type: "REMOVE_ITEM", payload: id }),
      updateQuantity: (id: string, quantity: number) =>
        dispatch({ type: "UPDATE_QTY", payload: { id, quantity } }),
      replaceCart: (items: CartEntry[]) => dispatch({ type: "REPLACE", payload: items }),
      clearCart: () => dispatch({ type: "CLEAR" })
    }),
    [state.items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
