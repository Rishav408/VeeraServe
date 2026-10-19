from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Feedback, MenuItem, Order
from app.schemas.analytics import DashboardAnalytics
from app.services.order import ORDER_STATUSES

ACTIVE_STATUSES = ("pending", "preparing", "ready")
TRACKED_DAYS = 7


def _average(values: list[int]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 2)


def compute_dashboard(db: Session) -> DashboardAnalytics:
    orders = list(db.scalars(select(Order).options(selectinload(Order.items))))
    feedback = list(db.scalars(select(Feedback)))
    menu_items = list(db.scalars(select(MenuItem)))

    total_orders = len(orders)
    total_revenue = sum(order.total for order in orders)

    status_counts = {status: 0 for status in ORDER_STATUSES}
    for order in orders:
        if order.status in status_counts:
            status_counts[order.status] += 1

    today = datetime.now(timezone.utc).date()
    days = [today - timedelta(days=offset) for offset in range(TRACKED_DAYS - 1, -1, -1)]
    day_orders = {day: 0 for day in days}
    day_revenue = {day: 0 for day in days}
    hour_counts = {hour: 0 for hour in range(24)}

    for order in orders:
        created = order.created_at.date()
        if created in day_orders:
            day_orders[created] += 1
            day_revenue[created] += order.total
        hour_counts[order.created_at.hour] += 1

    item_totals: dict[str, dict[str, int]] = {}
    for order in orders:
        for line in order.items:
            entry = item_totals.setdefault(line.menu_item_id, {"quantity": 0, "revenue": 0})
            entry["quantity"] += line.quantity
            entry["revenue"] += line.unit_price * line.quantity

    names = {item.id: item.name for item in menu_items}
    top_items = sorted(
        (
            {
                "menu_item_id": item_id,
                "name": names.get(item_id, item_id),
                "quantity": totals["quantity"],
                "revenue": totals["revenue"],
            }
            for item_id, totals in item_totals.items()
        ),
        key=lambda entry: (entry["quantity"], entry["revenue"]),
        reverse=True,
    )[:5]

    food = _average([entry.food_rating for entry in feedback])
    service = _average([entry.service_rating for entry in feedback])
    ai = _average([entry.ai_rating for entry in feedback])
    overall = round((food + service + ai) / 3, 2) if feedback else 0.0

    return DashboardAnalytics(
        total_orders=total_orders,
        total_revenue=total_revenue,
        avg_order_value=round(total_revenue / total_orders) if total_orders else 0,
        active_orders=sum(status_counts[status] for status in ACTIVE_STATUSES),
        menu_items=len(menu_items),
        available_items=sum(1 for item in menu_items if item.is_available),
        orders_by_status=[
            {"status": status, "count": status_counts[status]} for status in ORDER_STATUSES
        ],
        revenue_by_day=[
            {
                "date": day.isoformat(),
                "weekday": day.strftime("%a"),
                "orders": day_orders[day],
                "revenue": day_revenue[day],
            }
            for day in days
        ],
        top_items=top_items,
        peak_hours=[{"hour": hour, "orders": hour_counts[hour]} for hour in range(24)],
        ratings={"food": food, "service": service, "ai": ai, "overall": overall, "count": len(feedback)},
    )
