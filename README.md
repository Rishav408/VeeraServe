# VeeraServe

An agentic, multimodal AI waiter for the restaurant **Veeradhar Dhaba** — built as a GenAI
mini-project. VeeraServe (persona "Veera") is grounded in the real menu, can take real actions
(add to cart, place orders, check status), and accepts text, voice, and image input — all running on
local, zero-cost open models.

> **Status:** in active development. The repository currently contains the original prototype; the
> documented revamp is planned and tracked in [`docs/TASKS.md`](docs/TASKS.md). This README describes
> the current state and the target, and is kept honest as phases complete.

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
- Admin console with real (non-mock) menu and order management and analytics.

## Tech stack

| Layer | Technology |
|---|---|
| Front end | React 18 + Vite + Tailwind CSS (TypeScript migration planned) |
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
2. Download a chat/vision model (e.g. a Qwen2.5-VL GGUF) and an embedding model (e.g.
   `nomic-embed-text`). The exact model is finalised in Phase P6 (see [`docs/MEMORY.md`](docs/MEMORY.md) O-1).
3. Load the model, open the **Local Server** tab, and start the server (default
   `http://localhost:1234`).
4. Copy `backend/.env.example` to `backend/.env` and set `LLM_BASE_URL`, `LLM_MODEL`, and
   `EMBEDDING_MODEL` to match what you loaded.

If LM Studio is not running, the ordering app still works; only the AI features are unavailable.

## Getting started

### Environment files

```bash
cp .env.example .env            # frontend (VITE_API_URL)
cp backend/.env.example backend/.env
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
| [`docs/evaluation/EVALUATION.md`](docs/evaluation/EVALUATION.md) | Evaluation protocol |
| [`docs/TASKS.md`](docs/TASKS.md) | Phased implementation plan |

## Honesty notes

Some behaviour is intentionally simulated and labelled as such, and some features are still mock:

- Kitchen/order status is simulated unless a real integration is added.
- Admin analytics currently use mock data and are replaced with real DB queries in Phase P7.
- The AI is not yet grounded in the menu; grounding is implemented in Phase P6.

See [`docs/IDE_Context.md`](docs/IDE_Context.md) for the current, verified state of the project.

## License

Coursework project. See the repository owner for terms.
