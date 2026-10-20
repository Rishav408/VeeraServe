# VeeraServe: An Agentic, Multimodal AI Waiter for a Restaurant Service

**Document type:** Academic report (GenAI mini-project)
**Author:** _(student name)_
**Course:** _(course code / title)_
**Institution:** _(university)_
**Status:** Draft baseline — Results sections pending Phase P8

> **Integrity note.** Sections marked _"to be populated"_ must not be filled with invented values.
> All quantitative results must be produced by the evaluation harness (`evaluation/harness/`) and
> recorded in `evaluation/EVALUATION.md`.

---

## Abstract

Restaurant ordering is typically either a static menu with no assistance or a generic chatbot that
cannot take action and is prone to inventing menu items and prices. This project presents
**VeeraServe**, an agentic, multimodal AI waiter for the restaurant *Veeradhar Dhaba*. VeeraServe is
grounded in the restaurant's real menu through retrieval-augmented generation (RAG), and it is
*agentic*: it can perform validated actions such as adding items to a cart, placing an order, and
reporting order status. It accepts text, voice, and image input and runs entirely on **local,
zero-cost open models** (served locally by LM Studio through its OpenAI-compatible API, plus
faster-whisper for speech). The system comprises a React + TypeScript front
end, a FastAPI backend, a LangGraph agent, and a database. We evaluate the GenAI claims with a fixed
protocol measuring menu groundedness/hallucination, tool-call accuracy, end-to-end task success,
speech-to-text word error rate, and latency. _[Summarised results to be populated in Phase P8.]_

**Keywords:** large language models, agents, tool calling, retrieval-augmented generation, local
inference, multimodal, restaurant technology.

---

## 1. Introduction

Conversational assistants are increasingly deployed in service settings, but a chatbot that only
*describes* is of limited value in ordering: the user still has to translate advice into actions.
Worse, ungrounded models confidently invent products and prices, undermining trust. This project
investigates whether a **small, local, grounded, tool-using agent** can deliver a genuinely useful
restaurant-ordering experience at zero marginal cost.

The project began as a visual prototype (a mock ordering UI with a chat gimmick) and was rebuilt as
a GenAI mini-project. The origin and the audit of the prototype's shortcomings are documented in
`ORIGINAL_IDEA.md`; this report focuses on the research and engineering work.

**Contributions.**

1. An agentic AI waiter architecture that couples a RAG-grounded LLM to a validated **tool layer**,
   enabling real cart/order actions while preventing hallucinated menu items.
2. A defence-in-depth grounding strategy (retrieval + prompt rules + server-side validation +
   validated rendering).
3. A multimodal pipeline (text, local STT, local vision) on small models.
4. A fixed evaluation protocol and ablation quantifying the effect of grounding.

---

## 2. Objectives

- **O1.** Build a usable restaurant ordering application (browse, cart, checkout, track, feedback).
- **O2.** Implement a grounded AI waiter that never recommends non-existent dishes or prices.
- **O3.** Make the waiter agentic: it can add to cart, place orders, and query status via tools.
- **O4.** Support voice and image input.
- **O5.** Run entirely on local, zero-cost models.
- **O6.** Evaluate the GenAI behaviour with reproducible metrics.

---

## 3. Related Work

_(To be expanded with citations.)_ Relevant areas include:

- **Retrieval-augmented generation (RAG)** for grounding generated text in a knowledge base.
- **Tool use / function calling** in LLM agents, and **agent frameworks** (e.g., LangGraph) that
  model agent behaviour as explicit state machines.
- **Local/small model inference** (LM Studio, GGUF quantised models, OpenAI-compatible servers) and **speech recognition** (Whisper /
  faster-whisper).
- **Conversational commerce** and existing restaurant chatbot deployments.

---

## 4. Methodology

The project follows phase-gated engineering (see `TASKS.md`) with an evaluation protocol fixed in
advance (`evaluation/EVALUATION.md`).

- **Grounding strategy:** the menu is the single source of truth (`data/menu.seed.json`); relevant
  items are retrieved and supplied to the model, which is forbidden from inventing data; the tool
  layer re-validates every item id against the database.
- **Agentic strategy:** the agent plans and selects tools; deterministic code executes them.
  Irreversible actions require user confirmation.
- **Evaluation strategy:** a fixed test-set design measures groundedness, tool accuracy, task
  success, STT WER, and latency, including a no-RAG vs RAG ablation.

---

