# VeeraServe — Project Memory

**Status:** Living document
**Purpose:** The single place to record decisions, open questions, risks, glossary terms, and a
running changelog. If a material choice is made, it is recorded here before it is implemented.

> Rule: *If it is not in `MEMORY.md`, it was not decided.*

---

## 1. How to use this document

- **Decisions (D-n):** accepted, current-state choices. Add a new decision rather than editing an
  old one; mark superseded decisions explicitly.
- **Open items (O-n):** unresolved questions. Each must be closed (with a decision) or explicitly
  deferred before the phase that depends on it.
- **Risks (R-n):** known project risks with likelihood, impact, and mitigation.
- **Glossary:** shared vocabulary so all documents use the same terms.
- **Changelog / session records:** append-only history of meaningful changes.

---

## 2. Decision log

| ID | Decision | Rationale | Status |
|---|---|---|---|
| D-1 | Canonical naming: **Veeradhar Dhaba** (restaurant), **VeeraServe** (bot). | Removes brand inconsistency between README and UI. | Accepted |
| D-2 | **Local-first, zero-cost AI**: small open models + `faster-whisper`. No paid APIs. | Budget and offline-demo requirements for a college project. | Accepted |
| D-3 | Front end is **React + TypeScript** (migrated from JavaScript). | Type safety across API and agent contracts; professional standard. | Accepted |
| D-4 | Backend is **FastAPI + SQLAlchemy + Pydantic**; SQLite for development, Postgres-compatible. | Typed API, easy local setup, production-ready path. | Accepted |
| D-5 | Agent orchestration uses **LangGraph** with tool-calling. | Explicit state machine, deterministic control flow, easy to diagram/defend. | Accepted |
| D-6 | AI answers are **grounded in a canonical menu** via retrieval (RAG); no hallucinated dishes or prices. | Turns the original gimmick into a defensible GenAI contribution. | Accepted |
| D-7 | **Single source of truth** for menu data: `data/menu.seed.json`. | Eliminates duplicate menu definitions. | Accepted |
| D-8 | Chat responses stream to the client via **SSE** (fallback: chunked JSON). | Perceived latency and "real-time" honesty. | Accepted |
| D-9 | Documentation is grouped under `docs/` with uppercase filenames and topical subfolders. | Readability and professional structure. | Accepted |
| D-10 | Kitchen/order status is **simulated** but explicitly labelled, unless a real integration is added. | Honest about scope while still demoable. | Accepted |
| D-11 | Local model runtime is **LM Studio**, accessed through its **OpenAI-compatible local server** (`LLM_BASE_URL`, default `http://localhost:1234/v1`); the app uses a standard OpenAI client, not an Ollama-specific client. Supersedes the Ollama runtime assumption in D-2. | Chosen platform; keeps the backend runtime-agnostic and OpenAI-compatible while remaining fully local and zero-cost. | Accepted |
| D-12 | RAG vector store is **Chroma** (persistent local client), embeddings from LM Studio (`nomic-embed-text`). | Persistent, zero-service, Python-native; simplest path to grounded retrieval (resolves O-3). | Accepted |
| D-13 | Chat replies stream over **SSE** (`POST /api/v1/chat`); the deterministic graph reply is authoritative and any LLM rephrasing is **verification-gated** (fallback to the template when it introduces an ungrounded price). Voice is **faster-whisper** in-process; TTS is browser `speechSynthesis`. | Keeps the demo honest and offline: streamed, grounded output that degrades safely when the model is unavailable (implements D-8). | Accepted |
| D-14 | The **database is the runtime source of truth** for the menu. Startup seeding is **add-only** (bootstrap from `data/menu.seed.json`, never overwrite existing rows), and Chroma is re-indexed **from the DB** (`reindex_menu`) after seeding and after every admin mutation. Refines D-7 (the seed stays the canonical *initial* catalogue). | Admin CRUD edits must persist and propagate to the diner menu and the agent; keeps a single definition of menu data while making it editable at runtime. | Accepted |
| D-15 | Evaluation harness conventions: (a) the shipped **agent path is measured as-is** (Mode `agent`) while the **RAG ablation** uses direct-LLM modes (`llm-rag` vs `llm-no-rag`) so retrieval value is isolated from the deterministic tools; (b) groundedness passes only if **every ₹ amount is a real menu price** and the requested dish/price is present, while negative traps must be **refused without a price**; (c) tool accuracy scores an **ordered subsequence** of expected calls with exact ids/quantities and substring matching for free-text args (extra chained calls are allowed); (d) agent nodes record `tool_calls` (name + args) per turn for scoring. | The deterministic graph is DB-grounded by construction, so measuring it alone cannot show retrieval's contribution; explicit, documented scoring rules keep M-1–M-3 reproducible and auditable. | Accepted |

### Superseded decisions

*(none yet)*

---

## 3. Open items

| ID | Open question | Needed by | Notes |
|---|---|---|---|
| O-1 | Final chat model loaded in LM Studio: Qwen2.5-VL-3B vs Qwen2.5-7B-Instruct vs Llama-3.1-8B (GGUF quantisations). | Phase P6 | Default pinned to `qwen2.5-vl-3b-instruct` (P6.1); confirm against real hardware/tool-calling in P6.4–P6.5. |
| O-2 | Embedding model in LM Studio: `nomic-embed-text` vs `mxbai-embed-large`. | Phase P6 | Default pinned to `nomic-embed-text` (P6.1); validate retrieval quality in P6.2. |
| O-4 | Text-to-speech: browser `SpeechSynthesis` vs local Piper. | Phase P6 | Browser is zero-install; Piper is more natural but heavier. |
| O-5 | Auth mechanism: custom JWT vs server session cookie. | Phase P4 | Default proposal: JWT for API simplicity. |
| O-6 | Demo deployment scope: strictly local Docker vs a hosted demo link. | Phase P8 | Hosted demo complicates the "zero-cost local model" story. |
| O-7 | Groundedness evaluation dataset (curated question set size and composition). | Phase P8 | See `evaluation/EVALUATION.md`. |
| O-8 | Whether to include a multilingual mode (Hindi/Marathi). | Backlog | Nice-to-have; depends on remaining time. |

---

