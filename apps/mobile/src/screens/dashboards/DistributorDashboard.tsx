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
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  AlertTriangle,
  Coins,
  RefreshCw,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useWalletStore } from "@/context/wallet-store";
import { kkGet } from "@/lib/api";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";
import { KNfcIconNative } from "@/screens/pos/KNfcIconNative";

interface DistributorSummary {
  floatHTG: number;
  floatUSD: number;
  todayCommissions: number;
  todayCashIn: number;
  todayCashOut: number;
  lowFloat: boolean;
}

interface PosDeviceInfo {
  hasActivePosDevice: boolean;
}

export default function DistributorDashboard() {
  const router = useRouter();
  const { balances } = useWalletStore() as any;
  const [summary, setSummary] = useState<DistributorSummary>({
    floatHTG: 0,
    floatUSD: 0,
    todayCommissions: 0,
    todayCashIn: 0,
    todayCashOut: 0,
    lowFloat: false,
  });
  const [posActive, setPosActive] = useState(false);
  const [loading, setLoading]     = useState(false);

  const totalFloat = balances
    .filter((b: any) => b.type === "DISTRIBUTOR")
    .reduce((sum: number, b: any) => sum + b.balance, 0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [summaryRes, posRes] = await Promise.allSettled([
        kkGet<DistributorSummary>("/v1/distributor/summary"),
        kkGet<PosDeviceInfo>("/v1/pos/devices/my"),
      ]);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
      if (posRes.status === "fulfilled")     setPosActive(posRes.value.hasActivePosDevice);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Low float warning */}
      {summary.lowFloat && (
        <Card style={styles.warningCard}>
          <View style={styles.warningRow}>
            <AlertTriangle size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Low Float Warning</Text>
              <Text style={styles.warningText}>
                Your float is running low. Contact your supervisor for a refill.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Float Balance + K-NFC */}
      <Card variant="gold" style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>{i18n.t("distributor.float")}</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(totalFloat, "HTG")}
            </Text>
            <View style={styles.floatRow}>
              <Badge variant="gold">HTG {summary.floatHTG.toLocaleString()}</Badge>
              <Badge variant="gold">USD {summary.floatUSD.toLocaleString()}</Badge>
            </View>
          </View>

          {/* K-NFC POS Button */}
          <TouchableOpacity
            style={[
              styles.nfcButton,
              posActive ? styles.nfcButtonActive : styles.nfcButtonInactive,
            ]}
            onPress={() => router.push("/(tabs)/scan")}
            accessibilityLabel={posActive ? "Open POS Terminal" : "Activate POS Terminal"}
          >
            <KNfcIconNative size={44} active={posActive} />
            <Text style={[styles.nfcLabel, posActive && { color: "#16C784" }]}>
              {posActive ? "POS On" : "Activate\nPOS"}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Today's Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Coins size={16} color={colors.gold} />
          <Text style={styles.statValue}>
            {formatCurrency(summary.todayCommissions, "HTG")}
          </Text>
          <Text style={styles.statLabel}>{i18n.t("distributor.commissions")}</Text>
        </Card>
        <Card style={styles.statCard}>
          <ArrowDownToLine size={16} color={colors.gold} />
          <Text style={styles.statValue}>
            {formatCurrency(summary.todayCashIn, "HTG")}
          </Text>
          <Text style={styles.statLabel}>Cash In</Text>
        </Card>
      </View>

      {/* Operations */}
      <Text style={styles.sectionTitle}>Operations</Text>

      {[
        {
          icon: <ArrowDownToLine size={20} color={colors.gold} />,
          label: i18n.t("distributor.cashIn"),
          sub: "Deposit cash for customers",
          route: "/distributor/cash-in" as const,
        },
        {
          icon: <ArrowUpFromLine size={20} color={colors.gold} />,
          label: i18n.t("distributor.cashOut"),
          sub: "Give cash to customers",
          route: "/distributor/cash-out" as const,
        },
        {
          icon: <Repeat size={20} color={colors.textBody} />,
          label: "Transfer Float",
          sub: "Send float to another agent",
          route: "/distributor/transfer" as const,
        },
      ].map((op, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.opCard}
          onPress={() => router.push(op.route)}
        >
          <View style={[styles.opIcon, { backgroundColor: `${colors.gold}15` }]}>
            {op.icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.opTitle}>{op.label}</Text>
            <Text style={styles.opSub}>{op.sub}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshRow} onPress={load} disabled={loading}>
        <RefreshCw size={14} color={colors.textMuted} />
        <Text style={styles.refreshText}>
          {loading ? "Refreshing…" : "Refresh Dashboard"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
    gap: spacing.md,
  },
  warningCard: {
    padding: spacing.md,
    backgroundColor: "rgba(245,158,11,0.06)",
    borderColor: "rgba(245,158,11,0.20)",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  warningTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.warning,
  },
  warningText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  balanceCard: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  balanceAmount: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: colors.gold,
    marginTop: 4,
  },
  floatRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  nfcButton: {
    alignItems: "center",
    gap: 4,
    padding: spacing.md,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    minWidth: 72,
  },
  nfcButtonActive: {
    backgroundColor: "rgba(22,199,132,0.06)",
    borderColor: "rgba(22,199,132,0.20)",
  },
  nfcButtonInactive: {
    backgroundColor: "rgba(201,168,76,0.06)",
    borderColor: "rgba(201,168,76,0.15)",
  },
  nfcLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.gold,
    textAlign: "center",
    lineHeight: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.textHeading,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  opCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  opIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  opTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.textHeading,
  },
  opSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    marginTop: 4,
  },
  refreshText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
});
