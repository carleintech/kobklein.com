import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  Shield,
  Globe,
  Bell,
  BadgeCheck,
  Crown,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Lock,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAuthStore } from "@/context/auth-store";
import { kkPost } from "@/lib/api";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

interface SettingsItem {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  badge?: string;
  badgeVariant?: "success" | "warning" | "gold" | "muted";
  onPress: () => void;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const kycBadge = () => {
    const tier = user?.kycTier ?? 0;
    if (tier >= 2) return { text: i18n.t("kyc.verified"), variant: "success" as const };
    if (tier >= 1) return { text: i18n.t("kyc.tier1"), variant: "gold" as const };
    if (user?.kycStatus === "pending") return { text: i18n.t("kyc.pending"), variant: "warning" as const };
    return { text: i18n.t("kyc.unverified"), variant: "muted" as const };
  };

  const kyc = kycBadge();

  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: "Account",
      items: [
        {
          icon: <User size={20} color={colors.textBody} />,
          label: i18n.t("settings.profile"),
          sub: user?.phone ?? "",
          onPress: () => router.push("/(tabs)/settings/profile"),
        },
        {
          icon: <BadgeCheck size={20} color={colors.gold} />,
          label: i18n.t("settings.kyc"),
          badge: kyc.text,
          badgeVariant: kyc.variant,
          onPress: () => router.push("/(tabs)/settings/kyc"),
        },
        {
          icon: <Crown size={20} color={colors.goldLight} />,
          label: i18n.t("settings.plan"),
          onPress: () => router.push("/(tabs)/settings/plan"),
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          icon: <Shield size={20} color={colors.textBody} />,
          label: i18n.t("settings.security"),
          sub: "Devices, biometrics, PIN",
          onPress: () => router.push("/(tabs)/settings/security"),
        },
        {
          icon: <Lock size={20} color={colors.danger} />,
          label: i18n.t("security.lockAccount"),
          onPress: () => {
            Alert.alert(
              "Lock Account",
              "Are you sure you want to lock your account? You'll need to contact support to unlock it.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Lock",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await kkPost("v1/security/freeze", {});
                      Alert.alert("Account Locked", "Your account has been locked. Contact support to unlock it.");
                      logout();
                    } catch {
                      Alert.alert("Error", "Failed to lock account. Please try again.");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: <Globe size={20} color={colors.textBody} />,
          label: i18n.t("settings.language"),
          sub: i18n.locale.toUpperCase(),
          onPress: () => {
            Alert.alert("Language", "Choose your preferred language", [
              { text: "English", onPress: () => { i18n.locale = "en"; } },
              { text: "Francais", onPress: () => { i18n.locale = "fr"; } },
              { text: "Kreyol Ayisyen", onPress: () => { i18n.locale = "ht"; } },
              { text: "Espanol", onPress: () => { i18n.locale = "es"; } },
              { text: "Cancel", style: "cancel" },
            ]);
          },
        },
        {
          icon: <Bell size={20} color={colors.textBody} />,
          label: i18n.t("settings.notifications"),
          onPress: () => router.push("/(tabs)/settings/notifications"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: <HelpCircle size={20} color={colors.textBody} />,
          label: i18n.t("settings.help"),
          onPress: () => Linking.openURL("https://kobklein.com/help"),
        },
        {
          icon: <Info size={20} color={colors.textBody} />,
          label: i18n.t("settings.about"),
          sub: i18n.t("settings.version", { version: "1.0.0" }),
          onPress: () => {
            Alert.alert("KobKlein", "KobKlein v1.0.0\nBuilt for Haiti \u{1F1ED}\u{1F1F9}");
          },
        },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>{i18n.t("settings.title")}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* User header */}
        <Card variant="gold" style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userKid}>{user?.kId}</Text>
          </View>
        </Card>

        {/* Settings sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.row,
                    idx < section.items.length - 1 && styles.rowBorder,
                  ]}
                  onPress={item.onPress}
                >
                  {item.icon}
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    {item.sub && <Text style={styles.rowSub}>{item.sub}</Text>}
                  </View>
                  {item.badge && (
                    <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                  )}
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutText}>{i18n.t("auth.signOut")}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  screenTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.textHeading,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: colors.black,
  },
  userName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.textHeading,
  },
  userKid: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.textHeading,
  },
  rowSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.xl,
    marginTop: spacing.md,
  },
  logoutText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.danger,
  },
});