## 4. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | Small local model tool-calling is unreliable. | High | High | Constrain tools, use structured JSON output, validate server-side, retry, and fall back to deterministic parsing. |
| R-2 | LM Studio models exceed demo hardware (RAM/CPU). | Medium | High | Document minimum specs and the LM Studio setup; keep models ≤ ~7B; support a Qwen2.5-VL-3B GGUF as the low-end default. |
| R-3 | Vision quality on a 3B multimodal model is poor. | Medium | Medium | Scope vision to "suggest similar dishes" rather than precise identification; label uncertainty. |
| R-4 | Whisper transcription latency on CPU is high. | Medium | Medium | Use the `base`/`small` model; show a transcribing state; allow text fallback. |
| R-5 | Scope creep vs. academic timeline. | High | High | Phase gates in `TASKS.md`; P0–P6 are required, P7–P8 are the finishing line. |
| R-6 | Architecture drift between docs and code. | Medium | Medium | `IDE_Context.md` + `RULES.md` require docs updates in the same change as code. |

---

## 5. Glossary

| Term | Meaning |
|---|---|
| **Veeradhar Dhaba** | The restaurant the system serves. |
| **VeeraServe / Veera** | The AI waiter system and its conversational persona. |
| **Agent** | An LLM-driven component that reasons and calls tools to accomplish a task. |
| **Agentic** | Behaviour where the model autonomously plans and takes actions (e.g., adding to cart), not just replies. |
| **Tool / function call** | A machine-readable action the model requests (e.g., `add_to_cart`). |
| **RAG** | Retrieval-Augmented Generation: grounding model output in retrieved, real data. |
| **Groundedness** | The degree to which a response is supported by the source data (the menu). |
| **Hallucination** | A model claim not supported by real data (e.g., a dish or price that does not exist). |
| **Happy Hour** | Discounted bar pricing period; items carry both Regular and Happy-Hour prices. |
| **STT / TTS** | Speech-to-Text / Text-to-Speech. |
| **SSE** | Server-Sent Events, a one-way streaming channel from server to browser. |
| **MCP** | Model Context Protocol (optional future integration for tool servers). |
| **LM Studio** | Desktop application for downloading and running local open models in GGUF format, with a built-in OpenAI-compatible server. |
| **OpenAI-compatible API** | The `/v1/chat/completions` and `/v1/embeddings` REST shape that LM Studio exposes, allowing a standard OpenAI client to talk to a local model. |
| **GGUF** | The quantised local model file format used by LM Studio. |
| **Seed data** | Canonical starting data loaded into the database (`data/menu.seed.json`). |
| **Gate** | A checkpoint in `TASKS.md` that must pass before the next phase. |

---

## 6. Changelog

