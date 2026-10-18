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

### Session 2 — Repository restructure (P0–P1.2)

- **Completed:** Phase P0 (hygiene: junk/asset removal, `.gitignore`, `.editorconfig`, pinned backend
  dependencies, env samples, README, `docs-baseline` tag); Phase P1.1 (front end moved to `frontend/`,
  backend reshaped into `backend/app/` with a thin entry point); Phase P1.2 (canonical menu seed).
- **Decisions:** none new. Menu single source of truth realised for D-7.
- **Open items opened/closed:** none.
- **Next:** P1.3 (Docker skeleton + centralised config), P1.4 (minimal app + health endpoint).

---

*Append-only. Do not delete history; supersede it.*
