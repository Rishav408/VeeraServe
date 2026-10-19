export interface HealthResponse {
  status: string;
}

export interface ChatResponse {
  response: string;
}

export type UserRoleDto = "guest" | "user" | "staff" | "admin";

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: UserRoleDto;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserDto;
}

export interface CategoryDto {
  id: string;
  label: string;
  sort_order: number;
}

export interface MenuItemDto {
  id: string;
  name: string;
  category_id: string;
  description: string | null;
  price: number | null;
  happy_hour_price: number | null;
  is_veg: boolean;
  spice_level: number;
  tags: string[];
  rating: number | null;
  prep_time: string | null;
  is_available: boolean;
  image_url: string | null;
  is_alcoholic: boolean;
}

export interface MenuSeedItemDto {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number | null;
  happy_hour_price: number | null;
  is_veg: boolean;
  spice_level: number;
  tags: string[];
  rating: number | null;
  prep_time: string | null;
  is_available: boolean;
  image_url: string | null;
  is_alcoholic: boolean;
}

export interface MenuSeedDto {
  version: string;
  currency: "INR";
  categories: CategoryDto[];
  items: MenuSeedItemDto[];
}

export type OrderStatusDto = "pending" | "preparing" | "ready" | "served";

export interface OrderItemCreate {
  menu_item_id: string;
  quantity: number;
  customisations?: string[];
}

export interface OrderCreate {
  table_number?: number | null;
  payment_method: string;
  instructions?: string | null;
  items: OrderItemCreate[];
}

export interface OrderItemDto {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  customisations: string[];
}

export interface OrderDto {
  id: number;
  user_id: number | null;
  table_number: number | null;
  status: OrderStatusDto;
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  payment_method: string | null;
  instructions: string | null;
  created_at: string;
  items: OrderItemDto[];
}

export interface OrderStatusUpdate {
  status: OrderStatusDto;
}

export interface FeedbackCreate {
  order_id?: number | null;
  food_rating: number;
  service_rating: number;
  ai_rating: number;
  comment?: string | null;
}

export interface FeedbackDto {
  id: number;
  user_id: number | null;
  order_id: number | null;
  food_rating: number;
  service_rating: number;
  ai_rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReservationCreate {
  name: string;
  party_size: number;
  time: string;
}

export interface ReservationDto {
  id: number;
  user_id: number | null;
  name: string;
  party_size: number;
  time: string;
  status: string;
  created_at: string;
}
