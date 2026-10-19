import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";
import { ChatProvider, useChat } from "./ChatContext";
import type { MenuItem } from "../types/domain";

const MENU_ITEM: MenuItem = {
  id: "paneer-tikka",
  name: "Paneer Tikka",
  category: "starters",
  price: 320,
  image: null,
  description: null,
  isVeg: true,
  spiceLevel: 2,
  tags: [],
  rating: 4.5,
  prepTime: "15 min",
  isAvailable: true
};

vi.mock("../hooks/useMenu", () => ({
  useMenuItems: () => ({ data: [MENU_ITEM] })
}));

vi.mock("../lib/chatStream", () => ({
  streamChat: async function* () {
    yield { type: "tool", name: "add_to_cart", ok: true };
    yield { type: "token", text: "Added " };
    yield { type: "token", text: "Paneer Tikka." };
    yield {
      type: "cart",
      items: [{ item_id: "paneer-tikka", name: "Paneer Tikka", unit_price: 320, quantity: 2 }]
    };
    yield { type: "done", reply: "Added Paneer Tikka.", pending_confirmation: false };
  }
}));

function Harness() {
  const { messages, typing, sendMessage } = useChat();
  const { items } = useCart();
  return (
    <div>
      <button type="button" onClick={() => sendMessage("add paneer tikka")}>
        send
      </button>
      <span data-testid="typing">{typing ? "typing" : "idle"}</span>
      <span data-testid="cart-state">
        {items.length}:{items[0]?.quantity ?? 0}
      </span>
      <div data-testid="transcript">
        {messages.map((message) => (
          <p key={message.id} data-testid={`msg-${message.sender}`}>
            {message.text}
          </p>
        ))}
      </div>
    </div>
  );
}

describe("ChatProvider", () => {
  it("streams tokens into a bot message and syncs the cart", async () => {
    render(
      <CartProvider>
        <ChatProvider>
          <Harness />
        </ChatProvider>
      </CartProvider>
    );

    fireEvent.click(screen.getByText("send"));

    await waitFor(() => {
      expect(screen.getByTestId("typing")).toHaveTextContent("idle");
    });

    const botMessages = screen.getAllByTestId("msg-bot");
    expect(botMessages[botMessages.length - 1]).toHaveTextContent("Added Paneer Tikka.");
    expect(screen.getByTestId("cart-state")).toHaveTextContent("1:2");
  });
});
