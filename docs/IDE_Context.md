# VeeraServe — IDE Context Snapshot & Resumption Guide

**Status:** Living document
**Purpose:** Give any new developer or AI IDE agent a complete, honest, single-file context snapshot
so work can resume without re-discovering the project. Update this file at the end of every session.

---

## Section 1 — Project in one screen

**What it is:** An agentic, multimodal AI waiter for the restaurant **Veeradhar Dhaba**, submitted as
a **GenAI mini-project**. The AI (**VeeraServe**) is grounded in the real menu and can take actions
(add to cart, place orders, check status) via tool calls. Voice and image input are supported.

**Non-negotiables:**

1. **Local-first, zero-cost.** LLM/embedding models run locally in **LM Studio** (OpenAI-compatible
   server); speech recognition runs via faster-whisper. No paid APIs.
2. **Grounded AI.** VeeraServe never invents dishes, prices, or offers. Menu data comes from
   `data/menu.seed.json` via retrieval.
3. **Real actions.** The cart/order tool path must actually mutate application state — no dead code.
4. **Honest UI.** Simulated elements (e.g., kitchen status) are labelled as simulated. No fabricated
   analytics.
5. **Real auth.** No dropdown-based privilege escalation.
6. **Docs follow code.** Any material change updates `MEMORY.md` and the relevant document in the
   same change.

**Architecture at a glance (target):**

```text
Browser (React + TS)
   |  REST + SSE
   v
FastAPI backend  ---- SQLAlchemy ----> SQLite/Postgres
   |  (auth, menu, orders, feedback, reservations)
   v
Agent service (LangGraph)
   |-- Tools  -> menu, cart, orders, offers, reservations
   |-- RAG    -> Chroma over data/menu.seed.json (embeddings via LM Studio)
   |-- Memory -> conversation + long-term prefs
   v
LM Studio (chat/vision + embeddings, OpenAI-compatible)   faster-whisper (STT)   TTS
```

**Documentation authority:** `RULES.md` > `PRD.md` > `architecture/ARCHITECTURE.md` +
`ai/AGENT_DESIGN.md` > `FEATURES.md`/`TASKS.md` > everything else.

---

## Section 2 — Environment & toolchain

| Concern | Choice |
|---|---|
| OS / editor | Windows + VS Code |
| Front end | React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + TanStack Query |
| Back end | Python 3.11 + FastAPI + SQLAlchemy + Pydantic |
| Agent | LangGraph (Python) |
| Models | LM Studio (OpenAI-compatible local server) — chat/vision Qwen2.5-VL (tentative), embeddings `nomic-embed-text` (tentative) |
| STT | faster-whisper (`base`/`small`) |
| TTS | browser `SpeechSynthesis` (tentative) |
| Vector store | Chroma (tentative) |
| Database | SQLite (dev) / Postgres-ready |
| Containerisation | Docker + Docker Compose |
| Testing | pytest + httpx (backend); Vitest + Testing Library (frontend) |

Versions are pinned when the environment is created; exact versions are recorded in
`architecture/TECH_STACK.md` and in `requirements.txt` / `package.json`.

---

## Section 3 — Current state (update every session)

> Rule: this section reflects **verified** reality, not intent. If something is not yet built, say so.

### 3.1 Repository status

- **Documentation:** v1.0 suite present (16 documents). The previous unrelated documentation has been
  removed.
- **Code:** Phases P0 (hygiene) and P1.1–P1.4 (restructure) are complete. The Vite app lives in
  `frontend/`, the backend is a package under `backend/app/` with centralised settings in
  `backend/app/core/config.py`, the menu is sourced solely from `data/menu.seed.json`, a
  `docker-compose.yml` skeleton exists, and the backend exposes `GET /api/v1/health` (with a test).
  The legacy Ollama chat router is unwired pending its rebuild in P6. The front end is now TypeScript
  (`strict`; migrated in P2.1) with shared domain types in `frontend/src/types/domain.ts`; `tsc --noEmit`,
  lint, and build pass. The front end also uses a shared design system (`frontend/src/components/ui/`,
  tokens in `frontend/src/styles/tokens.css`) and TanStack Query server-state tooling
  (`frontend/src/lib/`, `frontend/src/hooks/`). Gate 2 is met.

### 3.2 Verified defects carried from the prototype

These are known and must be fixed during the indicated phase:

| Defect | Fix phase |
|---|---|
| Menu duplicated across `mockData.js` and `data/menu.md`. | **Resolved — P1.2** |
| Committed `__pycache__`, unused assets, editor config, dead stylesheet. | P0 |
| AI is not grounded in the menu; `add_to_cart` path is dead. | P6 |
| Random revenue / mock charts in admin. | P7 |
| Cosmetic login / dropdown privilege escalation. | P4 |
| Checkout discards table, payment, instructions. | P4/P5 |
| Feedback rating can compute 15/5. | P4/P5 |
| Hard-coded backend URL; no `.env`. | **Resolved — P1.3** |
| No tests, CI, Docker, or pinned Python deps. | P0/P8 |

