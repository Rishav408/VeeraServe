import seed from "../../../data/menu.seed.json";
import type { MenuItem } from "../types/domain";

const HIDDEN_CATEGORIES = ["bar"];

type SeedItem = (typeof seed.items)[number];

export const menuItems: MenuItem[] = seed.items
  .filter(
    (item): item is SeedItem & { price: number } =>
      item.price !== null &&
      !item.is_alcoholic &&
      !HIDDEN_CATEGORIES.includes(item.category)
  )
  .map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    image: item.image_url,
    description: item.description,
    isVeg: item.is_veg,
    spiceLevel: item.spice_level,
    tags: item.tags,
    rating: item.rating,
    prepTime: item.prep_time,
    isAvailable: item.is_available
  }));

export const categoryTabs: string[] = [
  "all",
  ...seed.categories
    .filter((category) => !HIDDEN_CATEGORIES.includes(category.id))
    .map((category) => category.id)
];
