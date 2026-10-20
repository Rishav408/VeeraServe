"""Groundedness checks for menu answers.

A reply is grounded when every rupee amount it quotes exists in the menu and,
for answerable questions, it names the requested dish and its real price.
Unanswerable questions must be refused without quoting a price.
"""

import re
from dataclasses import dataclass

PRICE_PATTERN = re.compile(r"₹\s?(\d+)")
REFUSAL_MARKERS = (
    "don't have",
    "don't serve",
    "couldn't find",
    "couldn't match",
    "not on the menu",
    "no matching",
    "no longer available",
    "sorry",
)


@dataclass(frozen=True)
class Verdict:
    ok: bool
    reasons: tuple[str, ...]
    hallucinated: bool


def quoted_prices(reply: str) -> list[int]:
    return [int(value) for value in PRICE_PATTERN.findall(reply)]


def check_reply(reply: str, item: dict, valid_prices: set[int]) -> Verdict:
    text = reply.lower()
    amounts = quoted_prices(reply)
    reasons: list[str] = []

    fabricated = [amount for amount in amounts if amount not in valid_prices]
    for amount in fabricated:
        reasons.append(f"fabricated price: ₹{amount}")

    if item.get("answerable", True):
        target = item.get("must_include", "")
        if target and target.lower() not in text:
            reasons.append(f"missing target dish: {target}")
        expected = item.get("expected_price")
        if expected is not None and expected not in amounts:
            reasons.append(f"missing expected price: ₹{expected}")
    else:
        if amounts:
            reasons.append("quoted a price for an unavailable dish")
        if not any(marker in text for marker in REFUSAL_MARKERS):
            reasons.append("did not clearly refuse the unavailable dish")

    hallucinated = bool(fabricated) or (
        not item.get("answerable", True) and bool(amounts)
    )
    return Verdict(ok=not reasons, reasons=tuple(reasons), hallucinated=hallucinated)
