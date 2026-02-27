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
  Banknote,
  BarChart3,
  History,
  TrendingUp,
  RefreshCw,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useWalletStore } from "@/context/wallet-store";
import { kkGet } from "@/lib/api";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";
import { KNfcIconNative } from "@/screens/pos/KNfcIconNative";

interface MerchantStats {
  todaySales: number;
  todayFees: number;
  weekSales: number;
  txCount: number;
  monthSales?: number;
}

interface PosDeviceInfo {
  hasActivePosDevice: boolean;
  devices: Array<{ id: string; deviceLabel: string; status: string }>;
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { balances, refresh: refreshWallet } = useWalletStore() as any;
  const [stats, setStats] = useState<MerchantStats>({
    todaySales: 0,
    todayFees: 0,
    weekSales: 0,
    txCount: 0,
  });
  const [posActive, setPosActive] = useState(false);
  const [loading, setLoading]     = useState(false);

  const htg = balances.find(
    (b: any) => b.currency === "HTG" && b.type === "MERCHANT"
  );

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [statsRes, posRes] = await Promise.allSettled([
        kkGet<MerchantStats>("/v1/merchant/stats"),
        kkGet<PosDeviceInfo>("/v1/pos/devices/my"),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (posRes.status === "fulfilled")   setPosActive(posRes.value.hasActivePosDevice);
    } finally {
      setLoading(false);
    }
  }

  const quickActions = [
    {
      icon: <Banknote size={20} color={colors.black} />,
      label: i18n.t("merchant.withdraw"),
      sub: "Cash out earnings",
      onPress: () => {},
    },
    {
      icon: <History size={20} color={colors.black} />,
      label: "History",
      sub: "View all transactions",
      onPress: () => {},
    },
    {
      icon: <BarChart3 size={20} color={colors.black} />,
      label: "Analytics",
      sub: "Sales insights",
      onPress: () => {},
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header row: balance card + K-NFC icon */}
      <Card variant="gold" style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>Merchant Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(htg?.balance ?? 0, "HTG")}
            </Text>
            {posActive && (
              <Badge variant="success" style={{ marginTop: 8, alignSelf: "flex-start" }}>
                POS Active
              </Badge>
            )}
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

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <TrendingUp size={16} color={colors.gold} />
          <Text style={styles.statValue}>
            {formatCurrency(stats.todaySales, "HTG")}
          </Text>
          <Text style={styles.statLabel}>{i18n.t("merchant.todaySales")}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValueLarge}>{stats.txCount}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCurrency(stats.weekSales, "HTG")}
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCurrency(stats.todayFees, "HTG")}
          </Text>
          <Text style={styles.statLabel}>Fees Today</Text>
        </Card>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      {quickActions.map((action, idx) => (
        <TouchableOpacity key={idx} style={styles.actionCard} onPress={action.onPress}>
          <View style={styles.actionIcon}>{action.icon}</View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{action.label}</Text>
            <Text style={styles.actionSub}>{action.sub}</Text>
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
    paddingVertical: spacing.lg,
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.textHeading,
  },
  statValueLarge: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
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
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: { flex: 1 },
  actionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.textHeading,
  },
  actionSub: {
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
