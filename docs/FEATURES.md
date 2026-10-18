# VeeraServe — Feature Catalog

**Status:** Baseline feature inventory
**Purpose:** Enumerate every user-facing and system capability with a stable ID and a priority, so
`TASKS.md` can decompose work and `evaluation/EVALUATION.md` can reference features by ID.

---

## 1. Priority definitions

| Priority | Meaning |
|---|---|
| **P0** | Foundation. Without it the product does not function. |
| **P1** | Core product experience. Expected in the MVP. |
| **P2** | Strong differentiator; required to make the GenAI claim credible. |
| **P3** | Nice-to-have / backlog; only if time allows. |

Feature IDs are stable: `F-<domain>-<n>`.

---

## 2. Feature domains

- **Discovery (D)** — menu browse, search, filtering, details.
- **Order (O)** — cart, checkout, orders, tracking.
- **AI (A)** — the agentic waiter: grounding, tools, memory, multi-agent.
- **Multimodal (M)** — voice, image.
- **Account (U)** — authentication, roles, profile, preferences.
- **Admin (X)** — menu management, order management, analytics.
- **Engagement (E)** — offers, feedback, happy hour.
- **Platform (P)** — non-functional and system-level capabilities.

---

## 3. Discovery

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-D-1 | Category-grouped menu (food + bar). | P0 | Categories from the canonical data contract. |
| F-D-2 | Text search across name + description. | P0 | Debounced; empty state. |
| F-D-3 | Filter by veg/non-veg, spice level, price range. | P1 | Compose with search and category. |
| F-D-4 | Item detail view with price(s), tags, availability. | P0 | Shows happy-hour price when defined. |
| F-D-5 | "Pairs well with" / related items. | P1 | Same category or complementary. |
| F-D-6 | Sold-out / unavailable handling. | P0 | Cannot add unavailable items. |
| F-D-7 | Item customisations (spice, no onion, extra cheese) that **persist into the order**. | P1 | Fixes a prototype defect. |

## 4. Order

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-O-1 | Persistent cart (add/remove/quantity). | P0 | Survives reload. |
| F-O-2 | Totals: subtotal, GST, discounts, grand total. | P0 | Server-validated totals at order time. |
| F-O-3 | Checkout with table number, payment method, instructions. | P0 | All fields persisted (fixes defect). |
| F-O-4 | QR / table identification. | P2 | Opens the app pre-bound to a table. |
| F-O-5 | Order placement persisted server-side. | P0 | Returns an order ID. |
| F-O-6 | Order lifecycle: placed → preparing → ready → served. | P0 | Staff/admin-driven; simulated kitchen labelled. |
| F-O-7 | Order tracking screen with live status. | P1 | Updates via polling or SSE. |
| F-O-8 | Order history for registered diners. | P1 | Filtered by user. |
| F-O-9 | Re-order from history. | P3 | One-tap repeat. |

## 5. AI — the agentic waiter

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-A-1 | Grounded chat over the real menu (RAG). | P2 | **Core GenAI contribution.** |
| F-A-2 | Dish and price recommendations with correct data. | P2 | Never fabricate items/prices. |
| F-A-3 | Tool call: **add to cart**. | P2 | Validated, idempotent. |
| F-A-4 | Tool calls: remove/update cart, view cart. | P2 | Full cart control via chat. |
| F-A-5 | Tool call: **place order**. | P2 | Requires confirmation step. |
| F-A-6 | Tool call: **get order status**. | P2 | Reads real order state. |
| F-A-7 | Recommendations by dietary/spice/budget/past prefs. | P2 | Uses long-term memory. |
| F-A-8 | Short-term conversation memory. | P2 | Session-scoped. |
| F-A-9 | Long-term preference memory (veg, spice, allergies). | P2 | Persisted per user. |
| F-A-10 | Guardrails: refuse off-topic, no invented data. | P2 | Grounding + refusal policy. |
| F-A-11 | Streaming responses. | P2 | SSE. |
| F-A-12 | Proactive upsell (suggest sides/drinks). | P3 | Non-intrusive; grounded. |
| F-A-13 | Multi-agent specialisation (supervisor + specialists). | P3 | See `ai/AGENT_DESIGN.md`. |
| F-A-14 | Multilingual chat (Hindi/Marathi). | P3 | Backlog (O-8). |

