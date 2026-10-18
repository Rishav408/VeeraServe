import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { menuItems as legacyItems } from "../frontend/src/data/mockData.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const LEGACY_PATH = resolve(root, "frontend/src/data/mockData.js");
const MARKDOWN_PATH = resolve(root, "data/menu.md");
const SCHEMA_PATH = resolve(root, "data/menu.schema.json");
const OUTPUT_PATH = resolve(root, "data/menu.seed.json");

const CATEGORIES = [
  { id: "world-plates", label: "World Plates", sort_order: 1 },
  { id: "rice-noodles", label: "Rice & Noodles", sort_order: 2 },
  { id: "breads", label: "Indian Breads", sort_order: 3 },
  { id: "mains", label: "Mains", sort_order: 4 },
  { id: "appetizers-veg", label: "Veg Appetizers", sort_order: 5 },
  { id: "appetizers-nonveg", label: "Non-Veg Appetizers", sort_order: 6 },
  { id: "beverages", label: "Beverages", sort_order: 7 },
  { id: "bar", label: "Bar", sort_order: 8 }
];

const SECTION_CATEGORY = {
  "World Plates": "world-plates",
  "Veg Rice & Noodles": "rice-noodles",
  "Non-Veg Rice & Noodles": "rice-noodles",
  "Indian Breads": "breads",
  "Veg Mains": "mains",
  "Non-Veg Mains": "mains",
  "Veg Appetizers": "appetizers-veg",
  "Non-Veg Appetizers": "appetizers-nonveg",
  Beverages: "beverages"
};

const NAME_ALIASES = {
  tonic: "tonic water"
};

function normalizeName(value) {
  const cleaned = value
    .toLowerCase()
    .replace(/vegetables/g, "veg")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return NAME_ALIASES[cleaned] ?? cleaned;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePrice(raw) {
  if (!raw) return { price: null, happy_hour_price: null };
  const happy = /happy hour\s+(\d+)/i.exec(raw);
  const regular = /regular\s+(\d+)/i.exec(raw);
  if (regular || happy) {
    return {
      price: regular ? Number(regular[1]) : happy ? Number(happy[1]) : null,
      happy_hour_price: happy ? Number(happy[1]) : null
    };
  }
  const plain = /^(\d+)$/.exec(raw.trim());
  if (plain) return { price: Number(plain[1]), happy_hour_price: null };
  return { price: null, happy_hour_price: null };
}

function fromLegacy(item) {
  return {
    id: String(item.id),
    name: item.name,
    category: item.category,
    description: item.description ?? null,
    price: item.price ?? null,
    happy_hour_price: null,
    is_veg: Boolean(item.isVeg),
    spice_level: item.spiceLevel ?? 0,
    tags: item.tags ?? [],
    rating: item.rating ?? null,
    prep_time: item.prepTime ?? null,
    is_available: item.isAvailable ?? true,
    image_url: item.image ?? null,
    is_alcoholic: false
  };
}

function parseMenuMarkdown(text, seenNames) {
  const items = [];
  let section = null;
  let subsection = null;

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("### ")) {
      subsection = line.slice(4).trim();
      continue;
    }
    if (line.startsWith("## ")) {
      section = line.slice(3).trim();
      subsection = null;
      continue;
    }
    if (!line.startsWith("- ")) continue;

    const body = line.slice(2).trim();
    if (!body || body.startsWith("(") || body.startsWith("*")) continue;

    const splitAt = body.indexOf(": ");
    const name = (splitAt === -1 ? body : body.slice(0, splitAt)).trim();
    const rawPrice = splitAt === -1 ? "" : body.slice(splitAt + 2).trim();
    if (!name || name.length < 2) continue;

    let category = null;
    let is_alcoholic = false;

    if (section === "Beverages") {
      if (subsection === "Non-Alcoholic Beverages") {
        category = "beverages";
      } else {
        category = "bar";
        is_alcoholic = true;
      }
    } else if (section && SECTION_CATEGORY[section]) {
      category = SECTION_CATEGORY[section];
    }

    if (!category) continue;

    const key = normalizeName(name);
    if (seenNames.has(key)) continue;
    seenNames.add(key);

    const { price, happy_hour_price } = parsePrice(rawPrice);

    items.push({
      id: slugify(name),
      name,
      category,
      description: null,
      price,
      happy_hour_price,
      is_veg: category !== "appetizers-nonveg",
      spice_level: 0,
      tags: [],
      rating: null,
      prep_time: null,
      is_available: true,
      image_url: null,
      is_alcoholic
    });
  }

  return items;
}

