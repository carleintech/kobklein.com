"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import {
  TrendingUp,
  RefreshCw,
  DollarSign,
  ArrowRightLeft,
  History,
} from "lucide-react";

type FxRate = {
  id: string;
  mid: number;
  buy: number;
  sell: number;
  spreadBps: number;
  source: string;
  createdAt: string;
};

export default function FxPage() {
  const [rate, setRate] = useState<FxRate | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mid, setMid] = useState("");
  const [spreadBps, setSpreadBps] = useState("250");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, h, rev] = await Promise.all([
        kkGet<any>("v1/admin/fx/active"),
        kkGet<any>("v1/admin/fx/history"),
        kkGet<any>("v1/admin/fx/revenue?days=30"),
      ]);
      setRate(r?.rate || null);
      setHistory(h?.history || []);
      setRevenue(rev);
    } catch (e) {
      console.error("Failed to load FX data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSetRate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await kkPost("v1/admin/fx/set", {
        mid: Number(mid),
        spreadBps: Number(spreadBps),
        source: "admin_manual",
      });
      setMessage("FX rate updated successfully");
      setMid("");
      await load();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">FX Control</h1>
          <p className="text-sm text-muted-foreground">Manage USD/HTG exchange rates</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Current Rate */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mid Rate</span>
              <ArrowRightLeft className="h-4 w-4 text-[#C6A756]" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1 text-[#C6A756]">
              {rate?.mid?.toFixed(2) ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">USD → HTG</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Buy</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              {rate?.buy?.toFixed(2) ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">User receives</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sell</span>
              <DollarSign className="h-4 w-4 text-sky-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              {rate?.sell?.toFixed(2) ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">Platform buys</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Spread</span>
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              {rate?.spreadBps ?? "—"} bps
            </div>
            <div className="text-xs text-muted-foreground">Source: {rate?.source ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* FX Revenue (30d) */}
      {revenue && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">USD Converted (30d)</span>
              <div className="text-xl font-semibold mt-1 tabular-nums">
                ${revenue.totalUsdConverted?.toLocaleString() ?? "—"}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">HTG Delivered (30d)</span>
              <div className="text-xl font-semibold mt-1 tabular-nums">
                {revenue.totalHtgDelivered?.toLocaleString() ?? "—"} HTG
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">FX Profit (30d)</span>
              <div className="text-xl font-semibold mt-1 tabular-nums text-emerald-400">
                {revenue.totalProfitHtg?.toLocaleString() ?? "—"} HTG
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Set New Rate Form */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4">Set New FX Rate</h2>
          <form onSubmit={handleSetRate} className="flex items-end gap-3 max-w-lg">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Mid Rate (USD/HTG)</label>
              <Input
                type="number"
                step="0.01"
                required
                value={mid}
                onChange={(e) => setMid(e.target.value)}
                placeholder="e.g. 133.50"
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-muted-foreground mb-1 block">Spread (bps)</label>
              <Input
                type="number"
                step="1"
                value={spreadBps}
                onChange={(e) => setSpreadBps(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting} className="bg-[#C6A756] hover:bg-[#E1C97A] text-[#080B14] font-semibold">
              {submitting ? "Setting..." : "Set Rate"}
            </Button>
          </form>
          {message && (
            <p className={`mt-3 text-sm ${message.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rate History */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4">Rate History</h2>
          <DataTable
            columns={[
              { key: "mid", label: "Mid", render: (r: any) => r.mid?.toFixed(2) ?? "—" },
              { key: "buy", label: "Buy", render: (r: any) => r.buy?.toFixed(2) ?? "—" },
              { key: "sell", label: "Sell", render: (r: any) => r.sell?.toFixed(2) ?? "—" },
              { key: "spreadBps", label: "Spread (bps)" },
              { key: "source", label: "Source" },
              {
                key: "active",
                label: "Status",
                render: (r: any) => (
                  <Badge variant={r.active ? "default" : "outline"}>
                    {r.active ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "createdAt",
                label: "Set At",
                render: (r: any) => new Date(r.createdAt).toLocaleString(),
              },
            ]}
            rows={history}
            emptyMessage="No FX history"
          />
        </CardContent>
      </Card>
    </div>
  );
}
