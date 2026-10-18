# Menu data

This folder holds the **canonical menu** — the single source of truth for dish names, categories,
prices, dietary flags, and bar items.

| File | Purpose |
|---|---|
| `menu.seed.json` | The canonical menu. Every other menu source has been retired in favour of this file. |
| `menu.schema.json` | JSON Schema the seed is validated against. |
| `README.md` | This file. |

## Seed format

The seed is a JSON object:

```json
{
  "version": "1.0.0",
  "currency": "INR",
  "categories": [{ "id": "mains", "label": "Mains", "sort_order": 4 }],
  "items": []
}
```

Each item uses the contract in `docs/RULES.md` §5 and `docs/architecture/ARCHITECTURE.md` §6:

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable slug. |
| `name` | string | Dish name as printed on the menu. |
| `category` | string | One of the `categories[].id` values. |
| `description` | string \| null | Short description where known. |
| `price` | integer \| null | Regular price in rupees; `null` when the source menu does not state one. |
| `happy_hour_price` | integer \| null | Happy-hour price where defined (bar items). |
| `is_veg` | boolean | Dietary flag. |
| `spice_level` | integer | 0–5. |
| `tags` | string[] | Free-form labels (e.g. `Bestseller`). |
| `rating` | number \| null | 0–5. |
| `prep_time` | string \| null | Preparation time. |
| `is_available` | boolean | Availability. |
| `image_url` | string \| null | Item image. |
| `is_alcoholic` | boolean | `true` for bar items, so guests can be excluded by an age-policy toggle. |

## Provenance

`menu.seed.json` was generated once by `scripts/convert_menu.mjs`, which merged the two legacy
sources (`frontend/src/data/mockData.js` and `data/menu.md`) and validated every item against
`menu.schema.json`. Both legacy files have since been retired (see `docs/RULES.md` §1).

The converter is a **one-off** historical transform: it reads the legacy sources that no longer
exist, so it is kept only to document how the seed was produced. The seed itself is now the authority
and must be edited directly (or, later, through the backend menu service).
