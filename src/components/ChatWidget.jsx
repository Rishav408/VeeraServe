import { ChefHat, Mic, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { useChat } from "../context/ChatContext";

const quickReplies = ["Show menu", "Recommend", "Spicy dishes", "Track order"];

export default function ChatWidget({ compact = false }) {
  const [input, setInput] = useState("");
  const { messages, typing, sendMessage } = useChat();

  const submit = (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const sendQuick = (text) => sendMessage(text);

  return (
    <section className={`card-3d overflow-hidden rounded-[20px] p-0 ${compact ? "h-[28rem]" : "h-[34rem]"}`}>
      <header className="flex items-center justify-between bg-dhaba-hero p-4 text-white">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <ChefHat size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold">Veera Bot</p>
            <p className="text-xs text-white/70">Your AI Waiter</p>
          </div>
        </div>
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
      </header>

      <div className="h-[65%] space-y-3 overflow-y-auto bg-cream p-3 scroll-smooth">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "bot" ? "justify-start" : "justify-end"}`}>
            {message.sender === "bot" ? (
              <div className="flex max-w-[80%] items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                  <ChefHat size={14} />
                </span>
                <p className="rounded-[4px_16px_16px_16px] bg-white p-3 text-sm text-ink shadow-sm">{message.text}</p>
              </div>
            ) : (
              <p className="max-w-[80%] rounded-[16px_4px_16px_16px] bg-gradient-to-r from-primary to-primary/80 p-3 text-sm text-white shadow-btn-primary">
                {message.text}
              </p>
            )}
          </div>
        ))}

        {typing && (
          <div className="inline-flex items-center gap-1 rounded-[4px_16px_16px_16px] bg-white px-3 py-2">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="h-2 w-2 rounded-full bg-primary/60"
                style={{ animation: `float 0.9s ease ${index * 0.15}s infinite` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-primary/10 bg-white px-3 py-2">
        {quickReplies.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => sendQuick(chip)}
            className="category-chip whitespace-nowrap px-3 py-1 text-xs"
          >
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="border-t border-primary/10 bg-white p-3">
        <div className="relative">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for spicy/light/veg..."
            className="w-full rounded-pill border border-primary/20 bg-cream py-3 pl-4 pr-24 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            className="absolute right-12 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-primary"
          >
            <Mic size={14} />
          </button>
          <button
            type="submit"
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white"
          >
            <SendHorizontal size={14} />
          </button>
        </div>
      </form>
    </section>
  );
}
