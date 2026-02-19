"use client";

import { useState, useCallback, useRef } from "react";
import { trackEvent } from "@/lib/gtag";
import {
  ArrowRight,
  ArrowUpDown,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Info,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "HTG", name: "Haitian Gourde", symbol: "G", flag: "🇭🇹" },
];

// Demo rates — will be replaced by live API rates when available
const demoRates: Record<string, number> = {
  "USD-HTG": 132.50,
  "CAD-HTG": 97.30,
  "EUR-HTG": 143.80,
  "HTG-USD": 0.00755,
  "HTG-CAD": 0.01028,
  "HTG-EUR": 0.00696,
  "USD-CAD": 1.362,
  "USD-EUR": 0.921,
  "CAD-USD": 0.734,
  "CAD-EUR": 0.676,
  "EUR-USD": 1.086,
  "EUR-CAD": 1.479,
};

const competitorFees: Record<string, { fee: string; time: string }> = {
  "Western Union": { fee: "$12.00", time: "1-3 days" },
  MoneyGram: { fee: "$9.99", time: "1-2 days" },
  Remitly: { fee: "$3.99", time: "3-5 days" },
};

export default function FxCalculatorPage() {
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("HTG");

  const tracked = useRef(false);

  const numAmount = parseFloat(amount) || 0;
  const rateKey = `${fromCurrency}-${toCurrency}`;
  const rate = demoRates[rateKey] ?? 1;
  const converted = numAmount * rate;
  const kobkleinFee = fromCurrency !== toCurrency ? 1.99 : 0;

  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const fromOptions = currencies.filter((c) => c.code !== toCurrency);
  const toOptions = currencies.filter((c) => c.code !== fromCurrency);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <TrendingUp className="h-10 w-10 text-kob-gold mx-auto mb-4" />
          <h1 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
            Exchange Rate <span className="gradient-gold-text">Calculator</span>
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            See how much your family receives with KobKlein&apos;s competitive exchange rates.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-sovereign p-6 md:p-8">
            {/* From */}
            <div className="mb-6">
              <label className="block text-xs text-kob-muted mb-2 font-medium uppercase tracking-wider">
                You Send
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kob-muted" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (!tracked.current) {
                        trackEvent("fx_calculation", "engagement", "calculator_used");
                        tracked.current = true;
                      }
                    }}
                    min="0"
                    step="0.01"
                    className="w-full bg-kob-black/50 border border-white/[0.08] rounded-xl pl-9 pr-4 py-3 text-kob-text text-lg font-semibold focus:border-kob-gold/40 focus:outline-none transition-colors"
                    placeholder="100.00"
                  />
                </div>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="bg-kob-black/50 border border-white/[0.08] rounded-xl px-4 py-3 text-kob-text font-medium focus:border-kob-gold/40 focus:outline-none transition-colors appearance-none cursor-pointer min-w-[100px]"
                >
                  {fromOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-4">
              <button
                type="button"
                onClick={handleSwap}
                className="w-10 h-10 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center hover:bg-kob-gold/20 transition-all duration-200"
              >
                <ArrowUpDown className="h-4 w-4 text-kob-gold" />
              </button>
            </div>

            {/* To */}
            <div className="mb-6">
              <label className="block text-xs text-kob-muted mb-2 font-medium uppercase tracking-wider">
                They Receive
              </label>
              <div className="flex gap-3">
                <div className="flex-1 bg-kob-black/50 border border-white/[0.08] rounded-xl px-4 py-3">
                  <span className="text-2xl font-bold gradient-gold-text font-serif-luxury">
                    {converted.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="bg-kob-black/50 border border-white/[0.08] rounded-xl px-4 py-3 text-kob-text font-medium focus:border-kob-gold/40 focus:outline-none transition-colors appearance-none cursor-pointer min-w-[100px]"
                >
                  {toOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rate Info */}
            <div className="bg-kob-black/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-kob-muted">Exchange Rate</span>
                <span className="text-kob-text font-medium">
                  1 {fromCurrency} = {rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {toCurrency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kob-muted">KobKlein Fee</span>
                <span className="text-kob-gold font-medium">
                  {kobkleinFee === 0 ? "FREE" : `$${kobkleinFee.toFixed(2)}`}
                </span>
              </div>
              <div className="h-px bg-white/[0.06] my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-kob-muted">Total Cost</span>
                <span className="text-kob-text font-semibold">
                  {(numAmount + kobkleinFee).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {fromCurrency}
                </span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/${fromCurrency === "HTG" ? "en" : "en"}/app`}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-kob-gold text-kob-black font-semibold hover:bg-kob-gold-light transition-all duration-200"
            >
              Get This Rate Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 flex items-start gap-2 px-2">
            <Info className="h-4 w-4 text-kob-muted flex-shrink-0 mt-0.5" />
            <p className="text-xs text-kob-muted leading-relaxed">
              Rates shown are indicative and may vary at the time of transaction. KobKlein applies
              competitive spreads to mid-market rates. Final rates are locked when you confirm your
              transfer. Fees shown are for international remittances — KobKlein to KobKlein
              transfers within the same currency are free.
            </p>
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-2xl font-bold text-kob-text text-center mb-8">
            Compare & Save
          </h2>
          <div className="space-y-4">
            {Object.entries(competitorFees).map(([name, data]) => (
              <div
                key={name}
                className="card-sovereign p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-kob-text">{name}</p>
                  <p className="text-xs text-kob-muted">{data.time} delivery</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-kob-body">{data.fee} fee</p>
                </div>
              </div>
            ))}
            <div className="card-sovereign p-5 flex items-center justify-between bg-kob-gold/5 border-kob-gold/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-kob-emerald" />
                <div>
                  <p className="text-sm font-semibold text-kob-gold">KobKlein</p>
                  <p className="text-xs text-kob-muted">Instant delivery</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-kob-gold">$1.99 fee</p>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-kob-muted mt-6">
            Fees compared for a $200 USD → HTG transfer. Competitor rates as of February 2025.
          </p>
        </div>
      </section>
    </>
  );
}
