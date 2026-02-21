"use client";

import { useState } from "react";
import { kkPost, ApiError } from "@/lib/kobklein-api";
import { ApiUnavailableBanner } from "@/components/api-status-banner";
import { Card, CardContent } from "@kobklein/ui/card";
import { Input } from "@kobklein/ui/input";
import { Button } from "@kobklein/ui/button";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function FloatRefillPage() {
  const [id, setId]       = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]   = useState("");
  const [apiDown, setApiDown] = useState(false);

  async function refill() {
    if (!id.trim() || !amount.trim()) return;
    setLoading(true);
    setSuccess("");
    setError("");
    setApiDown(false);
    try {
      await kkPost("admin/float/refill", {
        distributorId: id.trim(),
        amount: Number(amount),
        currency: "HTG",
      });
      setSuccess(`Float of G${Number(amount).toLocaleString()} HTG added to distributor ${id.trim()}`);
      setId("");
      setAmount("");
    } catch (e: any) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
      else setError(e.message || "Failed to add float. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Distributor Float Refill</h1>
        <p className="text-sm text-muted-foreground">Add HTG float to a distributor's account</p>
      </div>

      {apiDown && <ApiUnavailableBanner />}

      <Card className="rounded-2xl max-w-md">
        <CardContent className="p-5 space-y-4">
          {success && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-400">{success}</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Distributor ID</label>
            <Input
              placeholder="User ID or K-ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount (HTG)</label>
            <Input
              placeholder="e.g. 50000"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button
            onClick={refill}
            disabled={loading || !id.trim() || !amount.trim()}
            className="w-full"
          >
            {loading ? "Adding Float…" : "Add Float"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
