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
};

const UserContext = createContext<UserContextType>({
  user: { sub: "" },
});

export function UserProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
