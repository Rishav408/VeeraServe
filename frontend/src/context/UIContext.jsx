import { createContext, useContext, useMemo, useReducer } from "react";

const UIContext = createContext(null);

const initialState = {
  activeCategory: "all",
  showCart: false,
  toast: null
};

function reducer(state, action) {
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

export function UIProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(
    () => ({
      ...state,
      setCategory: (category) => dispatch({ type: "SET_CATEGORY", payload: category }),
      toggleCart: () => dispatch({ type: "TOGGLE_CART" }),
      showToast: (message) => {
        dispatch({ type: "SHOW_TOAST", payload: message });
        setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 2000);
      }
    }),
    [state]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used inside UIProvider");
  }
  return context;
}
