import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { initialFeedback, initialOrders, initialUsers, menuItems } from "../data/mockData";
import { STORAGE_KEYS } from "../utils/storageKeys";

const ORDER_STAGES = [
  { delay: 5000, status: "preparing" },
  { delay: 10000, status: "ready" },
  { delay: 15000, status: "served" }
];

const AppDataContext = createContext(null);

const initialState = {
  menuItems,
  orders: initialOrders,
  feedback: initialFeedback,
  users: initialUsers,
  currentUser: { id: "U-guest", name: "Guest", role: "guest" }
};

function reducer(state, action) {
  switch (action.type) {
    case "AUTH_LOGIN":
      return { ...state, currentUser: action.payload };
    case "AUTH_LOGOUT":
      return { ...state, currentUser: { id: "U-guest", name: "Guest", role: "guest" } };
    case "ORDER_CREATE":
      return { ...state, orders: [action.payload, ...state.orders] };
    case "ORDER_STATUS_UPDATE":
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.orderId ? { ...order, status: action.payload.status } : order
        )
      };
    case "MENU_TOGGLE_AVAILABILITY":
      return {
        ...state,
        menuItems: state.menuItems.map((item) =>
          item.id === action.payload ? { ...item, isAvailable: !item.isAvailable } : item
        )
      };
    case "MENU_ADD_ITEM":
      return { ...state, menuItems: [action.payload, ...state.menuItems] };
    case "FEEDBACK_ADD":
      return { ...state, feedback: [action.payload, ...state.feedback] };
    default:
      return state;
  }
}

export function AppDataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timersRef = useRef([]);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (savedUser) {
      dispatch({ type: "AUTH_LOGIN", payload: JSON.parse(savedUser) });
    }
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const login = (name, role = "guest") => {
    const user = { id: `U-${name.toLowerCase()}`, name, role };
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    dispatch({ type: "AUTH_LOGIN", payload: user });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.user);
    dispatch({ type: "AUTH_LOGOUT" });
  };

  const placeOrder = ({ items, total }) => {
    const order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: state.currentUser.name,
      items,
      total,
      status: "pending",
      createdAt: Date.now()
    };

    dispatch({ type: "ORDER_CREATE", payload: order });

    ORDER_STAGES.forEach(({ delay, status }) => {
      const timer = setTimeout(() => {
        dispatch({ type: "ORDER_STATUS_UPDATE", payload: { orderId: order.id, status } });
      }, delay);
      timersRef.current.push(timer);
    });

    return order;
  };

  const addFeedback = ({ rating, comment }) => {
    dispatch({
      type: "FEEDBACK_ADD",
      payload: {
        id: `FDB-${Date.now()}`,
        user: state.currentUser.name,
        rating,
        comment,
        createdAt: Date.now()
      }
    });
  };

  const addMenuItem = (item) => {
    dispatch({
      type: "MENU_ADD_ITEM",
      payload: {
        ...item,
        id: `M-${Date.now()}`,
        rating: 4.2,
        tags: ["New"],
        prepTime: "12 min",
        isAvailable: true,
        image:
          "https://images.unsplash.com/photo-1548940740-204726a19be3?auto=format&fit=crop&w=800&q=80"
      }
    });
  };

  const value = {
    ...state,
    login,
    logout,
    placeOrder,
    addFeedback,
    addMenuItem,
    toggleAvailability: (itemId) => dispatch({ type: "MENU_TOGGLE_AVAILABILITY", payload: itemId })
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
