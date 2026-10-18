# VeeraServe — Documentation Index

**Project:** VeeraServe — An Agentic, Multimodal AI Waiter for Veeradhar Dhaba
**Course context:** GenAI mini-project (college submission)
**Status:** Documentation baseline — v1.0
**Canonical naming:** *Veeradhar Dhaba* = the restaurant; *VeeraServe* = the AI waiter system/bot.

This index is the entry point for the entire documentation suite. Every other document is
reachable from here. Documents describe a **proposed and partially implemented** system; they
distinguish clearly between what is *proposed*, what is *implemented*, and what is *verified*.
Do not read a proposal as proof that functionality exists.

---

## 1. Reading order

For a new reader (or a new AI IDE agent), read in this order:

1. `ORIGINAL_IDEA.md` — what the project is and why it exists.
2. `PRD.md` — what the product must do.
3. `FEATURES.md` — the full feature catalog and priorities.
4. `architecture/ARCHITECTURE.md` — how the system is structured.
5. `ai/AGENT_DESIGN.md` — how the agentic AI core works.
6. `architecture/TECH_STACK.md` — the technologies and why.
7. `architecture/FOLDER_STRUCTURE.md` — the repository layout.
8. `RULES.md` — the non-negotiable rules.
9. `TASKS.md` — the phased implementation plan.
10. `DEMONSTRATION_FLOW.md` — how to demo the finished system.
11. `evaluation/EVALUATION.md` — how the GenAI claims are measured.
12. `ACADEMIC_REPORT.md` — the graded written submission.
13. `MEMORY.md` — decisions, open items, risks, glossary.
14. `IDE_Context.md` — resumption snapshot for IDE agents.

---

## 2. Document map

### Root (`docs/`)

| Document | Purpose | Status |
|---|---|---|
| `INDEX.md` | This navigation hub. | Baseline |
| `ORIGINAL_IDEA.md` | Origin story and pivot to a GenAI mini-project. | Baseline |
| `PRD.md` | Product requirements, personas, requirement tables, MVP scope, metrics. | Baseline |
| `FEATURES.md` | Feature inventory with IDs and P0–P3 priorities. | Baseline |
| `RULES.md` | Engineering, AI-agent, security, data, testing, and reproducibility rules. | Baseline |
| `TASKS.md` | Phased implementation plan with gates and acceptance criteria. | Baseline |
| `DEMONSTRATION_FLOW.md` | Scripted end-to-end demonstration scenarios. | Baseline |
| `ACADEMIC_REPORT.md` | Graded academic report (standard academic structure). | Baseline (results pending) |
| `MEMORY.md` | Decision log, open items, risk register, glossary, changelog. | Living |
| `IDE_Context.md` | One-screen context snapshot and resumption guide for IDE agents. | Living |

### `architecture/`

| Document | Purpose | Status |
|---|---|---|
| `ARCHITECTURE.md` | Logical + physical architecture, agent lifecycle, data model, API surface. | Baseline |
| `DESIGN.md` | Visual design system for the restaurant product (tokens, typography, components, motion). | Baseline |
| `TECH_STACK.md` | Technology choices, local-model strategy, version policy. | Baseline |
| `FOLDER_STRUCTURE.md` | Target repository tree, responsibilities, dependency direction. | Baseline |

### `ai/`

| Document | Purpose | Status |
|---|---|---|
| `AGENT_DESIGN.md` | Agent topology, tool catalog, RAG grounding, memory, guardrails, multimodal pipelines. | Baseline |

### `evaluation/`

| Document | Purpose | Status |
|---|---|---|
| `EVALUATION.md` | GenAI evaluation protocol, metrics, rubrics, and results. | Baseline (results pending) |

---

## 3. Documentation authority hierarchy

When documents disagree, the higher item wins:

1. `RULES.md` — non-negotiable constraints.
2. `PRD.md` — product scope and acceptance.
3. `architecture/ARCHITECTURE.md` and `ai/AGENT_DESIGN.md` — agreed design.
4. `FEATURES.md`, `TASKS.md` — decomposition and plan.
5. All other documents — supporting material.

Material changes to items 1–3 must be recorded in `MEMORY.md` before implementation.

---

## 4. Honesty convention used across the suite

Every document follows the same vocabulary, inherited from a strict documentation standard:

- **Proposed** — designed but not yet built.
- **Implemented** — code exists in the repository.
- **Verified** — implemented *and* tested/observed, with evidence recorded.
- **Simulated** — deliberately mocked (e.g., kitchen status), and labelled as such in the UI.

Metrics, screenshots, and evaluation values must never be fabricated. Where a value is not yet
measured, the document says so explicitly (typically "to be populated in P8").

---

## 5. Quick facts

| Item | Value |
|---|---|
| Restaurant | Veeradhar Dhaba (multi-cuisine Indian + bar) |
| AI waiter | VeeraServe (persona "Veera") |
| AI strategy | Local-first, zero-cost: LM Studio (OpenAI-compatible local server) + faster-whisper, no paid APIs |
| Core novelty | Grounded, tool-calling agent that can actually place and track orders, plus voice and vision |
| Frontend | React + TypeScript, Vite, Tailwind CSS, Framer Motion, TanStack Query |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Agent layer | LangGraph (stateful, tool-calling, supervisor pattern) |
| Data source of truth | `data/menu.seed.json` |
| Delivery target | Local demo via Docker Compose; academic report as written deliverable |

---

*Maintained alongside the code. Update this file whenever a document is added, renamed, or its
status changes.*
