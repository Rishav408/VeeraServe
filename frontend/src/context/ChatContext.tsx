import { createContext, useCallback, useContext, useMemo, useReducer, useState } from "react";
import type { ReactNode } from "react";
import { useCart } from "./CartContext";
import { useMenuItems } from "../hooks/useMenu";
import { ApiError } from "../lib/apiClient";
import { streamChat } from "../lib/chatStream";
import { STORAGE_KEYS } from "../utils/storageKeys";
import type { ChatCartLineDto } from "../types/api";
import type { CartEntry, ChatMessage } from "../types/domain";

interface ChatState {
  messages: ChatMessage[];
  typing: boolean;
  activity: string | null;
}

interface ChatContextValue extends ChatState {
  speechEnabled: boolean;
  toggleSpeech: () => void;
  sendMessage: (text: string, audioBlob?: Blob | null, imageFile?: File | null) => Promise<void>;
}

type ChatAction =
  | { type: "ADD_USER"; payload: ChatMessage }
  | { type: "UPDATE_TEXT"; payload: { id: string; text: string } }
  | { type: "UPSERT_BOT"; payload: ChatMessage }
  | { type: "SET_ACTIVITY"; payload: string | null }
  | { type: "END_TURN" };

const ChatContext = createContext<ChatContextValue | null>(null);

const TOOL_LABELS: Record<string, string> = {
  search_menu: "Checking the menu",
  get_item: "Checking the menu",
  get_recommendations: "Picking some options",
  add_to_cart: "Updating your cart",
  update_cart: "Updating your cart",
  place_order: "Placing your order",
  get_order_status: "Checking your order"
};

const initialState: ChatState = {
  messages: [
    {
      id: "bot-welcome",
      sender: "bot",
      text: "Namaste! I am Veera. Tell me what you are craving and I will suggest dishes, place an order, or track it.",
      createdAt: Date.now()
    }
  ],
  typing: false,
  activity: null
};

function getSessionId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS.chatSession);
    if (existing) {
      return existing;
    }
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.chatSession, generated);
    return generated;
  } catch {
    return `s-${Date.now()}`;
  }
}

function toolLabel(name: string | null): string {
  return (name && TOOL_LABELS[name]) || "Working on it";
}

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_USER":
      return { ...state, messages: [...state.messages, action.payload], typing: true, activity: null };
    case "UPDATE_TEXT":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload.id ? { ...message, text: action.payload.text } : message
        )
      };
    case "UPSERT_BOT": {
      const exists = state.messages.some((message) => message.id === action.payload.id);
      const messages = exists
        ? state.messages.map((message) =>
            message.id === action.payload.id
              ? { ...message, text: action.payload.text, streaming: action.payload.streaming }
              : message
          )
        : [...state.messages, action.payload];
      return { ...state, messages };
    }
    case "SET_ACTIVITY":
      return { ...state, activity: action.payload };
    case "END_TURN":
      return {
        ...state,
        typing: false,
        activity: null,
        messages: state.messages.map((message) =>
          message.streaming ? { ...message, streaming: false } : message
        )
      };
    default:
      return state;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const { replaceCart } = useCart();
  const { data: menuItems = [] } = useMenuItems();

  const applyCart = useCallback(
    (lines: ChatCartLineDto[]) => {
      const entries: CartEntry[] = [];
      for (const line of lines) {
        const item = menuItems.find((menuItem) => menuItem.id === line.item_id);
        if (item) {
          entries.push({ item, quantity: line.quantity });
        }
      }
      replaceCart(entries);
    },
    [menuItems, replaceCart]
  );

  const speak = useCallback(
    (text: string) => {
      if (!speechEnabled || !text || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    },
    [speechEnabled]
  );

  const sendMessage = useCallback(
    async (text: string, audioBlob: Blob | null = null, imageFile: File | null = null) => {
      const userId = `u-${Date.now()}`;
      const display = text.trim() || (audioBlob ? "Voice message" : "Image");
      dispatch({
        type: "ADD_USER",
        payload: { id: userId, sender: "user", text: display, createdAt: Date.now() }
      });

      const botId = `b-${Date.now()}`;
      let botStarted = false;
      let botText = "";

      const appendBot = (chunk: string) => {
        botText += chunk;
        botStarted = true;
        dispatch({
          type: "UPSERT_BOT",
          payload: { id: botId, sender: "bot", text: botText, createdAt: Date.now(), streaming: true }
        });
      };

      try {
        const stream = streamChat({ text, sessionId: getSessionId(), audio: audioBlob, image: imageFile });
        for await (const event of stream) {
          switch (event.type) {
            case "transcript":
              dispatch({ type: "UPDATE_TEXT", payload: { id: userId, text: event.text } });
              break;
            case "image":
              dispatch({ type: "UPDATE_TEXT", payload: { id: userId, text: `Image: ${event.description}` } });
              break;
            case "tool":
              dispatch({ type: "SET_ACTIVITY", payload: toolLabel(event.name) });
              break;
            case "token":
              appendBot(event.text);
              break;
            case "cart":
              applyCart(event.items);
              break;
            case "done":
              if (!botStarted && event.reply) {
                appendBot(event.reply);
              }
              dispatch({ type: "END_TURN" });
              speak(event.reply);
              break;
            case "error":
              dispatch({ type: "SET_ACTIVITY", payload: event.message });
              break;
            default:
              break;
          }
        }
      } catch (error) {
        appendBot(
          error instanceof ApiError
            ? error.message
            : "I could not reach the kitchen just now. Please try again."
        );
      } finally {
        if (!botStarted) {
          appendBot("Sorry, I did not catch that. Could you try again?");
        }
        dispatch({ type: "END_TURN" });
      }
    },
    [applyCart, speak]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      ...state,
      speechEnabled,
      toggleSpeech: () => setSpeechEnabled((enabled) => !enabled),
      sendMessage
    }),
    [state, speechEnabled, sendMessage]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}
