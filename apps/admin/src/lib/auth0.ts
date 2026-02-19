import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email",
  },

  // Auth0 SDK v4 strips custom claims from ID token by default.
  // This hook preserves them (including https://kobklein.com/role)
  // so they appear in session.user for middleware RBAC checks.
  async beforeSessionSaved(session) {
    return session;
  },
});
