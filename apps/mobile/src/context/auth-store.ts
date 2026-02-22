/**
 * Auth Store — Zustand
 *
 * Manages session via Supabase onAuthStateChange.
 * The Supabase access_token is stored in SecureStore and injected
 * as a Bearer token by the API client for all requests.
 */
import { create } from "zustand";
import { clearToken, kkGet, setToken } from "@/lib/api";
import {
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUp,
} from "@/lib/auth";
import { syncPushToken } from "@/lib/push";
import { supabase } from "@/lib/supabase";

export type UserRole = "user" | "diaspora" | "merchant" | "distributor" | "admin";

export interface UserProfile {
  id: string;
  kId: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  handle: string | null;
  email: string | null;
  role: UserRole;
  kycTier: number;
  kycStatus: string;
  isFrozen: boolean;
  preferredLang: string;
  profilePhotoUrl: string | null;
  onboardingComplete: boolean;
  createdAt: string | null;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

async function loadProfile(): Promise<UserProfile> {
  return kkGet<UserProfile>("/v1/users/me");
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  /**
   * Call once on app startup (root layout useEffect).
   * Subscribes to Supabase auth state — INITIAL_SESSION fires immediately
   * with the persisted session (or null) so no separate getSession() needed.
   */
  initialize: () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Keep SecureStore token in sync with Supabase session
      if (session?.access_token) {
        await setToken(session.access_token);
      } else {
        await clearToken();
      }

      if (event === "INITIAL_SESSION") {
        if (session) {
          try {
            const user = await loadProfile();
            set({ user, isAuthenticated: true, isLoading: false });
            syncPushToken().catch(() => {});
          } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else if (event === "SIGNED_IN") {
        try {
          const user = await loadProfile();
          set({ user, isAuthenticated: true, isLoading: false });
          syncPushToken().catch(() => {});
        } catch {
          set({ isLoading: false });
        }
      } else if (event === "SIGNED_OUT") {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
      // TOKEN_REFRESHED: token updated in SecureStore above — no profile reload needed
    });
  },

  login: async (email, password) => {
    await signInWithPassword(email, password);
    // onAuthStateChange(SIGNED_IN) handles profile loading and state
  },

  loginWithGoogle: async () => {
    await signInWithGoogle();
    // onAuthStateChange(SIGNED_IN) handles the rest
  },

  register: async (email, password, firstName, lastName) => {
    return signUp(email, password, firstName, lastName);
  },

  logout: async () => {
    await signOut();
    // onAuthStateChange(SIGNED_OUT) clears state
  },

  refreshProfile: async () => {
    try {
      const user = await loadProfile();
      set({ user });
    } catch {
      // Silent fail
    }
  },
}));
