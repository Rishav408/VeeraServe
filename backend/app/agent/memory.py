"""Long-term preference memory (user-owned, confirmation-gated)."""

from sqlalchemy.orm import Session

from app.models import User

ALLERGENS = ("peanut", "dairy", "gluten", "soy", "nuts", "egg", "shellfish")


def load_preferences(db: Session, user_id: int | None) -> dict:
    if user_id is None:
        return {}
    user = db.get(User, user_id)
    return dict(user.preferences or {}) if user else {}


def save_preferences(db: Session, user_id: int | None, preferences: dict) -> dict:
    if user_id is None:
        return preferences
    user = db.get(User, user_id)
    if user is None:
        return preferences
    user.preferences = preferences
    db.commit()
    db.refresh(user)
    return dict(user.preferences or {})


def extract_preferences(message: str, current: dict | None = None) -> dict:
    lowered = message.lower()
    preferences = dict(current or {})

    if "vegetarian" in lowered or "i'm veg" in lowered or "i am veg" in lowered:
        preferences["veg"] = True
    elif "non-veg" in lowered or "non veg" in lowered:
        preferences["veg"] = False

    if "mild" in lowered:
        preferences["spice_level"] = 1
    elif "spicy" in lowered or "hot" in lowered:
        preferences["spice_level"] = 3

    allergies = {allergen for allergen in ALLERGENS if allergen in lowered}
    if allergies:
        existing = set(preferences.get("allergies") or [])
        preferences["allergies"] = sorted(existing | allergies)

    return preferences


def describe_preferences(preferences: dict) -> str:
    parts: list[str] = []
    if preferences.get("veg") is True:
        parts.append("veg-only")
    elif preferences.get("veg") is False:
        parts.append("non-veg")
    if preferences.get("spice_level") is not None:
        parts.append(f"spice level {preferences['spice_level']}")
    if preferences.get("allergies"):
        parts.append("allergies: " + ", ".join(preferences["allergies"]))
    return ", ".join(parts) or "your preferences"
