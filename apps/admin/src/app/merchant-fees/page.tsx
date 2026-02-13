"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Store } from "lucide-react";

export default function MerchantFeesPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Form
  const [merchantId, setMerchantId] = useState("");
  const [mode, setMode] = useState("percent");
  const [percentBps, setPercentBps] = useState("250");
  const [fixedFee, setFixedFee] = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<any>("v1/admin/merchant-fees");
      setMerchants(data?.merchants || []);
    } catch (e) {
      console.error("Failed to load merchant fees:", e);
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
      await kkPost("v1/admin/merchant-fees/set", {
        merchantId,
        mode,
        percentBps: Number(percentBps),
        fixedFee: Number(fixedFee),
        currency: "HTG",
      });
      setMessage("Fee profile updated");
      setMerchantId("");
      await load();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Merchant Fee Profiles</h1>
          <p className="text-sm text-muted-foreground">Configure per-merchant payment processing fees</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Current Merchants */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4">Merchant List</h2>
          <DataTable
            columns={[
              {
                key: "name",
                label: "Merchant",
                render: (r: any) => (
                  <div>
                    <div className="font-medium">{r.businessName || r.name || "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.paymentCode || r.id?.slice(0, 8)}</div>
                  </div>
                ),
              },
              {
                key: "mode",
                label: "Fee Mode",
                render: (r: any) => (
                  <Badge variant="default">{r.feeMode || r.mode || "global"}</Badge>
                ),
              },
              {
                key: "percentBps",
                label: "Rate (bps)",
                render: (r: any) => (
                  <span className="font-mono tabular-nums">{r.feePercentBps ?? r.percentBps ?? "—"}</span>
                ),
              },
              {
                key: "fixedFee",
                label: "Fixed Fee",
                render: (r: any) => (
                  <span className="font-mono tabular-nums">{r.feeFixed ?? r.fixedFee ?? "—"}</span>
                ),
              },
            ]}
            rows={merchants}
            emptyMessage="No merchants with custom fees"
          />
        </CardContent>
      </Card>

      {/* Set Fee Form */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="font-medium mb-4 flex items-center gap-2">
            <Store className="h-4 w-4 text-[#C6A756]" />
            Set Merchant Fee Profile
          </h2>
          <form onSubmit={handleSet} className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Merchant ID</label>
              <Input required value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="User ID" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
                <option value="hybrid">Hybrid</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rate (bps)</label>
              <Input type="number" step="1" value={percentBps} onChange={(e) => setPercentBps(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fixed Fee</label>
              <Input type="number" step="0.01" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="bg-[#C6A756] hover:bg-[#E1C97A] text-[#080B14] font-semibold">
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
