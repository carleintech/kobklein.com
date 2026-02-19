#!/usr/bin/env node
/**
 * KobKlein Admin — Auth0 Branding Script
 *
 * Pushes the "Sovereign Luxury" theme to Auth0 Universal Login via the
 * Management API so the admin login page matches the KobKlein brand.
 *
 * Usage:
 *   node scripts/auth0-branding.mjs
 *
 * Required env vars (reads from .env.local automatically):
 *   AUTH0_DOMAIN              – e.g. carleintech.us.auth0.com
 *   AUTH0_M2M_CLIENT_ID       – Machine-to-Machine app client id
 *   AUTH0_M2M_CLIENT_SECRET   – Machine-to-Machine app client secret
 *
 * NOTE: The client used must have Machine-to-Machine access to the
 * Auth0 Management API with at least these scopes:
 *   read:branding, update:branding, read:custom_domains
 *
 * If your current SPA client doesn't have M2M access, create a new
 * Machine-to-Machine application in Auth0 Dashboard → Applications,
 * authorize it for the "Auth0 Management API", and grant the scopes above.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Load .env.local ──────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn("⚠  Could not read .env.local — relying on environment vars");
}

const DOMAIN = process.env.AUTH0_DOMAIN;
const CLIENT_ID = process.env.AUTH0_M2M_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTH0_M2M_CLIENT_SECRET;

if (!DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing AUTH0_DOMAIN, AUTH0_M2M_CLIENT_ID, or AUTH0_M2M_CLIENT_SECRET");
  console.error("   Add these to apps/admin/.env.local");
  process.exit(1);
}

// ── Colours (Sovereign Luxury palette) ───────────────────────────
const COLORS = {
  black: "#080B14",
  navy: "#0F1626",
  panel: "#151B2E",
  gold: "#C6A756",
  goldLight: "#E1C97A",
  goldDark: "#9F7F2C",
  teal: "#0E8B78",
  text: "#F2F2F2",
  body: "#C4C7CF",
  muted: "#7A8394",
};

// ── 1. Get Management API token ──────────────────────────────────
async function getToken() {
  const res = await fetch(`https://${DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      audience: `https://${DOMAIN}/api/v2/`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Failed to get Management API token (${res.status}).\n` +
      `Response: ${err}\n\n` +
      `💡 Make sure your Auth0 application is a Machine-to-Machine app\n` +
      `   authorized for the "Auth0 Management API" with scopes:\n` +
      `   read:branding, update:branding\n\n` +
      `   If you're using a SPA/Regular Web App, create a new M2M app:\n` +
      `   Auth0 Dashboard → Applications → Create Application → Machine to Machine\n` +
      `   Then authorize it for the Management API and update .env.local.`
    );
  }

  const data = await res.json();
  return data.access_token;
}

// ── 2. Update branding settings ──────────────────────────────────
async function updateBranding(token) {
  console.log("🎨 Updating branding colours…");
  const res = await fetch(`https://${DOMAIN}/api/v2/branding`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      colors: {
        primary: COLORS.gold,
        page_background: {
          type: "linear-gradient",
          start: COLORS.black,
          end: COLORS.navy,
          angle_deg: 160,
        },
      },
      font: {
        url: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`⚠  Branding update failed (${res.status}): ${err}`);
  } else {
    console.log("   ✅ Branding colours updated");
  }
}

// ── 3. Set custom Universal Login template ───────────────────────
async function setLoginTemplate(token) {
  console.log("📄 Setting custom Universal Login template…");

  // NOTE: Replace LOGO_URL below with your production logo URL once deployed.
  // For now we use a data-uri fallback or the web-public domain.
  const LOGO_URL = "https://kobklein.com/logo.png"; // Update with actual CDN/production URL

  const template = `<!DOCTYPE html>
<html lang="en">
<head>
  {%- auth0:head -%}
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: linear-gradient(160deg, ${COLORS.black} 0%, ${COLORS.navy} 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${COLORS.body};
      overflow-x: hidden;
    }

    /* Radial glow behind form */
    body::before {
      content: '';
      position: fixed;
      top: 50%; left: 50%;
      width: 800px; height: 800px;
      transform: translate(-50%, -50%);
      background: radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .login-wrapper {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 440px;
      padding: 24px;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .brand-header img {
      height: 56px;
      margin-bottom: 20px;
      filter: drop-shadow(0 2px 12px rgba(201,168,76,0.3));
    }

    .brand-header h1 {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: ${COLORS.text};
      letter-spacing: -0.02em;
    }

    .brand-header p {
      margin-top: 6px;
      font-size: 13px;
      color: ${COLORS.muted};
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .gold-line {
      width: 60px;
      height: 2px;
      margin: 16px auto 0;
      background: linear-gradient(90deg, transparent, ${COLORS.gold}, transparent);
      border-radius: 2px;
    }

    /* Auth0 widget overrides */
    #auth0-login-container .auth0-lock.auth0-lock {
      font-family: 'Inter', sans-serif !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-header {
      display: none !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-widget {
      background: ${COLORS.panel} !important;
      border: 1px solid rgba(201,168,76,0.12) !important;
      border-radius: 16px !important;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset !important;
      overflow: hidden !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-center {
      background: transparent !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-content {
      background: transparent !important;
      padding: 24px 28px !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-form {
      padding: 0 !important;
    }

    /* Input fields */
    #auth0-login-container .auth0-lock .auth0-lock-input-wrap {
      background: ${COLORS.black} !important;
      border: 1px solid rgba(255,255,255,0.06) !important;
      border-radius: 10px !important;
      transition: border-color 0.2s;
    }

    #auth0-login-container .auth0-lock .auth0-lock-input-wrap:focus-within {
      border-color: rgba(201,168,76,0.4) !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-input {
      color: ${COLORS.text} !important;
      font-family: 'Inter', sans-serif !important;
      font-size: 14px !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-input::placeholder {
      color: ${COLORS.muted} !important;
    }

    /* Submit button → gold */
    #auth0-login-container .auth0-lock .auth0-lock-submit {
      background: ${COLORS.gold} !important;
      border-radius: 10px !important;
      height: 46px !important;
      font-family: 'Inter', sans-serif !important;
      font-weight: 600 !important;
      transition: background 0.2s, box-shadow 0.2s !important;
      box-shadow: 0 4px 20px rgba(201,168,76,0.25) !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-submit:hover {
      background: ${COLORS.goldLight} !important;
      box-shadow: 0 4px 24px rgba(201,168,76,0.35) !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-submit .auth0-label-submit {
      color: ${COLORS.black} !important;
      font-size: 14px !important;
    }

    /* Social buttons */
    #auth0-login-container .auth0-lock .auth0-lock-social-button {
      border-radius: 10px !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
      background: ${COLORS.black} !important;
      transition: border-color 0.2s !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-social-button:hover {
      border-color: rgba(201,168,76,0.3) !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-social-button-text {
      color: ${COLORS.body} !important;
      font-family: 'Inter', sans-serif !important;
    }

    /* Links → teal */
    #auth0-login-container .auth0-lock a {
      color: ${COLORS.teal} !important;
    }

    /* Separator */
    #auth0-login-container .auth0-lock .auth0-lock-separator {
      color: ${COLORS.muted} !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-separator::before,
    #auth0-login-container .auth0-lock .auth0-lock-separator::after {
      border-color: rgba(255,255,255,0.06) !important;
    }

    /* Footer */
    .brand-footer {
      text-align: center;
      margin-top: 28px;
      font-size: 11px;
      color: ${COLORS.muted};
      letter-spacing: 0.03em;
    }

    .brand-footer span {
      color: ${COLORS.gold};
      font-weight: 500;
    }

    /* Tabs */
    #auth0-login-container .auth0-lock .auth0-lock-tabs-container {
      background: transparent !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-tabs li a {
      color: ${COLORS.muted} !important;
      font-family: 'Inter', sans-serif !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-tabs li.auth0-lock-tabs-current a {
      color: ${COLORS.gold} !important;
    }

    #auth0-login-container .auth0-lock .auth0-lock-tabs li.auth0-lock-tabs-current {
      border-bottom-color: ${COLORS.gold} !important;
    }

    /* Error messages */
    #auth0-login-container .auth0-lock .auth0-global-message {
      background: rgba(239,68,68,0.15) !important;
      color: #fca5a5 !important;
      border-radius: 8px !important;
    }

    /* Hide dev keys badge (handled via proper Google OAuth setup) */
    .auth0-lock-badge-bottom {
      opacity: 0.3 !important;
    }
  </style>
</head>
<body>
  <div class="login-wrapper">
    <div class="brand-header">
      <img src="${LOGO_URL}" alt="KobKlein" onerror="this.style.display='none'" />
      <h1>KobKlein Admin</h1>
      <p>Operations Command Center</p>
      <div class="gold-line"></div>
    </div>

    <div id="auth0-login-container">
      {%- auth0:widget -%}
    </div>

    <div class="brand-footer">
      Secured by <span>KobKlein</span> &mdash; Sovereign Finance
    </div>
  </div>
</body>
</html>`;

  const res = await fetch(`https://${DOMAIN}/api/v2/branding/templates/universal-login`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ template }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`⚠  Template update failed (${res.status}): ${err}`);

    if (res.status === 402 || res.status === 403) {
      console.error(
        "\n💡 Custom Universal Login HTML templates require a paid Auth0 plan.\n" +
        "   The branding colors & logo were still set via the Branding API,\n" +
        "   so the login page will use Auth0's built-in layout with your\n" +
        "   KobKlein dark navy background + gold accent colours.\n\n" +
        "   To get full HTML template control, upgrade to Auth0 Essentials plan.\n" +
        "   Meanwhile, you can further customize via:\n" +
        "   Auth0 Dashboard → Branding → Universal Login → Advanced Options"
      );
    }
  } else {
    console.log("   ✅ Custom Universal Login template set");
  }
}

// ── 4. Update Universal Login page settings (New UL) ─────────────
async function updateUniversalLoginSettings(token) {
  console.log("⚙️  Updating Universal Login page settings…");

  // Try the "New Universal Login Experience" branding endpoint
  const res = await fetch(`https://${DOMAIN}/api/v2/branding`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      logo_url: "https://kobklein.com/logo.png", // Update with actual production URL
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`⚠  Logo URL update failed (${res.status}): ${err}`);
  } else {
    console.log("   ✅ Logo URL set");
  }
}

// ── 5. Customize login screen text ───────────────────────────────
async function setLoginText(token) {
  console.log("📝 Setting login screen text…");

  const res = await fetch(`https://${DOMAIN}/api/v2/prompts/login/custom-text/en`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login: {
        title: "KobKlein Admin",
        description: "Operations Command Center",
        buttonText: "Sign In",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`⚠  Login text update failed (${res.status}): ${err}`);
  } else {
    console.log("   ✅ Login screen text customized");
  }
}

// ── 6. Set login page widget style ───────────────────────────────
async function setWidgetStyle(token) {
  console.log("🎯 Setting widget rendering style…");

  // Set New Universal Login rendering mode and widget style
  const res = await fetch(`https://${DOMAIN}/api/v2/prompts`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      universal_login_experience: "new",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`⚠  Widget style update failed (${res.status}): ${err}`);
  } else {
    console.log("   ✅ Universal Login set to New Experience");
  }
}

// ── Run ──────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   KobKlein Admin — Auth0 Branding Configuration    ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\nDomain: ${DOMAIN}`);
  console.log(`Client: ${CLIENT_ID.slice(0, 8)}…\n`);

  try {
    const token = await getToken();
    console.log("🔑 Management API token acquired\n");

    await updateBranding(token);
    await updateUniversalLoginSettings(token);
    await setWidgetStyle(token);
    await setLoginText(token);
    await setLoginTemplate(token);

    console.log("\n──────────────────────────────────────────────────────");
    console.log("✅ Auth0 branding configuration complete!");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Visit your admin login page to verify the changes");
    console.log("  2. Update LOGO_URL in this script once you have a");
    console.log("     production-accessible logo URL (HTTPS required)");
    console.log("");
    console.log("⚠  Dev Keys Alert Fix:");
    console.log("  The red 'Dev Keys' badge means Google social login");
    console.log("  is using Auth0's built-in dev keys. To fix:");
    console.log("    1. Go to Auth0 Dashboard → Authentication → Social");
    console.log("    2. Click 'Google / Gmail'");
    console.log("    3. Replace with your own Google OAuth credentials:");
    console.log("       - Google Cloud Console → APIs & Services → Credentials");
    console.log("       - Create OAuth 2.0 Client ID");
    console.log(`       - Redirect URI: https://${DOMAIN}/login/callback`);
    console.log("       - Copy Client ID & Secret into Auth0");
    console.log("──────────────────────────────────────────────────────");
  } catch (err) {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}

main();
