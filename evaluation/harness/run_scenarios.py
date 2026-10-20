"""Run the end-to-end task-success scenarios (M-4).

Usage, from the repository root:

    python -m evaluation.harness.run_scenarios
    python -m evaluation.harness.run_scenarios --limit 5

Scenarios drive the live HTTP API (chat + staff order updates) and verify the
resulting application state, not the reply text alone.
"""

import argparse
import json
from collections import Counter
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from evaluation.harness.common import (
    build_session_factory,
    load_dataset,
    menu_prices,
    ratio,
    write_result,
)
from evaluation.harness.groundedness import quoted_prices

from app.db.session import get_db
from app.main import app
from app.models import User

API = "/api/v1"
PASSWORD = "eval-pass-123"
TARGETS = {"task_success": 0.85}


def _events(body: str) -> list[dict[str, Any]]:
    return [
        json.loads(line[len("data: ") :])
        for line in body.splitlines()
        if line.startswith("data: ")
    ]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _chat(client: TestClient, token: str, session_id: str, text: str) -> str:
    response = client.post(
        f"{API}/chat",
        data={"text": text, "session_id": session_id},
        headers=_auth(token),
    )
    response.raise_for_status()
    done = next((event for event in _events(response.text) if event.get("type") == "done"), None)
    if done is None:
        raise RuntimeError("chat stream did not emit a done event")
    return done.get("reply", "")


def _register(client: TestClient, email: str) -> dict[str, Any]:
    response = client.post(
        f"{API}/auth/register",
        json={"name": email.split("@")[0], "email": email, "password": PASSWORD},
    )
    response.raise_for_status()
    return response.json()


def _staff_token(client: TestClient, factory: Any) -> str:
    register = client.post(
        f"{API}/auth/register",
        json={"name": "eval-staff", "email": "staff@eval.local", "password": PASSWORD},
    )
    if register.status_code == 409:
        login = client.post(
            f"{API}/auth/login",
            json={"email": "staff@eval.local", "password": PASSWORD},
        )
    else:
        register.raise_for_status()
        login = register
    token = login.json()["access_token"]
    with factory() as db:
        user = db.query(User).filter_by(email="staff@eval.local").one()
        if user.role != "staff":
            user.role = "staff"
            db.commit()
    return token


def _orders(client: TestClient, token: str) -> list[dict[str, Any]]:
    response = client.get(f"{API}/orders", headers=_auth(token))
    response.raise_for_status()
    return response.json()


def _preferences(client: TestClient, token: str) -> dict[str, Any]:
    response = client.get(f"{API}/auth/me", headers=_auth(token))
    response.raise_for_status()
    return response.json().get("preferences") or {}


def _check(
    check: dict[str, Any],
    *,
    client: TestClient,
    token: str,
    prices: set[int],
    last_reply: str,
) -> list[str]:
    reasons: list[str] = []
    orders = _orders(client, token)

    if check.get("no_orders") and orders:
        reasons.append(f"expected no orders, found {len(orders)}")

    spec = check.get("orders")
    if spec:
        if "count" in spec and len(orders) != spec["count"]:
            reasons.append(f"order count {len(orders)} != {spec['count']}")
        if "items" in spec:
            actual: Counter[str] = Counter()
            for order in orders:
                for item in order["items"]:
                    actual[item["menu_item_id"]] += item["quantity"]
            expected = Counter(
                {item["menu_item_id"]: item["quantity"] for item in spec["items"]}
            )
            if actual != expected:
                reasons.append(f"order items {dict(actual)} != {dict(expected)}")
        if "status" in spec and (not orders or orders[0]["status"] != spec["status"]):
            reasons.append(f"latest status {orders[0]['status'] if orders else None} != {spec['status']}")
        if "total" in spec and (not orders or orders[0]["total"] != spec["total"]):
            reasons.append(f"latest total {orders[0]['total'] if orders else None} != {spec['total']}")

    if "preferences" in check:
        preferences = _preferences(client, token)
        for key, value in check["preferences"].items():
            if preferences.get(key) != value:
                reasons.append(f"preference {key}={preferences.get(key)} != {value}")

    if "preferences_absent" in check:
        preferences = _preferences(client, token)
        for key in check["preferences_absent"]:
            if preferences.get(key) is not None:
                reasons.append(f"unexpected preference: {key}={preferences.get(key)}")

    if "reply_contains" in check:
        for needle in check["reply_contains"]:
            if needle.lower() not in last_reply.lower():
                reasons.append(f"reply missing: {needle}")

    if check.get("grounded_prices"):
        fabricated = [price for price in quoted_prices(last_reply) if price not in prices]
        if fabricated:
            reasons.append(f"fabricated prices: {fabricated}")
        if not quoted_prices(last_reply):
            reasons.append("reply quoted no real prices")

    return reasons


