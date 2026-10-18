# VeeraServe — Technology Stack

**Status:** Baseline for confirmation
**Development environment:** Windows + VS Code
**Compute strategy:** Fully local, zero-cost (small open models served by **LM Studio**)
**Application architecture:** React + TypeScript front end, Python FastAPI backend, LangGraph agent

---

## 1. Stack overview

| Layer | Technology | Purpose |
|---|---|---|
| Front-end language | TypeScript | Typed UI and API contracts |
| Front-end framework | React 18 | Component model |
| Build tool | Vite | Fast dev server and production build |
| Styling | Tailwind CSS + design tokens | Consistent warm design system |
| Animation | Framer Motion | Micro-animations and transitions |
| Icons | Lucide React | Icon set |
| Routing | React Router | Multi-page navigation |
| Server state | TanStack Query | Fetching, caching, mutations |
| Client state | Lightweight store (Zustand) or React context | Cart, UI state |
| Backend language | Python 3.11 | API and AI services |
| Backend framework | FastAPI | Typed HTTP API |
| Validation | Pydantic | Request/response schemas |
| ORM | SQLAlchemy | Database models |
| Database | SQLite (dev) / Postgres (ready) | Persistence |
| Agent orchestration | LangGraph | Stateful, tool-calling agent |
| Local model runtime | **LM Studio** (desktop app + local server) | Downloads and runs open GGUF models locally |
| Model API | OpenAI-compatible REST (`/v1/chat/completions`, `/v1/embeddings`) on `http://localhost:1234/v1` | Uniform client for chat, vision, and embeddings |
| Model client | `openai` Python SDK (or `langchain-openai`) | Talks to LM Studio's OpenAI-compatible endpoints |
| Chat/vision model | Loaded in LM Studio, e.g. Qwen2.5-VL (tentative, see O-1) | Reasoning + image understanding |
| Embedding model | Loaded in LM Studio, e.g. `nomic-embed-text` (tentative, see O-2) | Menu retrieval |
| Vector store | Chroma (tentative, see O-3) | RAG index |
| Speech-to-text | faster-whisper (`base`/`small`) | Voice input |
| Text-to-speech | Browser `SpeechSynthesis` (see O-4) | Voice output |
| Auth | JWT (see O-5) + Argon2/bcrypt hashing | Accounts and roles |
| Containerisation | Docker + Docker Compose | One-command local run |
| Backend tests | pytest + httpx | Unit/integration/API tests |
| Front-end tests | Vitest + Testing Library | Component/flow tests |
| Lint/format | Ruff + Black (Python); ESLint + Prettier (TS) | Code quality |
| CI | GitHub Actions | Lint, typecheck, test, build |

**Version policy:** choose supported, mutually compatible versions when the environment is created,
pin them in `requirements.txt` / `package-lock.json`, and record the exact versions used. This
document intentionally does not assert unverified version numbers.

---

## 2. Why this stack

- **React + TypeScript** gives a polished, responsive, multi-page UI with type safety across the
  API and agent contracts — important for a professional submission.
- **FastAPI + Pydantic** exposes the Python AI stack with automatic validation and OpenAPI docs.
- **LangGraph** makes the agent's control flow an explicit, testable state machine — easy to diagram
  and defend academically (more so than an opaque prompt chain).
- **LM Studio** provides local, zero-cost, offline inference of small open models through a desktop
  app with a built-in OpenAI-compatible server — so the backend uses the same client code it would
  for any OpenAI-compatible API, with no cloud dependency.
- **faster-whisper** provides accurate local STT without a cloud service.
- **SQLite → Postgres** keeps local setup trivial while remaining production-ready.

---

## 3. Local model strategy

The project deliberately runs **small** models so it can be demonstrated on a modest laptop. LLM and
embedding models are loaded in **LM Studio**; speech recognition runs separately in-process.

| Task | Model | Size class | Served by |
|---|---|---|---|
| Chat + tools | e.g. Qwen2.5-7B-Instruct *or* Qwen2.5-VL-3B (GGUF) | 3–7B | LM Studio (O-1). |
| Vision | e.g. Qwen2.5-VL-3B (GGUF) | 3B | LM Studio — dish/menu photo understanding. |
| Embeddings | e.g. `nomic-embed-text` (GGUF) | small | LM Studio — menu retrieval. |
| STT | faster-whisper `base`/`small` | small | In-process Python (LM Studio does not serve STT). |
| TTS | browser `SpeechSynthesis` | — | Browser — zero-install voice output. |

**LM Studio operation (developer setup):**

1. Install LM Studio and download the chosen GGUF chat/vision and embedding models via its UI.
2. Load a model and start the **local server** (default `http://localhost:1234/v1`, OpenAI-compatible).
3. Enable the model's **tool/function-calling** support where available; record which model is loaded.
4. The backend reads `LLM_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL` (and a dummy `LLM_API_KEY`) from
   `.env`; it never hard-codes the model name.
5. Because LM Studio is a desktop app, it runs on the **host**, not inside Docker (see §7).

Model readiness is a runtime precondition: if the LM Studio server is not running, the chat surfaces
an "AI unavailable" state while the rest of the app still works (`ARCHITECTURE.md` §10).

**Hardware guidance (to be confirmed on reference hardware):**

- Minimum: 16 GB RAM, modern CPU, ~10 GB free disk for models.
- Recommended: 32 GB RAM and a CUDA GPU for responsive 7B inference.
- The project must remain usable on CPU with the smaller models.

Because small models are weak tool-callers (risk R-1), the stack includes a **strict JSON-schema
output mode** and server-side validation as a fallback path.

---

## 4. Environment & configuration

- Front end: `.env` with `VITE_API_URL` (no hard-coded URLs).
- Backend: `.env` with database URL, JWT secret, LM Studio base URL (`LLM_BASE_URL`, default
  `http://localhost:1234/v1`), model names, upload limits.
- Secrets are never committed; `.env.example` documents required keys.
- Model names, endpoints, and limits are configuration, not code.

---

## 5. Dependency management

- Python: virtual environment + pinned `requirements.txt` (split into runtime vs. dev if large).
- Front end: `package.json` + committed lock file.
- Record the environment used for any reported evaluation.
- Never rely on an unpinned install for a reported result.

---

## 6. Model / artifact contract

Although the project uses runtime model servers (not trained artifacts), the following are recorded
for reproducibility:

- LM Studio model identifiers and quantisation (e.g., `qwen2.5-vl-3b-instruct@q4_k_m`), plus the
  exact LM Studio version and the model's context length / sampling settings used.
- Prompt template version.
- Retrieval configuration (embedding model, chunking, top-k).
- Tool schema version.
- Seed data version (`data/menu.seed.json`).
- Code revision.

---

## 7. Local vs. container run

- **Local dev:** `npm run dev` (front end) and `uvicorn` (backend); LM Studio running on the host with
  its local server started.
- **Containerized:** `docker compose up` starts front end, backend, vector store, and database.
  **LM Studio is not containerized** — the backend reaches the host server at
  `http://host.docker.internal:1234/v1` (Windows/macOS), configured via `LLM_BASE_URL`.
- Both paths must be documented and reproducible. The Docker path documents the host-model
  requirement explicitly so a fresh machine can reproduce it.

---

## 8. Decisions still to confirm

- Final chat/vision model and whether one model handles both roles (O-1).
- Embedding model and vector store (O-2, O-3).
- TTS engine (O-4).
- Auth mechanism details (O-5).
- Whether the vector store is a separate service or embedded (O-3).
- Charting/component libraries for the admin console.

---

*Confirm these choices in `../MEMORY.md` when the environment is created.*
