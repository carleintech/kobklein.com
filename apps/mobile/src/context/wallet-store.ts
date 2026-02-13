/**
 * Wallet Store — Zustand
 *
 * Manages wallet balances with optimistic updates.
 * Mirrors WalletProvider from apps/web.
 */
import { create } from "zustand";
import { kkGet } from "@/lib/api";

export interface WalletBalance {
  walletId: string;
  currency: string;
  type: string; // "USER" | "MERCHANT" | "DISTRIBUTOR"
  balance: number;
}

interface WalletState {
  balances: WalletBalance[];
  loading: boolean;

  // Actions
  refresh: () => Promise<void>;
  optimisticDebit: (currency: string, amount: number) => void;
  optimisticCredit: (currency: string, amount: number) => void;
  getBalance: (currency: string) => number;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balances: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const data = await kkGet<WalletBalance[]>("/v1/wallets/balance");
      set({ balances: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  optimisticDebit: (currency, amount) => {
    set((state) => ({
      balances: state.balances.map((b) =>
        b.currency === currency ? { ...b, balance: b.balance - amount } : b,
      ),
    }));
  },

  optimisticCredit: (currency, amount) => {
    set((state) => ({
      balances: state.balances.map((b) =>
        b.currency === currency ? { ...b, balance: b.balance + amount } : b,
      ),
    }));
  },

  getBalance: (currency) => {
    const b = get().balances.find((w) => w.currency === currency);
    return b?.balance ?? 0;
  },
}));