def _run_scenario(
    client: TestClient,
    scenario: dict[str, Any],
    *,
    factory: Any,
    staff_token: str,
    prices: set[int],
) -> dict[str, Any]:
    account = _register(client, f"{scenario['id']}@eval.local")
    token = account["access_token"]
    session_id = f"scenario-{scenario['id']}"
    replies: list[str] = []
    reasons: list[str] = []

    try:
        for step in scenario["steps"]:
            if "chat" in step:
                reply = _chat(client, token, session_id, step["chat"])
                replies.append(reply)
                expected = step.get("expect_contains")
                if isinstance(expected, str):
                    expected = [expected]
                for needle in expected or []:
                    if needle.lower() not in reply.lower():
                        reasons.append(f"turn '{step['chat']}' reply missing: {needle}")
            elif "staff_status" in step:
                orders = _orders(client, token)
                if not orders:
                    reasons.append("staff_status requested before any order existed")
                    continue
                response = client.patch(
                    f"{API}/orders/{orders[0]['id']}/status",
                    json={"status": step["staff_status"]},
                    headers=_auth(staff_token),
                )
                if response.status_code != 200:
                    reasons.append(
                        f"status update to {step['staff_status']} failed: {response.status_code}"
                    )

        reasons.extend(
            _check(
                scenario.get("check") or {},
                client=client,
                token=token,
                prices=prices,
                last_reply=replies[-1] if replies else "",
            )
        )
    except Exception as exc:
        reasons.append(f"error: {exc}")

    return {
        "id": scenario["id"],
        "goal": scenario["goal"],
        "turns": [step["chat"] for step in scenario["steps"] if "chat" in step],
        "ok": not reasons,
        "reasons": reasons,
        "replies": replies,
    }


def run(*, limit: int | None = None) -> dict[str, Any]:
    factory = build_session_factory()
    with factory() as db:
        prices = menu_prices(db)

    def override_get_db():
        session: Session = factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    try:
        staff_token = _staff_token(client, factory)
        scenarios = load_dataset("scenarios")["items"]
        if limit is not None:
            scenarios = scenarios[:limit]
        records = [
            _run_scenario(
                client,
                scenario,
                factory=factory,
                staff_token=staff_token,
                prices=prices,
            )
            for scenario in scenarios
        ]
    finally:
        app.dependency_overrides.clear()

    success = ratio(sum(record["ok"] for record in records), len(records))
    return {
        "suite": "scenarios",
        "dataset_version": load_dataset("scenarios").get("version", "unknown"),
        "items": len(records),
        "records": records,
        "metrics": {"task_success": success},
        "targets": TARGETS,
    }


def _print_summary(payload: dict[str, Any]) -> None:
    print(f"Task success items={payload['items']} rate={payload['metrics']['task_success']:.3f}")
    for record in payload["records"]:
        if not record["ok"]:
            print(f"  FAIL {record['id']}: {record['goal']} -> {'; '.join(record['reasons'])}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", default="scenarios")
    parser.add_argument("--strict", action="store_true", help="exit 1 when the target is missed")
    args = parser.parse_args(argv)

    payload = run(limit=args.limit)
    _print_summary(payload)
    path = write_result(args.out, payload)
    print(f"Wrote {path}")
    missed = payload["metrics"]["task_success"] < TARGETS["task_success"]
    return 1 if args.strict and missed else 0


if __name__ == "__main__":
    raise SystemExit(main())
