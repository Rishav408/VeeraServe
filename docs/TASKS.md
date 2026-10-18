# TASKS.md — VeeraServe Implementation Plan

## How to use this file

- Work **one commit unit at a time**, top to bottom, phase by phase.
- Each numbered item (e.g. `P1.2`) is a **single commit** that bundles the steps listed under it. This keeps every phase to **4–5 commits** while preserving every step — steps are merged, never removed.
- Do not start a unit until the previous one is committed and (where applicable) passes its check.
- Do not jump ahead to a later phase "while you're at it" — if a step in a later phase seems easier to do now, note it here as a future unit instead and stay on the current one.
- **Backend is built and testable before AI work begins** (Phases P1–P4), and the **ordering app is fully integrated without AI before the agentic core is built** (P5 before P6).
- Read the relevant architecture doc (`architecture/ARCHITECTURE.md`, `ai/AGENT_DESIGN.md`, `architecture/DESIGN.md`, `architecture/FOLDER_STRUCTURE.md`, `evaluation/EVALUATION.md`) before implementing a unit that references it.
- Keep the AI **grounded** in `data/menu.seed.json` at all times; never fabricate dishes, prices, analytics, metrics, or screenshots.
- Update the docs in the **same commit** as the code they describe.
- Check off units as `[x]` as you complete them so progress is resumable in a new session.

**Commit message format:** `Update - <Phase>.<Commit> - <description>`
Example: `Update - P1.2 - move frontend and reshape backend`

**Phase IDs:** `P0`–`P9`. These are *phase* numbers, not the `P0`–`P3` *priority* labels used in `FEATURES.md`.

> **Regrouping note:** Phase P0's first two units were committed individually before this regrouping took effect; `P0.2` below is that early hygiene work grouped retrospectively. From here on, each numbered unit is exactly one commit.

---

## Phase P0 — Repository & Documentation Hygiene (no new logic)

- [x] **P0.1 — Documentation suite**
  - Create the 16-document `docs/` suite (root + `architecture/` + `ai/` + `evaluation/`) with working `INDEX.md` cross-links.
  Commit: `Update - P0.1 - documentation suite`

- [x] **P0.2 — Repository hygiene** _(executed as a few small commits before this regroup)_
  - Remove committed junk: `__pycache__/` and `*.pyc`, `.qwen/`, dead `App.css`; untrack them. Do **not** delete `data/menu.md` yet (P1.2 converts it).
  - Remove unused static assets (`react.svg`, `vite.svg`, `hero.png`, `icons.svg`) after grep-confirming they are not imported.
  - Add root `.gitignore` (Python + Node + OS + editor) and `.editorconfig`.
  Commit: `Update - P0.2 - repo hygiene`

- [x] **P0.3 — Environment samples & pinned dependencies**
  - Commit the frontend lockfile and add a root `.env.example` with `VITE_API_URL`.
  - Add pinned `backend/requirements.txt` and `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `LLM_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL`, `LLM_API_KEY`, CORS origins, upload limits).
  Commit: `Update - P0.3 - env samples and pinned deps`

- [x] **P0.4 — README & baseline checkpoint**
  - Rewrite `README.md` to match reality (accurate; LM Studio setup; links `docs/INDEX.md`).
  - Baseline checkpoint: frontend lint + build pass, clean tree, tag `docs-baseline`.
  Commit: `Update - P0.4 - README and baseline checkpoint`

**Checkpoint — Gate 0:** Repository is clean, dependencies are pinned, docs baseline exists, and the front-end builds. This is the checkpoint before any restructuring.

---

## Phase P1 — Repository Restructure (move-only; no logic change)

- [x] **P1.1 — Frontend move & backend package reshape** _(move-only commit)_
  - Move the Vite app into `frontend/` using `git mv` (preserve history); fix relative paths; update run instructions.
  - Reshape the backend into `backend/app/` (`main.py`, `api/`, `core/`, `services/`, `models/`, `schemas/`) and a thin `backend/main.py` entry (`uvicorn app.main:app`).
  Commit: `Update - P1.1 - move frontend and reshape backend`

- [x] **P1.2 — Canonical menu seed**
  - Convert `src/data/mockData.js` + `data/menu.md` into the canonical `data/menu.seed.json` with `data/menu.schema.json` and a one-off converter script; validate every item against the schema.
  - Switch the app's menu source to the seed, then delete `mockData.js` and `data/menu.md`; grep confirms no remaining `mockData` imports.
  Commit: `Update - P1.2 - canonical menu seed`

- [ ] **P1.3 — Docker skeleton & centralised config**
  - Add `docker-compose.yml` skeleton (`frontend`, `backend`, `chroma`, `db`) with `LLM_BASE_URL=http://host.docker.internal:1234/v1`; document that LM Studio runs on the host.
  - Add `backend/app/core/config.py` (Pydantic `BaseSettings`) reading all env vars; remove the hard-coded `http://localhost:8000/...` URL from the front end.
  Commit: `Update - P1.3 - docker skeleton and config`

