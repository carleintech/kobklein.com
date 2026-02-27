"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export async function createAdminAccount(formData: FormData) {
  const setupCode = formData.get("setupCode") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const role = formData.get("role") as string;

  const VALID_ROLES = ["super_admin", "admin", "regional_manager", "support_agent"];
  const EXPECTED_CODE = process.env.ADMIN_SETUP_CODE;

  if (!EXPECTED_CODE || setupCode !== EXPECTED_CODE) {
    redirect("/auth/register?error=invalid_code");
  }

  if (!VALID_ROLES.includes(role)) {
    redirect("/auth/register?error=invalid_role");
  }

  if (!email || !password || password.length < 8) {
    redirect("/auth/register?error=invalid_input");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      admin_role: role,
      role,
      first_name: firstName,
      last_name: lastName,
    },
    email_confirm: true,
  });

  if (error) {
    const msg = encodeURIComponent(error.message);
    redirect(`/auth/register?error=${msg}`);
  }

  redirect("/auth/login?registered=1");
}
