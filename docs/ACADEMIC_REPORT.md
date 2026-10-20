# VeeraServe: An Agentic, Multimodal AI Waiter for a Restaurant Service

**Document type:** Academic report (GenAI mini-project)
**Author:** _(student name)_
**Course:** _(course code / title)_
**Institution:** _(university)_
**Status:** Final — results recorded in Phase P8.3 and release polish in Phase P8.5

> **Integrity note.** Every quantitative value below was produced by the evaluation harness
> (`evaluation/harness/`) and is recorded in `evaluation/EVALUATION.md` with raw outputs in
> `evaluation/results/`. No values are estimated or invented.

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
speech-to-text word error rate, safety refusal, and latency. The shipped agent achieved perfect
menu groundedness (1.000), zero hallucinated prices, perfect tool-call accuracy (1.000), and perfect
task success (25/25). The no-retrieval ablation grounded no answer (0.000) and hallucinated prices at
a 0.021 rate, while retrieval-grounded generation matched the agent (1.000/0.000), isolating grounding
as the decisive factor. Safety refusal was 1.000 (24/24 adversarial prompts plus 16/16 non-existent
dish traps, with zero orders placed). Median first-token and full-response latency on the shipped
deterministic path were both 4 ms (p90 5 ms). Speech-to-text word error rate was 0.181 on a synthetic
corpus, missing the 0.15 target, and vision usefulness was not measured because no labelled image set
or human raters were available.

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

**Retrieval-augmented generation (RAG).** Lewis et al. [1] introduced RAG, combining a parametric
sequence-to-sequence model with a non-parametric dense index so that generation is conditioned on
retrieved evidence. RAG is the standard remedy for knowledge-intensive tasks where a model's
parametric memory is stale or incomplete; VeeraServe applies the same principle to a small, mutable
menu rather than a general corpus.

**Tool-using agents.** ReAct [2] interleaves reasoning traces with actions, letting a model query
external sources and revise its plan. Toolformer [3] showed that models can learn when to call APIs
from self-supervision. Contemporary agent frameworks such as LangGraph [4] make the control flow an
explicit state machine, which is the approach used here: routing and tool execution are inspectable
graph nodes rather than free-form model output.

**Small local models.** Qwen2.5 [5] reports competitive instruction-following and tool-use behaviour
for compact open models. Serving such models through LM Studio's OpenAI-compatible endpoint [6] keeps
inference local and zero-cost. Embeddings are stored in Chroma [7].

**Speech recognition.** Whisper [8] demonstrated robust multilingual speech recognition from
large-scale weak supervision; faster-whisper [9] provides a CPU-efficient reimplementation used for
local transcription.

**Conversational commerce.** Commercial restaurant assistants typically combine a menu catalogue with
a hosted chat model. Published evaluations of their grounding and action correctness are scarce; this
project therefore contributes a reproducible, fully local protocol rather than a product comparison.

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

The delivered system runs locally as three processes: the Vite front end, the FastAPI backend, and
LM Studio's local model server. The canonical menu (`data/menu.seed.json`) contains 161 items across
8 categories. Startup seeds the SQLAlchemy database additively and reindexes Chroma from the database,
so the database is the runtime source of truth and reseeding is idempotent. The front end is React +
TypeScript, the backend is Python 3.11 with FastAPI, SQLAlchemy, and Pydantic, and the agent is a
compiled LangGraph state machine.

- **Tool layer.** Twelve typed tools cover menu search, item details, recommendations, cart
  operations, order placement, and order status. Arguments are validated with Pydantic and item ids
  are re-checked against the database, so an unknown dish produces a recoverable tool error rather
  than a fabricated result. Order placement is confirmation-gated and server-side totals are
  recomputed; the client never supplies prices.
- **Grounding and verification.** Retrieval returns the top-ranked menu rows for each turn. The
  graph's deterministic handler produces the authoritative reply; optional LLM polishing is disabled
  by default and, when enabled, is accepted only if a verification check finds no ungrounded price.
  The front end renders validated bot messages rather than raw model text.
