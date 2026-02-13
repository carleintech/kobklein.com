import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { QrCode, ArrowDownLeft, BarChart3, Banknote } from "lucide-react-native";
import Card from "@/components/ui/Card";
import { useWalletStore } from "@/context/wallet-store";
import { kkGet } from "@/lib/api";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

interface MerchantStats {
  todaySales: number;
  todayFees: number;
  weekSales: number;
  txCount: number;
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { balances } = useWalletStore();
  const [stats, setStats] = useState<MerchantStats>({
    todaySales: 0,
    todayFees: 0,
    weekSales: 0,
    txCount: 0,
  });

  const htg = balances.find((b) => b.currency === "HTG" && b.type === "MERCHANT");

  useEffect(() => {
    kkGet<MerchantStats>("/v1/merchant/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  const actions = [
    {
      icon: <QrCode size={22} color={colors.black} />,
      label: i18n.t("merchant.pos"),
      sub: "Accept payments",
      onPress: () => router.push("/(tabs)/scan"),
    },
    {
      icon: <Banknote size={22} color={colors.black} />,
      label: i18n.t("merchant.withdraw"),
      sub: "Cash out earnings",
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      {/* Balance */}
      <Card variant="gold" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Merchant Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(htg?.balance ?? 0, "HTG")}
        </Text>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCurrency(stats.todaySales, "HTG")}
          </Text>
          <Text style={styles.statLabel}>{i18n.t("merchant.todaySales")}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.txCount}</Text>
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
          <Text style={styles.statLabel}>Today Fees</Text>
        </Card>
      </View>

      {/* Actions */}
      {actions.map((action, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.actionCard}
          onPress={action.onPress}
        >
          <View style={styles.actionIcon}>{action.icon}</View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{action.label}</Text>
            <Text style={styles.actionSub}>{action.sub}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  balanceCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
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
    fontSize: 32,
    color: colors.gold,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.textHeading,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
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
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
  },
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
});
