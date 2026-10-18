# VeeraServe — Agent Design (AGENT_DESIGN.md)

**Status:** Baseline design
**Purpose:** Specify the agentic AI core — the GenAI contribution of the project — in enough detail
to implement, test, and evaluate it.
**Related:** `../architecture/ARCHITECTURE.md`, `../evaluation/EVALUATION.md`, `../RULES.md` §3.

---

## 1. Design goals

1. **Grounded** — every dish, price, and offer the agent references comes from the canonical menu.
2. **Agentic** — the agent takes real actions (cart, order, status) through validated tools.
3. **Multimodal** — accepts text, voice, and images; can reply with voice.
4. **Local & zero-cost** — runs on small models served locally by **LM Studio** through its
   OpenAI-compatible API.
5. **Testable & defensible** — the control flow is an explicit graph, not a prompt soup.

---

## 2. Agentic principles

- **The model proposes; the code disposes.** The model chooses tools and drafts language, but all
  state changes are validated and executed by deterministic code.
- **Ground before you speak.** Retrieve real candidates before answering or acting.
- **Confirm before commitment.** Irreversible actions (placing an order) require explicit
  confirmation.
- **Fail recoverably.** A bad tool call returns a structured error the agent can recover from.
- **Stay in character.** VeeraServe is a restaurant waiter; off-topic requests are declined politely.

---

## 3. Agent topology

The design supports two modes; the supervisor mode is the target for the project's "agentic"
narrative, while a single-agent tool-calling mode is the minimum viable form.

### 3.1 Minimum viable: single tool-calling agent

```text
User turn -> [Ground: retrieve candidates] -> [LLM + tools] -> [Tool executor] -> reply
```

### 3.2 Target: supervisor + specialists

```text
                         +-------------------+
        user turn -----> |   Supervisor      |
                         | (router/planner)  |
                         +---------+---------+
                                   |
        +------------+------------+------------+-------------+
        v            v            v            v             v
   Menu/Greeter  Ordering   Recommendation  Vision/       Status/
   (info, FAQ)   (cart,     (upsell, diet)  Multimodal    Kitchen
                 order)                    (STT/vision)  (tracking)
        |            |            |            |             |
        +------------+------------+------------+-------------+
                                   |
                          shared Tool Layer + Memory + RAG
```

The supervisor decides which specialist handles a turn (it may chain them, e.g., Vision →
Recommendation → Ordering). This is a classic **supervisor multi-agent** pattern and is the primary
"agentic capability" claim.

---

## 4. Tool catalog

Tools are strict contracts. The model proposes calls; the tool layer validates and executes.

| Tool | Arguments | Effect | Validation |
|---|---|---|---|
| `search_menu` | `query?`, `category?`, `is_veg?`, `max_spice?`, `max_price?` | Returns matching menu items (read-only). | Filters applied server-side. |
| `get_item` | `item_id` | Returns one item's details. | Item must exist. |
| `get_recommendations` | `dietary?`, `spice_pref?`, `budget?` | Returns grounded suggestions. | Uses menu + memory. |
| `add_to_cart` | `item_id`, `quantity`, `customisations?` | Adds to cart. | Item exists, available, qty>0. |
| `update_cart` | `item_id`, `quantity` | Sets line quantity (0 removes). | Item in cart. |
| `view_cart` | — | Returns current cart + totals. | — |
| `apply_offer` | `code` | Applies a valid offer/discount. | Code exists and is applicable. |
| `place_order` | `table_number?`, `payment_method?`, `instructions?` | Creates an order. | Cart non-empty; **confirmation required**. |
| `get_order_status` | `order_id?` | Returns status of the user's order. | Order belongs to user/session. |
| `list_offers` | — | Returns active offers / happy-hour info. | — |
| `book_table` | `party_size`, `time`, `name?` | Creates a reservation. | Time valid; party_size ≥ 1. |
| `get_happy_hour_status` | — | Whether happy hour is active and affected items. | Time-based. |

Tool schemas use explicit types and enums; unsupported fields are rejected, and unknown `item_id`s
produce a recoverable error (never a silent success).

---

## 5. RAG grounding

### 5.1 Ingestion

- Source: `data/menu.seed.json`.
- Each item is rendered into a compact text document (name, category, price(s), veg, spice, tags,
  description).
- Documents are embedded with the local embedding model and stored in the vector store.
- Ingestion is idempotent and re-runs when the seed changes.

### 5.2 Retrieval