| Date | Change | Related |
|---|---|---|
| (baseline) | Documentation suite v1.0 created; supersedes the previous XTrust/sample documentation. | `INDEX.md` |
| (baseline) | Project repositioned as GenAI mini-project; agentic AI waiter defined as the core contribution. | `ORIGINAL_IDEA.md` |
| (baseline) | Canonical naming and local-first AI strategy fixed. | D-1, D-2 |
| (rev) | Local model runtime changed from Ollama to **LM Studio** (OpenAI-compatible local server) across the documentation suite. | D-11 |
| (rev) | `TASKS.md` reformatted as a granular, one-task-per-commit checklist (phases P0–P9, `Update - <phase>.<task>` commit messages, phase checkpoints). | `TASKS.md` |
| (rev) | Phase P0 complete: repository hygiene, pinned backend deps, env samples, README rewrite; tagged `docs-baseline`. | `TASKS.md`, `README.md` |
| (rev) | Phase P1.1: Vite app moved to `frontend/`; backend reshaped into `backend/app/` with a thin `backend/main.py` entry. | `TASKS.md` |
| (rev) | Phase P1.2: canonical `data/menu.seed.json` (+ `menu.schema.json`) created by one-off `scripts/convert_menu.mjs`; legacy `mockData.js` and `data/menu.md` retired; front end reads the seed. | D-7 |
| (rev) | Phase P1.3: added `docker-compose.yml` skeleton (frontend, backend, chroma, db) with `LLM_BASE_URL=http://host.docker.internal:1234/v1`; added `backend/app/core/config.py` (Pydantic BaseSettings) and removed the hard-coded API URL from the front end. | D-11, TECH_STACK §7 |
| (rev) | Phase P1.4: minimalist FastAPI app + `GET /api/v1/health` and the first backend test; the legacy Ollama chat router is unwired pending its rebuild in P6. | D-11, TASKS P1.4 |
| (rev) | Phase P2.1: front end migrated to TypeScript (`.ts`/`.tsx`, `strict`); added `typescript`, `@types/*`, `typescript-eslint`, a `typecheck` script, `src/vite-env.d.ts`, and `src/types/domain.ts`; the ESLint flat config now lints `{ts,tsx}`. `tsc --noEmit`, lint, and build all pass. | TASKS P2.1 |
| (rev) | Phase P2.2: added `frontend/src/types/api.ts` (API DTOs mirroring the documented data model/seed — `MenuSeedDto`, `MenuItemDto`, `CategoryDto`, `HealthResponse`, `ChatResponse`); `data/menu.ts` and `utils/bot.ts` now use them instead of inline types. | TASKS P2.2 |
| (rev) | Phase P2.3: design tokens centralised in `frontend/src/styles/tokens.css`; added shared primitives under `frontend/src/components/ui/` (`Button`, `Card`, `Badge`, `OrderStatusBadge`, `Input`, `Spinner`, `EmptyState`, `Modal`) and adopted them across screens/components, removing duplicated status-pill, empty-state, button, input, and card-wrapper markup. | TASKS P2.3 |
| (rev) | Phase P2.4: adopted TanStack Query (`QueryClientProvider`), added `src/lib/{apiClient,queryClient}.ts` and `src/hooks/useHealth.ts`, and surfaced backend status in the right rail; `tsc`, lint, and build pass (Gate 2 met). | TASKS P2.4 |
| (rev) | Phase P3.1: added the SQLAlchemy data layer (`backend/app/db/`: `base.py`, `session.py`, `init_db.py`) and all eight models (`users`, `categories`, `menu_items`, `orders`, `order_items`, `feedback`, `sessions`, `reservations`); dev `create_all` runs on startup; schema test added. | TASKS P3.1 |
| (rev) | Phase P3.2: added an idempotent seeder (`backend/app/db/seed.py`, upsert by seed id, runnable as `python -m app.db.seed` and invoked on startup) and `MenuService` (`backend/app/services/menu.py`) with category/item reads and category/veg/max-price/search filters; seeder/filter tests added. | TASKS P3.2 |
| (rev) | Phase P3.3: added read endpoints `GET /api/v1/categories`, `GET /api/v1/menu` (category/veg/max-price/search filters), and `GET /api/v1/menu/{id}` (404 on unknown id) with Pydantic response models (`backend/app/schemas/menu.py`, `backend/app/api/menu.py`). | TASKS P3.3 |
| (rev) | Phase P3.4: added read API tests (`backend/tests/conftest.py` with an in-memory SQLite + seeded `get_db` override, and `backend/tests/test_api/test_menu.py` covering happy path, filters, and 404). Gate 3 met; `pytest` passes (9 tests). | TASKS P3.4 |
| (rev) | Phase P4.1: added the auth core — bcrypt password hashing and PyJWT issuance (`backend/app/core/security.py`), user service, auth schemas, and `POST /api/v1/auth/register` + `POST /api/v1/auth/login`; pinned `bcrypt`/`PyJWT`; aligned user role default to `user`. | TASKS P4.1 |
| (rev) | Phase P4.2: added server-side role enforcement (`backend/app/api/deps.py`: `get_current_user`, `get_optional_user`, `require_roles(*roles)` with 401/403) and `GET /api/v1/auth/me` as the first protected route. | TASKS P4.2 |
| (rev) | Phase P4.3: added the orders API (`backend/app/schemas/order.py`, `backend/app/services/order.py`, `backend/app/api/orders.py`) — server-validated totals (menu-priced subtotal + 5% GST, `gst_rate` config), guest-friendly placement, scoped listing/detail with ownership, and staff/admin-only `pending→preparing→ready→served` transitions. | TASKS P4.3 |
| (rev) | Phase P4.4: added the feedback and reservations APIs (`backend/app/api/{feedback,reservations}.py`) — feedback with 1–5 rating validation and admin-only listing, and reservations (party size ≥ 1, valid time) with guest submissions and scoped listing. | TASKS P4.4 |
| (rev) | Phase P4.5: added auth/write-path tests (`backend/tests/test_auth/`, `backend/tests/test_api/test_orders.py`, `backend/tests/test_api/test_feedback.py`) covering hashing/JWT, 401/403 RBAC, ownership, server-side totals, status transitions, and rating bounds. Gate 4 met; `pytest` passes (26 tests). | TASKS P4.5 |
| (rev) | Phase P5.1: built the typed API client (auth-token attachment + typed `ApiError`), `AuthContext`, real login/register UI, and `RequireAuth`/`RequireRole` route guards; widened `UserRole`; moved identity out of `AppDataContext`. `tsc`, lint, and build pass. | TASKS P5.1 |
| (rev) | Phase P5.2: wired the diner catalog to the API — added `src/hooks/useMenu.ts` + `src/utils/menuMapper.ts` and switched `MenuScreen`/`HomeScreen`/`ItemDetailsScreen`/`CartScreen`/`RightRail`/`ChatContext` to server menu/categories with server-side filters; cart carries API ids/prices. Admin menu remains mock until P7. | TASKS P5.2 |
| (rev) | Phase P5.3: added `src/hooks/useOrders.ts` and wired checkout (persists table number/payment/instructions via `POST /orders`), order tracking (polling `GET /orders/{id}` with a summary), the orders list, and profile order history to the API. | TASKS P5.3 |
| (rev) | Phase P5.4: added `PATCH /api/v1/auth/me/preferences` (`UserPreferences`, `update_preferences`, preferences on `UserOut`) and wired the feedback form (three 1–5 ratings validated, guest-friendly) and profile preferences (veg/spice/allergies) to the API. | TASKS P5.4 |
| (rev) | Phase P5.5: added the frontend test stack (Vitest 5 + Testing Library, `vite.config.ts` test block, `src/test/setup.ts`) and `CheckoutScreen.test.tsx` covering the cart→checkout→order flow (`npm run test`, 5 tests). Gate 5 met. | TASKS P5.5 |
| (rev) | Phase P6.1: added `app/llm/{client,health}.py` + `GET /api/v1/health/llm`, pinned chat/vision/embedding model defaults, and removed the superseded Ollama AI plumbing. | TASKS P6.1 |
| (rev) | Phase P6.2: added `app/rag/{ingest,retriever}.py` (Chroma + LM Studio embeddings, idempotent seeding, DB-validated retrieval) and backend startup indexing with graceful degradation. | TASKS P6.2 |
| (rev) | Phase P6.3: added the validated tool layer (`app/agent/tools/`, 12 tools) with a session cart; `place_order` is confirmation-gated and cart/offer tools mutate real state. | TASKS P6.3 |
| (rev) | Phase P6.4: added `app/agent/{state,intents,memory,nodes,graph,runner}.py` — a LangGraph supervisor→guardrails→specialist graph (rule-based routing), deterministic grounded replies, confirmation-gated preference memory, and an `InMemorySaver` checkpointer via `run_agent`. | TASKS P6.4 |
| (rev) | Phase P6.5: added the SSE chat endpoint (`POST /api/v1/chat`, `app/api/chat.py` + `app/agent/streaming.py`), vision (`app/llm/vision.py`), voice (`app/services/transcription.py`), and verification-gated response polishing (`app/agent/polish.py`); rewired the chat UI to stream tokens/tool events/cart with optional TTS. | TASKS P6.5 |
| (rev) | Phase P7.1: added admin-only menu CRUD (`POST/PATCH/DELETE /api/v1/menu[/{id}]`, `POST /api/v1/categories`) with slug ids and validation, made startup seeding add-only, and re-indexed Chroma from the DB; rebuilt the admin menu screen on the API (`useAdminMenu`). | TASKS P7.1, D-14 |
| (rev) | Phase P7.2: added a `status` filter to `GET /api/v1/orders` (validated) and rebuilt the admin order screen on the API with status filter tabs, timelines, and forward-only "Mark <next>" transitions. | TASKS P7.2 |
| (rev) | Phase P7.3: added `GET /api/v1/analytics/dashboard` (`app/services/analytics.py`, admin-only) computing revenue, order counts, 7-day trend, top items, peak hours and ratings from the DB; rebuilt `AdminDashboardScreen` on it and deleted the random charts and the mock store (`AppDataContext`, `data/demoData.ts`, `data/menu.ts`). | TASKS P7.3 |
| (rev) | Phase P7.4: added a persisted `Feedback.acknowledged` flag (with a startup column backfill for existing SQLite dev DBs) and `PATCH /api/v1/feedback/{id}/acknowledge`; built the admin feedback inbox and role-gated admin navigation. Gate 7 met. | TASKS P7.4 |
| (rev) | Phase P8.1: built the evaluation harness (`evaluation/harness/`: in-memory seeded DB, grounding checks, tool-call matching, result JSON writer) with `grounding.json` (48 positives + 16 traps) and `tools.json` (40 utterances); agent nodes now record per-turn `tool_calls` (name + args). Baseline agent run: groundedness 1.000, hallucination 0.000, refusal 1.000, tool accuracy 1.000. | TASKS P8.1, D-15 |