function check(condition, path, message, errors) {
  if (!condition) errors.push(`${path}: ${message}`);
}

function matchesType(value, type) {
  switch (type) {
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "integer":
      return Number.isInteger(value);
    case "number":
      return typeof value === "number";
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return true;
  }
}

function validateNode(value, schema, path, errors) {
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    check(types.some((type) => matchesType(value, type)), path, `expected ${types.join("|")}`, errors);
  }
  if (value === null || value === undefined) return;

  if (schema.enum) {
    check(schema.enum.includes(value), path, `value not in enum`, errors);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined) check(value >= schema.minimum, path, `below minimum`, errors);
    if (schema.maximum !== undefined) check(value <= schema.maximum, path, `above maximum`, errors);
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined) check(value.length >= schema.minLength, path, `shorter than minLength`, errors);
    if (schema.maxLength !== undefined) check(value.length <= schema.maxLength, path, `longer than maxLength`, errors);
    if (schema.pattern) check(new RegExp(schema.pattern).test(value), path, `does not match pattern`, errors);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined) check(value.length >= schema.minItems, path, `fewer than minItems`, errors);
    if (schema.items) value.forEach((entry, index) => validateNode(entry, schema.items, `${path}[${index}]`, errors));
  }
  if (matchesType(value, "object")) {
    if (schema.required) {
      schema.required.forEach((key) => check(key in value, path, `missing "${key}"`, errors));
    }
    for (const [key, entry] of Object.entries(value)) {
      if (schema.properties && schema.properties[key]) {
        validateNode(entry, schema.properties[key], `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}: unexpected property "${key}"`);
      }
    }
  }
}

const seenNames = new Set(legacyItems.map((item) => normalizeName(item.name)));
const baseItems = legacyItems.map(fromLegacy);
const markdown = readFileSync(MARKDOWN_PATH, "utf8");
const extraItems = parseMenuMarkdown(markdown, seenNames);

const usedIds = new Set(baseItems.map((item) => item.id));
for (const item of extraItems) {
  let id = item.id || "item";
  let suffix = 2;
  while (usedIds.has(id)) id = `${item.id}-${suffix++}`;
  item.id = id;
  usedIds.add(id);
}

const seed = {
  version: "1.0.0",
  currency: "INR",
  categories: CATEGORIES,
  items: [...baseItems, ...extraItems]
};

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const errors = [];
validateNode(seed, schema, "$", errors);

const categoryIds = new Set(CATEGORIES.map((category) => category.id));
const seenIds = new Set();
seed.items.forEach((item, index) => {
  check(categoryIds.has(item.category), `$.items[${index}].category`, `unknown category "${item.category}"`, errors);
  check(!seenIds.has(item.id), `$.items[${index}].id`, `duplicate id "${item.id}"`, errors);
  seenIds.add(item.id);
});

if (errors.length > 0) {
  console.error(`Menu seed validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

writeFileSync(OUTPUT_PATH, `${JSON.stringify(seed, null, 2)}\n`, "utf8");
console.log(`Wrote ${seed.items.length} items to data/menu.seed.json`);
console.log(`  legacy items: ${baseItems.length}`);
console.log(`  additional items: ${extraItems.length}`);
console.log(`  legacy source: ${LEGACY_PATH}`);
