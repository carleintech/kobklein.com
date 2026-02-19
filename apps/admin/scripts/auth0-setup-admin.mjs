#!/usr/bin/env node
/**
 * KobKlein Admin — Auth0 Admin Role Setup
 *
 * Creates the "admin" role, a Post-Login Action that injects the
 * `https://kobklein.com/role` custom claim, deploys it to the login
 * flow, and assigns the admin role to the first user found.
 *
 * Usage:
 *   node scripts/auth0-setup-admin.mjs [optional-email]
 *
 * Required env vars (reads from .env.local):
 *   AUTH0_DOMAIN              – e.g. carleintech.us.auth0.com
 *   AUTH0_M2M_CLIENT_ID       – Machine-to-Machine app client id
 *   AUTH0_M2M_CLIENT_SECRET   – Machine-to-Machine app client secret
 *
 * Required M2M API Scopes (Auth0 Management API):
 *   read:roles, create:roles, read:users, update:users,
 *   read:role_members, create:role_members,
 *   read:actions, create:actions, update:actions, delete:actions,
 *   read:triggers, update:triggers
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
const TARGET_EMAIL = process.argv[2] || null; // optional: specific user email

if (!DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing AUTH0_DOMAIN, AUTH0_M2M_CLIENT_ID, or AUTH0_M2M_CLIENT_SECRET");
  process.exit(1);
}

const API = `https://${DOMAIN}/api/v2`;

// ── Helper: fetch with auth ──────────────────────────────────────
async function api(path, opts = {}) {
  const { method = "GET", body, token } = opts;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    // Check for missing scopes
    if (res.status === 403 && typeof data === "object" && data.message) {
      if (data.message.includes("insufficient_scope")) {
        console.error(`\n❌ Missing M2M API scopes for: ${method} ${path}`);
        console.error(`   Go to Auth0 Dashboard → Applications → M2M App → APIs`);
        console.error(`   → Auth0 Management API → Permissions`);
        console.error(`   Grant ALL required scopes listed in the script header.\n`);
      }
    }
    return { ok: false, status: res.status, data };
  }
  return { ok: true, status: res.status, data };
}

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
    throw new Error(`Failed to get token (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── 2. Create "admin" role ───────────────────────────────────────
async function ensureAdminRole(token) {
  console.log("👑 Ensuring 'admin' role exists…");

  // Check if role already exists
  const listRes = await api("/roles", { token });
  if (listRes.ok) {
    const existing = listRes.data.find((r) => r.name === "admin");
    if (existing) {
      console.log(`   ✅ Role 'admin' already exists (id: ${existing.id})`);
      return existing.id;
    }
  }

  // Create role
  const createRes = await api("/roles", {
    method: "POST",
    token,
    body: {
      name: "admin",
      description: "KobKlein Admin — full access to the Operations Command Center",
    },
  });

  if (!createRes.ok) {
    console.error(`   ❌ Failed to create role (${createRes.status}):`, createRes.data);
    return null;
  }

  console.log(`   ✅ Role 'admin' created (id: ${createRes.data.id})`);
  return createRes.data.id;
}

// ── 3. Find user & assign role ───────────────────────────────────
async function assignRoleToUser(token, roleId) {
  console.log("👤 Finding user to assign admin role…");

  let userId, userEmail;

  if (TARGET_EMAIL) {
    // Search by specific email
    const res = await api(`/users-by-email?email=${encodeURIComponent(TARGET_EMAIL)}`, { token });
    if (!res.ok || !res.data.length) {
      console.error(`   ❌ No user found with email: ${TARGET_EMAIL}`);
      return false;
    }
    userId = res.data[0].user_id;
    userEmail = res.data[0].email;
  } else {
    // Get the first user in the tenant
    const res = await api("/users?per_page=10&sort=created_at:-1", { token });
    if (!res.ok || !res.data.length) {
      console.error("   ❌ No users found in tenant");
      return false;
    }
    // Prefer the most recently created non-M2M user
    const user = res.data.find((u) => u.email) || res.data[0];
    userId = user.user_id;
    userEmail = user.email || user.user_id;
  }

  console.log(`   Found user: ${userEmail} (${userId})`);

  // Assign role
  const res = await api(`/users/${encodeURIComponent(userId)}/roles`, {
    method: "POST",
    token,
    body: { roles: [roleId] },
  });

  if (!res.ok) {
    // 409 = already assigned
    if (res.status === 409) {
      console.log("   ✅ User already has 'admin' role");
      return true;
    }
    console.error(`   ❌ Failed to assign role (${res.status}):`, res.data);
    return false;
  }

  console.log(`   ✅ Assigned 'admin' role to ${userEmail}`);
  return true;
}

// ── 4. Create Post-Login Action ──────────────────────────────────
async function ensurePostLoginAction(token) {
  console.log("⚡ Setting up Post-Login Action…");

  const ACTION_NAME = "KobKlein — Add Role to Token";

  const actionCode = `
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://kobklein.com';

  if (event.authorization && event.authorization.roles && event.authorization.roles.length > 0) {
    // Set the first role as the primary role claim
    const primaryRole = event.authorization.roles[0];
    api.idToken.setCustomClaim(namespace + '/role', primaryRole);
    api.accessToken.setCustomClaim(namespace + '/role', primaryRole);

    // Also set all roles array for flexibility
    api.idToken.setCustomClaim(namespace + '/roles', event.authorization.roles);
    api.accessToken.setCustomClaim(namespace + '/roles', event.authorization.roles);
  }
};
`.trim();

  // Check if action already exists
  const listRes = await api("/actions/actions?actionName=" + encodeURIComponent(ACTION_NAME), { token });

  let actionId;

  if (listRes.ok && listRes.data.actions && listRes.data.actions.length > 0) {
    const existing = listRes.data.actions[0];
    actionId = existing.id;
    console.log(`   Found existing action: ${actionId}`);

    // Update it with latest code
    const updateRes = await api(`/actions/actions/${actionId}`, {
      method: "PATCH",
      token,
      body: {
        code: actionCode,
        runtime: "node18",
      },
    });

    if (updateRes.ok) {
      console.log("   ✅ Action code updated");
    } else {
      console.error(`   ⚠  Failed to update action (${updateRes.status}):`, updateRes.data);
    }
  } else {
    // Create new action
    const createRes = await api("/actions/actions", {
      method: "POST",
      token,
      body: {
        name: ACTION_NAME,
        supported_triggers: [{ id: "post-login", version: "v3" }],
        code: actionCode,
        runtime: "node18",
      },
    });

    if (!createRes.ok) {
      console.error(`   ❌ Failed to create action (${createRes.status}):`, createRes.data);
      return null;
    }

    actionId = createRes.data.id;
    console.log(`   ✅ Action created (id: ${actionId})`);
  }

  // Deploy the action
  console.log("   Deploying action…");
  const deployRes = await api(`/actions/actions/${actionId}/deploy`, {
    method: "POST",
    token,
    body: {},
  });

  if (!deployRes.ok) {
    console.error(`   ⚠  Deploy failed (${deployRes.status}):`, deployRes.data);
  } else {
    console.log("   ✅ Action deployed");
  }

  return actionId;
}

// ── 5. Attach action to Login flow ───────────────────────────────
async function attachToLoginFlow(token, actionId) {
  console.log("🔗 Attaching action to Login flow…");

  // Get current login flow bindings
  const flowRes = await api("/actions/triggers/post-login/bindings", { token });

  if (!flowRes.ok) {
    console.error(`   ❌ Failed to read login flow (${flowRes.status}):`, flowRes.data);
    return false;
  }

  const currentBindings = flowRes.data.bindings || [];

  // Check if already attached
  const alreadyAttached = currentBindings.some(
    (b) => b.action && b.action.id === actionId
  );

  if (alreadyAttached) {
    console.log("   ✅ Action already attached to Login flow");
    return true;
  }

  // Build new bindings array — keep existing + add ours
  const newBindings = [
    ...currentBindings.map((b) => ({
      ref: { type: "binding_id", value: b.id },
    })),
    {
      ref: { type: "action_id", value: actionId },
    },
  ];

  const updateRes = await api("/actions/triggers/post-login/bindings", {
    method: "PATCH",
    token,
    body: { bindings: newBindings },
  });

  if (!updateRes.ok) {
    console.error(`   ❌ Failed to attach action (${updateRes.status}):`, updateRes.data);
    return false;
  }

  console.log("   ✅ Action attached to Login flow");
  return true;
}

// ── Run ──────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   KobKlein Admin — Auth0 Admin Role Setup          ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\nDomain: ${DOMAIN}`);
  console.log(`M2M Client: ${CLIENT_ID.slice(0, 8)}…`);
  if (TARGET_EMAIL) console.log(`Target user: ${TARGET_EMAIL}`);
  console.log("");

  try {
    const token = await getToken();
    console.log("🔑 Management API token acquired\n");

    // Step 1: Create admin role
    const roleId = await ensureAdminRole(token);
    if (!roleId) {
      console.error("\n❌ Cannot proceed without admin role.");
      process.exit(1);
    }
    console.log("");

    // Step 2: Assign role to user
    const assigned = await assignRoleToUser(token, roleId);
    console.log("");

    // Step 3: Create Post-Login Action
    const actionId = await ensurePostLoginAction(token);
    console.log("");

    // Step 4: Attach to Login flow
    if (actionId) {
      await attachToLoginFlow(token, actionId);
    }

    console.log("\n──────────────────────────────────────────────────────");
    console.log("✅ Auth0 admin setup complete!");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Go to http://localhost:3002/auth/logout");
    console.log("  2. Login again at http://localhost:3002");
    console.log("  3. You should now see the admin dashboard!");
    console.log("");
    if (!assigned) {
      console.log("⚠  Could not auto-assign admin role to a user.");
      console.log("   Manually assign in Auth0 Dashboard → User Management → Users");
      console.log("   → Select user → Roles → Assign Role → 'admin'");
    }
    console.log("──────────────────────────────────────────────────────");
  } catch (err) {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}

main();
