"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Package,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type Plan = {
  id: string;
  planKey: string;
  amountUsd: number;
  interval: string;
  labelEn: string;
  active: boolean;
};

type CatalogItem = {
  id: string;
  merchantKey: string;
  category: string;
  nameEn: string;
  active: boolean;
  plans: Plan[];
};

export default function KPayPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<any>("v1/admin/catalog");
      setItems(data?.items || []);
    } catch (e) {
      console.error("Failed to load catalog:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleItem(id: string) {
    setToggling(id);
    try {
      await kkPost(`v1/admin/catalog/item/${id}/toggle`, {});
      await load();
    } catch (e: any) {
      alert(`Toggle failed: ${e.message}`);
    } finally {
      setToggling(null);
    }
  }

  async function togglePlan(id: string) {
    setToggling(id);
    try {
      await kkPost(`v1/admin/catalog/plan/${id}/toggle`, {});
      await load();
    } catch (e: any) {
      alert(`Toggle failed: ${e.message}`);
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">K-Pay Catalog</h1>
          <p className="text-sm text-muted-foreground">Manage subscription products and plans</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Products</span>
            <div className="text-2xl font-semibold tabular-nums mt-1">{items.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</span>
            <div className="text-2xl font-semibold tabular-nums mt-1 text-emerald-400">
              {items.filter((i) => i.active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Plans</span>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              {items.reduce((s, i) => s + i.plans.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catalog Items */}
      {items.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-5 w-5 mx-auto mb-2" />
            No catalog items. Run the seed script to populate.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{item.nameEn}</span>
                    <Badge variant="outline">{item.merchantKey}</Badge>
                    <Badge variant="outline">{item.category}</Badge>
                    <Badge variant={item.active ? "default" : "destructive"}>
                      {item.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleItem(item.id)}
                    disabled={toggling === item.id}
                    className="gap-1"
                  >
                    {item.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {item.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>

                {/* Plans */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2 pr-4 text-xs uppercase tracking-wider font-medium">Plan Key</th>
                        <th className="py-2 pr-4 text-xs uppercase tracking-wider font-medium">Label</th>
                        <th className="py-2 pr-4 text-xs uppercase tracking-wider font-medium">Price</th>
                        <th className="py-2 pr-4 text-xs uppercase tracking-wider font-medium">Interval</th>
                        <th className="py-2 pr-4 text-xs uppercase tracking-wider font-medium">Status</th>
                        <th className="py-2 text-xs uppercase tracking-wider font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.plans.map((plan) => (
                        <tr key={plan.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="py-2 pr-4 font-mono text-xs">{plan.planKey}</td>
                          <td className="py-2 pr-4">{plan.labelEn}</td>
                          <td className="py-2 pr-4 font-mono tabular-nums">${Number(plan.amountUsd).toFixed(2)}</td>
                          <td className="py-2 pr-4">{plan.interval}</td>
                          <td className="py-2 pr-4">
                            <Badge variant={plan.active ? "default" : "destructive"}>
                              {plan.active ? "Active" : "Off"}
                            </Badge>
                          </td>
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePlan(plan.id)}
                              disabled={toggling === plan.id}
                              className="text-xs h-7"
                            >
                              {plan.active ? "Disable" : "Enable"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
