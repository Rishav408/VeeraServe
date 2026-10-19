import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "../context/CartContext";
import { UIProvider, useUI } from "../context/UIContext";
import { ApiError, apiPost } from "../lib/apiClient";
import { STORAGE_KEYS } from "../utils/storageKeys";
import type { MenuItem } from "../types/domain";
import CheckoutScreen from "./CheckoutScreen";

vi.mock("../lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/apiClient")>();
  return { ...actual, apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn() };
});

const apiPostMock = vi.mocked(apiPost);

const CHAI: MenuItem = {
  id: "masala-chai",
  name: "Masala Chai",
  category: "chai",
  price: 50,
  image: null,
  description: null,
  isVeg: true,
  spiceLevel: 1,
  tags: [],
  rating: 4.5,
  prepTime: "5 min",
  isAvailable: true
};

function ToastProbe() {
  const { toast } = useUI();
  return toast ? <div role="status">{toast}</div> : null;
}

function renderCheckout() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/checkout"]}>
            <ToastProbe />
            <Routes>
              <Route path="/checkout" element={<CheckoutScreen />} />
              <Route path="/track/:id" element={<div>Tracker Screen</div>} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("CheckoutScreen", () => {
  it("summarises the cart with server-aligned totals", async () => {
    localStorage.setItem(
      STORAGE_KEYS.cart,
      JSON.stringify({ items: [{ item: CHAI, quantity: 2 }] })
    );

    renderCheckout();

    expect(await screen.findByText("Masala Chai")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getAllByText("₹100")).toHaveLength(2);
    expect(screen.getByText("₹5")).toBeInTheDocument();
    expect(screen.getByText("₹105")).toBeInTheDocument();
  });

  it("submits the order, clears the cart, and navigates to tracking", async () => {
    localStorage.setItem(
      STORAGE_KEYS.cart,
      JSON.stringify({ items: [{ item: CHAI, quantity: 2 }] })
    );
    apiPostMock.mockResolvedValue({ id: 42, status: "pending" });

    renderCheckout();
    await screen.findByText("Masala Chai");

    await userEvent.click(screen.getByRole("button", { name: /confirm order/i }));

    await waitFor(() => expect(apiPostMock).toHaveBeenCalledTimes(1));
    expect(apiPostMock).toHaveBeenCalledWith("/orders", {
      table_number: null,
      payment_method: "cash",
      instructions: null,
      items: [{ menu_item_id: "masala-chai", quantity: 2 }]
    });

    expect(await screen.findByText("Tracker Screen")).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) ?? "{}");
    expect(stored.items).toHaveLength(0);
  });

  it("sends table number, payment method, and instructions", async () => {
    localStorage.setItem(
      STORAGE_KEYS.cart,
      JSON.stringify({ items: [{ item: CHAI, quantity: 1 }] })
    );
    apiPostMock.mockResolvedValue({ id: 43, status: "pending" });

    renderCheckout();
    await screen.findByText("Masala Chai");

    await userEvent.type(screen.getByPlaceholderText("Table #"), "7");
    await userEvent.click(screen.getByRole("button", { name: /upi/i }));
    await userEvent.type(
      screen.getByPlaceholderText("Extra napkins, less spicy, etc."),
      "Less spicy"
    );
    await userEvent.click(screen.getByRole("button", { name: /confirm order/i }));

    await waitFor(() => expect(apiPostMock).toHaveBeenCalledTimes(1));
    expect(apiPostMock).toHaveBeenCalledWith("/orders", {
      table_number: 7,
      payment_method: "upi",
      instructions: "Less spicy",
      items: [{ menu_item_id: "masala-chai", quantity: 1 }]
    });
  });

  it("blocks an empty cart with a toast", async () => {
    renderCheckout();
    await userEvent.click(screen.getByRole("button", { name: /confirm order/i }));

    expect(await screen.findByRole("status")).toHaveTextContent("Cart is empty.");
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("surfaces API errors to the diner", async () => {
    localStorage.setItem(
      STORAGE_KEYS.cart,
      JSON.stringify({ items: [{ item: CHAI, quantity: 1 }] })
    );
    apiPostMock.mockRejectedValue(new ApiError(400, "Table number is required"));

    renderCheckout();
    await screen.findByText("Masala Chai");
    await userEvent.click(screen.getByRole("button", { name: /confirm order/i }));

    expect(await screen.findByRole("status")).toHaveTextContent("Table number is required");
    expect(screen.queryByText("Tracker Screen")).not.toBeInTheDocument();
  });
});
