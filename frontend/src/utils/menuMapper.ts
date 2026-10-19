import type { MenuItemDto } from "../types/api";
import type { MenuItem } from "../types/domain";

export const HIDDEN_CATEGORIES = ["bar"];

export function toMenuItem(dto: MenuItemDto): MenuItem | null {
  if (dto.price === null || dto.is_alcoholic || HIDDEN_CATEGORIES.includes(dto.category_id)) {
    return null;
  }
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category_id,
    price: dto.price,
    image: dto.image_url,
    description: dto.description,
    isVeg: dto.is_veg,
    spiceLevel: dto.spice_level,
    tags: dto.tags,
    rating: dto.rating,
    prepTime: dto.prep_time,
    isAvailable: dto.is_available
  };
}
