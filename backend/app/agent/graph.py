"""Wire the agent nodes into a LangGraph state machine."""

from typing import Any

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph

from app.agent import nodes
from app.agent.state import AgentState

SPECIALISTS = ("greeter", "menu", "recommend", "ordering", "status", "vision", "preference")

ROUTE_MAP: dict[str, str] = {name: name for name in ("record", *SPECIALISTS)}


def build_graph(checkpointer: Any | None = None):
    builder = StateGraph(AgentState)

    builder.add_node("load_memory", nodes.load_memory)
    builder.add_node("supervisor", nodes.supervisor)
    builder.add_node("guardrails", nodes.guardrails)
    for name in SPECIALISTS:
        builder.add_node(name, getattr(nodes, f"{name}_node"))
    builder.add_node("record", nodes.record_node)

    builder.add_edge(START, "load_memory")
    builder.add_edge("load_memory", "supervisor")
    builder.add_edge("supervisor", "guardrails")
    builder.add_conditional_edges("guardrails", nodes.route_after_guardrails, ROUTE_MAP)
    for name in SPECIALISTS:
        builder.add_edge(name, "record")
    builder.add_edge("record", END)

    return builder.compile(checkpointer=checkpointer or InMemorySaver())
