import pytest

from app.agent.polish import polish_reply, verify_grounded
from app.llm.client import LLMError

CONTEXT = [
    {"name": "Paneer Tikka", "is_veg": True, "price": 320},
    {"name": "Masala Chai", "is_veg": True, "price": 60},
]


def test_verify_grounded_accepts_known_prices() -> None:
    assert verify_grounded("Try Paneer Tikka (₹320) or Masala Chai (₹60).", CONTEXT) is True


def test_verify_grounded_rejects_unknown_price() -> None:
    assert verify_grounded("Try our special thali for ₹999.", CONTEXT) is False


def test_polish_reply_uses_grounded_output() -> None:
    def complete(prompt: str, **kwargs: object) -> str:
        return "I'd suggest Paneer Tikka at ₹320."

    assert polish_reply("draft", CONTEXT, complete=complete) == "I'd suggest Paneer Tikka at ₹320."


def test_polish_reply_falls_back_on_invented_price() -> None:
    def complete(prompt: str, **kwargs: object) -> str:
        return "Try our deluxe platter at ₹1500."

    assert polish_reply("original draft", CONTEXT, complete=complete) == "original draft"


def test_polish_reply_falls_back_on_llm_error() -> None:
    def complete(prompt: str, **kwargs: object) -> str:
        raise LLMError("LM Studio down")

    assert polish_reply("original draft", CONTEXT, complete=complete) == "original draft"


def test_polish_reply_without_context_is_a_noop() -> None:
    def complete(prompt: str, **kwargs: object) -> str:
        raise AssertionError("should not be called")

    assert polish_reply("draft", [], complete=complete) == "draft"
