"use client";

import type { AdminRole } from "@/lib/admin-role";
import { AdminRoleProvider } from "@/lib/admin-role-context";
import { I18nProvider } from "@/lib/i18n";

export function AdminProviders({
  role,
  children,
}: {
  role: AdminRole;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <AdminRoleProvider role={role}>{children}</AdminRoleProvider>
    </I18nProvider>
  );
}
