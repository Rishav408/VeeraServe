# VeeraServe — Evaluation Protocol (EVALUATION.md)

**Status:** Baseline protocol; results **to be populated in Phase P8**
**Purpose:** Define, in advance, how the GenAI claims of VeeraServe are measured, so the academic
report can present real, reproducible evidence rather than assertions.

> Integrity rule: no metric in this document is a result until it is produced by the evaluation
> harness from a recorded run. Targets are goals, not achievements.

---

## 1. What we are evaluating (and why)

The central claims to defend are:

1. **Groundedness** — VeeraServe recommends only real dishes at real prices.
2. **Agentic capability** — VeeraServe can complete ordering tasks via tool calls.
3. **Multimodality** — voice and image input work usefully.
4. **Usability under local constraints** — responses are fast enough on local models.

Each claim maps to a metric family below.

---

## 2. Metrics overview

| ID | Metric | Claim | Target | Direction |
|---|---|---|---|---|
| M-1 | Menu groundedness (no fabricated dishes/prices) | Groundedness | ≥ 95% | higher |
| M-2 | Hallucination rate | Groundedness | ≤ 5% | lower |
| M-3 | Tool-call accuracy (correct tool + args) | Agentic | ≥ 90% | higher |
| M-4 | End-to-end task success (scripted scenarios) | Agentic | ≥ 85% | higher |
| M-5 | STT word error rate (quiet English) | Multimodal | ≤ 15% | lower |
| M-6 | Vision usefulness (human-rated on a small set) | Multimodal | ≥ 70% "helpful" | higher |
| M-7 | First-token latency (reference hardware) | Usability | ≤ 3 s | lower |
| M-8 | Full-response latency | Usability | ≤ 15 s | lower |
| M-9 | Refusal correctness (off-topic declined) | Safety | ≥ 95% | higher |

---

## 3. Test sets

| Set | Description | Size (target) | Used by |
|---|---|---|---|
| **Grounding set** | Questions whose answers are/isn't in the menu (incl. traps for non-existent dishes). | ≥ 60 items | M-1, M-2 |
| **Tool set** | Labelled utterances → expected tool calls and arguments. | ≥ 40 items | M-3 |
| **Scenario set** | End-to-end goals (order, modify, track, reserve). | ≥ 20 items | M-4 |
| **Audio set** | Recorded order utterances with transcripts. | ≥ 25 clips | M-5 |
| **Vision set** | Dish/menu photos with expected helpfulness. | ≥ 15 images | M-6 |
| **Safety set** | Off-topic / adversarial prompts. | ≥ 20 items | M-9 |

Test sets are fixed, reviewed, and versioned before use. Sets must include **negative cases**
(non-existent dishes, ambiguous requests) to expose hallucination.

> **Disclosure (P8.2):** the audio set currently in `evaluation/datasets/audio/` is **synthesised
> with Windows SAPI** (16 kHz mono) as an offline, reproducible baseline. It is easier than real
> speech, so it is a lower bound on expected WER; human-recorded clips remain the protocol target.
>
> **Disclosure (P8.3):** the safety set is `evaluation/datasets/safety.json` (12 prompt-injection +
> 12 off-topic prompts). M-9 for the shipped agent also counts the 16 unavailable-dish traps from the
> grounding set, giving 40 refusal cases.

---

## 4. Metric definitions

### M-1 / M-2 — Groundedness and hallucination
For each grounding-set response, a checker (rule-based + human review) verifies that **every** dish
and price mentioned exists in `data/menu.seed.json` with the exact value.

```
groundedness       = (# answerable responses that name the dish and its real price) / (# answerable responses)
hallucination_rate = (# responses quoting any price absent from the menu) / (# responses)
```

Hallucination is not computed as `1 - groundedness`: a response can fail groundedness by refusing or
omitting a price without fabricating one, and refusal quality is scored separately as M-9. For
unanswerable questions the reply must contain a refusal marker; suggesting a real alternative dish at
its real price is allowed. This operationalisation is fixed in the harness and reflected in D-15.

### M-3 — Tool-call accuracy
For each tool-set item with a labelled expected call(s):
```
tool_accuracy = (# items where selected tool AND all arguments score correct) / (# items)
```
Argument scoring is exact for ids/quantities and tolerant for free text where specified.

### M-4 — End-to-end task success
A scenario succeeds if the final application state matches the goal (e.g., cart contains the
requested items, or an order with the correct total exists).

