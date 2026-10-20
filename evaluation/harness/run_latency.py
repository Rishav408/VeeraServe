"""Measure first-token and full-response latency (M-7, M-8).

Usage, from the repository root:

    python -m evaluation.harness.run_latency
    python -m evaluation.harness.run_latency --repeat 5

The measurement exercises the real turn pipeline (`iter_turn_events`) end to end
through reply chunking. It excludes browser/network transit.
"""

import argparse
import math
import time
from typing import Any

from evaluation.harness.common import (
    build_database,
    ensure_user,
    ratio,
    write_result,
)

TARGETS = {"first_token_seconds": 3.0, "full_response_seconds": 15.0}
PROMPTS = (
    "how much is butter chicken",
    "do you have dal bukhara",
    "recommend something spicy",
    "suggest a veg dish",
    "surprise me",
    "add 1 dal tadka",
    "where is my order",
    "hi",
    "what's the weather",
    "tell me about ghee roast prawns",
    "add 1 butter chicken",
    "how much is water",
)


def _percentile(values: list[float], percentile: int) -> float:
    ordered = sorted(values)
    index = max(0, math.ceil(percentile / 100 * len(ordered)) - 1)
    return round(ordered[index], 4)


def _measure(db: Any, user_id: int, prompt: str, session_id: str) -> tuple[float, float]:
    from app.agent.streaming import iter_turn_events

    started = time.perf_counter()
    first_token: float | None = None
    completed: float | None = None
    for event in iter_turn_events(db, session_id=session_id, user_id=user_id, text=prompt):
        now = time.perf_counter()
        if event.get("type") == "token" and first_token is None:
            first_token = now - started
        elif event.get("type") == "done":
            completed = now - started
    if first_token is None or completed is None:
        raise RuntimeError(f"Turn produced no token/done event: {prompt}")
    return round(first_token, 4), round(completed, 4)


def run(*, repeat: int = 3) -> dict[str, Any]:
    db = build_database()
    user_id = ensure_user(db)
    _measure(db, user_id, "hi", "latency-warmup")

    records: list[dict[str, Any]] = []
    for index in range(repeat):
        for position, prompt in enumerate(PROMPTS):
            first_token, full_response = _measure(
                db, user_id, prompt, f"latency-{index}-{position}"
            )
            records.append(
                {
                    "prompt": prompt,
                    "run": index,
                    "first_token_seconds": first_token,
                    "full_response_seconds": full_response,
                }
            )

    first_tokens = [record["first_token_seconds"] for record in records]
    full_responses = [record["full_response_seconds"] for record in records]
    metrics = {
        "first_token_median": _percentile(first_tokens, 50),
        "first_token_p90": _percentile(first_tokens, 90),
        "full_response_median": _percentile(full_responses, 50),
        "full_response_p90": _percentile(full_responses, 90),
        "turns": len(records),
    }
    completed_both = ratio(
        sum(
            1
            for record in records
            if record["first_token_seconds"] <= TARGETS["first_token_seconds"]
            and record["full_response_seconds"] <= TARGETS["full_response_seconds"]
        ),
        len(records),
    )
    metrics["within_target"] = completed_both
    return {
        "suite": "latency",
        "repeat": repeat,
        "prompts": len(PROMPTS),
        "records": records,
        "metrics": metrics,
        "targets": TARGETS,
        "notes": (
            "Deterministic graph path: replies are composed by the graph and then chunked, "
            "so first-token latency is close to full-response latency. Optional LLM polishing "
            "adds model time to both."
        ),
    }


def _print_summary(payload: dict[str, Any]) -> None:
    metrics = payload["metrics"]
    print(
        f"Latency turns={metrics['turns']} "
        f"first-token median={metrics['first_token_median']:.3f}s "
        f"p90={metrics['first_token_p90']:.3f}s "
        f"full median={metrics['full_response_median']:.3f}s "
        f"p90={metrics['full_response_p90']:.3f}s "
        f"within-target={metrics['within_target']:.3f}"
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repeat", type=int, default=3)
    parser.add_argument("--out", default="latency")
    parser.add_argument("--strict", action="store_true", help="exit 1 when a target is missed")
    args = parser.parse_args(argv)

    payload = run(repeat=args.repeat)
    _print_summary(payload)
    path = write_result(args.out, payload)
    print(f"Wrote {path}")
    metrics = payload["metrics"]
    missed = (
        metrics["first_token_p90"] > TARGETS["first_token_seconds"]
        or metrics["full_response_p90"] > TARGETS["full_response_seconds"]
    )
    return 1 if args.strict and missed else 0


if __name__ == "__main__":
    raise SystemExit(main())
