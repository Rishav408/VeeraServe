"""Direct LLM answering modes used for the retrieval ablation.

These modes bypass the agent tools so the ablation measures grounding from
retrieved context alone. They require the local model runtime (LM Studio).
"""

from sqlalchemy.orm import Session

from app.llm.client import chat_completion
from app.rag.retriever import retrieve_menu_items

SYSTEM_PROMPT = (
    "You are Veera, the AI waiter at Veeradhar Dhaba. "
    "Answer the guest using only the menu information provided. "
    "Never invent a dish, ingredient, or price. "
    "If the menu does not contain what the guest asks for, say so and offer an alternative."
)


def _context(question: str, db: Session) -> str:
    lines: list[str] = []
    for item in retrieve_menu_items(question, db=db, top_k=8):
        diet = "veg" if item.is_veg else "non-veg"
        price = f"₹{item.price}" if item.price is not None else "price on request"
        lines.append(f"- {item.name} ({diet}): {price}")
    return "\n".join(lines)


def answer(question: str, db: Session, *, use_rag: bool) -> str:
    context = _context(question, db) if use_rag else ""
    prompt = question if not context else f"MENU CONTEXT:\n{context}\n\nGUEST: {question}"
    return chat_completion(prompt, system_prompt=SYSTEM_PROMPT, temperature=0.0)
