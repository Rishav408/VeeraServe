# VeeraServe — System Architecture

**Status:** Baseline design
**Core principle:** Keep the agent and business logic independent of the UI, and keep all menu
authority in one place.

---

## 1. Architecture goals

- A clean separation between **presentation** (React), **application/API** (FastAPI), and
  **intelligence** (the agent + RAG).
- A single **source of menu truth** shared by the UI, the API, and the agent.
- The agent must be able to **act** on real state through validated tools.
- Everything runs **locally and offline** with small models.
- The design must be **diagrammable and defensible** in an academic review.

---

## 2. Logical architecture

```text
                    DATA / KNOWLEDGE                             LOCAL MODELS
   data/menu.seed.json ---> seeder ---> Database        LM Studio: chat & vision model
                |                               |       LM Studio: embedding model
                v                               |       faster-whisper (STT)
        RAG ingestion ---> Vector store         |       (optional) TTS
                                               v
+------------------------------- APPLICATION -------------------------------+
|                                                                           |
|   React + TypeScript Frontend (browser)                                   |
|   Menu | Cart | Checkout | Orders | Chat | Voice | Vision | Admin         |
|                       |  REST + SSE                                       |
|                       v                                                   |
|   FastAPI Backend                                                         |
|   Auth & Roles -> Catalog API -> Orders API -> Feedback API -> Chat API   |
|                       |                                                   |
|                       v                                                   |
|   Agent Service (LangGraph)                                               |
|   Supervisor -> [Menu | Ordering | Recommendation | Vision | Status]      |
|        |            |                                                     |
|        |            v                                                     |
|        |      Tool Layer (validated): search_menu, add_to_cart,           |
|        |      place_order, get_order_status, list_offers, book_table ...  |
|        |                                                                  |
|        v                                                                  |
|   Retrieval (RAG) over Vector store  +  Memory (session + long-term)      |
|                                                                           |
+---------------------------------------------------------------------------+
|   Persistence: SQLite (dev) / Postgres (prod-ready)                       |
+---------------------------------------------------------------------------+
```

---

## 3. Architectural components

### A. Data & knowledge layer
Responsibilities:
- Own the canonical menu (`data/menu.seed.json`) and validate it against a schema.
- Seed the database idempotently.
- Ingest menu items into the vector store for retrieval.
- Provide one menu-access service used by both the API and the agent.

### B. Frontend
Responsibilities:
- Render catalog, cart, checkout, orders, chat, admin.
- Call the API; never compute authoritative prices/totals or agent logic.
- Render streamed chat content and multimodal input.
- Show loading/empty/error/unavailable states; label simulated data.

### C. Backend API
Responsibilities:
- Authenticate and authorize; enforce roles server-side.
- Validate requests with Pydantic schemas.
- Serve menu, categories, orders, feedback, reservations.
- Broker chat requests to the agent service.
- Expose streaming endpoints (SSE).

### D. Agent service
Responsibilities:
- Interpret user intent (text/voice/image).
- Retrieve grounded menu context (RAG).
- Select and execute tools through the tool layer.
- Manage conversation and long-term memory.
- Enforce guardrails and confirmation rules.
(Full detail in `../ai/AGENT_DESIGN.md`.)

### E. Tool layer
Responsibilities:
- Strict schemas per tool.
- Validate arguments against the menu/DB before execution.
- Perform cart/order mutations idempotently.
- Return structured success/error payloads.

### F. Model layer
Responsibilities:
- Serve chat/vision and embeddings from **LM Studio** via its OpenAI-compatible endpoints.
- Serve STT (faster-whisper, in-process) and optional TTS.
- Be reachable through an environment-configured base URL (`LLM_BASE_URL`); no model or endpoint is
  hard-coded.

---

## 4. Responsibility boundaries (what must not happen)

- The front end must not hold authoritative pricing, totals, or menu truth.
- The agent must not mutate state except through the tool layer.
- The API must not embed agent prompts or model logic inline; it calls the agent service.
- The tool layer must not trust the model's arguments without validation.
- No component may read the raw seed directly at request time; access flows through the menu
  service.

---

## 5. Agentic request lifecycle

