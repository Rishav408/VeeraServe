from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class DayRevenue(BaseModel):
    date: str
    weekday: str
    orders: int
    revenue: int


class TopItem(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    revenue: int


class HourCount(BaseModel):
    hour: int
    orders: int


class RatingSummary(BaseModel):
    food: float
    service: float
    ai: float
    overall: float
    count: int


class DashboardAnalytics(BaseModel):
    total_orders: int
    total_revenue: int
    avg_order_value: int
    active_orders: int
    menu_items: int
    available_items: int
    orders_by_status: list[StatusCount]
    revenue_by_day: list[DayRevenue]
    top_items: list[TopItem]
    peak_hours: list[HourCount]
    ratings: RatingSummary