---

## 7. Session records

Session records are appended here after each meaningful work session, in the style:

```
YYYY-MM-DD — Session summary
- Completed: ...
- Decisions: D-n ...
- Open items opened/closed: ...
- Next: ...
```

### Session 0 — Documentation baseline

- **Completed:** Created the full VeeraServe documentation suite (16 documents). Removed the
  previous unrelated (XTrust/sample) documentation from `docs/`.
- **Decisions:** D-1 … D-10 established as the initial baseline.
- **Open items opened:** O-1 … O-8.
- **Next:** Repository hygiene and restructure (Phase P0 → P1 in `TASKS.md`).

### Session 1 — Runtime and plan revision

- **Completed:** Migrated the entire documentation suite from Ollama to **LM Studio** (open
  OpenAI-compatible local server). Reformatted `TASKS.md` into a granular, one-task-per-commit
  checklist (phases P0–P9) with `Update - <phase>.<task>` commit messages and phase checkpoints.
- **Decisions:** Added D-11 (LM Studio runtime); D-2 reworded to be runtime-agnostic.
- **Open items updated:** O-1/O-2 restated in LM Studio GGUF terms; all others unchanged.
- **Next:** Phase P0 (repository hygiene), then P1 (restructure).

### Session 2 — Repository restructure (P0–P1.4)

- **Completed:** Phase P0 (hygiene: junk/asset removal, `.gitignore`, `.editorconfig`, pinned backend
  dependencies, env samples, README, `docs-baseline` tag); Phase P1.1 (front end moved to `frontend/`,
  backend reshaped into `backend/app/` with a thin entry point); Phase P1.2 (canonical menu seed);
  Phase P1.3 (Docker skeleton + centralised `config.py`); Phase P1.4 (minimal FastAPI app + health
  endpoint + first test).
- **Decisions:** none new. Menu single source of truth realised for D-7.
- **Open items opened/closed:** none.
- **Next:** Phase P2 (TypeScript migration & design system).

### Session 3 — TypeScript migration (P2.1–P2.2)

- **Completed:** Phase P2.1 — added `tsconfig.json` (`strict: true`), `typescript`/`@types/react`/
  `@types/node`/`typescript-eslint` (aligned `@types/react` to React 18), a `typecheck` script, and
  `src/vite-env.d.ts`; renamed all `src` files `.jsx`→`.tsx` / `.js`→`.ts` and `vite.config.js`→
  `.ts`; updated `index.html`. Typed the shared layer (contexts, `utils`, `data`) and added a minimal
  `src/types/domain.ts` to satisfy strict mode, then typed the components and screens. Extended the
  ESLint flat config to lint `{ts,tsx}` via `typescript-eslint`. `tsc --noEmit`, `npm run lint`, and
  `npm run build` all pass. Phase P2.2 — added `src/types/api.ts` (API DTOs; `data/menu.ts` and
  `utils/bot.ts` now use them).
- **Decisions:** none new. Domain types were pulled forward from P2.2 as a strict-mode prerequisite;
  P2.2 became the API-contract (DTO) layer, with order/user/feedback DTOs deferred to P3+.
- **Open items opened/closed:** none.
- **Next:** Phase P2.3 (design tokens & UI primitives), then P2.4 (server-state & typecheck pass).

### Session 4 — Design system (P2.3)

- **Completed:** Phase P2.3 — centralised the design tokens (DESIGN.md §2) in
  `frontend/src/styles/tokens.css`, imported by `index.css`; added shared primitives under
  `frontend/src/components/ui/` (`Button`, `Card` (polymorphic `as`), `Badge`, `OrderStatusBadge`,
  `Input`, `Spinner`, `EmptyState`, `Modal`) with a barrel export; and adopted them across
  screens/components — replacing the duplicated order-status pill logic, empty states, primary/
  outline buttons, form inputs, and `card-3d` wrappers. `tsc --noEmit`, `npm run lint`, and
  `npm run build` all pass.
- **Decisions:** none new. `Spinner`/`Modal` are provided as design-system primitives (per TASKS
  P2.3) and will be adopted as loading/modal surfaces are introduced.
- **Open items opened/closed:** none.
- **Next:** Phase P2.4 (server-state management & typecheck pass), then Phase P3 (data layer & read APIs).

### Session 5 — Server-state tooling (P2.4)

- **Completed:** Phase P2.4 — added `@tanstack/react-query`; introduced a typed fetch wrapper
  (`frontend/src/lib/apiClient.ts` with `apiGet`/`apiPost`/`apiPostForm` and `ApiError`) and a
  configured `QueryClient` (`frontend/src/lib/queryClient.ts`); wrapped the app in
  `QueryClientProvider`; added the typed `useHealth` hook (`frontend/src/hooks/useHealth.ts`) and
  surfaced the AI-backend status (with the `Spinner` primitive) in the right rail; routed `utils/bot.ts`
  through `apiPostForm`. `tsc --noEmit`, `npm run lint`, and `npm run build` all pass.
- **Decisions:** none new. Gate 2 (fully TypeScript, type-checks clean, shared design system) is met.
- **Open items opened/closed:** none.
- **Next:** Phase P3 (data layer & read APIs) — database models, seeder/menu service, read endpoints, and the typed front-end query hooks against them.

### Session 6 — Data layer (P3.1)

