# VeeraServe — Design Specification

**Status:** Baseline design system (derived from the existing prototype theme)
**Scope:** Visual language, tokens, components, motion, layout, and accessibility for the
VeeraServe web application.

---

## 1. Design objective

VeeraServe should feel like a **warm, premium Indian dhaba**: appetising, hospitable, and
trustworthy, with a modern ordering experience. The AI is an assistant, not a spectacle — it should
feel like part of the restaurant, not a sci-fi overlay.

Guiding principles:

1. **Appetising first.** Food imagery and warm colour do the emotional work.
2. **Restrained AI.** The bot is present and helpful, but not neon, not gimmicky, not "cyber".
3. **Clarity over decoration.** Every screen makes the next action obvious.
4. **Honest states.** Simulated, unavailable, and error states are always labelled.
5. **Accessible by default.** Contrast, focus, keyboard, and reduced-motion are respected.

---

## 2. Colour tokens

Derived from the prototype theme (`tailwind.config.js`, `src/index.css`).

```css
:root {
  /* Brand */
  --primary: #FF6B00;        /* VeeraServe orange */
  --primary-light: #FF8C3A;
  --primary-dark: #CC5500;
  --gold: #FFB300;           /* accents, ratings, badges */
  --gold-light: #FFD54F;
  --gold-dark: #E65100;

  /* Warm surfaces */
  --cream: #FFF3E0;
  --cream-dark: #FFE0B2;
  --cream-deeper: #FFCCBC;

  /* Text / secondary */
  --ink: #1A1A1A;
  --ink-soft: #3D2B1F;
  --ink-muted: #6D4C41;
  --secondary: #5D4037;      /* deep brown, sidebar/hero */

  /* Status */
  --success: #2E7D32;
  --danger: #C62828;
}
```

**Usage rules**

- Orange is the primary action colour; do not use it for large text blocks.
- Gold is for ratings, badges, and highlights — never for primary buttons.
- Cream is the page/card background family; white is for elevated cards.
- Status colours are always paired with a **text label** (never colour alone).

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Display / headings | **Newsreader** (serif) | Warm, editorial feel for dish names and titles. |
| Body / UI | **Be Vietnam Pro** | Readable, friendly sans. |
| Labels / chips | **Inter** | Compact, high legibility for metadata. |

Rules:

- Use `font-display` for headings/product names, `font-body` for paragraphs, `font-label` for chips
  and metadata.
- Minimum body size 14 px; avoid low-contrast microcopy.
- Use tabular numerals for prices and metrics where supported.
- Never rely on colour or size alone to convey meaning.

---

## 4. Surfaces, shape, and elevation

- **Cards:** white→cream gradient with a soft layered shadow (the `card-3d` treatment).
- **Radius scale:** cards 20 px, buttons 14 px, chips 10 px, pills 999 px.
- **Elevation:** subtle; hover lifts cards slightly (translateY −2 to −6 px) — must respect
  reduced-motion.
- **Borders:** 1–1.5 px, low-opacity orange/brown, to keep surfaces soft.

The "3D" feel comes from layered shadows and gentle transforms, not skeuomorphism.

---

## 5. Layout

- **Desktop (≥1280 px):** left sidebar (navigation), main content, optional right rail
  (mini-cart / today's special).
- **Tablet (768–1279 px):** sidebar collapses; main content full width.
- **Mobile (<768 px):** top horizontal nav + bottom tab bar; content is single-column; sticky
  category bar on the menu.
- **Menu:** sticky search + category chips; grouped sections with counts; responsive card grid.
- **Item detail:** hero image, price, ratings, spice, tags, customisations, quantity, add-to-cart.
- **Cart/checkout:** two-column on desktop (summary sticky), single-column on mobile.
- **Chat:** full-height panel; quick-reply chips; input with attach + mic + send.

---

## 6. Core components

- **FoodCard** (full + compact): image, veg/non-veg dot, tag badge, name, price, rating, spice,
  prep time, "Add"/"In Cart"/"Sold Out".
- **CategoryChip / CategoryTabs:** filter pills with active state and counts.
- **MiniCart / CartLine:** line items with quantity steppers and totals.
- **OrderTimeline:** four-stage progress (placed → preparing → ready → served).
- **StatCard:** analytics KPI tile (value, label, icon; **real data only**).
- **ChatWidget:** conversation, typing indicator, quick replies, multimodal input.
- **ScreenHeader / PageHeader:** title + subtitle + optional action.
- **Toast:** transient confirmation (orders, cart, errors).
- **State components:** LoadingState, EmptyState, ErrorState, UnavailableState.
- **DemoNotice:** persistent label used wherever data/action is simulated.

---

## 7. Motion

Powered by Framer Motion (already in the prototype).

- Page transitions: subtle fade + small vertical/scale (≈250 ms).
- Card entrances: staggered fade-up on the menu grid.
- Cart badge: spring pop when count changes.
- Hover: gentle lift; tap: slight scale-down on buttons.
- Respect `prefers-reduced-motion`: disable non-essential motion.

Motion must never delay an action or hide state changes.

---

## 8. AI-specific presentation

- The bot speaks with a warm, concise persona ("Namaskar! ...").
- Grounded answers show the dish and price exactly as in the menu.
- When the bot proposes a cart change, show an explicit confirmation affordance.
- When confidence is low (e.g., vision), say so ("I think this is close to X — want to try it?").
- Never render fabricated numbers, ratings, or analytics.

---

## 9. Interaction states

Every interactive/data component defines: default, hover, focus (visible), active, disabled,
loading, success, error, empty, and unavailable. States must be distinguishable without relying on
colour alone.

---

## 10. Accessibility

- Target WCAG 2.2 AA contrast for text and UI.
- Logical tab order; visible focus rings.
- Semantic headings and labels; form inputs always labelled.
- Touch targets ≥ 44 px on mobile.
- Provide text alternatives for charts; never colour-only status.
- Support keyboard operation of chat, cart, and checkout.
- Honour reduced-motion preferences.

---

## 11. Avoid

- Neon gradients, glowing borders, cyberpunk or robot motifs.
- Fabricated "AI" dashboards or fake real-time telemetry.
- Colour-only meaning for veg/non-veg, spice, or order status (always add text/icons).
- Overloaded screens; keep one clear primary action per view.

---

## 12. Decisions to confirm

- Whether to introduce a small component library (e.g., Radix primitives) for accessibility.
- Final charting library for admin analytics.
- Exact happy-hour visual treatment (badge, banner, or price strike-through).
- Whether to keep the "3D card" hover on touch devices.

---

*This specification maps to the design tokens in `frontend/src/styles` once the TypeScript migration
(Phase P2) is complete.*
