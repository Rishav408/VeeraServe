# VeeraServe — Original Idea & Project Evolution

**Status:** Baseline narrative
**Purpose:** Record where the project came from, what it originally was, why it was insufficient,
and what it is being transformed into.

---

## 1. The original spark

VeeraServe began as a **casual dummy project** — a visually ambitious restaurant ordering UI built
mostly to explore front-end design: layered "3D" cards, warm gradients, micro-animations, and a
chat panel wired to a local multimodal model. The original goal was aesthetic more than functional:
make a restaurant app that *looked* premium and had a conversational gimmick.

The original build:

- A single-page React app for browsing a hard-coded menu of ~69 dishes and a full bar.
- A local cart and a **simulated** order lifecycle driven by timers.
- A chat panel that sent text, image, and audio to a FastAPI service backed by a local model
  (`qwen2.5vl`) and faster-whisper.
- An admin dashboard that displayed randomized "revenue" and mock charts.

It worked as a demo, but it was a facade: the AI did not know the menu, the analytics were random,
there was no authentication, no database, and the front end and backend shared no data.

## 2. The honest assessment of the original build

A full audit of the original repository identified the following problems. This list is preserved
here because the revamp is defined as *the fix for these problems*.

### 2.1 Claims that were not true

- The README advertised an "AI waiter that can order for you." In reality the model never saw the
  menu and could recommend dishes that do not exist. The front-end code path that would add an
  AI-suggested dish to the cart was **dead code** (the API always returned a null action).
- "Real-time order tracking" was a `setTimeout` sequence unrelated to any kitchen.
- The admin "dashboard" showed `Math.random()` revenue and fabricated charts.
- "Voice support, transcribed in real time" was a record-then-upload flow, not streaming.

### 2.2 Structural problems

- Flat repository: the front end lived at the repository root with `backend/` as a sibling; no
  application boundary, no monorepo tooling.
- Committed artifacts: Python `__pycache__`/`.pyc`, an editor-assistant config folder, and several
  unused image assets.
- Dead files: a leftover Vite-template stylesheet, an unused `data/menu.md`, and duplicate menu
  data spread between a 1,022-line JS module and a Markdown file.
- No tests, no CI, no Docker, no `.env.example`, no Python hygiene (unpinned dependencies), and a
  hard-coded `http://localhost:8000` in the front end.
- Inconsistent branding ("VeeraServe" in the README vs. "Veera Dhabha" in the UI).

### 2.3 Correctness defects

- Feedback rating math could produce a value of **15 out of 5** when no stars were selected.
- Login was cosmetic; a user could simply pick "Admin" from a dropdown to gain admin views.
- Checkout collected table number, payment method, and instructions, then discarded all of them.
- Item customisations, promo codes, QR scanning, and profile preferences were all non-functional.

## 3. The pivot

The project is being repurposed as the **GenAI mini-project submission** for a college course. This
changes the success definition:

- It is no longer enough to *look* good. The GenAI behaviour must be **real, measurable, and
  defensible** in front of an evaluator.
- The centrepiece becomes an **agentic** AI waiter: a system that reasons over a real menu,
  calls tools to modify a real cart and place real orders, remembers user preferences, accepts
  voice and images, and never invents dishes or prices.
- The application must feel like a **usable restaurant service**, not a slideware mock.
- Everything must remain **local-first and zero-cost** — small open models served through LM Studio,
  no paid APIs — so it can be demonstrated anywhere without a budget.

## 4. What "done" now means

The revamped VeeraServe is complete when:

1. A diner can browse the real Veeradhar Dhaba menu (food and bar, with happy-hour pricing),
   search it, and build an order.
2. A diner can talk (or type, or send a photo) to VeeraServe and have it **only** recommend dishes
   that exist, with correct prices, and actually add them to the cart via tool calls.
3. Orders persist in a database, move through a real lifecycle, and are visible to the diner and to
   an authorized admin.
4. Authentication and role separation are real (not a dropdown).
5. The GenAI behaviour is **evaluated**: menu groundedness / hallucination rate, tool-call accuracy,
   speech-to-text word error rate, and latency are measured and reported.
6. The repository is professional: clean structure, tests, CI, Docker, honest documentation, and no
   committed junk.

## 5. Relationship to the rest of the documentation

- The *problems* above are traced to fixes in `TASKS.md`.
- The *product intent* is formalized in `PRD.md`.
- The *capability set* is enumerated in `FEATURES.md`.
- The *agentic core* that turns the gimmick into a genuine GenAI contribution is specified in
  `ai/AGENT_DESIGN.md`.
- The *evidence* that the GenAI claims hold is defined in `evaluation/EVALUATION.md` and written up
  in `ACADEMIC_REPORT.md`.

---

*This document is historical and explanatory. It should be updated only if the project's origin or
intent materially changes.*
