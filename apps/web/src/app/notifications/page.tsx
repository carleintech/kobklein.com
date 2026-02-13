"use client";

import { useEffect, useState } from "react";
import { kkGet, kkPatch } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const res = await kkGet<any[]>("notifications");
    setItems(res);
  }

  async function markRead() {
    await kkPatch("notifications/read-all");
  }

  useEffect(() => {
    load();
    markRead();
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-2xl font-semibold">Notifications</div>

      {items.map(n => (
        <Card key={n.id} className="rounded-2xl">
          <CardContent className="p-4">
            <div className="font-medium">{n.title}</div>
            <div className="text-sm text-muted-foreground">{n.body}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}