- **Agent control flow.** Rule-based intent routing dispatches to specialist handlers, with
  guardrails for prompt injection, off-topic requests, and disabled alcohol service. Conversation
  state is checkpointed in memory per session. See `ai/AGENT_DESIGN.md`.
- **Multimodal input.** Images are sent with the chat request and handled by the vision model when
  configured; voice recordings are transcribed in-process by faster-whisper. Speech output uses the
  browser's SpeechSynthesis API, so no audio leaves the machine.
- **Streaming.** Chat responses are delivered over Server-Sent Events with distinct session,
  transcript, tool, token, cart, and completion events, allowing the UI to show tool activity before
  the final text.
- **Delivery scope.** v1 is local-only. Docker, Docker Compose, and CI were deliberately removed from
  scope (decision D-18 in `MEMORY.md`); the documented run path is frontend + backend + LM Studio on
  one machine.

Verification: 113 backend tests pass with 3 skipped, and 14 front-end tests pass; lint, type checking,
and the production build are clean. Implementation risks and mitigations are recorded in
`MEMORY.md` §4.

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
the grounding set (M-1/M-2). A planned comparison across candidate local models (M-3/M-4/M-7/M-8)
was not run because suitable checkpoints were unavailable locally; this is disclosed in §10.

---

## 8. Results

> **Recorded 2026-10-20 (revision `b7de574` plus the P8.3 harness changes).** Raw outputs are in
> `evaluation/results/`. The shipped agent path is deterministic (D-13); only the LLM ablation was
> repeated (3 runs). All runs used temperature 0 and retrieval top-k = 8.

**Table 1. Summary of measured results.**

| ID | Metric | Target | Result |
|---|---|---|---|
| M-1 | Menu groundedness | ≥ 95% | **1.000** (48/48) |
| M-2 | Hallucination rate | ≤ 5% | **0.000** (0/64) |
| M-3 | Tool-call accuracy | ≥ 90% | **1.000** (40/40) |
| M-4 | End-to-end task success | ≥ 85% | **1.000** (25/25) |
| M-5 | STT word error rate | ≤ 15% | **0.181** corpus (target missed) |
| M-6 | Vision usefulness | ≥ 70% | not measured |
| M-7 | First-token latency | ≤ 3 s | **0.004 s** median (0.005 s p90) |
| M-8 | Full-response latency | ≤ 15 s | **0.004 s** median (0.005 s p90) |
| M-9 | Refusal correctness | ≥ 95% | **1.000** (24/24 + 16/16) |

### 8.1 Groundedness (M-1, M-2)

On the shipped agent path, all 48 answerable grounding questions were grounded (1.000) and none of
the 64 records quoted a price absent from the menu (0.000 hallucination). The grounding set contains
48 positive questions plus 16 traps for non-existent dishes; traps must be refused, but suggesting a
real alternative dish at its real price is permitted.

The ablation isolates the cause (Table 2). Without retrieval, the 3B text model grounded no answer:
it usually claimed it could not access the menu, and when it did answer it invented prices (for
example ₹150 for Saoji Mutton Rassa and ₹120 for Chicken Tikka Supreme). It also failed to refuse 9
of 48 trap responses. Retrieval-grounded generation grounded every price and refused every trap. The
shipped agent matched the retrieval ceiling while also executing tools and applying the verification
gate, so the experiment supports the grounding design rather than ranking models.

**Table 2. Grounding ablation.** Each LLM mode covers 64 items × 3 repeats (192 records; 144
answerable).

| Mode | Groundedness | Hallucination | Refusal | Accuracy |
|---|---|---|---|---|
| LLM, no retrieval | 0.000 | 0.021 | 0.812 | 0.203 |
| LLM, retrieval-grounded | 1.000 | 0.000 | 1.000 | 1.000 |
| Shipped agent | 1.000 | 0.000 | 1.000 | 1.000 |

### 8.2 Agentic capability (M-3, M-4)

Tool-call accuracy was 1.000 on 40 labelled utterances, scored as an ordered subsequence of expected
calls with exact tool ids and quantities and substring matching for free-text arguments. End-to-end
task success was 1.000 on 25 scenarios executed against the live HTTP API; each scenario asserts both
the reply and the resulting database state (cart contents, order rows, and status transitions), not
just a textual response. Irreversible order placement required explicit confirmation in every run.