### M-5 — STT word error rate
```
WER = (substitutions + deletions + insertions) / (reference words)
```
Computed against human transcripts on the audio set.

### M-6 — Vision usefulness
Human raters label each response helpful / not helpful given the image and menu.

### M-7 / M-8 — Latency
Measured on documented reference hardware, recorded per run (model, prompt version, top-k). Report
median and p90, not just the mean.

### M-9 — Refusal correctness
Off-topic/adversarial prompts should be declined without inventing restaurant information.

---

## 5. Experimental design

- **Ablation (grounding):** compare *no-RAG* vs *RAG-grounded* on the grounding set — this is the key
  experiment showing the value of grounding.
- **Model comparison:** compare candidate local models loaded in LM Studio (e.g., Qwen2.5-VL-3B vs a
  7B instruction model) on M-3, M-4, and M-7/M-8.
- **Multimodal:** report STT WER (M-5) and vision usefulness (M-6) separately from text metrics.
- **Repetition:** run each automated metric ≥ 3 times where the model is non-deterministic; report
  mean ± spread.

Every run records: code revision, model name/version, prompt version, retrieval config, and seed/
temperature.

---

## 6. Harness

Location: `evaluation/harness/` (see `../architecture/FOLDER_STRUCTURE.md`).

- `run_grounding.py` — M-1, M-2 (+ ablation switch).
- `run_tools.py` — M-3.
- `run_scenarios.py` — M-4.
- `run_stt.py` — M-5.
- `run_vision.py` — M-6 (collects responses for human rating).
- `run_latency.py` — M-7, M-8.
- `run_safety.py` — M-9.

Implemented in P8.1–P8.3 (run from the repository root):

```powershell
python -m evaluation.harness.run_grounding                  # M-1, M-2 on the shipped agent
python -m evaluation.harness.run_grounding --mode llm-rag   # ablation: retrieval-grounded LLM
python -m evaluation.harness.run_grounding --mode llm-no-rag
python -m evaluation.harness.run_tools                      # M-3
python -m evaluation.harness.run_scenarios                  # M-4 (live API + state checks)
python -m evaluation.harness.run_stt                        # M-5 (requires the audio clips)
python -m evaluation.harness.run_latency                    # M-7, M-8 (36 timed turns)
python -m evaluation.harness.run_safety                     # M-9 (24 adversarial prompts)
```

The LLM ablation reads `LLM_CHAT_MODEL` and `LLM_EMBEDDING_MODEL` (P8.3 used
`qwen2.5-3b-instruct` and `text-embedding-nomic-embed-text-v1.5` because the pinned checkpoints were
not installed); `run_grounding --mode llm-rag` re-indexes Chroma from the evaluation database first.
`run_vision.py` (M-6) is not implemented: it needs a labelled image set and human raters.

Options: `--limit N`, `--repeat N` (grounding/latency), `--strict` (non-zero exit when a target is
missed), and `--out NAME`. Each run uses a fresh in-memory database seeded from `data/menu.seed.json`;
the LLM modes require LM Studio and the Chroma index. Results are named `<out>-<mode>.json`
(grounding) or `<out>.json` (other suites). Unmeasured metrics are never reported.

Scenario runs also use a fresh in-memory DB through a FastAPI `TestClient`, so they exercise the real
routers and auth. Latency is measured inside `iter_turn_events` (the real turn pipeline) and excludes
browser/network transit.

Outputs are written to `evaluation/results/` as JSON/CSV with run metadata. Results are consumed by
this document and by `../ACADEMIC_REPORT.md`.

---

## 7. Results

> **Status: populated in P8.3 (2026-10-20).** Raw outputs are in `evaluation/results/`. The shipped
> agent path is deterministic (D-13); only the LLM ablation was repeated (3 runs).

### 7.1 Summary

| Metric | Target | Baseline (no-RAG) | VeeraServe | Notes |
|---|---|---|---|---|
| M-1 Groundedness | ≥ 95% | 0.000 (0/144) | **1.000** (48/48) | Agent path; baseline is 48 questions × 3 runs |
| M-2 Hallucination | ≤ 5% | 0.021 (4/192) | **0.000** (0/64) | Any quoted price not in the menu counts |
| M-3 Tool accuracy | ≥ 90% | — | **1.000** (40/40) | Ordered call subsequence + argument checks |
| M-4 Task success | ≥ 85% | — | **1.000** (25/25) | Live API + database state assertions |
| M-5 STT WER | ≤ 15% | — | **0.181** corpus (median 0.000) | **Target missed**; synthetic SAPI audio |
| M-6 Vision helpful | ≥ 70% | — | not measured | No image set or human raters |
| M-7 First-token | ≤ 3 s | — | **0.004 s** median, 0.005 s p90 | Deterministic path, 36 turns |
| M-8 Full response | ≤ 15 s | — | **0.004 s** median, 0.005 s p90 | Same turns; browser/network excluded |
| M-9 Refusal | ≥ 95% | — | **1.000** (24/24 + 16/16) | 24 adversarial prompts, 16 dish traps, 0 orders |

