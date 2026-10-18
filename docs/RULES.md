# VeeraServe — Engineering, AI, Security, and Data Rules

**Status:** Baseline project rules (non-negotiable)
**Applies to:** frontend, backend, agent, evaluation harness, data, tests, and documentation.

These rules are the highest authority in the documentation hierarchy. When in doubt, follow this
document, then `PRD.md`, then the architecture, then the plan.

---

## 1. Source-of-truth rules

1. The canonical menu is `data/menu.seed.json`. It is the only authority for dish names, categories,
   prices, dietary flags, and offers.
2. No menu data may be duplicated in a second file. The legacy `mockData.js` and `data/menu.md` must
   be retired in favour of the canonical seed.
3. The backend/Pydantic schemas are the authority for API contracts; front-end TypeScript types must
   mirror them.
4. Distinguish clearly in code and docs: **implemented**, **verified**, **proposed**, and
   **simulated**.
5. Never describe proposed or simulated behaviour as live or production.

---

## 2. Coding rules

- **Frontend:** TypeScript (strict), React function components, feature-based folders.
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Pydantic; type hints on public functions.
- Keep modules small and single-purpose; separate API, services, agent, RAG, and models.
- No magic numbers or hard-coded URLs/paths. Use configuration (`settings`, env vars).
- Prefer explicit configuration over hidden defaults.
- Do not duplicate the same logic (especially not menu access, totals, or tool definitions) across
  layers.
- Consistent formatting: Prettier + ESLint (frontend), Ruff + Black (backend).
- Do not commit generated files, caches, or build output.

---

## 3. AI and agent rules

1. **Grounding is mandatory.** The agent may only mention dishes, prices, categories, and offers that
   exist in the canonical data or the database. Server-side validation must reject any tool call that
   references an unknown item.
2. **No fabricated data.** The agent must never invent ratings, reviews, availability, nutrition, or
   preparation times that are not in the data.
3. **Tools are contracts.** Every tool has a strict schema. Arguments are validated before execution;
   invalid calls return a structured error the model can recover from.
4. **Confirm before irreversible actions.** Placing an order requires an explicit confirmation step.
5. **Idempotency.** Cart and order mutations must be safe against duplicate tool calls.
6. **Deterministic where it matters.** Prices, totals, availability, and order status come from code,
   never from the model.
7. **Guardrails.** Off-topic, unsafe, or abuseful requests are declined politely; the agent stays a
   restaurant waiter.
8. **Structured output fallback.** Because small local models are unreliable tool-callers, the
   system must support a strict JSON-schema response mode and validate/repair before acting.
9. **No paid APIs.** All inference is local.
10. **Memory boundaries.** Conversation memory is session-scoped; long-term preferences are explicit,
    user-owned, and deletable.

---

## 4. Security and privacy rules

- Hash passwords (Argon2 or bcrypt). Never store or log plaintext passwords.
- Enforce authentication and roles **on the server**; UI hiding is not security.
- Use JWT (or signed session cookies) with reasonable expiry; never trust client-supplied roles.
- Validate all input: types, ranges, lengths, and enums; enforce upload size and content-type limits.
- Restrict CORS to known origins; do not ship permissive CORS.
- Keep secrets in `.env` (git-ignored); never commit credentials, tokens, or keys.
- Do not expose stack traces, internal paths, or model internals in API errors.
- Treat uploaded images/audio as untrusted input; store temporarily and delete after processing.
- No external telemetry; the system must be usable fully offline.

---

## 5. Data rules

- `data/menu.seed.json` is versioned and validated against a schema on load.
- Prices are integers in rupees; a single item may carry `price` (regular) and `happy_hour_price`.
- Every item has: `id`, `name`, `category`, `is_veg`, `spice_level` (0–5), `tags`, `availability`.
- Allergen and dietary information, where present, must be accurate and clearly labelled; never
  infer allergens the data does not state.
- Bar/alcohol items are marked so they can be excluded for guests who should not see them (age
  policy is a documented, configurable toggle).
- Do not commit user data or database files.

---

## 6. Testing rules

- Unit tests for pure functions (totals, filters, validators, tool schemas).
- API tests for valid, invalid, missing, extra, and boundary fields.
- Auth tests for role enforcement.
- Agent tests with a **mocked model** for determinism; a small set of live smoke tests for the local
  model (not part of CI).
- Evaluation harness tests for metric computation.
- Frontend tests for critical flows and loading/empty/error states.
- Tests must not require downloading large models; mock or skip where necessary.

---

## 7. Reproducibility and evaluation rules

- Every evaluation run records: model name/version, prompt version, dataset identifier, and code
  revision.
- Metrics are computed by code and written to machine-readable files; never type numbers by hand.
- Report negative and mixed results honestly.
- The groundedness test set is fixed and reviewed before use.
- Latency is measured on documented hardware; do not claim targets as achieved results.

---

## 8. Frontend and design rules

- Follow the warm restaurant design system in `architecture/DESIGN.md`.
- No colour-only meaning; always pair status colour with text/labels.
- Provide visible focus states and keyboard operability.
- Show explicit loading, empty, error, and unavailable states.
- Never display mock numbers as if they were live. Simulated status is labelled.
- The front end must not compute authoritative prices/totals or reimplement agent logic.

---

## 9. Documentation rules

- Docs live under `docs/` with uppercase names and the subfolder structure in
  `architecture/FOLDER_STRUCTURE.md`.
- Update `MEMORY.md` (decisions/open items/changelog) before or with any material change.
- Update `IDE_Context.md` §3 at the end of each session.
- No fabricated metrics, screenshots, or results in any document.

---

## 10. Git and collaboration rules

- Use focused commits with clear messages; keep diffs reviewable.
- Feature branches for non-trivial work.
- Never commit `.env`, `node_modules`, `__pycache__`, build output, databases, or model binaries.
- Do not commit editor-specific or assistant-specific config unless it is intentionally shared.
- Review the diff before committing.
- CI must pass before merge.

---

## 11. Definition of done

A task is complete only when its acceptance criteria in `TASKS.md` are met, tests pass (or failures
are documented), the documentation is updated in the same change, and no rule above is violated.
"Runs once on my machine" is not evidence of correctness.

---

*These rules are non-negotiable. If a rule must change, record a decision in `MEMORY.md` first.*
