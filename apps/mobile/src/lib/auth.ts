/**
 * Auth0 Authentication for KobKlein Mobile
 *
 * Uses expo-auth-session for PKCE flow + expo-secure-store for tokens.
 */
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { setToken, clearToken } from "./api";

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? "";
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? "";
const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? "";
const REFRESH_TOKEN_KEY = "kobklein_refresh_token";

const redirectUri = AuthSession.makeRedirectUri({ scheme: "kobklein" });

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
};

/* ------------------------------------------------------------------ */
/*  Login                                                              */
/* ------------------------------------------------------------------ */

export async function login(): Promise<string | null> {
  const request = new AuthSession.AuthRequest({
    clientId: AUTH0_CLIENT_ID,
    redirectUri,
    scopes: ["openid", "profile", "email", "offline_access"],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      audience: AUTH0_AUDIENCE,
    },
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== "success" || !result.params.code) {
    return null;
  }

  // Exchange code for tokens
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: AUTH0_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? "",
      },
    },
    discovery,
  );

  if (tokenResponse.accessToken) {
    await setToken(tokenResponse.accessToken);
  }

  if (tokenResponse.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokenResponse.refreshToken);
  }

  return tokenResponse.accessToken ?? null;
}

/* ------------------------------------------------------------------ */
/*  Token refresh                                                      */
/* ------------------------------------------------------------------ */

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const tokenResponse = await AuthSession.refreshAsync(
      {
        clientId: AUTH0_CLIENT_ID,
        refreshToken,
      },
      discovery,
    );

    if (tokenResponse.accessToken) {
      await setToken(tokenResponse.accessToken);
    }

    if (tokenResponse.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokenResponse.refreshToken);
    }

    return tokenResponse.accessToken ?? null;
  } catch {
    // Refresh failed — force re-login
    await logout();
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Logout                                                             */
/* ------------------------------------------------------------------ */

export async function logout(): Promise<void> {
  await clearToken();
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

  // Clear Auth0 session
  try {
    await WebBrowser.openAuthSessionAsync(
      `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${redirectUri}`,
      redirectUri,
    );
  } catch {
    // Silent fail — token already cleared
  }
}
