# TASKS.md — VeeraServe Implementation Plan

## How to use this file

- Work **one task at a time**, top to bottom, phase by phase.
- Each task below is sized to be **one commit** — not a batch of commits, not a partial commit.
- Do not start a task until the previous one is committed and (where applicable) passes its check.
- Do not jump ahead to a later phase "while you're at it" — if a task in a later phase seems easier to do now, note it here as a future task instead and stay on the current one.
- **Backend is built and testable before AI work begins** (Phases P1–P4), and the **ordering app is fully integrated without AI before the agentic core is built** (P5 before P6).
- The **agentic AI core is built one node at a time** (Phase P6); do not write two agent nodes (or a node + its wiring) in the same commit, even if it feels efficient. Specialists are grouped in P6D and built in order, then the supervisor, then the graph wiring.
- Read the relevant architecture doc (`architecture/ARCHITECTURE.md`, `ai/AGENT_DESIGN.md`, `architecture/DESIGN.md`, `architecture/FOLDER_STRUCTURE.md`, `evaluation/EVALUATION.md`) before implementing a task that references it.
- Keep the AI **grounded** in `data/menu.seed.json` at all times; never fabricate dishes, prices, analytics, metrics, or screenshots.
- Update the docs in the **same commit** as the code they describe.
- Check off tasks as `[x]` as you complete them so progress is resumable in a new session.

**Commit message format:** `Update - <Phase>.<Task> - <description>`
Example: `Update - P1.1 - move frontend into frontend/`

**Phase IDs:** `P0`–`P9`. These are *phase* numbers, not the `P0`–`P3` *priority* labels used in `FEATURES.md`.

---

## Phase P0 — Repository & Documentation Hygiene (no new logic)

- [x] P0.1 — Create the 16-document `docs/` suite (root + `architecture/` + `ai/` + `evaluation/`) with working `INDEX.md` cross-links — **done**
  Commit: `Update - P0.1 - documentation suite`
- [x] P0.2 — Remove committed junk: `__pycache__/` and `*.pyc`, `.qwen/`, dead `App.css`; untrack them. Do **not** delete `data/menu.md` yet (P1.3 converts it)
  Commit: `Update - P0.2 - remove committed junk`
- [x] P0.3 — Remove unused static assets (`react.svg`, `vite.svg`, `hero.png`, `icons.svg`) after grep-confirming they are not imported
  Commit: `Update - P0.3 - remove unused assets`
- [x] P0.4 — Add root `.gitignore` (Python + Node + OS + editor) and `.editorconfig`
  Commit: `Update - P0.4 - gitignore and editorconfig`
- [ ] P0.5 — Commit the frontend lockfile and add `frontend/.env.example` with `VITE_API_URL`
  Commit: `Update - P0.5 - pin frontend deps and env example`
- [ ] P0.6 — Add pinned `backend/requirements.txt` and `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `LLM_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL`, `LLM_API_KEY`, CORS origins, upload limits)
  Commit: `Update - P0.6 - backend deps and env example`
- [ ] P0.7 — Rewrite `README.md` to match reality (accurate; LM Studio setup; links `docs/INDEX.md`)
  Commit: `Update - P0.7 - rewrite README`
- [ ] P0.8 — Baseline checkpoint: frontend lint + build pass, `git status` clean, tag `docs-baseline`
  Commit: `Update - P0.8 - baseline checkpoint`

**Checkpoint — Gate 0:** Repository is clean, dependencies are pinned, docs baseline exists, and the front-end builds. This is the checkpoint before any restructuring.

---

## Phase P1 — Repository Restructure (move-only; no logic change)

- [ ] P1.1 — Move the Vite app into `frontend/` using `git mv` (preserve history); fix relative paths; update run instructions. **Move-only commit**
  Commit: `Update - P1.1 - move frontend into frontend/`
- [ ] P1.2 — Reshape the backend into `backend/app/` (`main.py`, `api/`, `core/`, `services/`, `models/`, `schemas/`) and a thin `backend/main.py` entry (`uvicorn app.main:app`). **Move-only commit**
  Commit: `Update - P1.2 - reshape backend into app package`
- [ ] P1.3 — Convert `src/data/mockData.js` + `data/menu.md` into the canonical `data/menu.seed.json` with `data/menu.schema.json` and a one-off converter script; validate every item against the schema
  Commit: `Update - P1.3 - canonical menu seed and schema`
- [ ] P1.4 — Switch the app's menu source to the seed, then delete `mockData.js` and `data/menu.md`; grep confirms no remaining `mockData` imports
  Commit: `Update - P1.4 - retire duplicate menu sources`
- [ ] P1.5 — Add `docker-compose.yml` skeleton (`frontend`, `backend`, `chroma`, `db`) with `LLM_BASE_URL=http://host.docker.internal:1234/v1`; document that LM Studio runs on the host
  Commit: `Update - P1.5 - docker-compose skeleton`
