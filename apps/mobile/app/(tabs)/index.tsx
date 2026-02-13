import { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/context/auth-store";
import { useWalletStore } from "@/context/wallet-store";
import { colors, fonts, spacing } from "@/constants/theme";
import i18n from "@/i18n";

import ClientDashboard from "@/screens/dashboards/ClientDashboard";
import DiasporaDashboard from "@/screens/dashboards/DiasporaDashboard";
import MerchantDashboard from "@/screens/dashboards/MerchantDashboard";
import DistributorDashboard from "@/screens/dashboards/DistributorDashboard";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { refresh, loading } = useWalletStore();

  useEffect(() => {
    refresh();
  }, []);

  const role = user?.role ?? "user";
  const displayName = user?.name?.split(" ")[0] ?? "User";

  const renderDashboard = () => {
    switch (role) {
      case "diaspora":
        return <DiasporaDashboard />;
      case "merchant":
        return <MerchantDashboard />;
      case "distributor":
        return <DistributorDashboard />;
      default:
        return <ClientDashboard />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {i18n.t("dashboard.greeting", { name: displayName })}
            </Text>
            <Text style={styles.kidLabel}>
              {user?.kId ?? ""}
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Role-specific dashboard */}
        {renderDashboard()}

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.textHeading,
  },
  kidLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.black,
  },
});
