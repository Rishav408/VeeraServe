import { AppDataProvider } from "./AppDataContext";
import { CartProvider } from "./CartContext";
import { UIProvider } from "./UIContext";
import { ChatProvider } from "./ChatContext";

export function AppProviders({ children }) {
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