- **Completed:** Phase P3.1 — added `backend/app/db/` (`base.py` with the SQLAlchemy 2.0
  `DeclarativeBase`, `session.py` with the engine/`SessionLocal`/`get_db`, `init_db.py` with a dev
  `create_all`) and the eight ORM models per `ARCHITECTURE.md` §6 using typed `Mapped[...]` columns
  (`users`, `categories`, `menu_items`, `orders`, `order_items`, `feedback`, `sessions`,
  `reservations`). `init_db()` is invoked from a FastAPI lifespan so the schema is created on startup.
  Added `tests/test_db/test_schema.py`; `pytest` passes (2 tests).
- **Decisions:** dev database uses `create_all` (no Alembic yet) — Alembic can be introduced in a later
  phase if migrations are needed; `menu_items`/`categories` use the seed's stable string ids as PKs.
- **Open items opened/closed:** none.
- **Next:** Phase P3.2 (idempotent seeder + `MenuService`).

### Session 7 — Menu service (P3.2)

- **Completed:** Phase P3.2 — added `backend/app/db/seed.py`, an idempotent seeder that loads
  `data/menu.seed.json` (path from the new `menu_seed_path` setting) and upserts categories/items by
  their stable seed ids; it runs on app startup and can be run manually as `python -m app.db.seed`.
  Added `backend/app/services/menu.py` (`MenuService`) as the single menu accessor with category/item
  reads and `category`/`veg`/`max_price`/`search` filters. Added idempotency and filter tests; `pytest`
  passes (4 tests).
- **Decisions:** the seeder runs at startup so a fresh dev database always matches the canonical seed;
  seeding is idempotent, so re-runs are safe.
- **Open items opened/closed:** none.
- **Next:** Phase P3.3 (read endpoints over `MenuService`).

### Session 8 — Read endpoints (P3.3)

- **Completed:** Phase P3.3 — added `backend/app/schemas/menu.py` (`CategoryOut`, `MenuItemOut` with
  `from_attributes`) and `backend/app/api/menu.py` exposing `GET /api/v1/categories`,
  `GET /api/v1/menu` (filters: `category`, `veg`, `max_price`, `search`), and `GET /api/v1/menu/{id}`
  (404 on unknown id); wired the router into the app.
- **Decisions:** read endpoints delegate all data access to `MenuService`; response shapes are Pydantic
  models so they appear in the OpenAPI schema.
- **Open items opened/closed:** none.
- **Next:** Phase P3.4 (read API tests).

### Session 9 — Read API tests (P3.4)

- **Completed:** Phase P3.4 — added `backend/tests/conftest.py` (in-memory SQLite engine with a seeded
  `get_db` dependency override) and `backend/tests/test_api/test_menu.py` covering the categories list,
  the menu happy path, the `veg`/`max_price`/`search`/`category` filters, item detail, and the 404 case.
  `pytest` passes (9 tests). **Gate 3 met.**
- **Decisions:** API tests run against an isolated in-memory SQLite database seeded from
  `data/menu.seed.json`, so they never touch the dev database file.
- **Open items opened/closed:** none.
- **Next:** Phase P4 (auth & write APIs).

### Session 10 — Auth core (P4.1)

- **Completed:** Phase P4.1 — added `backend/app/core/security.py` (bcrypt password hashing with a
  72-byte clamp, `verify_password`, and PyJWT `create_access_token`/`decode_access_token`),
  `backend/app/services/user.py` (register/authenticate/get-by-email), `backend/app/schemas/auth.py`,
  and `backend/app/api/auth.py` (`POST /api/v1/auth/register` → 201 + token, 409 on duplicate email;
  `POST /api/v1/auth/login` → bearer token, 401 on bad credentials). Pinned `bcrypt==5.0.0` and
  `PyJWT==2.15.1`. Aligned the `users.role` default to the canonical `user`.
- **Decisions:** registration always creates a `user`-role account (privileged roles are never
  self-assigned); passwords are never stored or logged in plaintext; the dev `JWT_SECRET` default is a
  ≥32-byte placeholder to satisfy HMAC key-length guidance.
- **Open items opened/closed:** none.
- **Next:** Phase P4.2 (server-side role enforcement).

### Session 11 — Role enforcement (P4.2)

- **Completed:** Phase P4.2 — added `backend/app/api/deps.py` with `get_current_user`,
  `get_optional_user`, and `require_roles(*roles)`, plus `CurrentUser`/`OptionalUser` aliases. Invalid or
  missing tokens yield 401; a disallowed role yields 403. Added `GET /api/v1/auth/me` as the first
  protected route.
- **Decisions:** roles are enforced exclusively server-side from the JWT `sub`/`role` claims; the
  client can never elevate its own role (fixes the original dropdown-escalation defect).
- **Open items opened/closed:** none.
- **Next:** Phase P4.3 (orders API).

### Session 12 — Orders API (P4.3)

- **Completed:** Phase P4.3 — added `backend/app/schemas/order.py`, `backend/app/services/order.py`, and
  `backend/app/api/orders.py`. `POST /api/v1/orders` prices every line from the database menu (client
  never sends money), computes `subtotal`, 5% `gst` (config `gst_rate`), `discount` (0 for now), and
  `total`, and accepts guest orders (`user_id` null). `GET /api/v1/orders` is scoped (staff/admin see all;
  diners see their own); `GET /api/v1/orders/{id}` enforces ownership; `PATCH /api/v1/orders/{id}/status`
  is staff/admin-only and follows `pending→preparing→ready→served`. Added `payment_methods` config.
- **Decisions:** totals are always recomputed server-side from persisted menu prices (fixes the
  discarded-checkout defect); the status machine is forward-only; guests may place orders but must
  authenticate to list/detail.
- **Open items opened/closed:** none.
- **Next:** Phase P4.4 (feedback & reservations APIs).

### Session 13 — Feedback & reservations (P4.4)

- **Completed:** Phase P4.4 — added `backend/app/schemas/{feedback,reservation}.py`,
  `backend/app/services/{feedback,reservation}.py`, and `backend/app/api/{feedback,reservations}.py`.
  `POST /api/v1/feedback` validates `food_rating`/`service_rating`/`ai_rating` to 1–5 (422 otherwise;
  fixes the old 15/5 defect) and allows guests; `GET /api/v1/feedback` is admin-only.
  `POST /api/v1/reservations` enforces party size ≥ 1 and a valid time and allows guests;
  `GET /api/v1/reservations` is scoped (staff/admin see all, diners their own).
