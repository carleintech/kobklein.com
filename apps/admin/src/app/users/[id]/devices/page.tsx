"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { kkGet, kkPost, kkDelete } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Smartphone,
  Shield,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type Device = {
  id: string;
  fingerprint: string;
  ip: string;
  userAgent: string;
  trusted: boolean;
  label: string | null;
  revokedAt: string | null;
  lastSeenAt: string;
  createdAt: string;
};

export default function UserDevicesPage() {
  const params = useParams();
  const userId = params.id as string;

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<any>(`v1/admin/devices/${userId}`);
      setDevices(data?.devices || []);
    } catch (e) {
      console.error("Failed to load devices:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function handleRevoke(deviceId: string) {
    setActionLoading(deviceId);
    try {
      await kkDelete(`v1/admin/devices/${deviceId}/revoke`);
      await load();
    } catch (e: any) {
      alert(`Revoke failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevokeAll() {
    if (!confirm("Revoke all devices for this user?")) return;
    setActionLoading("all");
    try {
      await kkPost(`v1/admin/devices/revoke-all/${userId}`, {});
      await load();
    } catch (e: any) {
      alert(`Revoke all failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  function parseUA(ua: string) {
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "Mac";
    return "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/users" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">User Devices</h1>
          <p className="text-sm text-muted-foreground">{userId}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRevokeAll}
            disabled={actionLoading === "all"}
          >
            Revoke All
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {devices.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Smartphone className="h-5 w-5 mx-auto mb-2" />
            No devices found for this user
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {devices.map((d) => (
            <Card key={d.id} className={`rounded-2xl ${d.revokedAt ? "opacity-50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {d.label || parseUA(d.userAgent)}
                        </span>
                        {d.trusted && (
                          <Badge variant="default" className="gap-1 text-xs">
                            <Shield className="h-3 w-3" /> Trusted
                          </Badge>
                        )}
                        {d.revokedAt && (
                          <Badge variant="destructive" className="text-xs">Revoked</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        IP: {d.ip} &middot; Last seen: {new Date(d.lastSeenAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[400px]">
                        {d.userAgent}
                      </div>
                    </div>
                  </div>

                  {!d.revokedAt && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRevoke(d.id)}
                      disabled={actionLoading === d.id}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
