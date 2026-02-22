"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { kkGet, kkPost, kkDelete } from "@/lib/kobklein-api";
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

type DevicesResponse = { devices: Device[] };

export default function UserDevicesPage() {
  const params = useParams();
  const userId = params.id as string;

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<DevicesResponse>(`v1/admin/devices/${userId}`);
      setDevices(data?.devices || []);
    } catch (e) {
      console.error("Failed to load devices:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRevoke(deviceId: string) {
    setActionLoading(deviceId);
    try {
      await kkDelete(`v1/admin/devices/${deviceId}/revoke`);
      await load();
    } catch (e: unknown) {
      alert(`Revoke failed: ${e instanceof Error ? e.message : "unknown error"}`);
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
    } catch (e: unknown) {
      alert(
        `Revoke all failed: ${e instanceof Error ? e.message : "unknown error"}`,
      );
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/users"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/8 bg-[#080E20] text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors"
        >
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-kob-text">User Devices</h1>
          <p className="text-sm text-kob-muted font-mono">{userId}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleRevokeAll}
            disabled={actionLoading === "all"}
            className="rounded-lg bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
          >
            Revoke All
          </button>
          <button
            type="button"
            aria-label="Refresh"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#080E20] px-3 py-1.5 text-xs text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {devices.length === 0 && !loading && (
        <div className="rounded-xl border border-white/8 bg-[#080E20] p-8 text-center text-kob-muted">
          <Smartphone size={20} className="mx-auto mb-2" />
          No devices found for this user
        </div>
      )}

      {loading && devices.length === 0 && (
        <div className="flex items-center justify-center py-16 text-kob-muted">
          <RefreshCw size={20} className="animate-spin mr-2" />
          Loading devices…
        </div>
      )}

      {/* Device list */}
      {devices.length > 0 && (
        <div className="space-y-3">
          {devices.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border border-white/8 bg-[#080E20] p-4 transition-opacity ${d.revokedAt ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone size={18} className="text-kob-muted shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-kob-text">
                        {d.label || parseUA(d.userAgent)}
                      </span>
                      {d.trusted && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400">
                          <Shield size={10} /> Trusted
                        </span>
                      )}
                      {d.revokedAt && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-red-500/15 text-red-400">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-kob-muted mt-0.5">
                      IP: {d.ip} &middot; Last seen:{" "}
                      {new Date(d.lastSeenAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-kob-muted truncate max-w-100">
                      {d.userAgent}
                    </div>
                  </div>
                </div>

                {!d.revokedAt && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(d.id)}
                    disabled={actionLoading === d.id}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 shrink-0"
                  >
                    <Trash2 size={12} />
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
