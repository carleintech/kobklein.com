"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase";

/**
 * Subscribe to live Wallet row updates for the current user.
 * Calls onUpdate with the new wallet row whenever balance changes.
 * Requires REPLICA IDENTITY FULL + supabase_realtime publication on Wallet table.
 */
export function useRealtimeWallet(
  localUserId: string | null,
  onUpdate: (row: Record<string, unknown>) => void,
) {
  useEffect(() => {
    if (!localUserId) return;

    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`wallet:${localUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Wallet",
          filter: `userId=eq.${localUserId}`,
        },
        (payload) => onUpdate(payload.new as Record<string, unknown>),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [localUserId, onUpdate]);
}
