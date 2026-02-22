/**
 * Supabase Authentication — KobKlein Mobile
 *
 * Provides email/password and OAuth (Google/Apple) auth
 * backed by Supabase, whose JWTs are accepted by the NestJS API.
 */
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

/* ------------------------------------------------------------------ */
/*  Email + Password                                                   */
/* ------------------------------------------------------------------ */

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName, role: "user" },
    },
  });
  if (error) throw new Error(error.message);

  // If no session returned, email confirmation is required
  const needsEmailConfirmation = !data.session;
  return { needsEmailConfirmation };
}

/* ------------------------------------------------------------------ */
/*  Google OAuth                                                        */
/* ------------------------------------------------------------------ */

export async function signInWithGoogle(): Promise<void> {
  const redirectUri = makeRedirectUri({ scheme: "kobklein", path: "auth/callback" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "Google OAuth failed");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === "success" && result.url) {
    const url = new URL(result.url);
    const code = url.searchParams.get("code");
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw new Error(exchangeError.message);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Password reset                                                      */
/* ------------------------------------------------------------------ */

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const redirectUri = makeRedirectUri({ scheme: "kobklein", path: "auth/reset" });
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUri,
  });
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Sign out                                                            */
/* ------------------------------------------------------------------ */

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
