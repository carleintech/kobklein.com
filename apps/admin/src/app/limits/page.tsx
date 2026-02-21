"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Button } from "@kobklein/ui/button";
import { Input } from "@kobklein/ui/input";
import { DataTable } from "@/components/data-table";
import { Badge } from "@kobklein/ui/badge";
import { RefreshCw, Shield } from "lucide-react";

type LimitProfile = {
  id: string;
  role: string;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
};

export default function LimitsPage() {
  const [profiles, setProfiles] = useState<LimitProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [role, setRole] = useState("user");
  const [currency, setCurrency] = useState("HTG");
  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<any>("v1/admin/limits/profiles");
      setProfiles(data?.profiles || []);
    } catch (e) {
      console.error("Failed to load limits:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSet(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await kkPost("v1/admin/limits/profiles/set", {
        role,
        currency,
        dailyLimit: Number(dailyLimit),
        monthlyLimit: Number(monthlyLimit),
      });
      setMessage("Limit profile updated");
      setDailyLimit("");
      setMonthlyLimit("");
      await load();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  function fmtAmt(n: number) {
    return n?.toLocaleString() ?? "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Transaction Limits</h1>
          <p className="text-sm text-muted-foreground">Configure daily and monthly limits by role</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Current Profiles */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4">Current Limit Profiles</h2>
          <DataTable
            columns={[
              {
                key: "role",
                label: "Role",
                render: (r: LimitProfile) => (
                  <Badge variant="default">{r.role}</Badge>
                ),
              },
              { key: "currency", label: "Currency" },
              {
                key: "dailyLimit",
                label: "Daily Limit",
                render: (r: LimitProfile) => (
                  <span className="font-mono tabular-nums">{fmtAmt(r.dailyLimit)}</span>
                ),
              },
              {
                key: "monthlyLimit",
                label: "Monthly Limit",
                render: (r: LimitProfile) => (
                  <span className="font-mono tabular-nums">{fmtAmt(r.monthlyLimit)}</span>
                ),
              },
            ]}
            rows={profiles}
            emptyMessage="No limit profiles configured"
          />
        </CardContent>
      </Card>

      {/* Set Limit Form */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#C9A84C]" />
            Set Limit Profile
          </h2>
          <form onSubmit={handleSet} className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="client">Client</option>
                <option value="diaspora">Diaspora</option>
                <option value="merchant">Merchant</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="HTG">HTG</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Daily Limit</label>
              <Input type="number" step="1" required value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Monthly Limit</label>
              <Input type="number" step="1" required value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="bg-[#C9A84C] hover:bg-[#E2CA6E] text-[#060D1F] font-semibold">
              {submitting ? "Saving..." : "Save"}
            </Button>
          </form>
          {message && (
            <p className={`mt-3 text-sm ${message.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
