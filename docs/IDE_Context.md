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
  The legacy Ollama chat router is unwired pending its rebuild in P6. The front end is still
  JavaScript (TypeScript migration is Phase P2).

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
| Frontend app | `frontend/` | Present; moved in P1.1 (still JavaScript) |
| Backend API | `backend/app/` | Minimal app + `/api/v1/health` (P1.4); chat router unwired pending P6 |
| Backend config | `backend/app/core/config.py` | Implemented (P1.3) |
| Backend tests | `backend/tests/` | Health test added (P1.4) |
| Docker skeleton | `docker-compose.yml` | Skeleton added in P1.3 (Dockerfiles in P9) |
| Agent service | `backend/app/services/agent/` | Not implemented |
| RAG / vector store | `backend/app/services/rag/` | Not implemented |
| Database models | `backend/app/models/` | Not implemented |
| Admin console | `frontend/src/features/admin/` | Mock present |
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