- [ ] **P1.4 — Minimal FastAPI app, health endpoint & test**
  - Add the minimal FastAPI app (`backend/app/main.py`) and `GET /api/v1/health` returning `{"status": "ok"}`; confirm `uvicorn app.main:app` runs.
  - Add `backend/tests/test_api/test_health.py` — one test for the health endpoint.
  Commit: `Update - P1.4 - minimal app, health endpoint and test`

**Checkpoint — Gate 1:** Front end runs from `frontend/`, backend runs from `backend/app/`, the canonical seed is the only menu source, `docker compose config` is valid, and no URLs are hard-coded.

---

## Phase P2 — TypeScript Migration & Design System

- [ ] **P2.1 — TypeScript setup & component migration**
  - Add `tsconfig.json` (`strict: true`), rename the entry files to `.tsx`; confirm `npm run dev` still runs.
  - Migrate components `.jsx` → `.tsx` folder by folder, keeping the app running throughout.
  Commit: `Update - P2.1 - TypeScript setup and component migration`

- [ ] **P2.2 — Domain types**
  - Add domain types in `frontend/src/types/` mirroring the API schemas (no `any` in domain types).
  Commit: `Update - P2.2 - domain types`

- [ ] **P2.3 — Design tokens & shared UI primitives**
  - Consolidate colour/spacing/typography tokens per `architecture/DESIGN.md`.
  - Build shared `ui/` primitives (`Button`, `Card`, `Badge`, `Modal`, `Input`, `Spinner`, `EmptyState`) and replace per-screen duplicates.
  Commit: `Update - P2.3 - design tokens and UI primitives`

- [ ] **P2.4 — Server-state management & typecheck pass**
  - Add TanStack Query (`QueryClient` + typed query/mutation hooks); keep client state minimal and local.
  - Verify `npx tsc --noEmit` and lint pass clean.
  Commit: `Update - P2.4 - server-state and typecheck pass`

**Checkpoint — Gate 2:** Front end is fully TypeScript, type-checks clean, and uses the shared design system.

---

## Phase P3 — Data Layer & Read APIs

- [ ] **P3.1 — Database models & init/migrations**
  - SQLAlchemy base + models: `users`, `categories`, `menu_items`, `orders`, `order_items`, `feedback`, `sessions`, `reservations` (fields per `architecture/ARCHITECTURE.md` §6).
  - Database init/migration path (Alembic, or `create_all` for dev); schema creates cleanly.
  Commit: `Update - P3.1 - database models and init`

- [ ] **P3.2 — Seeder & menu service**
  - Idempotent seeder that loads `data/menu.seed.json` (upsert by stable id/slug; safe to re-run).
  - `MenuService` — the single menu accessor shared by the API and (later) the agent.
  Commit: `Update - P3.2 - seeder and menu service`

- [ ] **P3.3 — Read endpoints**
  - `GET /api/v1/categories` with Pydantic response models.
  - `GET /api/v1/menu` with filters (category, veg, max price, search).
  - `GET /api/v1/menu/{id}` returning item details (404 on unknown id).
  Commit: `Update - P3.3 - read endpoints`

