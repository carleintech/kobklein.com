"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { apiGet } from "@/lib/api";

type WalletBalance = {
  walletId: string;
  currency: string;
  type: string;
  balance: number;
};

type WalletContextType = {
  balances: WalletBalance[];
  loading: boolean;
  refresh: () => Promise<void>;
  optimisticDebit: (currency: string, amount: number) => void;
  optimisticCredit: (currency: string, amount: number) => void;
};

const WalletContext = createContext<WalletContextType>({
  balances: [],
  loading: false,
  refresh: async () => {},
  optimisticDebit: () => {},
  optimisticCredit: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ balances: WalletBalance[] }>("v1/wallets/balance");
      setBalances(res.balances || []);
    } catch {
      // silent — page will handle its own error state
    } finally {
      setLoading(false);
    }
  }, []);

  const optimisticDebit = useCallback((currency: string, amount: number) => {
    setBalances((prev) =>
      prev.map((w) =>
        w.currency === currency && w.type === "USER"
          ? { ...w, balance: Math.max(0, w.balance - amount) }
          : w
      )
    );
  }, []);

  const optimisticCredit = useCallback((currency: string, amount: number) => {
    setBalances((prev) =>
      prev.map((w) =>
        w.currency === currency && w.type === "USER"
          ? { ...w, balance: w.balance + amount }
          : w
      )
    );
  }, []);

  return (
    <WalletContext.Provider
      value={{ balances, loading, refresh, optimisticDebit, optimisticCredit }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