- [ ] P1.6 — Add `backend/app/core/config.py` (Pydantic `BaseSettings`) reading all env vars; remove the hard-coded `http://localhost:8000/...` URL from the front end
  Commit: `Update - P1.6 - centralised env configuration`
- [ ] P1.7 — Add the minimal FastAPI app (`backend/app/main.py`) and `GET /api/v1/health` returning `{"status": "ok"}`; confirm `uvicorn app.main:app` runs
  Commit: `Update - P1.7 - minimal FastAPI app and health endpoint`
- [ ] P1.8 — Add `backend/tests/test_api/test_health.py` — one test for the health endpoint
  Commit: `Update - P1.8 - health check test`

**Checkpoint — Gate 1:** Front end runs from `frontend/`, backend runs from `backend/app/`, the canonical seed is the only menu source, `docker compose config` is valid, and no URLs are hard-coded.

---

## Phase P2 — TypeScript Migration & Design System

- [ ] P2.1 — Add `tsconfig.json` (`strict: true`), rename the entry files to `.tsx`; confirm `npm run dev` still runs
  Commit: `Update - P2.1 - add TypeScript config`
- [ ] P2.2 — Migrate components `.jsx` → `.tsx` folder by folder, keeping the app running throughout
  Commit: `Update - P2.2 - migrate components to TypeScript`
- [ ] P2.3 — Add domain types in `frontend/src/types/` mirroring the API schemas (no `any` in domain types)
  Commit: `Update - P2.3 - domain types`
- [ ] P2.4 — Consolidate colour/spacing/typography tokens per `architecture/DESIGN.md`
  Commit: `Update - P2.4 - consolidate design tokens`
- [ ] P2.5 — Build shared `ui/` primitives (`Button`, `Card`, `Badge`, `Modal`, `Input`, `Spinner`, `EmptyState`) and replace per-screen duplicates
  Commit: `Update - P2.5 - shared UI primitives`
- [ ] P2.6 — Add TanStack Query (`QueryClient` + typed query/mutation hooks); keep client state minimal and local
  Commit: `Update - P2.6 - adopt TanStack Query for server state`
- [ ] P2.7 — Verify `npx tsc --noEmit` and lint pass clean
  Commit: `Update - P2.7 - typecheck and lint pass`

**Checkpoint — Gate 2:** Front end is fully TypeScript, type-checks clean, and uses the shared design system.

---

## Phase P3 — Data Layer & Read APIs

- [ ] P3.1 — SQLAlchemy base + models: `users`, `categories`, `menu_items`, `orders`, `order_items`, `feedback`, `sessions`, `reservations` (fields per `architecture/ARCHITECTURE.md` §6)
  Commit: `Update - P3.1 - database models`
- [ ] P3.2 — Database init/migration path (Alembic, or `create_all` for dev); schema creates cleanly
  Commit: `Update - P3.2 - database init and migrations`
- [ ] P3.3 — Idempotent seeder that loads `data/menu.seed.json` (upsert by stable id/slug; safe to re-run)
  Commit: `Update - P3.3 - menu seeder`
