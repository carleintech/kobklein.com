"use client";

import { createContext, useContext, type ReactNode } from "react";

export type AuthUser = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  role?: string;
  roles?: string[];
};

type UserContextType = {
  user: AuthUser;
  /** DB cuid from the KobKlein User table (not the Supabase UUID). Use for Realtime filters. */
  localUserId?: string;
};

const UserContext = createContext<UserContextType>({
  user: { sub: "" },
});

export function UserProvider({
  user,
  localUserId,
  children,
}: {
  user: AuthUser;
  localUserId?: string;
  children: ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user, localUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
