"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthUser = {
  sub: string;
  name?: string;
  email?: string;
  /** OAuth picture (e.g. Google avatar). May be absent for email/password users. */
  picture?: string;
  role?: string;
  roles?: string[];
  /**
   * KobKlein DB profile photo URL — loaded separately from the API on mount
   * (GET /v1/users/me → profilePhotoUrl). Preferred over `picture`.
   */
  profilePhotoUrl?: string;
};

type UserContextType = {
  user: AuthUser;
  /** DB cuid from the KobKlein User table (not the Supabase UUID). Use for Realtime filters. */
  localUserId?: string;
  /**
   * Resolved avatar URL to use everywhere: DB profilePhotoUrl → OAuth picture → undefined.
   * Updates automatically on upload without requiring a page refresh.
   */
  avatarUrl?: string;
  /** Programmatically update the avatar (e.g. after an upload). */
  setAvatarUrl: (url: string) => void;
};

const UserContext = createContext<UserContextType>({
  user: { sub: "" },
  setAvatarUrl: () => {},
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
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user.profilePhotoUrl || user.picture || undefined,
  );

  // Sync when AppShell fetches the DB profilePhotoUrl after mount
  useEffect(() => {
    if (user.profilePhotoUrl) {
      setAvatarUrl(user.profilePhotoUrl);
    }
  }, [user.profilePhotoUrl]);

  // Listen for instant updates after the profile page uploads a new photo.
  // Any component can dispatch:
  //   window.dispatchEvent(new CustomEvent("kk:profile-photo-updated", { detail: url }))
  // and the avatar will update everywhere without a page refresh.
  useEffect(() => {
    function onPhotoUpdated(e: Event) {
      const url = (e as CustomEvent<string>).detail;
      if (url) setAvatarUrl(url);
    }
    window.addEventListener("kk:profile-photo-updated", onPhotoUpdated);
    return () => window.removeEventListener("kk:profile-photo-updated", onPhotoUpdated);
  }, []);

  return (
    <UserContext.Provider value={{ user, localUserId, avatarUrl, setAvatarUrl }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