- [ ] P3.4 — `MenuService` — the single menu accessor shared by the API and (later) the agent
  Commit: `Update - P3.4 - menu access service`
- [ ] P3.5 — `GET /api/v1/categories` with Pydantic response models
  Commit: `Update - P3.5 - categories endpoint`
- [ ] P3.6 — `GET /api/v1/menu` with filters (category, veg, max price, search)
  Commit: `Update - P3.6 - menu list endpoint with filters`
- [ ] P3.7 — `GET /api/v1/menu/{id}` returning item details (404 on unknown id)
  Commit: `Update - P3.7 - menu item detail endpoint`
- [ ] P3.8 — Read API tests with pytest + httpx (happy path, filters, 404)
  Commit: `Update - P3.8 - read API tests`

**Checkpoint — Gate 3:** Read APIs are implemented, documented in OpenAPI, and tested; the menu is served from the database.

---

## Phase P4 — Auth & Write APIs

- [ ] P4.1 — Password hashing utility (Argon2/bcrypt); no plaintext storage
  Commit: `Update - P4.1 - password hashing utility`
- [ ] P4.2 — `POST /api/v1/auth/register`
  Commit: `Update - P4.2 - register endpoint`
- [ ] P4.3 — `POST /api/v1/auth/login` + JWT issuance
  Commit: `Update - P4.3 - login endpoint and JWT`
- [ ] P4.4 — Role dependency (`guest`/`user`/`staff`/`admin`) enforced **server-side** (fixes dropdown escalation)
  Commit: `Update - P4.4 - server-side role enforcement`
- [ ] P4.5 — `POST /api/v1/orders` — persist table number, payment method, and instructions; validate totals server-side (fixes discarded-checkout defect)
  Commit: `Update - P4.5 - create order endpoint`
- [ ] P4.6 — `GET /api/v1/orders` (scoped) and `GET /api/v1/orders/{id}` (ownership enforced)
  Commit: `Update - P4.6 - list and get orders`
- [ ] P4.7 — `PATCH /api/v1/orders/{id}/status` with staff/admin-only transitions
  Commit: `Update - P4.7 - order status transitions`
- [ ] P4.8 — `POST /api/v1/feedback` and `GET /api/v1/feedback` (admin) with 1–5 rating validation (fixes the 15/5 defect)
  Commit: `Update - P4.8 - feedback endpoints with validation`
- [ ] P4.9 — `POST /api/v1/reservations` and list (party size ≥ 1; valid time)
  Commit: `Update - P4.9 - reservations endpoints`
- [ ] P4.10 — Auth/write tests including security cases (401/403, RBAC)
  Commit: `Update - P4.10 - auth and write-path tests`

**Checkpoint — Gate 4:** Real authentication and write APIs are implemented and tested; the backend is complete and testable via curl/Postman.

---

## Phase P5 — Front-end Integration (Ordering MVP, no AI)

- [ ] P5.1 — Typed API client using `VITE_API_URL` with auth-token attachment and typed errors
  Commit: `Update - P5.1 - typed API client`
- [ ] P5.2 — Auth context + login/register UI + protected (role-guarded) routes
  Commit: `Update - P5.2 - auth context and protected routes`
- [ ] P5.3 — Catalog wired to the API (menu, categories, filters)
  Commit: `Update - P5.3 - wire catalog to API`
- [ ] P5.4 — Cart wired to the backend (server-validated totals)
  Commit: `Update - P5.4 - wire cart to API`
- [ ] P5.5 — Checkout wired (table number, payment method, instructions persisted)
  Commit: `Update - P5.5 - wire checkout to API`
- [ ] P5.6 — Order tracking screen (status via polling)
  Commit: `Update - P5.6 - order tracking screen`
- [ ] P5.7 — Order history for registered diners
  Commit: `Update - P5.7 - order history`
- [ ] P5.8 — Feedback form wired to the API
  Commit: `Update - P5.8 - wire feedback form`