## 6. Multimodal

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-M-1 | Voice input (STT via faster-whisper). | P2 | Record → transcribe → agent. |
| F-M-2 | Voice output (TTS). | P3 | Browser first; Piper optional. |
| F-M-3 | Image input: analyse a dish/menu photo. | P2 | Grounded suggestion + labelled certainty. |
| F-M-4 | Multimodal turn (voice + image in one request). | P3 | Backend already accepts multipart. |

## 7. Account

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-U-1 | Guest session (browse + order without account). | P0 | Anonymous token. |
| F-U-2 | Register / login with hashed passwords. | P0 | Fixes cosmetic login. |
| F-U-3 | Role separation (guest/user/staff/admin) enforced by API. | P1 | Fixes dropdown escalation. |
| F-U-4 | Profile with saved preferences (dietary, spice). | P2 | Feeds agent memory. |
| F-U-5 | Order history on profile. | P1 | Ties to F-O-8. |

## 8. Admin

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-X-1 | Menu CRUD (add/edit/delete). | P1 | Categories must match the data contract. |
| F-X-2 | Toggle availability / sold-out. | P0 | Reflects on diner side and agent. |
| F-X-3 | Update regular and happy-hour prices. | P1 | Bar pricing. |
| F-X-4 | Order management with status transitions. | P1 | Staff-facing. |
| F-X-5 | Real analytics (orders, revenue, top items, peak hours). | P2 | From DB, never random. |
| F-X-6 | Feedback inbox. | P2 | Read + acknowledge. |
| F-X-7 | Menu import/export (JSON). | P3 | Bulk operations. |

## 9. Engagement

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-E-1 | Offers/deals listing. | P2 | Real, seeded, applicable. |
| F-E-2 | Happy-hour pricing logic (time-based). | P2 | Items carry both prices. |
| F-E-3 | Promo code application (validated). | P3 | Fixes non-functional promo UI. |
| F-E-4 | Feedback capture (food, service, AI) with valid 1–5 ratings. | P1 | Fixes 15/5 defect. |
| F-E-5 | Feedback visible to admin. | P2 | Links to F-X-6. |

## 10. Platform

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-P-1 | REST API with typed Pydantic schemas. | P0 | Single source of API truth. |
| F-P-2 | Real-time channel (SSE) for chat + order status. | P2 | Streaming honesty. |
| F-P-3 | Authn/authz middleware. | P0 | Guards protected routes. |
| F-P-4 | Input validation + file size/type limits. | P0 | Security. |
| F-P-5 | Structured logging + request IDs. | P2 | Debuggability. |
| F-P-6 | Local model configuration via env. | P0 | Model names/URLs configurable. |
| F-P-7 | Docker Compose one-command run. | P2 | Portability. |
| F-P-8 | Automated tests (unit/integration/eval). | P1 | Quality + academic evidence. |
| F-P-9 | CI (lint, typecheck, test, build). | P2 | Professional repo. |
| F-P-10 | Responsive, accessible UI. | P1 | WCAG-AA targets. |
| F-P-11 | Evaluation harness + metrics report. | P2 | Feeds `EVALUATION.md`. |

---

## 11. MVP feature set (must ship)

`F-D-1..F-D-4, F-D-6`, `F-O-1..F-O-3, F-O-5..F-O-7`, `F-A-1..F-A-4, F-A-8, F-A-10, F-A-11`,
`F-M-1, F-M-3`, `F-U-1..F-U-3`, `F-X-1, F-X-2, F-X-4, F-X-5`, `F-E-4`, `F-P-1, F-P-3, F-P-4, F-P-6`.

Everything else is post-MVP or backlog.

---

*Feature IDs are referenced by `TASKS.md` acceptance criteria and by the evaluation harness.*
