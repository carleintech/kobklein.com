import { TrendingUp, Vault, Wallet } from "lucide-react";
import { apiGet } from "@/lib/api";
import { PendingWithdrawals } from "./_pending-withdrawals";

// ── Types ─────────────────────────────────────────────────────────────────────

type TreasuryWallet = { walletId: string; currency: string; balance: number };
type TreasuryBalances = { ok: boolean; wallets: TreasuryWallet[] };
type TreasuryRevenue = {
  ok: boolean;
  periodDays: number;
  totalRevenue: number;
  breakdown: Record<string, number>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHTG(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

const SOURCE_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  merchant_fee:         { label: "Merchant Fees",        color: "text-emerald-400", bar: "#1F6F4A" },
  fx_profit:            { label: "FX Spread",             color: "text-violet-400",  bar: "#7c3aed" },
  cash_out_fee:         { label: "Cash-Out Fees",         color: "text-orange-400",  bar: "#ea580c" },
  commission:           { label: "Agent Commissions",     color: "text-sky-400",     bar: "#0ea5e9" },
  subscription_revenue: { label: "Subscription Revenue",  color: "text-kob-gold",    bar: "#C9A84C" },
  float_fee:            { label: "Float Fees",            color: "text-rose-400",    bar: "#fb7185" },
};

const HTG_PER_USD = 132; // approximate peg

// ── Revenue Row ───────────────────────────────────────────────────────────────

function RevenueRow({ source, amount, total }: { source: string; amount: number; total: number }) {
  const cfg = SOURCE_CONFIG[source] ?? { label: source, color: "text-kob-muted", bar: "#6B7489" };
  const pct = total > 0 ? (amount / total) * 100 : 0;
  const pctStr = pct.toFixed(1);

  return (
    <div className="grid grid-cols-[180px_1fr_90px_80px] items-center gap-4 py-3 border-b border-white/4 last:border-0">
      {/* Label */}
      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>

      {/* SVG bar — width attribute is not a CSS style, no inline style warning */}
      <svg className="h-2 w-full rounded-full overflow-hidden" viewBox="0 0 100 8" preserveAspectRatio="none" aria-label={`${pctStr}% of revenue`}>
        <title>{cfg.label}: {pctStr}%</title>
        <rect x="0" y="0" width="100" height="8" fill="rgba(255,255,255,0.04)" />
        <rect x="0" y="0" width={pct} height="8" fill={cfg.bar} />
      </svg>

      {/* Amount */}
      <span className="text-xs font-semibold tabular-nums text-kob-text text-right font-mono">
        {fmtHTG(amount)}
      </span>

      {/* Percentage */}
      <span className={`text-[10px] font-bold text-right ${cfg.color}`}>{pctStr}%</span>
    </div>
  );
}

// ── Wallet Card ───────────────────────────────────────────────────────────────

function WalletCard({ wallet }: { wallet: TreasuryWallet }) {
  const isHTG = wallet.currency === "HTG";
  const hasBalance = wallet.balance > 0;

  return (
    <div className={`rounded-2xl border bg-[#080E20] p-5 flex flex-col gap-3 ${hasBalance ? "border-kob-gold/25" : "border-white/8"}`}>
      <div className="flex items-center justify-between">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${hasBalance ? "bg-kob-gold/10 border-kob-gold/20" : "bg-white/5 border-white/10"}`}>
          <Wallet className={`h-4 w-4 ${hasBalance ? "text-kob-gold" : "text-kob-muted"}`} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${hasBalance ? "text-kob-gold bg-kob-gold/8 border-kob-gold/20" : "text-kob-muted bg-white/3 border-white/8"}`}>
          {wallet.currency}
        </span>
      </div>

      <div>
        <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest mb-0.5">Balance</p>
        <p className={`text-2xl font-bold tabular-nums leading-tight ${hasBalance ? "text-kob-text" : "text-kob-muted"}`}>
          {fmtHTG(wallet.balance)}
        </p>
        {isHTG && wallet.balance > 0 && (
          <p className="text-[10px] text-kob-muted mt-0.5">≈ {fmtUSD(wallet.balance / HTG_PER_USD)}</p>
        )}
      </div>

      {/* Mini balance bar */}
      <div className="h-1 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${hasBalance ? "bg-kob-gold" : "bg-white/10"} w-full`} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TreasuryPage() {
  const [balances, revenue] = await Promise.all([
    apiGet<TreasuryBalances>("/v1/admin/treasury", { ok: false, wallets: [] }),
    apiGet<TreasuryRevenue>("/v1/admin/treasury/revenue?days=30", { ok: false, periodDays: 30, totalRevenue: 0, breakdown: {} }),
  ]);

  const wallets = balances?.wallets ?? [];
  const breakdown = revenue?.breakdown ?? {};
  const totalRevenue = revenue?.totalRevenue ?? 0;
  const periodDays = revenue?.periodDays ?? 30;

  // Total HTG balance (primary currency)
  const htgWallet = wallets.find((w) => w.currency === "HTG");
  const platformBalance = htgWallet?.balance ?? wallets.reduce((s, w) => s + w.balance, 0);

  // Revenue rows sorted descending
  const revenueRows = Object.entries(breakdown)
    .map(([source, amount]) => ({ source, amount: Number(amount) }))
    .sort((a, b) => b.amount - a.amount);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-kob-text tracking-tight">Treasury Vault</h1>
        <p className="text-xs text-kob-muted mt-0.5">Platform wallets, revenue streams &amp; pending cash-outs · {today}</p>
      </div>

      {/* ── Hero: Vault overview ───────────────────────────── */}
      <div className="relative rounded-2xl border border-kob-gold/20 bg-[#080E20] overflow-hidden">
        {/* Gold shimmer accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-kob-gold/60 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-kob-gold/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/6">
          {/* Platform balance */}
          <div className="p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Vault className="h-4 w-4 text-kob-gold" />
              <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">Platform Balance</p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-kob-text tabular-nums">{fmtHTG(platformBalance)}</span>
              <span className="text-lg font-semibold text-kob-gold">HTG</span>
            </div>
            <p className="text-xs text-kob-muted mt-1">≈ {fmtUSD(platformBalance / HTG_PER_USD)} USD</p>

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/6 text-[11px] text-kob-muted">
              <span><span className="text-kob-text font-semibold">{wallets.length}</span> treasury wallet{wallets.length !== 1 ? "s" : ""}</span>
              <span><span className="text-kob-text font-semibold">{revenueRows.length}</span> revenue sources</span>
              <span className="ml-auto flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live ledger
              </span>
            </div>
          </div>

          {/* Revenue snapshot */}
          <div className="p-6 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">{periodDays}d Revenue</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-kob-gold tabular-nums">{fmtHTG(totalRevenue)}</span>
              <span className="text-sm font-semibold text-kob-gold/60">HTG</span>
            </div>
            <p className="text-[10px] text-kob-muted">≈ {fmtUSD(totalRevenue / HTG_PER_USD)}</p>
            {totalRevenue > 0 && (
              <div className="mt-3 space-y-1">
                {revenueRows.slice(0, 3).map((r) => {
                  const cfg = SOURCE_CONFIG[r.source];
                  return cfg ? (
                    <div key={r.source} className="flex items-center justify-between text-[10px]">
                      <span className={cfg.color}>{cfg.label}</span>
                      <span className="text-kob-muted tabular-nums">{fmtHTG(r.amount)}</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Wallet Balances ────────────────────────────────── */}
      {wallets.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-kob-muted uppercase tracking-widest mb-3">Treasury Wallets</p>
          <div className={`grid gap-3 ${wallets.length === 1 ? "grid-cols-1 max-w-xs" : wallets.length === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
            {wallets.map((w) => <WalletCard key={w.walletId} wallet={w} />)}
          </div>
        </div>
      )}

      {/* ── Revenue Breakdown ─────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div>
            <p className="text-sm font-semibold text-kob-text">Revenue Breakdown</p>
            <p className="text-[10px] text-kob-muted mt-0.5">Last {periodDays} days · all treasury credits</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-kob-muted">Total</p>
            <p className="text-sm font-bold text-kob-gold tabular-nums">{fmtHTG(totalRevenue)} HTG</p>
          </div>
        </div>

        <div className="px-5 py-2">
          {revenueRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <TrendingUp className="h-8 w-8 text-kob-muted" />
              <p className="text-sm text-kob-muted">No revenue data for this period</p>
            </div>
          ) : (
            <>
              {/* Column labels */}
              <div className="grid grid-cols-[180px_1fr_90px_80px] gap-4 pb-2 border-b border-white/6 mb-1">
                {["Source", "Proportion", "Amount (HTG)", "Share"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">{h}</span>
                ))}
              </div>
              {revenueRows.map((r) => (
                <RevenueRow key={r.source} source={r.source} amount={r.amount} total={totalRevenue} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Pending Withdrawals ───────────────────────────── */}
      <PendingWithdrawals />
    </div>
  );
}
