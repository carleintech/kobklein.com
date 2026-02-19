"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@kobklein/ui/card";
import { Badge } from "@kobklein/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Send,
  CreditCard,
  Shield,
  Wallet,
  Crown,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  profile: {
    id: string;
    firstName?: string;
    handle?: string;
    kycTier: number;
    kycStatus?: string;
    planSlug?: string;
    planName?: string;
    planTier?: number;
  };
};

type BalanceInfo = {
  totalBalance: number;
  availableBalance: number;
  heldBalance: number;
};

export function ClientDashboard({ profile }: Props) {
  const router = useRouter();
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [displayBalance, setDisplayBalance] = useState<number | null>(null);

  // Animated balance count-up
  useEffect(() => {
    if (balance?.totalBalance != null) {
      const start = displayBalance ?? 0;
      const end = balance.totalBalance;
      if (start === end) return;
      const duration = 900;
      const startTime = performance.now();
      function animate(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = start + (end - start) * progress;
        setDisplayBalance(progress < 1 ? value : end);
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance?.totalBalance, displayBalance]);

  const loadBalance = useCallback(async () => {
    try {
      const res = await apiGet<BalanceInfo>("v1/wallets/balance");
      setBalance(res);
      setDisplayBalance(res?.totalBalance ?? null);
    } catch {}
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const greeting = profile.firstName
    ? `Bonjou, ${profile.firstName}`
    : "Bonjou!";

  return (
    <div className="space-y-8">
      {/* Header with glassmorphism and animated glow */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden px-6 py-7 flex flex-col gap-2"
        style={{ boxShadow: "0 4px 32px 0 #C9A84C22, 0 1.5px 0 #C9A84C33" }}
      >
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-[#C9A84C]/30 to-transparent rounded-full blur-2xl opacity-60 pointer-events-none animate-pulse" />
        <div className="text-sm text-muted-foreground font-medium tracking-wide">KobKlein</div>
        <div className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{greeting}</div>
        {profile.handle && (
          <div className="text-xs text-primary font-medium">
            <span className="inline-flex items-center gap-0.5">
              <span className="w-3 h-3 rounded bg-primary text-white text-[8px] font-bold flex items-center justify-center">K</span>
              @{profile.handle}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          {profile.planName ? (
            <Badge variant="default" className="text-[10px] gap-0.5 px-2.5 py-1">
              <Crown className="h-2.5 w-2.5" />
              {profile.planName}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-2.5 py-1">Free</Badge>
          )}
          {profile.kycTier >= 2 ? (
            <Badge variant="success" className="text-[10px] gap-0.5 px-2.5 py-1">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Verified
            </Badge>
          ) : profile.kycTier === 1 ? (
            <Badge variant="warning" className="text-[10px] px-2.5 py-1 animate-pulse">KYC Pending</Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] px-2.5 py-1 animate-pulse">Unverified</Badge>
          )}
        </div>
      </motion.div>

      {/* Balance Card with glassmorphism and animation */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="relative rounded-3xl bg-white/10 backdrop-blur-xl border border-[#C9A84C]/30 shadow-lg overflow-hidden"
        style={{ boxShadow: "0 2px 24px 0 #C9A84C33" }}
      >
        <CardContent className="p-8 text-center space-y-2">
          <div className="text-xs text-muted-foreground tracking-wide">Total Balance</div>
          <div className="text-5xl font-extrabold text-white drop-shadow-lg flex items-center justify-center gap-2">
            {displayBalance != null
              ? Number(displayBalance).toLocaleString("fr-HT", { minimumFractionDigits: 2 })
              : "-"}
            <span className="text-lg font-semibold text-[#C9A84C]">HTG</span>
          </div>
          {balance && balance.heldBalance > 0 && (
            <>
              <div className="text-sm text-muted-foreground">
                Available: {Number(balance.availableBalance).toLocaleString("fr-HT", { minimumFractionDigits: 2 })} HTG
              </div>
              <div className="text-xs text-orange-400 animate-pulse">
                Some funds are temporarily on hold
              </div>
            </>
          )}
        </CardContent>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-tr from-[#C9A84C]/20 to-transparent rounded-full blur-2xl opacity-60 pointer-events-none" />
      </motion.div>

      {/* Quick Actions with modern glassy cards and animation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Send, label: "K-Pay", href: "/send", color: "from-[#C9A84C] to-[#E2CA6E]" },
          { icon: ArrowDownLeft, label: "Receive", href: "/wallet", color: "from-[#1F6F4A] to-[#A7F3D0]" },
          { icon: QrCode, label: "K-Scan", href: "/pay", color: "from-[#F59E42] to-[#FDE68A]" },
          { icon: CreditCard, label: "K-Card", href: "/card", color: "from-[#7C3AED] to-[#C4B5FD]" },
        ].map((action, i) => (
          <motion.button
            key={action.label}
            type="button"
            onClick={() => router.push(action.href)}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-md hover:bg-white/20 transition-all"
          >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
              <action.icon className="h-6 w-6 text-white drop-shadow" />
            </div>
            <span className="text-xs font-semibold text-white tracking-wide">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* KYC Banner with glassmorphism and animation */}
      <AnimatePresence>
        {profile.kycTier < 2 && (
          <motion.button
            type="button"
            onClick={() => router.push("/verify")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full text-left"
          >
            <Card className="rounded-2xl border-primary/30 bg-white/10 backdrop-blur-md shadow-md overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary shrink-0 animate-pulse" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">
                    {profile.kycTier === 0
                      ? "Verify Your Identity"
                      : "Complete Full Verification"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {profile.kycTier === 0
                      ? "Unlock higher limits and K-Card access"
                      : "Submit your ID to unlock K-Card and higher limits"}
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
              </CardContent>
            </Card>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Plan Upgrade Banner with glassmorphism and animation */}
      <AnimatePresence>
        {!profile.planSlug && (
          <motion.button
            type="button"
            onClick={() => router.push("/settings/plan")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full text-left"
          >
            <Card className="rounded-2xl border-[#C9A84C]/30 bg-white/10 backdrop-blur-md shadow-md overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <Crown className="h-8 w-8 text-[#C9A84C] shrink-0 animate-pulse" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">Upgrade Your Plan</div>
                  <div className="text-xs text-muted-foreground">
                    Get lower fees, higher limits & premium features
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#C9A84C] shrink-0" />
              </CardContent>
            </Card>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Navigation with glassy cards and icon animation */}
      <div className="space-y-3">
        {[
          { label: "Wallet & History", sub: "Balance, transactions, holds", href: "/wallet", icon: Wallet },
          { label: "K-Card", sub: "Manage your card & settings", href: "/card", icon: CreditCard },
          { label: "Send Money", sub: "K-Pay instant transfer", href: "/send", icon: Send },
          { label: "Pay Merchant", sub: "Scan & pay businesses", href: "/pay", icon: QrCode },
          { label: "Security", sub: "Lock account, devices", href: "/settings/security", icon: Shield },
        ].map((item, i) => (
          <motion.a
            key={item.href}
            href={item.href}
            whileHover={{ scale: 1.03, x: 6 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 + i * 0.06, duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 hover:bg-white/10 transition-all shadow-sm"
          >
            <item.icon className="h-5 w-5 text-primary shrink-0 transition-transform group-hover:scale-110" />
            <div className="flex-1">
              <div className="font-medium text-sm text-white">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.sub}</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
          </motion.a>
        ))}
      </div>
    </div>
  );
}
