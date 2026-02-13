/**
 * Auth Store — Zustand
 *
 * Manages user session, profile, and authentication state.
 */
import { create } from "zustand";
import { kkGet } from "@/lib/api";
import { getToken, clearToken } from "@/lib/api";
import { login as auth0Login, logout as auth0Logout, refreshAccessToken } from "@/lib/auth";
import { syncPushToken } from "@/lib/push";

export type UserRole = "user" | "diaspora" | "merchant" | "distributor" | "admin";

export interface UserProfile {
  id: string;
  auth0Id: string;
  kId: string;
  phone: string;
  name: string;
  handle: string | null;
  email: string | null;
  role: UserRole;
  kycTier: number;
  kycStatus: string;
  isFrozen: boolean;
  preferredLang: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await getToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Try to load profile with existing token
      try {
        const user = await kkGet<UserProfile>("/v1/users/me");
        set({ user, isAuthenticated: true, isLoading: false });
        // Sync push token on session restore (non-blocking)
        syncPushToken().catch(() => {});
      } catch {
        // Token might be expired — try refresh
        const newToken = await refreshAccessToken();
        if (newToken) {
          const user = await kkGet<UserProfile>("/v1/users/me");
          set({ user, isAuthenticated: true, isLoading: false });
          // Sync push token after token refresh (non-blocking)
          syncPushToken().catch(() => {});
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async () => {
    set({ isLoading: true });
    try {
      const token = await auth0Login();
      if (!token) {
        set({ isLoading: false });
        return false;
      }

      const user = await kkGet<UserProfile>("/v1/users/me");
      set({ user, isAuthenticated: true, isLoading: false });
      // Sync push token after successful login (non-blocking)
      syncPushToken().catch(() => {});
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await auth0Logout();
    set({ user: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    try {
      const user = await kkGet<UserProfile>("/v1/users/me");
      set({ user });
    } catch {
      // Silent fail
    }
  },
}));