- [ ] P5.9 — Profile preferences (veg, spice, allergies) persisted (feeds agent memory later)
  Commit: `Update - P5.9 - profile preferences`
- [ ] P5.10 — Front-end tests for the cart→checkout→order flow
  Commit: `Update - P5.10 - ordering flow tests`

**Checkpoint — Gate 5 (MVP-minus-AI):** A diner can browse, order, track, and give feedback against the real backend, with admin routes role-guarded. This is the checkpoint before any AI work begins.

---

## Phase P6 — Agentic AI Core (the GenAI contribution)

Context: build the AI core on LM Studio's OpenAI-compatible API (`ai/AGENT_DESIGN.md`), grounded in `data/menu.seed.json`. Wiring always follows the node it depends on.

### 6A — LLM Client, LM Studio Readiness & Model Pins

- [ ] P6.1 — `backend/app/llm/client.py` — OpenAI-compatible wrapper (single function: prompt in, text out) targeting `LLM_BASE_URL`; unit test with a mocked response (no live call in CI)
  Commit: `Update - P6.1 - LLM client wrapper (OpenAI-compatible)`
- [ ] P6.2 — `backend/app/llm/health.py` — LM Studio readiness probe; degrade to an "AI unavailable" state without crashing; record the loaded model id and context length
  Commit: `Update - P6.2 - LM Studio readiness probe`
- [ ] P6.3 — Pin the default chat/vision model and embedding model in `config.py` and `.env.example` (no client-interface change)
  Commit: `Update - P6.3 - pin default models`

### 6B — RAG Grounding

- [ ] P6.4 — `backend/app/rag/ingest.py` — render each menu item to compact text, embed via the LM Studio embeddings endpoint, and upsert into Chroma with item-id metadata; idempotent re-ingest
  Commit: `Update - P6.4 - RAG ingestion pipeline`
- [ ] P6.5 — `backend/app/rag/retriever.py` — top-k retrieval with optional structured filters; returns only real items
  Commit: `Update - P6.5 - RAG retriever`
- [ ] P6.6 — RAG tests (ingest is idempotent; retrieval returns only real items)
  Commit: `Update - P6.6 - RAG tests`

### 6C — Tool Layer (validated contracts)

- [ ] P6.7 — `backend/app/agent/tools/schemas.py` + registry — strict types/enums; unknown fields rejected
  Commit: `Update - P6.7 - tool schemas and registry`
- [ ] P6.8 — Tools: `search_menu`, `get_item`, `get_recommendations`
  Commit: `Update - P6.8 - read tools (search, item, recommendations)`
- [ ] P6.9 — Tools: `add_to_cart`, `update_cart`, `view_cart` — must really mutate cart state (fixes the dead `add_to_cart` path)
  Commit: `Update - P6.9 - cart tools (real state mutation)`
- [ ] P6.10 — Tools: `apply_offer`, `list_offers`, `get_happy_hour_status`
  Commit: `Update - P6.10 - offers and happy-hour tools`
- [ ] P6.11 — Tools: `place_order` (confirmation-gated), `get_order_status`, `book_table`
  Commit: `Update - P6.11 - order and reservation tools`
- [ ] P6.12 — Tool-layer validation tests (unknown `item_id` rejected with a recoverable error; qty > 0; idempotency)
  Commit: `Update - P6.12 - tool validation tests`

### 6D — Agents (build nodes one at a time, then wire the graph)

- [ ] P6.13 — LangGraph state schema (`backend/app/agent/state.py`) — session/user, messages, retrieved, intent, tool_calls, cart snapshot, pending confirmation, reply
  Commit: `Update - P6.13 - agent state schema`
- [ ] P6.14 — Greeter/Menu specialist node (info/FAQ) + unit test
  Commit: `Update - P6.14 - greeter/menu specialist node`
- [ ] P6.15 — Recommendation specialist node (dietary/spice/budget/past prefs) + unit test
  Commit: `Update - P6.15 - recommendation specialist node`
