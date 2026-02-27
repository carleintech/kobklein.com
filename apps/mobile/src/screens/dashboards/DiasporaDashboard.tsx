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
  Globe,
  Star,
  UserPlus,
  Clock,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useWalletStore } from "@/context/wallet-store";
import { kkGet } from "@/lib/api";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  emoji: string;
  isFavorite: boolean;
}

interface TimelineEntry {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

interface DiasporaStats {
  sentThisMonth: number;
  totalTransfers: number;
  savedVsWesternUnion: number;
}

export default function DiasporaDashboard() {
  const router = useRouter();
  const { balances } = useWalletStore() as any;
  const [family, setFamily]           = useState<FamilyMember[]>([]);
  const [timeline, setTimeline]       = useState<TimelineEntry[]>([]);
  const [stats, setStats]             = useState<DiasporaStats>({
    sentThisMonth: 0,
    totalTransfers: 0,
    savedVsWesternUnion: 0,
  });
  const [loading, setLoading]         = useState(false);

  const usd = balances.find((b: any) => b.currency === "USD");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [familyRes, timelineRes, statsRes] = await Promise.allSettled([
        kkGet<FamilyMember[]>("/v1/family"),
        kkGet<TimelineEntry[]>("/v1/wallets/timeline?limit=5"),
        kkGet<DiasporaStats>("/v1/diaspora/stats"),
      ]);
      if (familyRes.status === "fulfilled")   setFamily(familyRes.value ?? []);
      if (timelineRes.status === "fulfilled") setTimeline(timelineRes.value ?? []);
      if (statsRes.status === "fulfilled")    setStats(statsRes.value);
    } finally {
      setLoading(false);
    }
  }

  const txIcon = (type: string) => {
    if (type === "CREDIT" || type === "TOPUP") return <ArrowDownLeft size={14} color="#16C784" />;
    return <ArrowUpRight size={14} color={colors.gold} />;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Balance card with Add Funds button */}
      <Card variant="gold" style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Available to Send</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(usd?.balance ?? 0, "USD")}
            </Text>
          </View>
          <Globe size={32} color={colors.gold} />
        </View>

        {/* Add Funds CTA */}
        <TouchableOpacity
          style={styles.addFundsBtn}
          onPress={() => {
            // On mobile, navigate to the add-funds modal/screen
            // For now route to send or show platform-specific flow
            router.push("/(tabs)/wallet" as any);
          }}
        >
          <PlusCircle size={16} color={colors.black} />
          <Text style={styles.addFundsText}>Add Funds</Text>
        </TouchableOpacity>
      </Card>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <TrendingUp size={16} color={colors.gold} />
          <Text style={styles.statValue}>
            {formatCurrency(stats.sentThisMonth, "USD")}
          </Text>
          <Text style={styles.statLabel}>Sent This Month</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTransfers}</Text>
          <Text style={styles.statLabel}>Transfers</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#16C784" }]}>
            ${stats.savedVsWesternUnion.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Saved vs WU</Text>
        </Card>
      </View>

      {/* Family quick-send */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{i18n.t("diaspora.family")}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>{i18n.t("seeAll")}</Text>
        </TouchableOpacity>
      </View>

      {family.length === 0 ? (
        <Card>
          <View style={styles.emptyFamily}>
            <UserPlus size={24} color={colors.textMuted} />
            <Text style={styles.emptyText}>Add your first family member</Text>
            <Button onPress={() => {}} size="sm" variant="outline">
              {i18n.t("diaspora.addMember")}
            </Button>
          </View>
        </Card>
      ) : (
        <View style={styles.familyRow}>
          {/* Add button */}
          <TouchableOpacity style={styles.familyAdd} onPress={() => {}}>
            <UserPlus size={20} color={colors.gold} />
          </TouchableOpacity>

          {family.slice(0, 5).map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.familyItem}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/send" as any,
                  params: { to: member.phone },
                })
              }
            >
              <View style={styles.familyAvatar}>
                <Text style={styles.familyEmoji}>{member.emoji || "👤"}</Text>
                {member.isFavorite && (
                  <Star
                    size={10}
                    color={colors.gold}
                    fill={colors.gold}
                    style={styles.star}
                  />
                )}
              </View>
              <Text style={styles.familyName} numberOfLines={1}>
                {member.name.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/send" as any)}
        >
          <Send size={20} color={colors.gold} />
          <Text style={styles.actionText}>{i18n.t("diaspora.sendHome")}</Text>
          <ArrowRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
          <Clock size={20} color={colors.gold} />
          <Text style={styles.actionText}>{i18n.t("diaspora.recurring")}</Text>
          <ArrowRight size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>

      {timeline.length === 0 ? (
        <Card>
          <Text style={styles.emptyActivityText}>No transactions yet</Text>
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
              {txIcon(tx.type)}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDesc} numberOfLines={1}>
                {tx.description}
              </Text>
              <Text style={styles.txDate}>
                {new Date(tx.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                {
                  color:
                    tx.type === "CREDIT" || tx.type === "TOPUP"
                      ? "#16C784"
                      : colors.textHeading,
                },
              ]}
            >
              {tx.type === "CREDIT" || tx.type === "TOPUP" ? "+" : "-"}
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
  balanceCard: {
    paddingVertical: spacing.xl,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    fontSize: 32,
    color: colors.gold,
    marginTop: 4,
  },
  addFundsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: radii.xl,
    paddingVertical: 12,
  },
  addFundsText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.black,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.textHeading,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
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
  seeAll: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.gold,
  },
  emptyFamily: {
    alignItems: "center",
    gap: 12,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  familyRow: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 4,
  },
  familyAdd: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  familyItem: {
    alignItems: "center",
    gap: 4,
    width: 52,
  },
  familyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  familyEmoji: { fontSize: 22 },
  star: { position: "absolute", bottom: -2, right: -2 },
  familyName: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textBody,
    textAlign: "center",
  },
  actionsRow: { gap: 10 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  actionText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.textHeading,
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
    color: colors.textHeading,
  },
  emptyActivityText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
