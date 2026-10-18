import type { ReactNode } from "react";
import { AppDataProvider } from "./AppDataContext";
import { CartProvider } from "./CartContext";
import { UIProvider } from "./UIContext";
import { ChatProvider } from "./ChatContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppDataProvider>
      <CartProvider>
        <UIProvider>
          <ChatProvider>{children}</ChatProvider>
        </UIProvider>
      </CartProvider>
    </AppDataProvider>
  );
}