- **Decisions:** ratings model uses three 1–5 dimensions (food/service/ai) matching the model; feedback
  and reservations accept guests (nullable `user_id`) but require auth to list.
- **Open items opened/closed:** none.
- **Next:** Phase P4.5 (auth & write-path tests).

### Session 14 — Auth & write-path tests (P4.5)

- **Completed:** Phase P4.5 — added `backend/tests/test_auth/` (bcrypt/JWT round-trip plus
  register/login/duplicate-email/401 cases) and write-path tests `backend/tests/test_api/test_orders.py`
  and `backend/tests/test_api/test_feedback.py`. Coverage includes server-side total computation,
  guest ordering, scoped listing, ownership 403, staff-only status transitions with forward-only rules,
  rating-bound 422s, and admin-only feedback listing. Added shared `create_user`/`auth_headers` fixtures.
  `pytest` passes (26 tests). **Gate 4 met — the backend is complete and testable via curl/Postman.**
- **Decisions:** role-specific accounts are created directly in tests via the shared `create_user`
  fixture (roles are never self-assigned through the API).
- **Open items opened/closed:** none.
- **Next:** Phase P5 (front-end integration, ordering MVP).

### Session 15 — API client & auth (P5.1)

- **Completed:** Phase P5.1 — reworked `frontend/src/lib/apiClient.ts` to attach a bearer token and
  surface typed `ApiError`s (with the backend `detail`), added `src/lib/authToken.ts`, and added
  `src/context/AuthContext.tsx` (login/register/logout with persisted token + user). Rewrote
  `LoginScreen` as a real login/register form (guest continue preserved, role dropdown removed) and added
  `RequireAuth`/`RequireRole` guards on `/profile`, `/orders`, and `/admin*`. Widened `UserRole` to
  `guest|user|staff|admin` and removed mock auth from `AppDataContext` (identity now comes from
  `AuthContext`). `tsc`, lint, and build pass.
- **Decisions:** the JWT is stored under `STORAGE_KEYS.token` and attached by the API client; admin
  routes are role-guarded on the client in addition to server enforcement; the user's role is never
  chosen in the UI.
- **Open items opened/closed:** none.
- **Next:** Phase P5.2 (wire catalog & cart to the API).

### Session 16 — Catalog & cart on the API (P5.2)

- **Completed:** Phase P5.2 — added `frontend/src/hooks/useMenu.ts` (`useCategories`, `useMenuItems`,
  `useMenuItem`) with `frontend/src/utils/menuMapper.ts` mapping API `MenuItemDto` -> domain `MenuItem`
  (hiding bar/alcoholic/unpriced items) and switched the diner surfaces (`MenuScreen` with server-side
  category/search filters, `HomeScreen`, `ItemDetailsScreen`, `CartScreen`, `RightRail`, `ChatContext`)
  from the local seed to the API. Cart entries now reference server menu ids and prices; totals are
  recomputed by the API at order time (P5.3).
- **Decisions:** the diner catalog reads the API; admin menu management keeps the mock store until P7,
  so `data/menu.ts` remains only for admin screens in the interim.
- **Open items opened/closed:** none.
- **Next:** Phase P5.3 (checkout, tracking & order history).

### Session 17 — Checkout, tracking & history (P5.3)

- **Completed:** Phase P5.3 — added `frontend/src/hooks/useOrders.ts` and wired `CheckoutScreen`
  (posts `POST /orders` with table number, payment method, and instructions; server prices the order),
  `TrackOrderScreen` (polls `GET /orders/{id}` until served and shows a priced summary),
  `OrdersScreen` (scoped list with polling), and the `ProfileScreen` order history to the API.
- **Decisions:** order money values are always what the API returns (the client never sends totals);
  tracking polls every 4–5s and stops once the order is served.
- **Open items opened/closed:** none.
- **Next:** Phase P5.4 (feedback form & profile preferences).

### Session 18 — Feedback form & preferences (P5.4)

- **Completed:** Phase P5.4 — added backend `PATCH /api/v1/auth/me/preferences` (`UserPreferences`
  schema with `spice_level` 0–4, `update_preferences` service, `preferences` on `UserOut`) and
  frontend `useUpdatePreferences`/`useSubmitFeedback` hooks; rewrote `FeedbackScreen` to POST three
  1–5 ratings (guest-friendly, no public list) and wired the `ProfileScreen` preferences tab
  (veg/spice/allergies) to persist. `AuthContext` gained `updateUser`.
- **Decisions:** users' preferences live in the existing JSON column and are surfaced on the user
  object so the agent can read them later; `AuthContext` exposes `updateUser` for in-place refresh
  after a profile write; `GET /feedback` stays admin-only, so the diner screen no longer lists it.
- **Open items opened/closed:** none.
- **Next:** Phase P5.5 (ordering flow tests).

### Session 19 — Ordering flow tests (P5.5) & Gate 5

- **Completed:** Phase P5.5 — added the frontend test stack (Vitest 5 pinned for Vite 8
  compatibility, `jsdom`, Testing Library + jest-dom/user-event), a test block in `vite.config.ts`,
  `src/test/setup.ts` (jest-dom matchers, `matchMedia` stub, cleanup), and
  `src/screens/CheckoutScreen.test.tsx` covering totals, order submission → cart clear → navigation,
  table/payment/instructions, empty-cart blocking, and API-error surfacing. Added `npm run test`/
  `test:watch` scripts. **Gate 5 (MVP-minus-AI) met.**
- **Decisions:** mocks the `apiClient` module in tests (deterministic) rather than `fetch`; Vitest is
  pinned to v5 so it shares the project's Vite 8 (v2 nested an older Vite and broke `tsc`).
- **Open items opened/closed:** none.
- **Next:** Phase P6 (Agentic AI core).

### Session 20 — LLM client & LM Studio readiness (P6.1)

- **Completed:** Phase P6.1 — added `backend/app/llm/client.py` (`chat_completion`, `LLMError`;
  OpenAI-compatible wrapper that targets `LLM_BASE_URL` and turns runtime failures into a typed
  error) and `backend/app/llm/health.py` (`probe_llm`/`LLMStatus` reading the loaded model id,
  context length, and an explicit unavailable state). Exposed `GET /api/v1/health/llm`. Pinned
  `llm_chat_model`/`llm_vision_model`/`llm_embedding_model`/`llm_context_length` in `config.py`
  and `.env.example`. Removed the superseded Ollama `services/ai_service.py` and the unwired
  `api/chat.py` placeholder (rebuilt in P6.4/P6.5).
