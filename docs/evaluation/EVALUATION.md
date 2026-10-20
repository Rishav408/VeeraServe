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

---

## 4. Metric definitions

### M-1 / M-2 — Groundedness and hallucination
For each grounding-set response, a checker (rule-based + human review) verifies that **every** dish
and price mentioned exists in `data/menu.seed.json` with the exact value.

```
groundedness = (# responses with zero fabricated entities) / (# responses)
hallucination_rate = 1 - groundedness
```

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

Implemented in P8.1 (run from the repository root):

```powershell
python -m evaluation.harness.run_grounding                  # M-1, M-2 on the shipped agent
python -m evaluation.harness.run_grounding --mode llm-rag   # ablation: retrieval-grounded LLM
python -m evaluation.harness.run_grounding --mode llm-no-rag
python -m evaluation.harness.run_tools                      # M-3
```

Options: `--limit N`, `--repeat N` (grounding), `--strict` (non-zero exit when a target is missed), and
`--out NAME`. Each run uses a fresh in-memory database seeded from `data/menu.seed.json`; the LLM modes
require LM Studio and the Chroma index. Results are named `<out>-<mode>.json` (grounding) or
`<out>.json` (tools). Unmeasured metrics are never reported.

Outputs are written to `evaluation/results/` as JSON/CSV with run metadata. Results are consumed by
this document and by `../ACADEMIC_REPORT.md`.

---

## 7. Results

> **Status: to be populated in Phase P8.** No values are recorded until produced by the harness.

### 7.1 Summary

| Metric | Target | Baseline (no-RAG) | VeeraServe (RAG) | Notes |
|---|---|---|---|---|
| M-1 Groundedness | ≥ 95% | — | — | — |
| M-2 Hallucination | ≤ 5% | — | — | — |
| M-3 Tool accuracy | ≥ 90% | — | — | — |
| M-4 Task success | ≥ 85% | — | — | — |
| M-5 STT WER | ≤ 15% | — | — | — |
| M-6 Vision helpful | ≥ 70% | — | — | — |
| M-7 First-token | ≤ 3 s | — | — | — |
| M-8 Full response | ≤ 15 s | — | — | — |
| M-9 Refusal | ≥ 95% | — | — | — |

### 7.2 Reference hardware

*To be recorded (CPU, RAM, GPU, OS, model versions) when the first measured run is executed.*

### 7.3 Known limitations

- Small local models may underperform larger hosted models; results are reported for the local setup
  used, and generalisation beyond it is not claimed.
- Human-rated metrics (M-6) depend on rater judgement; the rubric must be recorded.

---

## 8. Reporting rules

- Never report a target as an achieved result.
- Report negative and mixed findings honestly.
- Include the exact configuration and hardware for every run.
- Keep raw result files alongside the summary so results are auditable.

---

*This protocol is fixed before implementation. Changes after seeing results must be disclosed in
`../MEMORY.md` and in `../ACADEMIC_REPORT.md`.*