## 5. System Design

The system has three tiers plus an intelligence layer (full detail in
`architecture/ARCHITECTURE.md`):

- **Front end:** React + TypeScript; menu, cart, checkout, orders, chat, voice/vision, admin.
- **Backend:** FastAPI; auth/roles, catalog, orders, feedback, reservations; SSE for chat.
- **Agent:** LangGraph supervisor + specialists; tool layer; RAG retrieval; memory.
- **Models:** LM Studio (chat/vision + embeddings over an OpenAI-compatible local API),
  faster-whisper (STT), optional TTS.

A single **menu service** guarantees that the UI and the agent use identical menu authority.

---

## 6. Implementation

_(To be finalised as code is built.)_ Key implementation notes:

- Canonical seed → database → retrieval index, all idempotent.
- Tool schemas validated with Pydantic; unknown items rejected with recoverable errors.
- Agent control flow expressed as a LangGraph state machine (see `ai/AGENT_DESIGN.md`).
- Strict JSON-schema fallback for small-model tool-calling unreliability.
- Streaming responses via SSE.
- Local run only (frontend + backend + LM Studio); Docker/CI are out of scope for v1.

Implementation risks and mitigations are recorded in `MEMORY.md` §4.

---

## 7. Evaluation & Experiments

The evaluation protocol is defined in `evaluation/EVALUATION.md`. Summary of the design:

| ID | Metric | Target |
|---|---|---|
| M-1 | Menu groundedness | ≥ 95% |
| M-2 | Hallucination rate | ≤ 5% |
| M-3 | Tool-call accuracy | ≥ 90% |
| M-4 | End-to-end task success | ≥ 85% |
| M-5 | STT word error rate | ≤ 15% |
| M-6 | Vision usefulness | ≥ 70% helpful |
| M-7 | First-token latency | ≤ 3 s |
| M-8 | Full-response latency | ≤ 15 s |
| M-9 | Refusal correctness | ≥ 95% |

**Key experiment:** an ablation comparing a **no-RAG** baseline against the **RAG-grounded** agent on
the grounding set (M-1/M-2), and a model comparison across candidate local models (M-3/M-4/M-7/M-8).

---

## 8. Results

> **Status: to be populated in Phase P8 from `evaluation/results/`.**
> Until measured, this section contains no values.

### 8.1 Groundedness (M-1, M-2)
_To be populated. Include the no-RAG vs RAG ablation._

### 8.2 Agentic capability (M-3, M-4)
_To be populated._

### 8.3 Multimodal (M-5, M-6)
_To be populated._

### 8.4 Performance (M-7, M-8)
_To be populated on recorded reference hardware._

### 8.5 Safety (M-9)
_To be populated._

---

## 9. Discussion

_(To be written once results exist.)_ Expected themes: the effect of grounding on hallucination;
the trade-off between model size, latency, and tool-calling reliability; and the practical value of
confirming irreversible actions.

---

## 10. Limitations

- Small local models are less capable than large hosted models; results are specific to the local
  setup and hardware tested and are not generalised beyond it.
- Kitchen/order status is simulated (labelled) rather than integrated with a real kitchen system.
- Payment is recorded, not processed.
- Vision on a 3B model is approximate; certainty is labelled.
- Human-rated metrics depend on rater judgement and a recorded rubric.

---

## 11. Conclusion

VeeraServe demonstrates that a small, local, grounded, tool-using agent can power a credible
restaurant service at zero marginal cost, and that the GenAI claims behind such a system can be
measured honestly. _[Final conclusion to be completed with measured results.]_

---

## 12. Future Work

- Real kitchen integration (KDS/webhook) replacing simulated status.
- Multilingual conversation (Hindi/Marathi).
- Stronger vision for menu OCR.
- Multi-restaurant/multi-tenant support.
- Quantitative user study with real diners.

---

## 13. References

_(To be completed.)_ Suggested categories: RAG, tool-using agents and agent frameworks, Whisper/
faster-whisper, LM Studio and small-model inference, conversational commerce, and the restaurant's
public menu data.

---

## Appendix

- `INDEX.md` — documentation map.
- `architecture/ARCHITECTURE.md`, `ai/AGENT_DESIGN.md` — design detail.
- `evaluation/EVALUATION.md` — full protocol and results.
- `DEMONSTRATION_FLOW.md` — reproducible demo.

---

*This report must remain consistent with the measured evidence. No fabricated results.*