```text
Diner: "Add two butter chickens and a garlic naan"
  |
  1. Frontend -> POST /chat (multipart: text/audio/image) + session id
  2. Backend -> Agent service (stream)
  3. Agent -> Retrieval (find candidate items in the real menu)
  4. Agent -> decides tool calls: add_to_cart(item_id, qty=2) x1, add_to_cart(naan, qty=1)
  5. Tool layer -> validates ids against DB -> mutates cart -> returns results
  6. Agent -> composes a grounded reply ("Added 2x Butter Chicken, 1x Butter Garlic Naan...")
  7. Backend -> SSE streams tokens/events to the frontend
  8. Frontend -> updates cart badge + chat bubble; shows a confirmation affordance
```

Order placement adds a confirmation step (the agent asks, the diner confirms, then `place_order`
runs).

---

## 6. Data model (entities)

| Entity | Key fields |
|---|---|
| `users` | id, name, email, password_hash, role, preferences (veg, spice, allergies), created_at |
| `categories` | id, slug, label, sort_order |
| `menu_items` | id, name, category_id, description, price, happy_hour_price, is_veg, spice_level, tags, rating, prep_time, is_available, image_url, is_alcoholic |
| `orders` | id, user_id, table_number, status, subtotal, gst, discount, total, payment_method, instructions, created_at |
| `order_items` | id, order_id, menu_item_id, quantity, unit_price, customisations |
| `feedback` | id, user_id, order_id, food_rating, service_rating, ai_rating, comment, created_at |
| `sessions` | id, user_id/guest token, context, created_at, expires_at |
| `reservations` | id, user_id, name, party_size, time, status, created_at |

The menu contract is derived from `data/menu.seed.json`; see `../RULES.md` §5.

---

## 7. API surface (target)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Availability. |
| POST | `/api/v1/auth/register` | Create account. |
| POST | `/api/v1/auth/login` | Obtain token. |
| GET | `/api/v1/categories` | List categories. |
| GET | `/api/v1/menu` | List/filter menu (query params). |
| GET | `/api/v1/menu/{id}` | Item details. |
| POST | `/api/v1/orders` | Place an order. |
| GET | `/api/v1/orders` | List orders (scoped). |
| GET | `/api/v1/orders/{id}` | Order detail/status. |
| PATCH | `/api/v1/orders/{id}/status` | Transition status (staff/admin). |
| POST | `/api/v1/feedback` | Submit feedback. |
| GET | `/api/v1/feedback` | List feedback (admin). |
| POST | `/api/v1/reservations` | Create reservation. |
| POST | `/api/v1/chat` | Agent turn (text/audio/image), streaming. |
| GET | `/api/v1/offers` | Offers / happy-hour info. |

Admin CRUD extends `/api/v1/menu` with POST/PUT/DELETE (admin role).

---

## 8. Real-time

- **Chat:** SSE stream from `/api/v1/chat` emitting token deltas and structured tool events.
- **Order status:** polling initially; SSE upgrade optional.
- All streaming is one-way (server → client); actions from the client use normal HTTP.

---

## 9. Deployment topology (local)

```text
Local processes (no containers)
  ├─ frontend   (Vite dev server / static build at http://localhost:5173)
  └─ backend    (FastAPI/uvicorn at http://localhost:8000)

Backing stores
  ├─ SQLite file (veeraserve.db)
  └─ Chroma persistent directory (chroma_db/)

LM Studio runs on the same host (desktop application) and is reached at
http://localhost:1234/v1 (LLM_BASE_URL).
```

The system must be runnable on a single developer machine. Hardware minimums and the LM Studio setup
steps are documented in `TECH_STACK.md` §3/§7. Docker/CI are out of scope for v1.

---

## 10. Error handling & safety boundaries

- Invalid input → structured `VALIDATION_ERROR`; never fabricate a value.
- Unknown item in a tool call → rejected with a recoverable error.
- Model unavailable → the chat returns a clear "AI unavailable" state; ordering still works.
- Auth failure → `401`/`403`; never fall back to an implicit role.
- Simulated kitchen status is labelled in the UI.
- No stack traces, secrets, or internal paths in responses.

---

## 11. Open architecture decisions

See `../MEMORY.md` §3: model choice (O-1), embeddings (O-2), vector store (O-3), TTS (O-4),
auth mechanism (O-5), deployment scope (O-6).

---

*This is a logical view. Components marked as target are not yet implemented; see
`../IDE_Context.md` §3 for the verified build state.*