### 8.3 Multimodal (M-5, M-6)

**M-5 (speech-to-text).** The corpus word error rate was 0.181 against a 0.15 target, so the target
was missed. The mean per-clip WER was 0.166 and the median was 0.000: most clips transcribed exactly,
while a few clips containing out-of-vocabulary dish names (for example "Pindi Chole" and "Warqi
Paratha") dominated the corpus error. Clips were synthesised with Windows SAPI rather than recorded
from diners, which is a disclosed deviation from natural speech.

**M-6 (vision usefulness).** Not measured. No dish-image set with human helpfulness labels was
collected and no human raters were available, so this report makes no vision-quality claim. Image
upload and the vision path are implemented, but only their functional integration is demonstrated.

### 8.4 Performance (M-7, M-8)

Latency was measured inside the agent's event iterator over 36 turns, excluding browser and network
transit. Median first-token latency was 0.004 s and median full-response latency was 0.004 s, with
both p90 values at 0.005 s. These figures describe the shipped deterministic path with LLM polishing
disabled (`llm_polish_enabled=false`); enabling polishing would add model latency to both metrics.
They should not be read as end-to-end browser timings.

### 8.5 Safety (M-9)

Refusal correctness was 1.000: all 24 adversarial prompts (12 prompt-injection and 12 off-topic) were
blocked with a non-empty reply and no quoted prices, and all 16 non-existent-dish traps were refused.
No unauthorised orders were placed. Guardrails are keyword-based, so the result is evidence for the
documented pattern set rather than a guarantee against semantically novel paraphrases.

---

## 9. Discussion

The ablation gives a clear answer to the central question: on this menu task, grounding is not a
marginal improvement but the difference between a useless and a reliable assistant. The no-retrieval
model almost never produced a usable answer (0.203 accuracy) and failed to refuse 9 of 48 traps,
whereas retrieval produced perfect groundedness and refusal. This is consistent with the RAG
literature [1]: a small model's parametric memory is a poor substitute for a small, frequently
changing catalogue.

The shipped agent's perfect scores should be interpreted carefully. Its reply path is deterministic
by design (D-13): routing and handlers produce the answer, and the LLM is used only for optional
polishing behind a verification gate. The agent therefore inherits the ceiling of the rule-based
implementation, and its 1.000 results measure the engineering guarantee (validated ids, validated
prices, no fabrication) rather than the raw reasoning ability of a 3B model. That is a deliberate
trade-off: for an ordering service, predictable correctness is more valuable than conversational
variety. It also means the reported latency is handler latency, not model latency.

The multimodal results are mixed and are reported as such. Speech recognition works well on most
clips but misses the aggregate WER target because of dish names that are rare in general speech
corpora. Vision was not evaluated at all, so the system's image path should be described as
functional rather than useful. Both gaps point to data work (recorded diner audio, a labelled image
set) rather than model changes.

Safety results support defence in depth. Keyword guardrails blocked every documented attack, and even
if a paraphrase slipped through, the menu handlers refuse unknown dishes and prices and order
placement requires confirmation, so the failure modes that matter most (fabrication and unauthorised
ordering) remain bounded. The limitation is coverage, not the presence of a second line of defence.

---

## 10. Limitations

- **Model substitution.** The pinned `qwen2.5-vl-3b-instruct` and `nomic-embed-text` checkpoints were
  unavailable in the local LM Studio catalogue. The ablation used `qwen2.5-3b-instruct` and
  `text-embedding-nomic-embed-text-v1.5` via environment overrides. Because the shipped agent path is
  deterministic and does not call the chat model, M-1–M-4 and M-9 are unaffected; the ablation
  describes the 3B text configuration, not the pinned vision-language model.
- **Ceiling effects.** Positive grounding items were generated from menu rows using the same
  templates as the agent's handlers, and retrieval returns the answer in context. The numbers show
  the value of grounding, not a general model ranking; a held-out, human-written set would be harder.
- **Synthetic speech.** M-5 uses SAPI-synthesised clips. The corpus WER missed the target (0.181 vs
  0.15), driven by out-of-vocabulary dish names, while the median clip error was 0.000.
- **Vision not measured.** No labelled image set or human raters were available (M-6), so no
  vision-quality claim is made.
- **Keyword guardrails.** The 24-prompt safety set covers documented injection and off-topic
  patterns; semantically novel paraphrases may reach the menu handler. Unknown dishes and prices are
  still refused, and orders still require confirmation.
- **Latency scope.** M-7/M-8 were measured inside the agent event iterator with polishing disabled,
  excluding browser and network transit. They do not represent full end-to-end user-perceived
  latency, and enabling the LLM polish would increase both.
- **Single model.** Only one chat model was evaluated; the planned multi-model comparison was not run
  because suitable local checkpoints were unavailable.
- **Simulated operations.** Kitchen/order status is simulated and labelled rather than integrated
  with a real kitchen display system, and payment is recorded rather than processed.
- **Local-only delivery.** v1 has no containerisation or CI. Reproducibility depends on the recorded
  hardware and LM Studio configuration rather than an automated pipeline.
- **Environment specificity.** Results are specific to the reference machine and the recorded model
  versions; they are not generalised beyond it.

---

## 11. Conclusion

VeeraServe shows that a compact, fully local stack can deliver a credible agentic restaurant service
at zero marginal cost, provided the model is grounded in an authoritative catalogue and its actions
pass through validated tools. The measured evidence is strongest exactly where the design invests:
menu groundedness, zero fabricated prices, tool accuracy, task success, and refusal correctness all
met their targets (1.000). It is weaker where data was unavailable: speech recognition missed its
target on synthetic audio, and vision usefulness was not measured. Reporting both outcomes, rather
than claiming uniform success, is part of the contribution. The system is therefore best described
as a reliable, inspectable, local ordering assistant whose generative behaviour is deliberately
constrained — and whose remaining gaps are clearly identified for future work.

---

## 12. Future Work

- Real kitchen integration (KDS/webhook) replacing simulated status.
- Multilingual conversation (Hindi/Marathi).
- Stronger vision for menu OCR.
- Multi-restaurant/multi-tenant support.
- Quantitative user study with real diners.

---

## 13. References

1. Lewis, P., Perez, E., Piktus, A., et al. (2020). *Retrieval-Augmented Generation for
   Knowledge-Intensive NLP Tasks.* NeurIPS 2020. arXiv:2005.11401.
2. Yao, S., Zhao, J., Yu, D., et al. (2023). *ReAct: Synergizing Reasoning and Acting in Language
   Models.* ICLR 2023. arXiv:2210.03629.
3. Schick, T., Dwivedi-Yu, J., Dessì, R., et al. (2023). *Toolformer: Language Models Can Teach
   Themselves to Use Tools.* NeurIPS 2023. arXiv:2302.04761.
4. LangChain AI. (2024). *LangGraph: Build stateful, multi-actor applications with LLMs.*
   https://github.com/langchain-ai/langgraph
5. Qwen Team. (2024). *Qwen2.5 Technical Report.* arXiv:2412.15115.
6. LM Studio. (2026). *LM Studio documentation: local model server and OpenAI-compatible API.*
   https://lmstudio.ai/docs
7. Chroma. (2026). *Chroma documentation: open-source embedding database.*
   https://docs.trychroma.com
8. Radford, A., Kim, J. W., Xu, T., et al. (2023). *Robust Speech Recognition via Large-Scale Weak
   Supervision.* ICML 2023. arXiv:2212.04356.
9. SYSTRAN. (2026). *faster-whisper: fast Whisper inference with CTranslate2.*
   https://github.com/SYSTRAN/faster-whisper

---

## Appendix

- `INDEX.md` — documentation map.
- `architecture/ARCHITECTURE.md`, `ai/AGENT_DESIGN.md` — design detail.
- `evaluation/EVALUATION.md` — full protocol and results.
- `DEMONSTRATION_FLOW.md` — reproducible demo.

---

*This report must remain consistent with the measured evidence. No fabricated results.*
