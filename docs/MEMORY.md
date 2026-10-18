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

### Superseded decisions

*(none yet)*

---

## 3. Open items

| ID | Open question | Needed by | Notes |
|---|---|---|---|
| O-1 | Final chat model loaded in LM Studio: Qwen2.5-VL-3B vs Qwen2.5-7B-Instruct vs Llama-3.1-8B (GGUF quantisations). | Phase P6 | Trade-off between vision capability, tool-calling reliability, and hardware. |
| O-2 | Embedding model in LM Studio: `nomic-embed-text` vs `mxbai-embed-large`. | Phase P6 | Retrieval quality vs memory footprint. |
| O-3 | Vector store: Chroma vs FAISS. | Phase P6 | Default proposal: Chroma (persistent, simple). |
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

---

*Append-only. Do not delete history; supersede it.*