- **Decisions:** chat and vision share the low-end Qwen2.5-VL-3B default (O-1) with embeddings on
  `nomic-embed-text` (O-2); the readiness probe uses the OpenAI `/models` endpoint for availability
  and LM Studio's native `/api/v0/models` for `max_context_length`, degrading gracefully if either
  is missing.
- **Open items opened/closed:** none (O-1/O-2 defaults pinned, final confirmation deferred to P6.4/P6.5).
- **Next:** Phase P6.2 (RAG grounding).

### Session 21 — RAG grounding (P6.2)

- **Completed:** Phase P6.2 — added `backend/app/rag/ingest.py` (renders each menu item to compact
  text, embeds via the LM Studio embeddings endpoint through `app/llm/client.embed_texts`, upserts
  into a persistent Chroma collection with item metadata, removes stale ids, and skips re-indexing
  when the seed version is unchanged) and `backend/app/rag/retriever.py` (`retrieve_menu_items`
  top-k with optional category/veg/price/spice filters that only returns ids validated against the
  database). Wired `ensure_menu_indexed()` into the app lifespan with graceful degradation when
  LM Studio is down. Added `chromadb==1.5.9` (and bumped the `pydantic` pin to 2.14.1) plus
  `vector_store_path`/`rag_collection_name`/`rag_top_k` config.
- **Decisions:** **D-12 — vector store is Chroma** (resolves O-3); retrieval is defence-in-depth,
  dropping any vector-store id that is not a real `menu_items` row.
- **Open items opened/closed:** closed **O-3**.
- **Next:** Phase P6.3 (tool layer).

### Session 22 — Tool layer (P6.3)

- **Completed:** Phase P6.3 — added `backend/app/agent/tools/` with strict `extra="forbid"` argument
  schemas, a per-session `Cart`/`ToolContext`, and 12 handlers: `search_menu`, `get_item`,
  `get_recommendations`, `add_to_cart`, `update_cart`, `view_cart`, `apply_offer`, `list_offers`,
  `get_happy_hour_status`, `place_order` (confirmation-gated), `get_order_status`, `book_table`.
  `registry.call_tool` validates args into typed models (unknown fields/invalid quantity rejected as
  recoverable errors) and `openai_tool_schemas()` exposes them for function calling. `create_order`
  gained an optional `discount_rate`; added `happy_hour_start`/`happy_hour_end` config and an
  offer catalog (`WELCOME10`, `FEAST20`).
- **Decisions:** tools mutate real server-side state — `add_to_cart`/`update_cart` operate on the
  session cart (fixing the dead path), `place_order` only creates an order after explicit
  confirmation and clears the cart so it cannot double-order. Catalog tools read the DB directly
  (deterministic, no embeddings), so the tool layer is testable without LM Studio.
- **Open items opened/closed:** none.
- **Next:** Phase P6.4 (agent nodes, memory, guardrails & graph wiring).

---

### Session 23 — Agent graph, memory & guardrails (P6.4)

- **Completed:** Phase P6.4 — added `backend/app/agent/{state,intents,memory,nodes,graph,runner}.py`.
  `AgentState` carries session/user, message, image, intent, retrieved items, tool results, cart
  snapshot, pending confirmation/preference, memory, history and reply. A rule-based supervisor
  classifies the turn (greeting/menu/recommend/order/status/vision/preference + confirm/cancel) and
  a guardrails node blocks prompt-injection, off-topic and (when `alcohol_enabled` is false)
  alcohol requests. Specialist nodes produce deterministic replies grounded in the tool layer
  (menu/recommend lookups, name+quantity order matching, order status, vision-by-text); the ordering
  node stages a cart summary and only calls `place_order` on explicit confirmation. Preference memory
  loads on every turn and is saved only after confirmation. `build_graph` wires
  `START→load_memory→supervisor→guardrails→(specialist)→record→END` with an `InMemorySaver` checkpointer
  keyed by `thread_id`; `run_agent(db, message, …)` is the entry point.
- **Decisions:** routing is deterministic keyword rules (small local models are unreliable routers;
  risk R-1) with model reasoning reserved for P6.5 reply generation. Catalog/ordering nodes call the
  DB-backed tools directly, so the whole graph is testable headless without LM Studio. The `llm`
  handle is threaded through `config["configurable"]` but unused until P6.5.
- **Open items opened/closed:** none (O-1/O-2 remain pending final confirmation in P6.5).
- **Next:** Phase P6.5 (streaming chat API, voice/vision, chat UI).

---

### Session 24 — Streaming chat, voice & vision (P6.5)

- **Completed:** Phase P6.5 — added the streaming chat API and multimodal pipelines:
  `app/api/chat.py` (`POST /api/v1/chat`, multipart, SSE) + `app/agent/streaming.py`
  (`iter_turn_events` emitting `session`/`transcript`/`image`/`intent`/`tool`/`token`/`cart`/`done`),
  `app/llm/vision.py` (image → short dish description via the LM Studio vision model),
  `app/services/transcription.py` (lazy faster-whisper STT), and `app/agent/polish.py` (LLM rephrasing
  whose output is accepted only when `verify_grounded` finds no invented price). The vision node now
  prefers RAG retrieval and falls back to lexical search. Front end: `src/lib/chatStream.ts`
  (SSE-over-fetch generator), rewritten `ChatContext` (streamed tokens, tool-activity labels, cart
  sync via `CartContext.replaceCart`, optional browser TTS), and an updated `ChatWidget` (streaming
  caret + voice toggle); removed the old mock `utils/bot.ts`. Added config `llm_polish_enabled`,
  `stt_model_size`/`stt_device`/`stt_compute_type`; the opt-in live scenarios run only with
  `VEERASERVE_LIVE_LLM=1` and LM Studio up.
- **Decisions:** **D-13** — replies stream over SSE; the deterministic graph reply is authoritative
  and LLM rephrasing is verification-gated with template fallback; polish is **off by default**
  (`LLM_POLISH_ENABLED`) so the default test suite stays fast, offline and deterministic. Upgrade
  path: `langchain-core==1.6.12` (P6.4).