- [ ] **P3.4 — Read API tests**
  - Read API tests with pytest + httpx (happy path, filters, 404).
  Commit: `Update - P3.4 - read API tests`

**Checkpoint — Gate 3:** Read APIs are implemented, documented in OpenAPI, and tested; the menu is served from the database.

---

## Phase P4 — Auth & Write APIs

- [ ] **P4.1 — Auth core (hashing, register, login, JWT)**
  - Password hashing utility (Argon2/bcrypt); no plaintext storage.
  - `POST /api/v1/auth/register`.
  - `POST /api/v1/auth/login` + JWT issuance.
  Commit: `Update - P4.1 - auth core`

- [ ] **P4.2 — Server-side role enforcement**
  - Role dependency (`guest`/`user`/`staff`/`admin`) enforced **server-side** (fixes dropdown escalation).
  Commit: `Update - P4.2 - server-side role enforcement`

- [ ] **P4.3 — Orders API**
  - `POST /api/v1/orders` — persist table number, payment method, and instructions; validate totals server-side (fixes discarded-checkout defect).
  - `GET /api/v1/orders` (scoped) and `GET /api/v1/orders/{id}` (ownership enforced).
  - `PATCH /api/v1/orders/{id}/status` with staff/admin-only transitions.
  Commit: `Update - P4.3 - orders API`

- [ ] **P4.4 — Feedback & reservations APIs**
  - `POST /api/v1/feedback` and `GET /api/v1/feedback` (admin) with 1–5 rating validation (fixes the 15/5 defect).
  - `POST /api/v1/reservations` and list (party size ≥ 1; valid time).
  Commit: `Update - P4.4 - feedback and reservations APIs`

- [ ] **P4.5 — Auth/write tests & security cases**
  - Auth/write tests including security cases (401/403, RBAC).
  Commit: `Update - P4.5 - auth and write-path tests`

**Checkpoint — Gate 4:** Real authentication and write APIs are implemented and tested; the backend is complete and testable via curl/Postman.

---

## Phase P5 — Front-end Integration (Ordering MVP, no AI)

- [ ] **P5.1 — Typed API client, auth context & protected routes**
  - Typed API client using `VITE_API_URL` with auth-token attachment and typed errors.
  - Auth context + login/register UI + protected (role-guarded) routes.
  Commit: `Update - P5.1 - API client, auth context and protected routes`

- [ ] **P5.2 — Catalog & cart wired to the API**
  - Catalog wired to the API (menu, categories, filters).
  - Cart wired to the backend (server-validated totals).
  Commit: `Update - P5.2 - wire catalog and cart`

- [ ] **P5.3 — Checkout, tracking & order history**
  - Checkout wired (table number, payment method, instructions persisted).
  - Order tracking screen (status via polling).
  - Order history for registered diners.
  Commit: `Update - P5.3 - checkout, tracking and history`

- [ ] **P5.4 — Feedback form & profile preferences**
  - Feedback form wired to the API.
  - Profile preferences (veg, spice, allergies) persisted (feeds agent memory later).
  Commit: `Update - P5.4 - feedback form and preferences`

- [ ] **P5.5 — Ordering flow tests**
  - Front-end tests for the cart→checkout→order flow.
  Commit: `Update - P5.5 - ordering flow tests`

**Checkpoint — Gate 5 (MVP-minus-AI):** A diner can browse, order, track, and give feedback against the real backend, with admin routes role-guarded. This is the checkpoint before any AI work begins.

---

## Phase P6 — Agentic AI Core (the GenAI contribution)

Context: build the AI core on LM Studio's OpenAI-compatible API (`ai/AGENT_DESIGN.md`), grounded in `data/menu.seed.json`.

- [ ] **P6.1 — LLM client, LM Studio readiness & model pins**
  - `backend/app/llm/client.py` — OpenAI-compatible wrapper (single function: prompt in, text out) targeting `LLM_BASE_URL`; unit test with a mocked response (no live call in CI).
  - `backend/app/llm/health.py` — LM Studio readiness probe; degrade to an "AI unavailable" state without crashing; record the loaded model id and context length.
  - Pin the default chat/vision model and embedding model in `config.py` and `.env.example` (no client-interface change).
  Commit: `Update - P6.1 - LLM client and LM Studio readiness`