Run metadata: revision `b7de574` plus the P8.3 harness changes; grounding/tools/scenarios/safety run on
an in-memory SQLite database seeded from `data/menu.seed.json`; retrieval top-k = 8, Chroma collection
`menu`; chat temperature 0; embedding model `text-embedding-nomic-embed-text-v1.5`.

### 7.1.1 Grounding ablation (M-1/M-2)

| Mode | Groundedness | Hallucination | Refusal | Accuracy |
|---|---|---|---|---|
| LLM, no retrieval | 0.000 | 0.021 | 0.812 | 0.203 |
| LLM, retrieval-grounded | 1.000 | 0.000 | 1.000 | 1.000 |
| Shipped agent | 1.000 | 0.000 | 1.000 | 1.000 |

Each LLM mode covers 64 items × 3 repeats (192 records; 144 answerable). Without menu context the model
almost never states a real price: it either says it cannot access the menu or invents one (₹150 for Saoji
Mutton Rassa, ₹120 for Chicken Tikka Supreme); it also fails to refuse 9 of 48 trap responses. Retrieval
eliminates both failure modes on this set: every price is grounded and every trap is refused. The shipped
agent matches the retrieval ceiling while also executing tools and enforcing the verification gate, so the
ablation supports the grounding decision rather than ranking models.

### 7.2 Reference hardware

| Component | Value |
|---|---|
| CPU | 13th Gen Intel Core i7-13650HX |
| RAM | 23.7 GB |
| GPU | NVIDIA GeForce RTX 4060 Laptop (8 GB) + Intel UHD Graphics |
| OS | Windows 11 Home Single Language |
| Python | 3.11.9 |
| Runtime | LM Studio local server (CLI commit `dcefd5a`), Chroma persistent client |
| STT | faster-whisper `base`, CPU, `int8` |

### 7.3 Known limitations

- **Model substitution:** the pinned `qwen2.5-vl-3b-instruct` and `nomic-embed-text` checkpoints were not
  available in the local LM Studio catalogue. The ablation used `qwen2.5-3b-instruct` (GGUF, 2.1 GB) and
  `text-embedding-nomic-embed-text-v1.5` via environment overrides. The shipped agent path is
  deterministic and does not call the chat model, so M-1–M-4 and M-9 are unaffected; the ablation numbers
  describe this 3B text configuration, not the pinned VL model.
- **Ceiling effects:** the positive grounding items are generated from menu rows using the same templates
  the agent's handlers use, and retrieval returns the answer in context. These numbers demonstrate the
  value of grounding, not a general model ranking. A held-out, human-written set would be harder.
- **M-5 misses target (0.181 vs ≤ 0.15):** clips are synthetic SAPI speech, and errors concentrate on
  out-of-vocabulary dish names (e.g., "Pindi Chole", "Warqi Paratha"). Per-clip median WER is 0.000, so
  the corpus figure is driven by a few name failures.
- **M-6 is not measured:** no dish-image set with human helpfulness labels was collected. No vision claim
  is made in the report.
- **Guardrails are keyword-based:** the 24-prompt safety set covers documented injection/off-topic
  patterns; semantically novel paraphrases may reach the menu handler. Even then, unknown dishes/prices
  are refused and orders require explicit confirmation, so fabrication and unauthorised ordering are
  still blocked.
- **M-7/M-8 scope:** measured inside `iter_turn_events` (no browser/network transit) with LLM polishing
  disabled (`llm_polish_enabled=false`). Enabling polishing adds model latency to both metrics.
- Only one chat model was evaluated; the planned multi-model comparison was not run due to local model
  availability.

---

## 8. Reporting rules

- Never report a target as an achieved result.
- Report negative and mixed findings honestly.
- Include the exact configuration and hardware for every run.
- Keep raw result files alongside the summary so results are auditable.

---

*This protocol is fixed before implementation. Changes after seeing results must be disclosed in
`../MEMORY.md` and in `../ACADEMIC_REPORT.md`.*
