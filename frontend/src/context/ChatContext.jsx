import { createContext, useContext, useReducer } from "react";
import { useCart } from "./CartContext";
import { useAppData } from "./AppDataContext";
import { getBotResponse } from "../utils/bot";

const ChatContext = createContext(null);

const initialState = {
  messages: [
    {
      id: "bot-1",
      sender: "bot",
      text: "Namaste! I am Veera Bot. Tell me spicy/light/veg and I will suggest dishes.",
      createdAt: Date.now()
    }
  ],
  typing: false
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload], typing: true };
    case "ADD_BOT_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload], typing: false };
    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { addToCart } = useCart();
  const { menuItems } = useAppData();

  const sendMessage = async (text, audioBlob = null, imageFile = null) => {
    let displayMessage = text;
    if (!text && audioBlob) displayMessage = "🎤 Audio Message";
    else if (!text && imageFile) displayMessage = "🖼️ Image Attachment";

    dispatch({
      type: "ADD_USER_MESSAGE",
      payload: { id: `u-${Date.now()}`, sender: "user", text: displayMessage, createdAt: Date.now() }
    });

    const response = await getBotResponse(text, audioBlob, imageFile);

    if (response.action?.type === "add_to_cart") {
      const item = menuItems.find((menuItem) => menuItem.id === response.action.itemId);
      if (item) {
        addToCart(item);
      }
    }

    dispatch({
      type: "ADD_BOT_MESSAGE",
      payload: {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: response.message,
        createdAt: Date.now()
      }
    });
  };

  const value = { ...state, sendMessage };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}
