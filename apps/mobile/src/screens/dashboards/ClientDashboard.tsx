import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Send,
  QrCode,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useWalletStore } from "@/context/wallet-store";
import { useAuthStore } from "@/context/auth-store";
import { kkGet } from "@/lib/api";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

interface TimelineEntry {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

// Live FX rate
interface FxRate {
  mid: number;
  buy: number;
  sell: number;
  updatedAt: string;
}

export default function ClientDashboard() {
  const router                          = useRouter();
  const { balances }                    = useWalletStore() as any;
  const { user }                        = useAuthStore();
  const [timeline, setTimeline]         = useState<TimelineEntry[]>([]);
  const [fxRate, setFxRate]             = useState<FxRate | null>(null);
  const [loading, setLoading]           = useState(false);

  // Use live FX for HTG conversion — fallback to 132.5
  const rate   = fxRate?.mid ?? 132.5;
  const htg    = balances.find((b: any) => b.currency === "HTG");
  const usd    = balances.find((b: any) => b.currency === "USD");
  const totalHTG = (htg?.balance ?? 0) + (usd?.balance ?? 0) * rate;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [timelineRes, fxRes] = await Promise.allSettled([
        kkGet<TimelineEntry[]>("/v1/wallets/timeline?limit=8"),
        kkGet<FxRate>("/v1/fx/rates/live?from=USD&to=HTG"),
      ]);
      if (timelineRes.status === "fulfilled") setTimeline(timelineRes.value ?? []);
      if (fxRes.status === "fulfilled")       setFxRate(fxRes.value);
    } finally {
      setLoading(false);
    }
  }

  const actions = [
    {
      icon: <Send size={20} color={colors.black} />,
      label: "K-Pay",
      onPress: () => router.push("/(tabs)/send" as any),
    },
    {
      icon: <ArrowDownLeft size={20} color={colors.black} />,
      label: "Receive",
      onPress: () => router.push("/(tabs)/scan" as any),
    },
    {
      icon: <QrCode size={20} color={colors.black} />,
      label: "K-Scan",
      onPress: () => router.push("/(tabs)/scan" as any),
    },
    {
      icon: <CreditCard size={20} color={colors.black} />,
      label: "K-Card",
      onPress: () => {},
    },
  ];

  const txColor = (type: string) =>
    type === "CREDIT" || type === "TOPUP" ? "#16C784" : colors.textHeading;

  const txPrefix = (type: string) =>
    type === "CREDIT" || type === "TOPUP" ? "+" : "-";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* KYC Banner */}
      {(user?.kycTier ?? 0) < 1 && (
        <Card style={styles.kycBanner}>
          <View style={styles.kycRow}>
            <View>
              <Text style={styles.kycTitle}>Verify Your Identity</Text>
              <Text style={styles.kycSubtitle}>Unlock higher limits and all features</Text>
            </View>
            <Badge variant="warning">Unverified</Badge>
          </View>
        </Card>
      )}

      {/* Balance card */}
      <Card variant="gold" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{i18n.t("dashboard.balance")}</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(totalHTG, "HTG")}
        </Text>
        <View style={styles.currencyRow}>
          {htg && (
            <View style={styles.currencyPill}>
              <Text style={styles.currencyFlag}>🇭🇹</Text>
              <Text style={styles.currencyText}>{formatCurrency(htg.balance, "HTG")}</Text>
            </View>
          )}
          {usd && (
            <View style={styles.currencyPill}>
              <Text style={styles.currencyFlag}>🇺🇸</Text>
              <Text style={styles.currencyText}>{formatCurrency(usd.balance, "USD")}</Text>
            </View>
          )}
        </View>

        {/* Live FX rate */}
        {fxRate && (
          <View style={styles.fxPill}>
            <Text style={styles.fxText}>
              1 USD = {fxRate.mid.toFixed(1)} HTG
            </Text>
          </View>
        )}
      </Card>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>{i18n.t("dashboard.quickActions")}</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, idx) => (
          <TouchableOpacity key={idx} style={styles.actionItem} onPress={action.onPress}>
            <View style={styles.actionIcon}>{action.icon}</View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{i18n.t("dashboard.recentActivity")}</Text>
        <TouchableOpacity onPress={load} disabled={loading}>
          <RefreshCw size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {timeline.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>{i18n.t("dashboard.noActivity")}</Text>
        </Card>
      ) : (
        timeline.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View
              style={[
                styles.txIcon,
                {
                  backgroundColor:
                    tx.type === "CREDIT" || tx.type === "TOPUP"
                      ? "rgba(22,199,132,0.10)"
                      : "rgba(198,167,86,0.10)",
                },
              ]}
            >
              {tx.type === "CREDIT" || tx.type === "TOPUP" ? (
                <ArrowDownLeft size={14} color="#16C784" />
              ) : (
                <ArrowUpRight size={14} color={colors.gold} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDesc} numberOfLines={1}>
                {tx.description}
              </Text>
              <Text style={styles.txDate}>
                {new Date(tx.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.txAmount, { color: txColor(tx.type) }]}>
              {txPrefix(tx.type)}
              {formatCurrency(tx.amount, tx.currency)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
    gap: spacing.lg,
  },
  kycBanner: {
    padding: spacing.md,
    backgroundColor: "rgba(245,158,11,0.06)",
    borderColor: "rgba(245,158,11,0.20)",
  },
  kycRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kycTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.gold,
  },
  kycSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  balanceCard: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  balanceLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceAmount: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.gold,
    marginTop: 4,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  currencyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  currencyFlag: { fontSize: 14 },
  currencyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.textBody,
  },
  fxPill: {
    marginTop: 10,
    backgroundColor: "rgba(201,168,76,0.08)",
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.20)",
  },
  fxText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.gold,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  actionItem: { alignItems: "center", gap: 8 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.textBody,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  txDesc: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.textHeading,
  },
  txDate: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