### 3.3 Module status matrix

| Module | Target location | Status |
|---|---|---|
| Documentation suite | `docs/` | Implemented (baseline) |
| Canonical menu | `data/menu.seed.json` | Implemented (P1.2) |
| Frontend app | `frontend/` | Present; moved in P1.1; TypeScript in P2.1 (`strict`, typecheck passes) |
| Backend API | `backend/app/` | Minimal app + `/api/v1/health` (P1.4); chat router unwired pending P6 |
| Backend config | `backend/app/core/config.py` | Implemented (P1.3) |
| Backend tests | `backend/tests/` | Health test added (P1.4) |
| Docker skeleton | `docker-compose.yml` | Skeleton added in P1.3 (Dockerfiles in P9) |
| Agent service | `backend/app/services/agent/` | Not implemented |
| RAG / vector store | `backend/app/services/rag/` | Not implemented |
| Database models | `backend/app/models/` | Not implemented |
| Admin console | `frontend/src/features/admin/` | Mock present |
| Frontend types | `frontend/src/types/` | Domain (P2.1) + API DTOs (P2.2) |
| Design system | `frontend/src/components/ui/`, `frontend/src/styles/tokens.css` | Tokens + primitives (P2.3) |
| Server-state | `frontend/src/lib/`, `frontend/src/hooks/` | TanStack Query + typed API client (P2.4) |
| Database models | `backend/app/db/`, `backend/app/models/` | SQLAlchemy base + 8 models, dev `create_all` (P3.1) |
| Menu service | `backend/app/services/menu.py`, `backend/app/db/seed.py` | Idempotent seeder + `MenuService` (P3.2) |
| Menu read APIs | `backend/app/api/menu.py`, `backend/app/schemas/menu.py` | Categories/menu/read endpoints (P3.3) |
| API tests | `backend/tests/conftest.py`, `backend/tests/test_api/` | In-memory seeded client (P3.4) |
| Auth core | `backend/app/core/security.py`, `backend/app/api/auth.py` | bcrypt + JWT register/login (P4.1) |
| Auth guards | `backend/app/api/deps.py` | `get_current_user` / `require_roles` (P4.2) |
| Orders API | `backend/app/api/orders.py`, `backend/app/services/order.py` | Server-priced orders + status (P4.3) |
| Feedback/reservations | `backend/app/api/feedback.py`, `backend/app/api/reservations.py` | 1–5 ratings, admin listing (P4.4) |
| Backend tests | `backend/tests/` | Auth + read/write API suites (26 tests, P4.5) |
| Evaluation harness | `evaluation/` (code) + `docs/evaluation/` | Not implemented |

---

## Section 4 — Session trajectory

### Session 0 — Documentation baseline
- Inspected the full original repository and audited defects.
- Removed unrelated documentation; created the VeeraServe documentation suite.
- Established decisions D-1…D-10 and open items O-1…O-8 in `MEMORY.md`.
- **Next:** begin Phase P0 (repository hygiene) and P1 (restructure).

### Session 1 — Restructure (P0–P1.2)
- Completed Phase P0 (hygiene) and Phase P1.1–P1.2 (restructure); see `MEMORY.md` §7.
- Front end moved to `frontend/`; backend is a package under `backend/app/`; menu sourced only from
  `data/menu.seed.json`.
- **Next:** P1.3 (Docker skeleton + centralised config), P1.4 (minimal app + health endpoint).

### Session 2 — Restructure (P1.3–P1.4)
- Completed P1.3 (Docker skeleton + `backend/app/core/config.py`) and P1.4 (minimal FastAPI app +
  `GET /api/v1/health` + first test); see `MEMORY.md` §7.
- **Next:** Phase P2 (TypeScript migration & design system).

### Session 3 — TypeScript migration (P2.1–P2.2)
- Migrated the front end to TypeScript (`strict`); added tooling (`typescript`, `@types/*`,
  `typescript-eslint`), `typecheck` script, `vite-env.d.ts`, and `src/types/domain.ts`. Added the API
  DTO layer `src/types/api.ts` and wired `data/menu.ts` + `utils/bot.ts` to it. `tsc --noEmit`, lint,
  and build pass.
- **Next:** P2.3 (design tokens & UI primitives), P2.4 (server-state & typecheck pass).

