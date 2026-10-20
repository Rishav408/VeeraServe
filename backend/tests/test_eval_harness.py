import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.agent.tools.registry import TOOLS  # noqa: E402
from evaluation.harness.common import (  # noqa: E402
    build_database,
    ensure_user,
    load_dataset,
    load_grounding_items,
    menu_prices,
)
from evaluation.harness.groundedness import check_reply  # noqa: E402
from evaluation.harness.run_grounding import _agent_reply  # noqa: E402
from evaluation.harness.run_latency import _percentile  # noqa: E402
from evaluation.harness.run_safety import run as run_safety  # noqa: E402
from evaluation.harness.run_scenarios import run as run_scenarios  # noqa: E402
from evaluation.harness.run_stt import tokens, word_errors  # noqa: E402
from evaluation.harness.run_tools import _run, calls_match  # noqa: E402


def test_datasets_reference_real_menu_items() -> None:
    db = build_database()
    grounding = load_grounding_items(db)
    assert len([item for item in grounding if item["answerable"]]) >= 48
    assert len([item for item in grounding if not item["answerable"]]) >= 16

    tools = load_dataset("tools")["items"]
    assert len(tools) >= 40
    for item in tools:
        for call in item.get("expected") or []:
            assert call["tool"] in TOOLS

    scenarios = load_dataset("scenarios")["items"]
    assert len(scenarios) >= 20
    assert len({scenario["id"] for scenario in scenarios}) == len(scenarios)

    safety = load_dataset("safety")["items"]
    assert len(safety) >= 20
    assert {item["category"] for item in safety} == {"injection", "off_topic"}
    assert len({item["id"] for item in safety}) == len(safety)


def test_check_reply_accepts_grounded_answer() -> None:
    verdict = check_reply(
        "Butter Chicken (non-veg) — ₹385.",
        {"answerable": True, "must_include": "Butter Chicken", "expected_price": 385},
        {385, 310},
    )
    assert verdict.ok
    assert not verdict.hallucinated


def test_check_reply_flags_fabricated_price() -> None:
    verdict = check_reply(
        "Butter Chicken — ₹999.",
        {"answerable": True, "must_include": "Butter Chicken", "expected_price": 385},
        {385},
    )
    assert not verdict.ok
    assert verdict.hallucinated


def test_check_reply_requires_refusal_and_flags_fabrication() -> None:
    refused = check_reply("Sorry, we don't have anything matching 'sushi'.", {"answerable": False}, {385})
    assert refused.ok
    alternative = check_reply(
        "We don't have sushi, but Butter Chicken is ₹385.",
        {"answerable": False},
        {385},
    )
    assert alternative.ok
    assert not alternative.hallucinated
    invented = check_reply("Yes, sushi is ₹499.", {"answerable": False}, {385})
    assert not invented.ok
    assert invented.hallucinated


def test_calls_match_allows_chained_calls_and_partial_args() -> None:
    actual = [
        {"tool": "add_to_cart", "args": {"item_id": "25", "quantity": 2}},
        {"tool": "place_order", "args": {"payment_method": "cash"}},
    ]
    assert calls_match([{"tool": "add_to_cart", "args": {"item_id": "25"}}], actual)
    assert calls_match(
        [
            {"tool": "add_to_cart", "args": {"item_id": "25"}},
            {"tool": "place_order", "args": {"payment_method": "cash"}},
        ],
        actual,
    )
    assert not calls_match([{"tool": "add_to_cart", "args": {"quantity": 3}}], actual)
    assert not calls_match([{"tool": "get_order_status"}], actual)


def test_agent_answers_are_grounded_end_to_end() -> None:
    db = build_database()
    user_id = ensure_user(db)
    prices = menu_prices(db)
    items = {item["id"]: item for item in load_grounding_items(db)}

    positive = items["g-022"]
    reply = _agent_reply(db, positive["question"], "test-grounding-positive", user_id)
    assert check_reply(reply, positive, prices).ok

    negative = items["g-049"]
    reply = _agent_reply(db, negative["question"], "test-grounding-negative", user_id)
    assert check_reply(reply, negative, prices).ok


def test_tool_runner_records_expected_call_end_to_end() -> None:
    db = build_database()
    user_id = ensure_user(db)
    dataset = {item["id"]: item for item in load_dataset("tools")["items"]}

    item = dataset["t-001"]
    calls, _ = _run(db, item, "test-tools-search", user_id)
    assert calls_match(item["expected"], calls)

    greeting = dataset["t-036"]
    calls, _ = _run(db, greeting, "test-tools-greeting", user_id)
    assert calls == []


def test_wer_normalizes_number_words() -> None:
    assert tokens("Track my order number twenty five")[-1] == "25"
    assert word_errors("I want two roti", "I want 2 roti") == (0, 4)
    errors, words = word_errors("add one dal tadka", "add 1 dal tadka")
    assert errors == 0
    assert words == 4


def test_latency_percentile_uses_nearest_rank() -> None:
    values = [0.1, 0.2, 0.3, 0.4, 0.5]
    assert _percentile(values, 50) == 0.3
    assert _percentile(values, 90) == 0.5


def test_scenario_runs_end_to_end() -> None:
    payload = run_scenarios(limit=1)
    assert payload["items"] == 1
    assert payload["records"][0]["ok"], payload["records"][0]["reasons"]


def test_safety_runner_refuses_adversarial_prompts() -> None:
    payload = run_safety(limit=2)
    assert payload["metrics"]["refusal"] == 1.0
    assert payload["metrics"]["orders_placed"] == 0
