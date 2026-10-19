"""Mutable per-session state shared by agent tools."""

from dataclasses import dataclass, field

from sqlalchemy.orm import Session


@dataclass
class CartLine:
    item_id: str
    name: str
    unit_price: int
    quantity: int


@dataclass
class Cart:
    lines: dict[str, CartLine] = field(default_factory=dict)

    @property
    def is_empty(self) -> bool:
        return not self.lines

    def contains(self, item_id: str) -> bool:
        return item_id in self.lines

    def add(self, item_id: str, name: str, unit_price: int, quantity: int = 1) -> None:
        existing = self.lines.get(item_id)
        if existing is None:
            self.lines[item_id] = CartLine(item_id, name, unit_price, quantity)
        else:
            existing.quantity += quantity

    def set_quantity(self, item_id: str, quantity: int) -> None:
        if quantity <= 0:
            self.lines.pop(item_id, None)
            return
        if item_id in self.lines:
            self.lines[item_id].quantity = quantity

    def clear(self) -> None:
        self.lines.clear()

    def subtotal(self) -> int:
        return sum(line.unit_price * line.quantity for line in self.lines.values())

    def as_list(self) -> list[dict]:
        return [
            {
                "item_id": line.item_id,
                "name": line.name,
                "unit_price": line.unit_price,
                "quantity": line.quantity,
                "line_total": line.unit_price * line.quantity,
            }
            for line in self.lines.values()
        ]


@dataclass
class ToolContext:
    db: Session
    cart: Cart = field(default_factory=Cart)
    user_id: int | None = None
    session_id: str | None = None
    confirmed: bool = False
    offer_code: str | None = None