- [ ] **P6.2 — RAG grounding**
  - `backend/app/rag/ingest.py` — render each menu item to compact text, embed via the LM Studio embeddings endpoint, and upsert into Chroma with item-id metadata; idempotent re-ingest.
  - `backend/app/rag/retriever.py` — top-k retrieval with optional structured filters; returns only real items.
  - RAG tests (ingest is idempotent; retrieval returns only real items).
  Commit: `Update - P6.2 - RAG grounding`

- [ ] **P6.3 — Tool layer (validated contracts)**
  - `backend/app/agent/tools/schemas.py` + registry — strict types/enums; unknown fields rejected.
  - Tools: `search_menu`, `get_item`, `get_recommendations`.
  - Tools: `add_to_cart`, `update_cart`, `view_cart` — must really mutate cart state (fixes the dead `add_to_cart` path).
  - Tools: `apply_offer`, `list_offers`, `get_happy_hour_status`.
  - Tools: `place_order` (confirmation-gated), `get_order_status`, `book_table`.
  - Tool-layer validation tests (unknown `item_id` rejected with a recoverable error; qty > 0; idempotency).
  Commit: `Update - P6.3 - tool layer`

- [ ] **P6.4 — Agent nodes, memory, guardrails & graph wiring** _(build each node before wiring the graph)_
  - LangGraph state schema (`backend/app/agent/state.py`) — session/user, messages, retrieved, intent, tool_calls, cart snapshot, pending confirmation, reply.
  - Greeter/Menu specialist node + test.
  - Recommendation specialist node + test.
  - Ordering specialist node (confirmation before `place_order`) + test.
  - Status/Kitchen specialist node + test.
  - Vision/Multimodal specialist node + test.
  - Supervisor/router node + test.
  - Memory: session checkpointer + long-term preference load/update (confirmation-gated) + test.
  - Guardrails node — refuse fabrication and off-topic requests, enforce price authority and alcohol policy + test.
  - Wire the full agent graph + integration test ("order X" completes end-to-end).
  Commit: `Update - P6.4 - agent graph`

- [ ] **P6.5 — Streaming, voice, vision & chat UI**
  - `POST /api/v1/chat` streaming via SSE (token deltas + structured tool events).
  - Voice input (faster-whisper STT) in the multipart chat request + optional browser TTS.
  - Vision pipeline (LM Studio vision model) producing a grounded suggestion with labelled certainty.
  - Chat front-end integration (streamed replies, tool events, mic, image upload).
  - Agent scenario tests (grounding, tool accuracy, confirmation, refusal) running headless against LM Studio.
  Commit: `Update - P6.5 - streaming, voice, vision and chat UI`

**Checkpoint — Gate 6:** The agent completes scripted order scenarios end-to-end, no fabricated dish/price can reach the user (defence-in-depth verified), and groundedness meets the target in `evaluation/EVALUATION.md`. This is the checkpoint to demo before admin work resumes.

---

## Phase P7 — Admin Console

- [ ] **P7.1 — Menu CRUD API & management UI**
  - Admin-only menu CRUD endpoints (categories, price + happy-hour, availability).
  - Menu management UI (create/update/delete, price + happy-hour, availability toggle); changes propagate to the diner menu and the agent.
  Commit: `Update - P7.1 - menu CRUD and management UI`

- [ ] **P7.2 — Order management**
  - Order management endpoints + staff UI with status transitions.
  Commit: `Update - P7.2 - order management`

- [ ] **P7.3 — Real analytics (API & UI)**
  - Real analytics endpoints (orders, revenue, top items, peak hours) computed from the DB.
  - Analytics UI; delete all random/mock chart data.
  Commit: `Update - P7.3 - analytics from DB`

- [ ] **P7.4 — Feedback inbox & admin tests**
  - Feedback inbox endpoint + UI (read + acknowledge).
  - Admin tests (menu CRUD, RBAC, status transitions, analytics aggregation).
  Commit: `Update - P7.4 - feedback inbox and admin tests`