- [ ] P6.16 — Ordering specialist node (cart + order, with confirmation before `place_order`) + unit test
  Commit: `Update - P6.16 - ordering specialist node`
- [ ] P6.17 — Status/Kitchen specialist node (order tracking) + unit test
  Commit: `Update - P6.17 - status specialist node`
- [ ] P6.18 — Vision/Multimodal specialist node (image → grounded suggestion) + unit test
  Commit: `Update - P6.18 - vision specialist node`
- [ ] P6.19 — Supervisor/router node (chooses/chains specialists) + unit test
  Commit: `Update - P6.19 - supervisor router node`
- [ ] P6.20 — Memory: session checkpointer + long-term preference load/update (confirmation-gated) + test
  Commit: `Update - P6.20 - agent memory`
- [ ] P6.21 — Guardrails node — refuse fabrication and off-topic requests, enforce price authority and alcohol policy + test
  Commit: `Update - P6.21 - guardrails node`
- [ ] P6.22 — Wire the full agent graph and add an integration test ("order X" completes end-to-end)
  Commit: `Update - P6.22 - wire agent graph`

### 6E — Streaming, Voice, Vision & Chat UI

- [ ] P6.23 — `POST /api/v1/chat` streaming via SSE (token deltas + structured tool events)
  Commit: `Update - P6.23 - SSE chat streaming`
- [ ] P6.24 — Voice input (faster-whisper STT) in the multipart chat request + optional browser TTS
  Commit: `Update - P6.24 - voice STT and TTS`
- [ ] P6.25 — Vision pipeline (LM Studio vision model) producing a grounded suggestion with labelled certainty
  Commit: `Update - P6.25 - vision pipeline`
- [ ] P6.26 — Chat front-end integration (streamed replies, tool events, mic, image upload)
  Commit: `Update - P6.26 - chat UI integration`
- [ ] P6.27 — Agent scenario tests (grounding, tool accuracy, confirmation, refusal) running headless against LM Studio
  Commit: `Update - P6.27 - agent scenario tests`

**Checkpoint — Gate 6:** The agent completes scripted order scenarios end-to-end, no fabricated dish/price can reach the user (defence-in-depth verified), and groundedness meets the target in `evaluation/EVALUATION.md`. This is the checkpoint to demo before admin work resumes.

---

## Phase P7 — Admin Console

- [ ] P7.1 — Admin-only menu CRUD endpoints (categories, price + happy-hour, availability)
  Commit: `Update - P7.1 - admin menu CRUD API`
- [ ] P7.2 — Menu management UI (create/update/delete, price + happy-hour, availability toggle); changes propagate to the diner menu and the agent
  Commit: `Update - P7.2 - menu management UI`
- [ ] P7.3 — Order management endpoints + staff UI with status transitions
  Commit: `Update - P7.3 - order management`
- [ ] P7.4 — Real analytics endpoints (orders, revenue, top items, peak hours) computed from the DB
  Commit: `Update - P7.4 - analytics API from DB`
- [ ] P7.5 — Analytics UI; delete all random/mock chart data
  Commit: `Update - P7.5 - analytics UI (remove mock data)`
- [ ] P7.6 — Feedback inbox endpoint + UI (read + acknowledge)
  Commit: `Update - P7.6 - feedback inbox`
- [ ] P7.7 — Admin tests (menu CRUD, RBAC, status transitions, analytics aggregation)
  Commit: `Update - P7.7 - admin tests`

**Checkpoint — Gate 7:** All admin operations affect real data end-to-end, and no fabricated analytics remain.

---

## Phase P8 — Evaluation, Polish & Delivery

- [ ] P8.1 — Evaluation harness skeleton under `evaluation/harness/` per `evaluation/EVALUATION.md`
  Commit: `Update - P8.1 - evaluation harness skeleton`
- [ ] P8.2 — Groundedness/hallucination evaluation set + runner
  Commit: `Update - P8.2 - groundedness evaluation`
