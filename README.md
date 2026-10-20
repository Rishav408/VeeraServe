# VeeraServe

An agentic, multimodal AI waiter for the restaurant **Veeradhar Dhaba** — built as a GenAI
mini-project. VeeraServe (persona "Veera") is grounded in the real menu, can take real actions
(add to cart, place orders, check status), and accepts text, voice, and image input — all running on
local, zero-cost open models.

> **Status:** v1.0 (tagged). All planned phases (P0–P8) are complete and verified; see
> `docs/evaluation/EVALUATION.md` for the measured results and
> `docs/demo/` for real demo screenshots. P9-style containerised deployment is out of scope for v1
> (decision D-18 in `docs/MEMORY.md`) — the documented run is local.

## Overview

Most restaurant chat UIs either do nothing useful or invent dishes and prices. VeeraServe is
**grounded** (every dish, price, and offer comes from the canonical menu) and **agentic** (it performs
validated actions through a tool layer). It runs entirely locally, so it can be demonstrated without
a budget or a network connection.

- Full documentation: [`docs/INDEX.md`](docs/INDEX.md)
- Vision & design: [`docs/ORIGINAL_IDEA.md`](docs/ORIGINAL_IDEA.md), [`docs/PRD.md`](docs/PRD.md)

## Capabilities

Target capabilities (see [`docs/FEATURES.md`](docs/FEATURES.md) for status and priorities):

- Grounded AI waiter over the real menu (RAG), with no fabricated dishes or prices.
- Agentic actions via tools: add/update cart, place order, order status, offers, reservations.
- Voice input (faster-whisper) and image input (local vision model).
- Complete ordering flow: menu, cart, checkout, order tracking, feedback.
- Admin console with real (non-mock) menu and order management and analytics.## Tech stack

| Layer | Technology |
|---|---|
| Front end | React + Vite + Tailwind CSS (TypeScript, strict) |
| Back end | Python 3.11 + FastAPI + SQLAlchemy + Pydantic |
| Agent | LangGraph (grounded, tool-calling) |
| Local LLM | **LM Studio** via its OpenAI-compatible local API |
| Speech-to-text | faster-whisper |
| Data | SQLite (development) / Postgres-ready |

The full rationale and versions are in [`docs/architecture/TECH_STACK.md`](docs/architecture/TECH_STACK.md).

## Prerequisites

- **Node.js** (LTS) and **Python 3.11**.
- **LM Studio** — required for the AI features. All models run locally; no cloud API is used.

### LM Studio setup

1. Install [LM Studio](https://lmstudio.ai/) and open it.
2. Download a chat model (e.g. a Qwen2.5 GGUF) and an embedding model (e.g.
   `text-embedding-nomic-embed-text-v1.5`); names must match `LLM_CHAT_MODEL` /
   `LLM_EMBEDDING_MODEL` in `backend/.env`.
3. Load the models, open the **Local Server** tab, and start the server (default
   `http://localhost:1234/v1`).
4. Copy `backend/.env.example` to `backend/.env` and set `LLM_BASE_URL`,
   `LLM_CHAT_MODEL`, and `LLM_EMBEDDING_MODEL` to match what you loaded.

If LM Studio is not running, the ordering app still works; only the AI features are unavailable.

## Getting started

### Environment files

```bash
cp frontend/.env.example frontend/.env    # frontend (VITE_API_URL)
cp backend/.env.example backend/.env      # backend (DB, JWT, LLM)
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py                  # available at http://localhost:8000
```

> The backend is a package under `backend/app/`; `python main.py` (or `uvicorn app.main:app` from
> `backend/`) starts it.

### Frontend

```bash
cd frontend
npm install
npm run dev                     # available at http://localhost:5173
```

### Local run only

The project is not containerised for v1. Run the backend and frontend as above, and keep LM Studio
running on the host at `http://localhost:1234/v1` (default `LLM_BASE_URL`). CI and Docker are out of
scope; tests run locally with `pytest` and `npm test`.

## Project structure (current)

```text
VeeraServe/
├── frontend/           # React front end (Vite app)
│   ├── src/            # components, screens, context, data
│   └── package.json
├── backend/            # FastAPI backend
│   ├── main.py         # thin entry point (uvicorn app.main:app)
│   └── app/            # application package (api, core, services, models, schemas)
├── data/               # canonical menu seed (menu.seed.json) + schema
└── docs/               # project documentation
```

The target structure is defined in
[`docs/architecture/FOLDER_STRUCTURE.md`](docs/architecture/FOLDER_STRUCTURE.md).

## Documentation

| Document | Contents |
|---|---|
| [`docs/INDEX.md`](docs/INDEX.md) | Map of all documents |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Feature inventory with status |
| [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) | System design |
| [`docs/ai/AGENT_DESIGN.md`](docs/ai/AGENT_DESIGN.md) | Agent, tools, RAG, memory |
| [`docs/evaluation/EVALUATION.md`](docs/evaluation/EVALUATION.md) | Evaluation protocol + results |
| [`docs/DEMONSTRATION_FLOW.md`](docs/DEMONSTRATION_FLOW.md) | Demo script + screenshot assets |
| [`docs/ACADEMIC_REPORT.md`](docs/ACADEMIC_REPORT.md) | Academic report |
| [`docs/TASKS.md`](docs/TASKS.md) | Phased implementation plan |

## Honesty notes

- Kitchen/order status is simulated (labelled), not a real kitchen integration.
- STT evaluation uses Windows SAPI-synthesised clips; the corpus WER (0.181) misses the 0.15 target
  and is reported as such.
- Vision usefulness (M-6) was not measured; the image path is functionally integrated only.
- The pinned evaluation models were substituted with locally available ones and disclosed.

See [`docs/IDE_Context.md`](docs/IDE_Context.md) for the current, verified state of the project.

## License

Coursework project. See the repository owner for terms.
