import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AppDataProvider } from "./AppDataContext";
import { CartProvider } from "./CartContext";
import { UIProvider } from "./UIContext";
import { ChatProvider } from "./ChatContext";
import { queryClient } from "../lib/queryClient";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppDataProvider>
        <CartProvider>
          <UIProvider>
            <ChatProvider>{children}</ChatProvider>
          </UIProvider>
        </CartProvider>
      </AppDataProvider>
    </QueryClientProvider>
  );
}
