import base64
from typing import Optional
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.chat_history import InMemoryChatMessageHistory

# Simple in-memory memory store based on session id
session_memory = {}

# Use qwen2.5vl:3b as requested by user
LLM_MODEL = "qwen2.5vl:3b"

llm = ChatOllama(model=LLM_MODEL, temperature=0.7)

system_prompt = SystemMessage(
    content=(
        "You are Veera Bot, an AI Waiter for 'VeeraServe' restaurant. "
        "Recommend dishes, answer questions about the menu (spicy, veg, light), "
        "and behave like a polite, knowledgeable server. Keep responses concise and engaging."
    )
)

def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in session_memory:
        session_memory[session_id] = InMemoryChatMessageHistory()
        # Pre-seed with system prompt
        session_memory[session_id].add_message(system_prompt)
    return session_memory[session_id]

def process_chat(session_id: str, text: str, image_path: Optional[str] = None) -> str:
    """
    Processes chat with optional text and an optional image path.
    """
    history = get_session_history(session_id)
    
    content = []
    if text:
        content.append({"type": "text", "text": text})
    else:
        content.append({"type": "text", "text": "Analyze this image in context of a restaurant meal."})
        
    if image_path:
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}
        })
        
    user_msg = HumanMessage(content=content)
    
    # Appending the new user message to history
    history.add_message(user_msg)
    
    # Get response
    try:
        response = llm.invoke(history.messages)
        history.add_message(response)
        return response.content
    except Exception as e:
        print(f"Error calling LLM: {str(e)}")
        err_msg = "Sorry, I am out of service right now or taking longer than expected to think. Can I help you with anything else?"
        return err_msg
