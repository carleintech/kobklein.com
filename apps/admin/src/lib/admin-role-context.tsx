"use client";

import { createContext, useContext } from "react";
import type { AdminRole } from "./admin-role";

const AdminRoleContext = createContext<AdminRole>("admin");

export function AdminRoleProvider({
  role,
  children,
}: {
  role: AdminRole;
  children: React.ReactNode;
}) {
  return (
    <AdminRoleContext.Provider value={role}>
      {children}
    </AdminRoleContext.Provider>
  );
}

export function useAdminRole(): AdminRole {
  return useContext(AdminRoleContext);
}
