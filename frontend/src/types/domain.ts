export type UserRole = "guest" | "user" | "staff" | "admin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  description: string | null;
  isVeg: boolean;
  spiceLevel: number;
  tags: string[];
  rating: number | null;
  prepTime: string | null;
  isAvailable: boolean;
}

export type MenuItemInput = Pick<
  MenuItem,
  "name" | "category" | "price" | "description" | "isVeg" | "spiceLevel"
> &
  Partial<Pick<MenuItem, "tags" | "rating" | "prepTime" | "isAvailable" | "image">>;

export interface CartEntry {
  item: MenuItem;
  quantity: number;
}

export interface OrderItemRef {
  itemId: string;
  quantity: number;
}

export type OrderStatus = "pending" | "preparing" | "ready" | "served";

export interface Order {
  id: string;
  customerName: string;
  items: OrderItemRef[];
  total: number;
  status: OrderStatus;
  createdAt: number;
}

export interface Feedback {
  id: string;
  user: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export type ChatSender = "bot" | "user";

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: number;
}

export interface BotAction {
  type: string;
  itemId?: string;
}

export interface BotResponse {
  message: string;
  action: BotAction | null;
}
