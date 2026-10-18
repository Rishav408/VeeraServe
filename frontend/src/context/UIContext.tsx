import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

interface UIState {
  activeCategory: string;
  showCart: boolean;
  toast: string | null;
}

interface UIContextValue extends UIState {
  setCategory: (category: string) => void;
  toggleCart: () => void;
  showToast: (message: string) => void;
}

type UIAction =
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "TOGGLE_CART" }
  | { type: "SHOW_TOAST"; payload: string }
  | { type: "CLEAR_TOAST" };

const UIContext = createContext<UIContextValue | null>(null);

const initialState: UIState = {
  activeCategory: "all",
  showCart: false,
  toast: null
};

function reducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "SET_CATEGORY":
      return { ...state, activeCategory: action.payload };
    case "TOGGLE_CART":
      return { ...state, showCart: !state.showCart };
    case "SHOW_TOAST":
      return { ...state, toast: action.payload };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<UIContextValue>(
    () => ({
      ...state,
      setCategory: (category: string) => dispatch({ type: "SET_CATEGORY", payload: category }),
      toggleCart: () => dispatch({ type: "TOGGLE_CART" }),
      showToast: (message: string) => {
        dispatch({ type: "SHOW_TOAST", payload: message });
        setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 2000);
      }
    }),
    [state]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used inside UIProvider");
  }
  return context;
}
