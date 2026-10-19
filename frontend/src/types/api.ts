export interface HealthResponse {
  status: string;
}

export interface ChatCartLineDto {
  item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

export type ChatStreamEvent =
  | { type: "session"; session_id: string }
  | { type: "transcript"; text: string }
  | { type: "image"; description: string }
  | { type: "intent"; intent: string }
  | { type: "tool"; name: string | null; ok: boolean }
  | { type: "token"; text: string }
  | { type: "cart"; items: ChatCartLineDto[] }
  | { type: "done"; reply: string; pending_confirmation: boolean }
  | { type: "error"; message: string };

export type UserRoleDto = "guest" | "user" | "staff" | "admin";

export interface UserPreferences {
  veg?: boolean | null;
  spice_level?: number | null;
  allergies?: string[];
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: UserRoleDto;
  preferences?: UserPreferences | null;
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

export interface CategoryCreate {
  label: string;
  sort_order?: number;
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

export interface MenuItemCreate {
  name: string;
  category_id: string;
  description?: string | null;
  price?: number | null;
  happy_hour_price?: number | null;
  is_veg?: boolean;
  spice_level?: number;
  tags?: string[];
  rating?: number | null;
  prep_time?: string | null;
  is_available?: boolean;
  image_url?: string | null;
  is_alcoholic?: boolean;
}

export type MenuItemUpdate = Partial<MenuItemCreate>;

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

export interface StatusCount {
  status: OrderStatusDto;
  count: number;
}

export interface DayRevenue {
  date: string;
  weekday: string;
  orders: number;
  revenue: number;
}

export interface TopItemDto {
  menu_item_id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface HourCount {
  hour: number;
  orders: number;
}

export interface RatingSummary {
  food: number;
  service: number;
  ai: number;
  overall: number;
  count: number;
}

export interface DashboardAnalytics {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  active_orders: number;
  menu_items: number;
  available_items: number;
  orders_by_status: StatusCount[];
  revenue_by_day: DayRevenue[];
  top_items: TopItemDto[];
  peak_hours: HourCount[];
  ratings: RatingSummary;
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
  acknowledged: boolean;
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
