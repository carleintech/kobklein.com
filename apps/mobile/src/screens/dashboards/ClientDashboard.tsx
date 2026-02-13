import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Send, QrCode, CreditCard, ArrowDownLeft } from "lucide-react-native";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useWalletStore } from "@/context/wallet-store";
import { useAuthStore } from "@/context/auth-store";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

export default function ClientDashboard() {
  const router = useRouter();
  const { balances } = useWalletStore();
  const { user } = useAuthStore();

  const htg = balances.find((b) => b.currency === "HTG");
  const usd = balances.find((b) => b.currency === "USD");
  const totalHTG = (htg?.balance ?? 0) + (usd?.balance ?? 0) * 132.5; // approx

  const actions = [
    {
      icon: <Send size={20} color={colors.black} />,
      label: "K-Pay",
      onPress: () => router.push("/(tabs)/send"),
    },
    {
      icon: <ArrowDownLeft size={20} color={colors.black} />,
      label: "Receive",
      onPress: () => router.push("/(tabs)/scan"),
    },
    {
      icon: <QrCode size={20} color={colors.black} />,
      label: "K-Scan",
      onPress: () => router.push("/(tabs)/scan"),
    },
    {
      icon: <CreditCard size={20} color={colors.black} />,
      label: "K-Card",
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      {/* KYC Banner */}
      {(user?.kycTier ?? 0) < 1 && (
        <Card variant="gold" style={styles.kycBanner}>
          <View style={styles.kycRow}>
            <View>
              <Text style={styles.kycTitle}>Verify Your Identity</Text>
              <Text style={styles.kycSubtitle}>Unlock higher limits and all features</Text>
            </View>
            <Badge variant="warning">Unverified</Badge>
          </View>
        </Card>
      )}

      {/* Balance Card */}
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
      <Text style={styles.sectionTitle}>{i18n.t("dashboard.recentActivity")}</Text>
      <Card>
        <Text style={styles.emptyText}>{i18n.t("dashboard.noActivity")}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  kycBanner: {
    padding: spacing.md,
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
  currencyFlag: {
    fontSize: 14,
  },
  currencyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.textBody,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionItem: {
    alignItems: "center",
    gap: 8,
  },
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
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
