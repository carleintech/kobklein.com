import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowDownToLine, ArrowUpFromLine, Repeat, AlertTriangle, Coins } from "lucide-react-native";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useWalletStore } from "@/context/wallet-store";
import { kkGet } from "@/lib/api";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

interface DistributorSummary {
  floatHTG: number;
  floatUSD: number;
  todayCommissions: number;
  todayCashIn: number;
  todayCashOut: number;
  lowFloat: boolean;
}

export default function DistributorDashboard() {
  const router = useRouter();
  const { balances } = useWalletStore();
  const [summary, setSummary] = useState<DistributorSummary>({
    floatHTG: 0,
    floatUSD: 0,
    todayCommissions: 0,
    todayCashIn: 0,
    todayCashOut: 0,
    lowFloat: false,
  });

  useEffect(() => {
    kkGet<DistributorSummary>("/v1/distributor/summary")
      .then(setSummary)
      .catch(() => {});
  }, []);

  const totalFloat = balances
    .filter((b) => b.type === "DISTRIBUTOR")
    .reduce((sum, b) => sum + b.balance, 0);

  return (
    <View style={styles.container}>
      {/* Low float warning */}
      {summary.lowFloat && (
        <Card variant="gold" style={styles.warningCard}>
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

      {/* Float Balance */}
      <Card variant="gold" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{i18n.t("distributor.float")}</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(totalFloat, "HTG")}
        </Text>
        <View style={styles.floatRow}>
          <Badge variant="gold">
            HTG {formatCurrency(summary.floatHTG, "HTG")}
          </Badge>
          <Badge variant="gold">
            USD {formatCurrency(summary.floatUSD, "USD")}
          </Badge>
        </View>
      </Card>

      {/* Today's Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Coins size={18} color={colors.emerald} />
          <Text style={styles.statValue}>
            {formatCurrency(summary.todayCommissions, "HTG")}
          </Text>
          <Text style={styles.statLabel}>{i18n.t("distributor.commissions")}</Text>
        </Card>
        <Card style={styles.statCard}>
          <ArrowDownToLine size={18} color={colors.gold} />
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
          icon: <ArrowDownToLine size={20} color={colors.emerald} />,
          label: i18n.t("distributor.cashIn"),
          sub: "Deposit cash for customers",
          color: colors.emerald,
          route: "/distributor/cash-in" as const,
        },
        {
          icon: <ArrowUpFromLine size={20} color={colors.gold} />,
          label: i18n.t("distributor.cashOut"),
          sub: "Give cash to customers",
          color: colors.gold,
          route: "/distributor/cash-out" as const,
        },
        {
          icon: <Repeat size={20} color={colors.textBody} />,
          label: "Transfer Float",
          sub: "Send float to another agent",
          color: colors.textBody,
          route: "/distributor/transfer" as const,
        },
      ].map((op, idx) => (
        <TouchableOpacity key={idx} style={styles.opCard} onPress={() => router.push(op.route)}>
          <View style={[styles.opIcon, { backgroundColor: `${op.color}15` }]}>
            {op.icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.opTitle}>{op.label}</Text>
            <Text style={styles.opSub}>{op.sub}</Text>
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
  warningCard: {
    padding: spacing.md,
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
  floatRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
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
    fontSize: 14,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing.sm,
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
});