- [ ] P8.3 — Tool-call accuracy set + runner
  Commit: `Update - P8.3 - tool accuracy evaluation`
- [ ] P8.4 — End-to-end task-success scenarios + runner
  Commit: `Update - P8.4 - task success evaluation`
- [ ] P8.5 — STT word-error-rate set + runner
  Commit: `Update - P8.5 - STT WER evaluation`
- [ ] P8.6 — Latency measurement (first-token and full-response)
  Commit: `Update - P8.6 - latency measurement`
- [ ] P8.7 — No-RAG vs RAG ablation runner
  Commit: `Update - P8.7 - grounding ablation`
- [ ] P8.8 — Run the harness (≥ 3× where non-deterministic); write `evaluation/results/` and `evaluation/EVALUATION.md` §7, including any underperforming metric
  Commit: `Update - P8.8 - run evaluation and record results`
- [ ] P8.9 — Backend CI (Ruff/Black lint, pytest) via GitHub Actions
  Commit: `Update - P8.9 - backend CI`
- [ ] P8.10 — Front-end CI (ESLint/Prettier, `tsc`, Vitest, build)
  Commit: `Update - P8.10 - frontend CI`
- [ ] P8.11 — Docker Compose end-to-end verified (LM Studio host step documented)
  Commit: `Update - P8.11 - docker compose end-to-end`
- [ ] P8.12 — Populate `ACADEMIC_REPORT.md` results and remove all "to be populated" placeholders
  Commit: `Update - P8.12 - populate academic report results`
- [ ] P8.13 — Accessibility + responsive pass across screens
  Commit: `Update - P8.13 - accessibility and responsive pass`
- [ ] P8.14 — Demo assets (screenshots/GIF) following `DEMONSTRATION_FLOW.md`
  Commit: `Update - P8.14 - demo assets`
- [ ] P8.15 — Final review: re-verify `INDEX.md` links and `RULES.md` compliance, update `MEMORY.md`, tag `v1.0`
  Commit: `Update - P8.15 - final review and release tag`

**Checkpoint — Gate 8:** Metrics produced and written up honestly, CI green, one-command Docker run works, report complete, and demo assets ready.

---

## Phase P9 — Deployment (last, not in parallel with feature work)

Context: deployment is intentionally last and constrained — the LLM/embedding runtime (LM Studio) is a host desktop app, so a fully hosted demo would break the local-first, zero-cost story (see `MEMORY.md` O-6). Treat P9 as optional/limited.

- [ ] P9.1 — `infra/docker/backend.Dockerfile`
  Commit: `Update - P9.1 - backend Dockerfile`
- [ ] P9.2 — `infra/docker/frontend.Dockerfile`
  Commit: `Update - P9.2 - frontend Dockerfile`
- [ ] P9.3 — `infra/docker-compose.yml` for a full local run (LM Studio on host documented)
  Commit: `Update - P9.3 - docker-compose for local run`
- [ ] P9.4 — Backend deploy config (document the host LM Studio dependency / O-6 decision)
  Commit: `Update - P9.4 - backend deploy config`
- [ ] P9.5 — Frontend deploy config (`VITE_API_URL` pointed at the deployed backend)
  Commit: `Update - P9.5 - frontend deploy config`

**Checkpoint — Gate 9:** Deployment path documented; local-first constraints preserved.

---

## Notes on Pace

- Most tasks above map to **one commit each**, not batched further — this targets a large, reviewable commit history.
- Backend (Phases P1–P4) is a hard gate before the integrated ordering MVP (P5), and P5 is a hard gate before the agentic core (P6). Do not build the agent until ordering works without AI.
- Inside P6, build the tool layer (6C) before the nodes (6D), and every node before the graph wiring (P6.22).
- The admin console (P7) comes **after** the agent so that availability/price changes can be verified against the agent's grounded responses.
- Phase P8 is where every GenAI claim becomes measured evidence — no claim ships without a number.
- If a phase reveals a need to change the architecture, record a decision in `MEMORY.md` **before** implementing it.
