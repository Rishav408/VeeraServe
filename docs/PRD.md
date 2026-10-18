# VeeraServe — Product Requirements Document (PRD)

**Status:** Baseline for implementation
**Project:** VeeraServe — An Agentic, Multimodal AI Waiter for Veeradhar Dhaba
**Audience:** Student author, evaluators, future contributors
**Course:** GenAI mini-project

---

## 1. Purpose

VeeraServe is a restaurant service platform for **Veeradhar Dhaba** whose centrepiece is an
**agentic AI waiter**. Unlike a generic chatbot, VeeraServe is grounded in the restaurant's real
menu and can perform actions: recommend dishes that actually exist, add them to a cart, place an
order, check its status, and remember a diner's preferences across a session.

The product has two co-equal deliverables:

1. **A usable web application** — a diner can browse the menu (food and bar), order, track, and give
   feedback; an authorized admin can manage the menu and orders.
2. **A GenAI contribution** — a locally hosted, zero-cost, grounded, tool-using agent with voice and
   vision, whose behaviour is *evaluated* against explicit metrics.

The AI runs entirely on local open models served by LM Studio (OpenAI-compatible local server) plus
faster-whisper for speech recognition. No paid API is used.

---

## 2. Problem statement

Restaurant ordering interfaces are either static menus (no help choosing) or generic chatbots
(no ability to act, and prone to inventing dishes and prices). A useful AI waiter must:

- know the **actual** menu, including availability, dietary flags, spice levels, and bar pricing
  (including happy hour);
- **act** on the user's behalf (cart, order, status) rather than only describing;
- accept natural, multimodal input (typing, speaking, sending a photo);
- do all of this **privately, locally, and at zero marginal cost**.

VeeraServe addresses these requirements with a grounded, tool-calling agent backed by a real
application and database.

---

## 3. Goals

- Provide a complete, responsive ordering experience for food and beverages.
- Make the AI waiter **grounded**: every recommended dish and price is traceable to the menu data.
- Make the AI waiter **agentic**: it can mutate the cart and place/track orders through validated
  tool calls.
- Support **text, voice, and image** input.
- Persist orders, feedback, and menu state in a database behind an authenticated API.
- Keep the system **local-first and zero-cost**.
- Produce **measurable evidence** (groundedness, tool-call accuracy, STT WER, latency) for the
  academic report.
- Deliver a professional repository (structure, tests, CI, Docker, honest docs).

## 4. Non-goals (initial release)

- Real payment processing (payment selection is recorded, not charged).
- Integration with a real kitchen display system (status is simulated but labelled).
- Production-scale deployment, multi-tenant restaurants, or high availability.
- Using paid cloud AI APIs.
- Full natural-language understanding in every language (multilingual is backlog).
- Loyalty programs, delivery logistics, or third-party aggregator integration.

---

## 5. Users and personas

| Persona | Description | Primary needs |
|---|---|---|
| **Diner (guest)** | A customer at the restaurant (table/QR) or browsing remotely. | Find dishes, get help, order quickly, track order, give feedback. |
| **Registered diner** | A returning customer with saved preferences. | Faster reordering, dietary/spice memory, order history. |
| **Service staff** | Waiter/floor staff assisting guests. | See orders, update status, resolve issues. |
| **Kitchen staff** | Prepares orders. | Clear order queue and status transitions. |
| **Admin / manager** | Owns menu and operations. | CRUD menu, manage availability and prices, view real analytics. |
| **Evaluator / mentor** | Grades or reviews the GenAI project. | See a defensible demonstration and honest evaluation. |

Authentication and role separation are in scope for admin and staff; guests may browse and order
with an anonymous/guest session.

---

## 6. Functional requirements

Requirement IDs are stable and referenced by `TASKS.md` and tests.

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-01 | Display the canonical menu grouped by category, including food and bar items. | Menu renders from `data/menu.seed.json`; categories match the data contract. |
| FR-02 | Support search and filtering by category, veg/non-veg, spice, and price. | Filter results match the query; empty states are shown. |
| FR-03 | Show item details: description, price(s), veg flag, spice level, tags, availability. | Detail view matches the seeded item. |
| FR-04 | Provide a persistent cart with add/remove/quantity and computed totals. | Cart survives reload; subtotal/GST/total are correct. |
| FR-05 | Support guest and registered authentication with role separation. | Admin routes reject non-admin tokens; guest can order. |
| FR-06 | Place an order persisting table, payment method, and instructions. | Order record contains all entered fields. |
| FR-07 | Track order status through a defined lifecycle. | Status transitions are persisted and visible to diner and staff. |
| FR-08 | Provide an **agentic AI waiter** grounded in the menu. | Agent responses cite only real dishes/prices; verified by evaluation. |
| FR-09 | Allow the agent to **add to cart / place order** via validated tool calls. | A natural-language order results in the correct cart/order state. |
| FR-10 | Support **voice input** (STT) and **voice output** (TTS). | Spoken request is transcribed; response can be spoken. |
| FR-11 | Support **image input** for dish/menu understanding. | Uploaded image yields a grounded, labelled-certainty response. |
| FR-12 | Provide recommendations filtered by dietary needs, spice, budget, and past preferences. | Recommended items exist in the menu and match filters. |
| FR-13 | Provide offers/happy-hour pricing where defined. | Happy-hour price is shown and applied when active. |
| FR-14 | Collect multi-dimension feedback (food, service, AI). | Feedback stored with a valid 1–5 rating; no out-of-range values. |
| FR-15 | Provide an admin console for menu CRUD, availability, and order status. | Admin changes persist and propagate to the diner menu and the agent. |
| FR-16 | Provide real analytics (orders, revenue, top items) from the database. | Values derive from stored orders; no random numbers. |
| FR-17 | Handle loading, empty, validation-error, and API-unavailable states. | Each state is visible and understandable. |
| FR-18 | Stream AI responses to the client. | Tokens/segments appear progressively. |