- **Open items opened/closed:** none (O-1/O-2 confirmation still deferred to a real-hardware run).
- **Gate 6 (partial):** scripted order scenarios complete end-to-end and defence-in-depth grounding is
  verified in tests; the groundedness metric from `evaluation/EVALUATION.md` is produced by the P8/P9
  harness. Backend `pytest` 85 passed + 3 live skipped; frontend 11 tests, typecheck/lint/build pass.

### Session 25 — Admin menu CRUD (P7.1)

- **Completed:** Phase P7.1 — the admin console now writes real data. Backend: `POST /api/v1/menu`,
  `PATCH /api/v1/menu/{id}`, `DELETE /api/v1/menu/{id}`, and `POST /api/v1/categories`
  (all `require_roles("admin")`), new `CategoryCreate`/`MenuItemCreate`/`MenuItemUpdate` schemas,
  and `MenuService.create_category/create_item/update_item/delete_item` (slug ids via `_unique_id`,
  `MenuValidationError` on unknown categories). Startup seeding is now add-only and `main.py` calls the
  new `reindex_menu(db)` (DB → Chroma) at startup and after each mutation (failures are logged, not
  fatal). Front end: `src/hooks/useAdminMenu.ts` (list/categories + create/update/delete/create-category
  mutations invalidating the shared `["menu"]` cache) and a rebuilt `AdminMenuScreen` (API-backed create
  form, availability toggle, edit modal, delete, category creation).
- **Decisions:** **D-14** — the database is the runtime source of truth; seeding is bootstrap-only and
  the vector store is re-indexed from the DB (refines D-7).
- **Open items opened/closed:** none (O-1/O-2 unchanged).
- **Verification:** backend `pytest` 96 passed + 3 live skipped; frontend `tsc`/lint/build pass, 11 tests.

### Session 26 — Order management (P7.2)

- **Completed:** Phase P7.2 — staff order management on real data. Backend: `GET /api/v1/orders`
  gained a validated `status` query filter (`list_orders(..., status=...)`, 400 on unknown status);
  staff/admin already list all orders and `PATCH /orders/{id}/status` enforces forward-only transitions.
  Front end: rebuilt `AdminOrdersScreen` on `useOrders` (status filter + 5s polling) and
  `useUpdateOrderStatus` — filter tabs, per-order item lines resolved to names, `OrderTimeline`, and a
  "Mark <next>" action limited to legal transitions.
- **Decisions:** none new (uses D-14's DB-as-source-of-truth and the P4.3 status machine).
- **Open items opened/closed:** none.
- **Verification:** backend `pytest` 98 passed + 3 live skipped; frontend `tsc`/lint/build pass, 11 tests.

### Session 27 — Real analytics (P7.3)

- **Completed:** Phase P7.3 — the admin dashboard now reports real numbers. Backend:
  `app/services/analytics.py` (`compute_dashboard`) + `app/schemas/analytics.py` and the admin-only
  `GET /api/v1/analytics/dashboard` (total/active orders, revenue, average order value, menu counts,
  status breakdown, 7-day orders/revenue, top items, 24-hour peak hours, ratings summary). Front end:
  `src/hooks/useAnalytics.ts` and a rebuilt `AdminDashboardScreen` (live KPIs, 7-day chart, ratings,
  top items, peak hours, recent orders from `useOrders`). Deleted the random/mock chart data and the
  mock store: removed `context/AppDataContext.tsx`, `data/demoData.ts`, `data/menu.ts` and the
  `AppDataProvider`; `HomeScreen`/`RightRail` now read the API (`useOrders`, gated on auth) and
  `AuthContext`, and unused domain types were pruned.
- **Decisions:** none new (reinforces D-14: the DB is the source of truth; no fabricated analytics).
- **Open items opened/closed:** none.
- **Verification:** backend `pytest` 101 passed + 3 live skipped; frontend `tsc`/lint/build pass, 11 tests (bundle shrank as the mock data was deleted).

### Session 28 — Feedback inbox & Gate 7 (P7.4)

- **Completed:** Phase P7.4 — the admin console is fully API-backed. Backend: persisted
  `Feedback.acknowledged` (with an idempotent `ALTER TABLE` backfill in `db/init_db.py` so existing
  SQLite dev DBs keep working), `PATCH /api/v1/feedback/{id}/acknowledge` (admin), and an acknowledged
  filter in `list_feedback`. Front end: `useAdminFeedback`/`useAcknowledgeFeedback`, `AdminFeedbackScreen`
  (`/admin/feedback`, pending filter + acknowledge), and role-gated admin links in `SidebarNav`
  (`staff` sees Manage Orders; `admin` sees the whole console). Added `utils/format.ts::timeAgo`
  shared by the order and feedback screens.
- **Decisions:** none new (acknowledgement is persisted, not a mock).
- **Open items opened/closed:** none.
- **Gate 7 met:** menu CRUD, order management, analytics and feedback all read/write the database; no
  fabricated analytics remain (random charts and the mock store were deleted in P7.3).
- **Verification:** backend `pytest` 102 passed + 3 live skipped; frontend `tsc`/lint/build pass,
  14 tests (3 new feedback-inbox tests).

### Session 29 — Evaluation harness (P8.1)

- **Completed:** Phase P8.1 — the first metric harnesses. `evaluation/harness/common.py` builds a
  fresh in-memory seeded DB, loads versioned datasets, resolves canonical dish names/prices, and writes
  result JSON with git revision and timestamp. `groundedness.py` checks that every ₹ amount is a real
  menu price, that answerable replies name the dish with its price, and that traps are refused without
  a price. `run_grounding.py` runs the 64-item set in `agent` mode or in direct-LLM ablation modes
  (`llm-rag`/`llm-no-rag`), with `--repeat` and `--strict`. `run_tools.py` scores the 40-utterance set
  by ordered expected-call subsequence with exact ids/quantities and substring matching for text args;
  agent nodes now record per-turn `tool_calls` (name + args), reset at the start of each turn.
- **Decisions:** D-15 — agent path measured as shipped; ablation isolates retrieval via direct LLM;
  explicit tolerance rules for M-1–M-3.
- **Open items opened/closed:** none (O-7 resolved in shape: 48 positive item references + 16 traps).
- **Verification:** baseline agent run `groundedness=1.000`, `hallucination=0.000`, `refusal=1.000`,
  `tool accuracy=1.000`; results in `evaluation/results/`. Backend `pytest` 109 passed + 3 live skipped
  (7 new harness tests).

---

*Append-only. Do not delete history; supersede it.*
