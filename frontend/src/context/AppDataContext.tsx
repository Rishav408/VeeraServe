import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { initialFeedback, initialOrders, initialUsers } from "../data/demoData";
import { menuItems } from "../data/menu";
import { STORAGE_KEYS } from "../utils/storageKeys";
import type {
  Feedback,
  MenuItem,
  MenuItemInput,
  Order,
  OrderItemRef,
  OrderStatus,
  User,
  UserRole
} from "../types/domain";

const ORDER_STAGES: { delay: number; status: OrderStatus }[] = [
  { delay: 5000, status: "preparing" },
  { delay: 10000, status: "ready" },
  { delay: 15000, status: "served" }
];

const GUEST_USER: User = { id: "U-guest", name: "Guest", role: "guest" };

interface AppDataState {
  menuItems: MenuItem[];
  orders: Order[];
  feedback: Feedback[];
  users: User[];
  currentUser: User;
}

interface PlaceOrderInput {
  items: OrderItemRef[];
  total: number;
}

interface FeedbackInput {
  rating: number;
  comment: string;
}

interface AppDataContextValue extends AppDataState {
  login: (name: string, role?: UserRole) => void;
  logout: () => void;
  placeOrder: (input: PlaceOrderInput) => Order;
  addFeedback: (input: FeedbackInput) => void;
  addMenuItem: (item: MenuItemInput) => void;
  toggleAvailability: (itemId: string) => void;
}

type AppDataAction =
  | { type: "AUTH_LOGIN"; payload: User }
  | { type: "AUTH_LOGOUT" }
  | { type: "ORDER_CREATE"; payload: Order }
  | { type: "ORDER_STATUS_UPDATE"; payload: { orderId: string; status: OrderStatus } }
  | { type: "MENU_TOGGLE_AVAILABILITY"; payload: string }
  | { type: "MENU_ADD_ITEM"; payload: MenuItem }
  | { type: "FEEDBACK_ADD"; payload: Feedback };

const AppDataContext = createContext<AppDataContextValue | null>(null);

const initialState: AppDataState = {
  menuItems,
  orders: initialOrders,
  feedback: initialFeedback,
  users: initialUsers,
  currentUser: GUEST_USER
};

function reducer(state: AppDataState, action: AppDataAction): AppDataState {
  switch (action.type) {
    case "AUTH_LOGIN":
      return { ...state, currentUser: action.payload };
    case "AUTH_LOGOUT":
      return { ...state, currentUser: GUEST_USER };
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

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (savedUser) {
      dispatch({ type: "AUTH_LOGIN", payload: JSON.parse(savedUser) as User });
    }
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const login = (name: string, role: UserRole = "guest") => {
    const user: User = { id: `U-${name.toLowerCase()}`, name, role };
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    dispatch({ type: "AUTH_LOGIN", payload: user });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.user);
    dispatch({ type: "AUTH_LOGOUT" });
  };

  const placeOrder = ({ items, total }: PlaceOrderInput): Order => {
    const order: Order = {
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

  const addFeedback = ({ rating, comment }: FeedbackInput) => {
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

  const addMenuItem = (item: MenuItemInput) => {
    const newItem: MenuItem = {
      id: `M-${Date.now()}`,
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel,
      rating: item.rating ?? 4.2,
      tags: item.tags ?? ["New"],
      prepTime: item.prepTime ?? "12 min",
      isAvailable: item.isAvailable ?? true,
      image:
        item.image ??
        "https://images.unsplash.com/photo-1548940740-204726a19be3?auto=format&fit=crop&w=800&q=80"
    };
    dispatch({ type: "MENU_ADD_ITEM", payload: newItem });
  };

  const value: AppDataContextValue = {
    ...state,
    login,
    logout,
    placeOrder,
    addFeedback,
    addMenuItem,
    toggleAvailability: (itemId: string) => dispatch({ type: "MENU_TOGGLE_AVAILABILITY", payload: itemId })
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
