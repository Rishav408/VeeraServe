export interface HealthResponse {
  status: string;
}

export interface ChatResponse {
  response: string;
}

export interface CategoryDto {
  id: string;
  label: string;
  sort_order: number;
}

export interface MenuItemDto {
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
  items: MenuItemDto[];
}