## 7. Non-functional requirements

- **Local-first / zero-cost:** all inference on local models; document hardware minimums.
- **Groundedness:** the agent must not recommend or price a non-existent item; enforced by retrieval
  and server-side validation.
- **Latency:** interactive responses target first token < ~3 s and full answer < ~15 s on reference
  hardware (to be measured; targets are provisional until benchmarked).
- **Reliability:** tool calls are validated and idempotency-protected where relevant.
- **Security:** hashed passwords, JWT (or session) auth, input/file validation, no secrets in Git,
  restricted CORS.
- **Privacy:** no data leaves the machine; no external analytics.
- **Accessibility:** keyboard operability, visible focus, WCAG-AA contrast targets, no colour-only
  meaning.
- **Maintainability:** TypeScript on the front end, typed Pydantic schemas, tests, lint/format, docs.
- **Portability:** one-command local run via Docker Compose.
- **Honesty:** simulated behaviour is labelled; no fabricated metrics in the UI or report.

---

## 8. Scope and MVP definition

### MVP (must ship)

- Menu browse/search/filter and item details (FR-01…FR-03).
- Cart, checkout, and order creation with persistence (FR-04, FR-06).
- Guest + admin authentication with role protection (FR-05).
- Order lifecycle and tracking (FR-07).
- Grounded agent with text + **add-to-cart** tool calls (FR-08, FR-09).
- Voice input (FR-10) and image input (FR-11) in a basic form.
- Feedback (FR-14).
- Admin menu availability + order status (FR-15) and real basic analytics (FR-16).
- Streaming responses (FR-18) and robust UI states (FR-17).

### Post-MVP / backlog

- Full TTS polish, multilingual mode, loyalty, reservations with a real calendar, advanced image
  understanding, multi-agent specialization beyond the supervisor, MCP tool servers, hosted demo.

---

## 9. Success metrics

| Metric | Target | Measured by |
|---|---|---|
| Menu groundedness (no fabricated dishes/prices) | ≥ 95% of answers | `evaluation/EVALUATION.md` |
| Tool-call accuracy (correct tool + arguments) | ≥ 90% | Evaluation harness |
| Order task success (end-to-end via chat) | ≥ 85% | Scripted scenarios |
| STT word error rate (quiet, English) | ≤ 15% | Labelled audio set |
| First-token latency | ≤ 3 s (reference hardware) | Timing instrumentation |
| Frontend build / tests | Green | CI |
| Backend tests | Green | CI |

Metrics are **targets**, not results; actual numbers are recorded only when measured.

---

## 10. Milestones

1. **M1 — Documentation baseline** (`TASKS.md` P0).
2. **M2 — Clean, restructured repository** (P1).
3. **M3 — Typed front end + design system** (P2).
4. **M4 — Data + read APIs** (P3).
5. **M5 — Auth + write APIs** (P4).
6. **M6 — Integrated ordering MVP without AI** (P5).
7. **M7 — Grounded agentic AI + voice/vision** (P6).
8. **M8 — Admin console** (P7).
9. **M9 — Evaluation, CI, Docker, academic report** (P8).

Each milestone maps to a gate in `TASKS.md`.

---

## 11. Acceptance criteria for the initial release

The initial release is accepted when:

- All MVP functional requirements have acceptance evidence.
- The agent is demonstrably grounded (evaluation recorded).
- The agent can add to cart and place an order end-to-end.
- Auth and role protection are enforced by the API, not the UI.
- No fabricated analytics or metrics appear anywhere.
- The repository is clean, tested, containerized, and documented.
- `ACADEMIC_REPORT.md` contains the methodology, implementation, and measured evaluation.

---

## 12. Open decisions

Tracked in `MEMORY.md` §3 (O-1…O-8), including model selection, embeddings, vector store, TTS
engine, auth mechanism, deployment scope, and the groundedness test set.

---

*This PRD is the contract for scope. Changes require an entry in `MEMORY.md`.*
