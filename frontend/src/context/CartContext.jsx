import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { STORAGE_KEYS } from "../utils/storageKeys";

const CartContext = createContext(null);

const initialState = {
  items: []
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD":
      return action.payload;
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
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.cart);
    if (saved) {
      dispatch({ type: "LOAD", payload: JSON.parse(saved) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state));
  }, [state]);

  const subtotal = state.items.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

  const value = useMemo(
    () => ({
      items: state.items,
      subtotal,
      addToCart: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
      removeFromCart: (id) => dispatch({ type: "REMOVE_ITEM", payload: id }),
      updateQuantity: (id, quantity) => dispatch({ type: "UPDATE_QTY", payload: { id, quantity } }),
      clearCart: () => dispatch({ type: "CLEAR" })
    }),
    [state.items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
