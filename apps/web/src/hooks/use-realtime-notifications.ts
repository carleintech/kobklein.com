"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase";

/**
 * Subscribe to new Notification row inserts for the current user.
 * Calls onNew with the inserted row whenever a notification arrives.
 * Requires REPLICA IDENTITY FULL + supabase_realtime publication on Notification table.
 */
export function useRealtimeNotifications(
  localUserId: string | null,
  onNew: (row: Record<string, unknown>) => void,
) {
  useEffect(() => {
    if (!localUserId) return;

    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`notifications:${localUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${localUserId}`,
        },
        (payload) => onNew(payload.new as Record<string, unknown>),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [localUserId, onNew]);
}
