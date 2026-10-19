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

export interface CartEntry {
  item: MenuItem;
  quantity: number;
}

export type OrderStatus = "pending" | "preparing" | "ready" | "served";

export type ChatSender = "bot" | "user";

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: number;
  streaming?: boolean;
}
