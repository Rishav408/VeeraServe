"""Deterministic intent classification and small text helpers.

Small local models are unreliable at routing, so the supervisor defaults to fast,
explainable keyword rules (risk R-1); a model may refine an ambiguous label later.
"""

GREETINGS = {"hi", "hello", "hey", "namaste", "yo", "good morning", "good evening", "hola"}
AFFIRMATIVE = {
    "yes",
    "yeah",
    "yep",
    "yup",
    "sure",
    "ok",
    "okay",
    "confirm",
    "confirmed",
    "place it",
    "place the order",
    "go ahead",
    "please do",
    "do it",
    "save it",
    "save",
    "correct",
}
NEGATIVE = {"no", "nope", "cancel", "stop", "not now", "don't", "dont", "never mind"}

ALCOHOL_KEYWORDS = {
    "beer",
    "wine",
    "whisky",
    "whiskey",
    "vodka",
    "rum",
    "cocktail",
    "alcohol",
    "bar",
    "liquor",
}
INJECTION_KEYWORDS = {
    "ignore previous",
    "ignore all previous",
    "ignore the above",
    "system prompt",
    "disregard",
    "jailbreak",
    "you are now",
    "developer mode",
    "override your",
}
OFF_TOPIC_KEYWORDS = {
    "weather",
    "cricket",
    "football",
    "politics",
    "election",
    "stock market",
    "bitcoin",
    "joke",
    "homework",
    "write code",
    "python",
    "javascript",
    "president",
    "movie",
    "song",
}
PREFERENCE_KEYWORDS = {
    "i'm veg",
    "i am veg",
    "vegetarian",
    "non-veg",
    "non veg",
    "allergic",
    "allergy",
    "i prefer",
    "i don't eat",
    "i dont eat",
    "i only eat",
}
ORDER_KEYWORDS = {
    "order",
    "add ",
    "to cart",
    "cart",
    "checkout",
    "i'll have",
    "i will have",
    "i want",
    "get me",
    "bring me",
    "place",
}
RECOMMEND_KEYWORDS = {
    "recommend",
    "suggest",
    "what should",
    "should i",
    "best dish",
    "popular",
    "surprise me",
    "something good",
    "anything good",
}
STATUS_KEYWORDS = {
    "status",
    "where is my",
    "where's my",
    "wheres my",
    "track",
    "how long",
    "my order",
    "order number",
    "preparing",
    "ready yet",
}
MENU_KEYWORDS = {
    "menu",
    "price",
    "cost",
    "how much",
    "do you have",
    "available",
    "veg",
    "spicy",
    "mild",
    "dish",
    "item",
    "what is",
    "what's",
    "whats",
}

NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
}


def contains_any(text: str, keywords: set[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def is_affirmative(text: str) -> bool:
    lowered = text.strip().lower()
    return lowered in AFFIRMATIVE or any(
        lowered.startswith(prefix) for prefix in ("yes", "yeah", "yep", "yup", "sure", "ok")
    )


def is_negative(text: str) -> bool:
    lowered = text.strip().lower()
    return lowered in NEGATIVE or lowered.startswith("no ")


def extract_quantity(text: str) -> int:
    for token in text.replace(",", " ").split():
        digits = "".join(char for char in token if char.isdigit())
        if digits:
            value = int(digits)
            if value > 0:
                return min(value, 50)
    for word, value in NUMBER_WORDS.items():
        if word in text.split():
            return value
    return 1


def classify(
    message: str,
    *,
    has_image: bool = False,
    pending_order: bool = False,
    pending_preference: bool = False,
) -> str:
    lowered = message.strip().lower()

    if has_image:
        return "vision"
    if pending_preference and is_affirmative(lowered):
        return "preference_confirm"
    if pending_order and is_affirmative(lowered):
        return "order_confirm"
    if pending_order and is_negative(lowered):
        return "order_cancel"
    if contains_any(lowered, INJECTION_KEYWORDS):
        return "injection"
    if lowered in GREETINGS or (len(lowered.split()) <= 2 and contains_any(lowered, GREETINGS)):
        return "greeting"
    if contains_any(lowered, OFF_TOPIC_KEYWORDS):
        return "off_topic"
    if contains_any(lowered, PREFERENCE_KEYWORDS):
        return "preference"
    if contains_any(lowered, STATUS_KEYWORDS):
        return "status"
    if contains_any(lowered, ORDER_KEYWORDS):
        return "order"
    if contains_any(lowered, RECOMMEND_KEYWORDS):
        return "recommend"
    if contains_any(lowered, MENU_KEYWORDS):
        return "menu"
    return "menu"