**Checkpoint — Gate 7:** All admin operations affect real data end-to-end, and no fabricated analytics remain.

---

## Phase P8 — Evaluation, Polish & Delivery

- [ ] **P8.1 — Evaluation harness (groundedness & tool accuracy)**
  - Evaluation harness skeleton under `evaluation/harness/` per `evaluation/EVALUATION.md`.
  - Groundedness/hallucination evaluation set + runner.
  - Tool-call accuracy set + runner.
  Commit: `Update - P8.1 - eval harness, groundedness and tool accuracy`

- [ ] **P8.2 — Task success, STT WER & latency**
  - End-to-end task-success scenarios + runner.
  - STT word-error-rate set + runner.
  - Latency measurement (first-token and full-response).
  Commit: `Update - P8.2 - task success, WER and latency`

- [ ] **P8.3 — Grounding ablation & recorded results**
  - No-RAG vs RAG ablation runner.
  - Run the harness (≥ 3× where non-deterministic); write `evaluation/results/` and `evaluation/EVALUATION.md` §7, including any underperforming metric.
  Commit: `Update - P8.3 - ablation and recorded results`

- [ ] **P8.4 — CI & Docker end-to-end**
  - Backend CI (Ruff/Black lint, pytest) via GitHub Actions.
  - Front-end CI (ESLint/Prettier, `tsc`, Vitest, build).
  - Docker Compose end-to-end verified (LM Studio host step documented).
  Commit: `Update - P8.4 - CI and Docker end-to-end`

- [ ] **P8.5 — Report, polish & release**
  - Populate `ACADEMIC_REPORT.md` results and remove all "to be populated" placeholders.
  - Accessibility + responsive pass across screens.
  - Demo assets (screenshots/GIF) following `DEMONSTRATION_FLOW.md`.
  - Final review: re-verify `INDEX.md` links and `RULES.md` compliance, update `MEMORY.md`, tag `v1.0`.
  Commit: `Update - P8.5 - report, polish and release`

**Checkpoint — Gate 8:** Metrics produced and written up honestly, CI green, one-command Docker run works, report complete, and demo assets ready.

---

## Phase P9 — Deployment (last, not in parallel with feature work)

Context: deployment is intentionally last and constrained — the LLM/embedding runtime (LM Studio) is a host desktop app, so a fully hosted demo would break the local-first, zero-cost story (see `MEMORY.md` O-6). Treat P9 as optional/limited.

- [ ] **P9.1 — Dockerfiles**
  - `infra/docker/backend.Dockerfile`.
  - `infra/docker/frontend.Dockerfile`.
  Commit: `Update - P9.1 - Dockerfiles`

- [ ] **P9.2 — Local full-stack compose**
  - `infra/docker-compose.yml` for a full local run (LM Studio on host documented).
  Commit: `Update - P9.2 - docker-compose for local run`

- [ ] **P9.3 — Deploy configs**
  - Backend deploy config (document the host LM Studio dependency / O-6 decision).
  - Frontend deploy config (`VITE_API_URL` pointed at the deployed backend).
  Commit: `Update - P9.3 - deploy configs`

**Checkpoint — Gate 9:** Deployment path documented; local-first constraints preserved.

---

## Notes on Pace

- Each phase is capped at **4–5 commits** (P0 = 4, P1–P9 = 3–5); each commit bundles the steps listed under its unit. Steps are merged, never dropped.
- Backend (Phases P1–P4) is a hard gate before the integrated ordering MVP (P5), and P5 is a hard gate before the agentic core (P6). Do not build the agent until ordering works without AI.
- Inside P6, build the tool layer (`P6.3`) before the nodes and graph (`P6.4`), even though they share one commit's scope.
- The admin console (P7) comes **after** the agent so that availability/price changes can be verified against the agent's grounded responses.
- Phase P8 is where every GenAI claim becomes measured evidence — no claim ships without a number.
- If a unit reveals a need to change the architecture, record a decision in `MEMORY.md` **before** implementing it.