### Session 4 — Design system (P2.3)
- Centralised design tokens in `src/styles/tokens.css`; added shared primitives in
  `src/components/ui/` and adopted them across screens/components (empty states, status badges,
  buttons, inputs, card wrappers). `tsc`, lint, and build pass.
- **Next:** P2.4 (server-state & typecheck pass), then Phase P3 (data layer & read APIs).

### Session 5 — Server-state tooling (P2.4)
- Added TanStack Query + typed API client (`src/lib/`), `useHealth` hook (`src/hooks/`), and a
  backend-status indicator in the right rail. `tsc`, lint, and build pass; Gate 2 met.
- **Next:** Phase P3 (data layer & read APIs).

### Session 6 — Data layer (P3.1)
- Added the SQLAlchemy data layer (`backend/app/db/`) and all eight ORM models; dev `create_all` runs
  on startup; schema test added. `pytest` passes.
- **Next:** P3.2 (seeder + `MenuService`), P3.3 (read endpoints), P3.4 (read API tests).

### Session 7 — Menu service (P3.2)
- Added an idempotent seeder (`backend/app/db/seed.py`, upsert by seed id, runs on startup and via
  `python -m app.db.seed`) and `MenuService` (`backend/app/services/menu.py`) with category/veg/max-price/
  search filters. `pytest` passes (4 tests).
- **Next:** P3.3 (read endpoints), P3.4 (read API tests).

### Session 8 — Read endpoints (P3.3)
- Added `GET /api/v1/categories`, `GET /api/v1/menu` (category/veg/max-price/search), and
  `GET /api/v1/menu/{id}` (404) with Pydantic response models, backed by `MenuService`.
- **Next:** P3.4 (read API tests).

### Session 9 — Read API tests (P3.4)
- Added `backend/tests/conftest.py` (in-memory SQLite + seeded `get_db` override) and read API tests
  (happy path, filters, 404). `pytest` passes (9 tests). **Gate 3 met.**
- **Next:** Phase P4 (auth & write APIs).

### Session 10 — Auth core (P4.1)
- Added bcrypt hashing + PyJWT tokens (`backend/app/core/security.py`) and `POST /api/v1/auth/register`
  / `POST /api/v1/auth/login`; pinned `bcrypt`/`PyJWT`.
- **Next:** P4.2 (server-side role enforcement).

### Session 11 — Role enforcement (P4.2)
- Added `backend/app/api/deps.py` (`get_current_user`, `get_optional_user`, `require_roles`) and
  `GET /api/v1/auth/me`; missing/invalid tokens → 401, wrong role → 403.
- **Next:** P4.3 (orders API).

### Session 12 — Orders API (P4.3)
- Added server-priced orders (`backend/app/api/orders.py`, `backend/app/services/order.py`):
  `POST /orders` (guests allowed), scoped `GET /orders`, ownership-enforced `GET /orders/{id}`, and
  staff/admin-only `PATCH /orders/{id}/status` (`pending→preparing→ready→served`).
- **Next:** P4.4 (feedback & reservations APIs).

### Session 13 — Feedback & reservations (P4.4)
- Added `POST/GET /api/v1/feedback` (1–5 ratings, admin-only listing) and `POST/GET
  /api/v1/reservations` (party size ≥ 1, scoped listing).
- **Next:** P4.5 (auth & write-path tests).

### Session 14 — Auth & write-path tests (P4.5)
- Added `backend/tests/test_auth/` and write-path tests (orders, feedback/reservations) covering
  hashing/JWT, 401/403 RBAC, ownership, server-side totals, transitions, and rating bounds. `pytest`
  passes (26 tests). **Gate 4 met — backend complete.**
- **Next:** Phase P5 (front-end integration, ordering MVP).

---

## Section 5 — Resumption instructions for IDE agents

When resuming work:

1. Read `RULES.md`, then `PRD.md`, then the phase you are executing in `TASKS.md`.
2. Read `MEMORY.md` for decisions and open items. Do not reopen closed decisions without recording a
   new one.
3. Check the phase's **gate** in `TASKS.md` before starting dependent work.
4. Make changes in small, reviewable steps. Update documentation in the same change as code.
5. Never fabricate metrics, screenshots, or evaluation values. If something is unverified, say so.
6. Keep the AI grounded: no code path may let the model recommend or price a dish that is not in
   `data/menu.seed.json`.
7. At the end of the session, append a record to `MEMORY.md` and update Section 3 here.

### Standard prompt for a fresh agent

> You are continuing the VeeraServe GenAI mini-project. Read `docs/RULES.md`, `docs/PRD.md`,
> `docs/TASKS.md`, and `docs/MEMORY.md`. Resume the current phase, respect its gate, keep the AI
> local-first and grounded, and update the documentation in the same change. Do not fabricate results.

---

*This file is the fastest way to become productive. Keep it current.*
