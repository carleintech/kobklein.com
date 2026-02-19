"use client";

import { WalletProvider } from "@/context/wallet-context";
import { ToastProvider } from "@kobklein/ui";
import { I18nProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <WalletProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </WalletProvider>
    </I18nProvider>
  );
}
