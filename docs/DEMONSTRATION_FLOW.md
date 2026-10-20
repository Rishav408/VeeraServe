# VeeraServe — Demonstration Flow

**Status:** Baseline demo script
**Purpose:** A scripted, reproducible walkthrough that showcases the product and the GenAI
contribution for an evaluator. Each scenario lists the steps, what to say, and what to point out.

> Use a **seeded database** and a **warm model** (ask one throwaway question first) so the demo is
> responsive. Keep the network offline to prove the local-first claim.

---

## 1. Pre-demo checklist

- [ ] Local frontend (`npm run dev`) and backend (`python main.py`) are running.
- [ ] LM Studio is running on the host with the local server started and the chat/vision + embedding
      models loaded.
- [ ] Database seeded from `data/menu.seed.json`.
- [ ] Browser at `http://localhost:5173`.
- [ ] A second browser/incognito for the admin login.
- [ ] Network disconnected (to demonstrate offline/local operation).

**Opening line:** "VeeraServe is an agentic AI waiter for Veeradhar Dhaba. It runs entirely on local
models — no cloud, no cost — and it doesn't just chat: it takes real actions on the menu and orders."

---

## 2. Scenario A — Browse and order manually (baseline UX)

**Goal:** Show the product works as a real ordering app.

1. Open **Menu**. Point out grouped categories (World Plates, Breads, Mains, Appetizers, Bar) and
   search by typing "naan".
2. Filter to **Veg** and open **Paneer Khurchan**. Show price, spice, tags, description.
3. Add 1× Paneer Khurchan and 2× Butter Garlic Naan to the cart. Point out the cart badge update.
4. Open **Cart**: show line items, quantity steppers, subtotal, GST, grand total.
5. **Checkout**: enter table number, choose UPI, add instruction "less spicy". Confirm order.
6. Show **Order tracking**: placed → preparing → ready → served.

**Point out:** the order is persisted (refresh the page — it's still there); totals are computed
server-side.

---

## 3. Scenario B — The agentic AI waiter (the centrepiece)

**Goal:** Show grounding + tool calling.

1. Open **Chat**.
2. Type: **"Recommend something veg and spicy."**
   - VeeraServe replies with real, in-menu veg dishes (e.g., Paneer Khurchan ₹350, Korean Chilli
     Mushroom ₹310) at their real prices.
   - *Point out:* every dish exists in the menu; ask the evaluator to cross-check on the Menu page.
3. Type: **"Add Paneer Khurchan and a Butter Garlic Naan."**
   - The agent calls `add_to_cart` for exactly those two dishes; the cart badge updates.
   - *Point out:* the agent **acted**, not just described, and did not add the generic "Naan"
     instead of the specific one.
4. Ask a trap: **"Add a butter chicken pizza and a paneer sushi roll."**
   - The agent adds the real item and clearly states that "paneer sushi roll" isn't on the menu.
   - *Point out:* this is the anti-hallucination property — a naive chatbot would invent it.
5. Type: **"Place the order for table 7, pay by card."**
   - The agent **asks for confirmation**; confirm; the order is created with a real ID.
6. Type: **"Where's my order?"**
   - The agent calls `get_order_status` and reports the real status.

**Point out:** each tool call is validated; the model never invents prices; irreversible actions
require confirmation.

---

## 4. Scenario C — Voice ordering

**Goal:** Show multimodal input.

1. In **Chat**, tap the **mic** and say: **"Do you have any non-veg starters, and add the wings."**
2. Show the transcription appear, then the grounded answer and the added item.
3. Optionally enable TTS and show the spoken reply.

**Point out:** STT runs locally via faster-whisper; no audio leaves the machine. (Report the
measured WER from `evaluation/EVALUATION.md`.)

---

## 5. Scenario D — Vision

**Goal:** Show image understanding with honest uncertainty.

1. Attach a photo of a dish (or the menu).
2. VeeraServe describes it and suggests close menu matches **with labelled certainty** ("this looks
   close to Korean Chilli Mushroom — want to try it?").

**Point out:** uncertainty is stated; suggestions are grounded; the model is small and we are honest
about that.

---

## 6. Scenario E — Admin console (real data)

**Goal:** Show real management and analytics (no fabricated numbers).

1. In a second browser, log in as **admin**.
2. **Menu management:** mark "Mutton Kheema Pav" as **sold out**; return to the diner tab and show it
   is now unavailable (and the agent will refuse it).
3. Add a new dish; show it appears on the diner menu and in the agent's recommendations.
4. **Order management:** advance an order's status; show it update on the diner's tracker.
5. **Analytics:** show orders/revenue/top items — and state explicitly that these are computed from
   the database. *(Contrast with the original prototype, which used random numbers.)*
6. **Feedback:** show a submitted rating in the inbox.

---

## 7. Scenario F — Happy hour (optional)

**Goal:** Show time-based pricing.

1. During a configured happy-hour window (or via a demo toggle), open a bar item.
2. Show the happy-hour price applied alongside the regular price.

---

## 8. Scenario G — Evaluation (the academic evidence)

**Goal:** Show the claims are measured, not asserted.

1. Open `docs/evaluation/EVALUATION.md` §7.
2. Walk through the metrics table: groundedness, tool accuracy, task success, STT WER, latency.
3. Show the raw result files in `evaluation/results/`.
4. Point out the **ablation** (no-RAG vs RAG) demonstrating the value of grounding.

---

## 9. Capture verification (P8.5)

The flow above was executed end to end against the local stack (backend + frontend + LM Studio
embedding model) and captured with headless Chrome. The screenshots are committed as evidence in
`docs/demo/`:

| File | Shows |
|---|---|
| `01-home.png` | Home, diner-visible menu stats, right-rail cart |
| `02-menu.png` | Menu grouped by category with search |
| `03-item-details.png` | Item details with price, spice, tags |
| `10-chat-grounding.png` | Grounded menu + recommendation replies |
| `04-chat-agent.png` | Add-to-cart action + confirmation prompt |
| `05-cart.png` | Cart after the agent action (persists across reload) |
| `06-checkout.png` | Checkout with server-side totals |
| `07`–`09-mobile-*.png` | Mobile layout (390 px) home/menu/cart |

The cart-persistence and chat screenshots verified two fixes made during this pass: cart state now
restores from `localStorage` on full reload (React StrictMode previously cleared it), and specific
dish names no longer also match their generic subsets.

---

## 10. Closing summary slide / script

> "VeeraServe is a complete, local-first restaurant service. Its AI waiter is grounded in the real
> menu, can take real actions, accepts voice and images, and its GenAI claims are measured with a
> fixed evaluation protocol. Everything runs offline at zero cost on small open models."

---

## 11. Recovery / fallback notes

- If the model is slow on first call, run a warm-up question before the audience arrives.
- If tool-calling fails on a small model, demonstrate the JSON-schema fallback path (it still acts).
- If a metric underperforms, present it honestly with the ablation and limitations from
  `EVALUATION.md` — honesty is a graded quality.

---

*Keep this script in sync with the shipped features. Update after each successful demo.*
