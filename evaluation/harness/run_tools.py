"""Run the tool-call accuracy set (M-3).

Usage, from the repository root:

    python -m evaluation.harness.run_tools
    python -m evaluation.harness.run_tools --limit 8
"""

import argparse
from typing import Any

from evaluation.harness.common import (
    build_database,
    ensure_user,
    load_dataset,
    ratio,
    write_result,
)

TARGETS = {"accuracy": 0.90}


def _turns(item: dict[str, Any]) -> list[str]:
    return item.get("turns") or [item["utterance"]]


def _run(db: Any, item: dict[str, Any], session_id: str, user_id: int) -> tuple[list[dict], str]:
    from app.agent.runner import run_agent

    calls: list[dict[str, Any]] = []
    reply = ""
    for turn in _turns(item):
        state = run_agent(db, turn, session_id=session_id, user_id=user_id)
        calls.extend(state.get("tool_calls") or [])
        reply = state.get("reply", "")
    return calls, reply


def _args_match(expected: dict[str, Any], actual: dict[str, Any]) -> bool:
    for key, want in expected.items():
        if key.endswith("_contains"):
            field = key[: -len("_contains")]
            have = actual.get(field)
            if not isinstance(have, str) or want.lower() not in have.lower():
                return False
        elif actual.get(key) != want:
            return False
    return True


def calls_match(expected: list[dict], actual: list[dict]) -> bool:
    """Expected calls must appear in order; extra chained calls are allowed."""
    index = 0
    for call in expected:
        while index < len(actual) and actual[index].get("tool") != call.get("tool"):
            index += 1
        if index == len(actual):
            return False
        if not _args_match(call.get("args") or {}, actual[index].get("args") or {}):
            return False
        index += 1
    return True


def run(*, limit: int | None = None) -> dict[str, Any]:
    db = build_database()
    user_id = ensure_user(db)
    dataset = load_dataset("tools")
    items = dataset["items"]
    if limit is not None:
        items = items[:limit]

    records: list[dict[str, Any]] = []
    for item in items:
        calls, reply = _run(db, item, f"tools-{item['id']}", user_id)
        expected = item.get("expected") or []
        ok = calls_match(expected, calls)
        records.append(
            {
                "id": item["id"],
                "turns": _turns(item),
                "expected": expected,
                "actual": calls,
                "ok": ok,
                "reply": reply,
            }
        )

    accuracy = ratio(sum(record["ok"] for record in records), len(records))
    return {
        "suite": "tools",
        "dataset_version": dataset.get("version", "unknown"),
        "items": len(items),
        "records": records,
        "metrics": {"accuracy": accuracy},
        "targets": TARGETS,
    }


def _print_summary(payload: dict[str, Any]) -> None:
    print(f"Tool accuracy items={payload['items']} accuracy={payload['metrics']['accuracy']:.3f}")
    for record in payload["records"]:
        if not record["ok"]:
            print(f"  FAIL {record['id']}: {record['turns']}")
            print(f"    expected={record['expected']}")
            print(f"    actual={record['actual']}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", default="tools")
    parser.add_argument("--strict", action="store_true", help="exit 1 when the target is missed")
    args = parser.parse_args(argv)

    payload = run(limit=args.limit)
    _print_summary(payload)
    path = write_result(args.out, payload)
    print(f"Wrote {path}")
    missed = payload["metrics"]["accuracy"] < TARGETS["accuracy"]
    return 1 if args.strict and missed else 0


if __name__ == "__main__":
    raise SystemExit(main())
