"use client";

import { useEffect, useState } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldX,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

type Distributor = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  status: "active" | "suspended" | "pending" | "onboarding";
  floatBalance: number;
  commissionRate: number;
  joinedAt: string;
};

type DistributorStats = {
  total: number;
  active: number;
  suspended: number;
  pending: number;
};

/* ── Helpers ───────────────────────────────────────────────── */

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusStyles: Record<string, string> = {
  active: "bg-[#1F6F4A]/20 text-emerald-400 border-emerald-700",
  suspended: "bg-red-900/20 text-red-400 border-red-700",
  pending: "bg-yellow-900/20 text-yellow-400 border-yellow-700",
  onboarding: "bg-blue-900/20 text-blue-400 border-blue-700",
};

/* ── Page ──────────────────────────────────────────────────── */

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [stats, setStats] = useState<DistributorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  /* Onboard form */
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    commissionRate: "",
    initialFloat: "",
  });

  /* ── Data fetching ────────────────────────────────────────── */

  async function fetchAll() {
    setLoading(true);
    try {
      const [distData, statsData] = await Promise.all([
        kkGet<any>("v1/admin/distributors"),
        kkGet<any>("v1/admin/distributors/stats"),
      ]);
      setDistributors(distData?.distributors || []);
      setStats(statsData || null);
    } catch (e: any) {
      console.error("Failed to load distributors:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  /* ── Actions ──────────────────────────────────────────────── */

  async function handleToggleStatus(dist: Distributor) {
    const endpoint =
      dist.status === "suspended"
        ? `v1/admin/distributors/${dist.id}/activate`
        : `v1/admin/distributors/${dist.id}/suspend`;
    setActionLoading(dist.id);
    setActionMessage("");
    try {
      await kkPost(endpoint);
      setActionMessage(
        dist.status === "suspended"
          ? `${dist.name} has been activated`
          : `${dist.name} has been suspended`
      );
      await fetchAll();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage("");
    try {
      await kkPost("v1/admin/distributors/onboard", {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        city: form.city,
        commissionRate: parseFloat(form.commissionRate),
        initialFloat: parseFloat(form.initialFloat),
      });
      setFormMessage("Distributor created successfully");
      setForm({ name: "", phone: "", email: "", city: "", commissionRate: "", initialFloat: "" });
      await fetchAll();
    } catch (e: any) {
      setFormMessage(`Error: ${e.message}`);
    } finally {
      setFormLoading(false);
    }
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Distributor Management</h1>
        <p className="text-sm text-muted-foreground">Onboard, monitor, and manage distributors</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#C6A756]" />
              <div>
                <p className="text-xs text-[#7A8394]">Total Distributors</p>
                <p className="text-lg font-semibold text-[#F2F2F2]">{stats?.total ?? "..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs text-[#7A8394]">Active</p>
                <p className="text-lg font-semibold text-emerald-400">{stats?.active ?? "..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <ShieldX className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-xs text-[#7A8394]">Suspended</p>
                <p className="text-lg font-semibold text-red-400">{stats?.suspended ?? "..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-xs text-[#7A8394]">Pending Onboarding</p>
                <p className="text-lg font-semibold text-yellow-400">{stats?.pending ?? "..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboard New Distributor */}
      <Card className="rounded-2xl border-[#C6A756]/30">
        <CardContent className="p-5">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 w-full text-left"
          >
            <UserPlus className="h-4 w-4 text-[#C6A756]" />
            <span className="font-medium text-[#F2F2F2]">Onboard New Distributor</span>
            {showForm ? (
              <ChevronUp className="h-4 w-4 text-[#7A8394] ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#7A8394] ml-auto" />
            )}
          </button>

          {showForm && (
            <form onSubmit={handleOnboard} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#7A8394] mb-1 block">Full Name *</label>
                  <Input
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#7A8394] mb-1 block">Phone *</label>
                  <Input
                    placeholder="+509 ..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#7A8394] mb-1 block">Email</label>
                  <Input
                    placeholder="email@example.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#7A8394] mb-1 block">City *</label>
                  <Input
                    placeholder="Port-au-Prince"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#7A8394] mb-1 block">Commission Rate (%) *</label>
                  <Input
                    placeholder="2.5"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.commissionRate}
                    onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#7A8394] mb-1 block">Initial Float (USD) *</label>
                  <Input
                    placeholder="5000.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.initialFloat}
                    onChange={(e) => setForm({ ...form, initialFloat: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-[#C6A756] hover:bg-[#E1C97A] text-[#080B14] font-semibold gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {formLoading ? "Creating..." : "Create Distributor"}
                </Button>
                {formMessage && (
                  <p className={`text-sm ${formMessage.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
                    {formMessage}
                  </p>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Action Feedback */}
      {actionMessage && (
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <p className={`text-sm ${actionMessage.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {actionMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Distributors Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4 text-[#F2F2F2]">All Distributors</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-[#7A8394] py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading distributors...
            </div>
          ) : distributors.length === 0 ? (
            <p className="text-sm text-[#7A8394] text-center py-8">No distributors found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#151B2E] text-[#7A8394] text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Phone</th>
                    <th className="text-left py-3 px-2 font-medium">City</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-right py-3 px-2 font-medium">Float Balance</th>
                    <th className="text-right py-3 px-2 font-medium">Commission</th>
                    <th className="text-left py-3 px-2 font-medium">Joined</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {distributors.map((dist) => (
                    <tr
                      key={dist.id}
                      className="border-b border-[#151B2E]/50 hover:bg-[#151B2E]/30 transition-colors"
                    >
                      <td className="py-3 px-2 font-medium text-[#F2F2F2]">{dist.name}</td>
                      <td className="py-3 px-2 text-[#C4C7CF]">{dist.phone}</td>
                      <td className="py-3 px-2 text-[#C4C7CF]">{dist.city}</td>
                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className={`capitalize ${statusStyles[dist.status] || ""}`}
                        >
                          {dist.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C4C7CF]">
                        {fmtCurrency(dist.floatBalance)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C4C7CF]">
                        {dist.commissionRate}%
                      </td>
                      <td className="py-3 px-2 text-[#7A8394]">{fmtDate(dist.joinedAt)}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          {dist.status === "suspended" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === dist.id}
                              onClick={() => handleToggleStatus(dist)}
                              className="gap-1 text-xs border-emerald-600 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              {actionLoading === dist.id ? "Activating..." : "Activate"}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === dist.id}
                              onClick={() => handleToggleStatus(dist)}
                              className="gap-1 text-xs border-red-600 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                            >
                              <ShieldX className="h-3 w-3" />
                              {actionLoading === dist.id ? "Suspending..." : "Suspend"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
