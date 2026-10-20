"""Run the groundedness and hallucination set (M-1, M-2).

Usage, from the repository root:

    python -m evaluation.harness.run_grounding
    python -m evaluation.harness.run_grounding --mode llm-rag
    python -m evaluation.harness.run_grounding --limit 8 --repeat 3
"""

import argparse
from typing import Any

from evaluation.harness.common import (
    build_database,
    ensure_user,
    load_dataset,
    load_grounding_items,
    menu_prices,
    ratio,
    write_result,
)
from evaluation.harness.groundedness import check_reply

MODES = ("agent", "llm-rag", "llm-no-rag")
TARGETS = {"groundedness": 0.95, "hallucination": 0.05, "refusal": 0.95}


def _agent_reply(db: Any, question: str, session_id: str, user_id: int) -> str:
    from app.agent.runner import run_agent

    state = run_agent(db, question, session_id=session_id, user_id=user_id)
    return state.get("reply", "")


def _llm_reply(db: Any, question: str, *, use_rag: bool) -> str:
    from evaluation.harness.llm_answer import answer

    return answer(question, db, use_rag=use_rag)


def run(mode: str, *, limit: int | None = None, repeat: int = 1) -> dict[str, Any]:
    db = build_database()
    prices = menu_prices(db)
    user_id = ensure_user(db)
    items = load_grounding_items(db)
    if limit is not None:
        items = items[:limit]

    records: list[dict[str, Any]] = []
    for item in items:
        for run_index in range(repeat):
            if mode == "agent":
                session_id = f"ground-{item['id']}-{run_index}"
                reply = _agent_reply(db, item["question"], session_id, user_id)
            else:
                reply = _llm_reply(db, item["question"], use_rag=mode == "llm-rag")
            verdict = check_reply(reply, item, prices)
            records.append(
                {
                    "id": item["id"],
                    "kind": item["kind"],
                    "question": item["question"],
                    "answerable": item["answerable"],
                    "ok": verdict.ok,
                    "hallucinated": verdict.hallucinated,
                    "reasons": list(verdict.reasons),
                    "reply": reply,
                }
            )

    answerable = [record for record in records if record["answerable"]]
    unanswerable = [record for record in records if not record["answerable"]]
    metrics = {
        "groundedness": ratio(sum(r["ok"] for r in answerable), len(answerable)),
        "hallucination": ratio(sum(r["hallucinated"] for r in records), len(records)),
        "refusal": ratio(sum(r["ok"] for r in unanswerable), len(unanswerable)),
        "accuracy": ratio(sum(r["ok"] for r in records), len(records)),
    }
    return {
        "suite": "grounding",
        "mode": mode,
        "dataset_version": load_dataset("grounding").get("version", "unknown"),
        "repeat": repeat,
        "items": len(items),
        "records": records,
        "metrics": metrics,
        "targets": TARGETS,
    }


def _print_summary(payload: dict[str, Any]) -> None:
    metrics = payload["metrics"]
    print(f"Grounding mode={payload['mode']} items={payload['items']} repeat={payload['repeat']}")
    print(
        f"  groundedness={metrics['groundedness']:.3f} (>= {TARGETS['groundedness']})"
        f"  hallucination={metrics['hallucination']:.3f} (<= {TARGETS['hallucination']})"
        f"  refusal={metrics['refusal']:.3f} (>= {TARGETS['refusal']})"
        f"  accuracy={metrics['accuracy']:.3f}"
    )
    for record in payload["records"]:
        if not record["ok"]:
            print(f"  FAIL {record['id']}: {record['question']} -> {'; '.join(record['reasons'])}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=MODES, default="agent")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--repeat", type=int, default=1)
    parser.add_argument("--out", default="grounding")
    parser.add_argument("--strict", action="store_true", help="exit 1 when a target is missed")
    args = parser.parse_args(argv)

    payload = run(args.mode, limit=args.limit, repeat=args.repeat)
    _print_summary(payload)
    path = write_result(f"{args.out}-{args.mode}", payload)
    print(f"Wrote {path}")

    metrics = payload["metrics"]
    missed = (
        metrics["groundedness"] < TARGETS["groundedness"]
        or metrics["hallucination"] > TARGETS["hallucination"]
        or metrics["refusal"] < TARGETS["refusal"]
    )
    return 1 if args.strict and missed else 0


if __name__ == "__main__":
    raise SystemExit(main())