- On a user turn, the agent retrieves the top-k relevant items (plus optional structured filters).
- Retrieved items are injected into the prompt as the **only** allowed menu context.
- The system prompt forbids inventing items/prices and instructs the agent to say "we don't have
  that" when nothing matches.

### 5.3 Grounding enforcement (defence in depth)

1. Retrieval limits candidate context.
2. Prompt rules forbid fabrication.
3. The **tool layer re-validates** any `item_id` against the database before acting.
4. The reply renderer only formats dishes from validated tool results.

This makes it very hard for a hallucinated dish to reach the user.

---

## 6. Memory

| Type | Scope | Storage | Purpose |
|---|---|---|---|
| **Working memory** | A single turn's retrieved context + tool results. | In-graph state. | Reasoning. |
| **Conversation memory** | Session. | Checkpointer (LangGraph) + `sessions` table. | Pronoun/context resolution. |
| **Long-term preferences** | Per user. | `users.preferences`. | Dietary, spice, allergies, favourite items. |
| **Order history** | Per user. | `orders`. | Re-order, recommendations. |

Preferences are explicit, user-owned, and deletable. The agent may update them with confirmation
("Noted — you prefer veg. Save this?").

---

## 7. Orchestration & state

LangGraph state (conceptual):

```text
{
  session_id, user_id,
  messages,            # conversation
  retrieved,           # grounded candidates
  intent,              # classified intent
  tool_calls,          # pending/executed
  cart_snapshot,
  pending_confirmation, # e.g., awaiting order confirmation
  reply               # streamed out
}
```

Control flow:

1. **Ingest** input (text/audio→text/image).
2. **Ground** (retrieve menu context + load memory).
3. **Route** (supervisor chooses specialist; or single-agent decides tools).
4. **Act** (execute validated tools; may loop for multiple actions).
5. **Confirm** (if an irreversible action is pending, ask the user).
6. **Respond** (compose a grounded reply; stream via SSE).
7. **Persist** (memory, cart, order state).

---

## 8. Multimodal pipelines

- **Voice in:** audio → faster-whisper → text → normal turn.
- **Voice out:** reply → TTS (browser first; Piper optional).
- **Vision:** image → multimodal model loaded in **LM Studio** → description/guess → grounded
  suggestion via `search_menu` / `get_recommendations`, with **labelled certainty** ("I think this is
  close to X — want to try it?"). The model must be loaded with vision capability enabled.
- **Combined:** voice + image in one multipart request (backend already supports multipart).

---

## 9. Guardrails & safety

- **No fabrication:** unsupported claims are refused.
- **Scope:** off-topic, abusive, or unsafe requests are politely declined.
- **Price authority:** prices come from the DB, never the model.
- **Allergens:** only state allergen info present in the data; otherwise advise checking with staff.
- **Alcohol:** respect the age-visibility/config toggle.
- **PII:** do not store message content beyond session needs; preferences are explicit.
- **Injection:** treat retrieved/user content as untrusted; keep the system prompt authoritative.
- **Confirmation:** never place an order without explicit user confirmation.

---

## 10. Small-model reality & fallbacks

Small local models frequently fail to emit valid tool calls (risk R-1). The design therefore:

1. Uses **few, well-described tools** with unambiguous names.
2. Supports a **strict JSON-schema output mode** as a fallback, parsed and validated server-side.
3. **Repairs** common malformations (missing quotes, extra prose) before giving up.
4. **Retries** once with a corrective message, then falls back to a safe clarifying question.
5. Never executes an unvalidated action.

---

## 11. Observability & tracing

- Log per turn: session id, model, tool calls, latencies, and whether grounding succeeded.
- Optional tracing via Langfuse/LangSmith-compatible local tracing (no data leaves the machine).
- Metrics feed `../evaluation/EVALUATION.md`.

---

## 12. Evaluation hooks

The agent exposes machine-checkable interfaces for evaluation:

- Groundedness: does every dish/price in a reply exist in the menu? (see EVALUATION.md §4).
- Tool-call accuracy: correct tool + correct arguments for a labelled scenario.
- Task success: did the scripted goal (e.g., "order X") complete?
- Latency and STT WER.

---

## 13. Open decisions

- Model choice and whether one model serves chat + vision (O-1).
- Embedding model and vector store (O-2, O-3).
- Multi-agent depth: supervisor + N specialists vs. single agent (feature F-A-13 is P3).
- Whether preferences are auto-saved or confirmation-gated.

---

*This document is the contract for the agentic core. Any behavioural change is recorded in
`../MEMORY.md` before implementation.*
