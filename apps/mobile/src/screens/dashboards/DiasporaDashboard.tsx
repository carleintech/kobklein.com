import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Send, Globe, Star, UserPlus, Clock, ArrowRight } from "lucide-react-native";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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

export default function DiasporaDashboard() {
  const router = useRouter();
  const { balances } = useWalletStore();
  const [family, setFamily] = useState<FamilyMember[]>([]);

  const usd = balances.find((b) => b.currency === "USD");

  useEffect(() => {
    kkGet<FamilyMember[]>("/v1/family")
      .then(setFamily)
      .catch(() => {});
  }, []);

  const favorites = family.filter((m) => m.isFavorite);

  return (
    <View style={styles.container}>
      {/* Balance */}
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
      </Card>

      {/* Quick Send Family */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{i18n.t("diaspora.family")}</Text>
        <TouchableOpacity onPress={() => {}}>
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

          {/* Family members */}
          {family.slice(0, 5).map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.familyItem}
              onPress={() => router.push(`/(tabs)/send?to=${member.phone}`)}
            >
              <View style={styles.familyAvatar}>
                <Text style={styles.familyEmoji}>{member.emoji || "👤"}</Text>
                {member.isFavorite && (
                  <Star size={10} color={colors.gold} fill={colors.gold} style={styles.star} />
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
          onPress={() => router.push("/(tabs)/send")}
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

      {/* Stats */}
      <Card>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>$0</Text>
            <Text style={styles.statLabel}>Sent This Month</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statValue}>{family.length}</Text>
            <Text style={styles.statLabel}>Family Members</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Transfers</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
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
  familyEmoji: {
    fontSize: 22,
  },
  star: {
    position: "absolute",
    bottom: -2,
    right: -2,
  },
  familyName: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textBody,
    textAlign: "center",
  },
  actionsRow: {
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: 2,
  },
  actionText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.textHeading,
  },
  statsGrid: {
    flexDirection: "row",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
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
    marginTop: 2,
  },
});
