import { Tabs } from "expo-router";
import { Home, Wallet, Send, ScanLine, Settings } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";
import { useAuthStore } from "@/context/auth-store";
import i18n from "@/i18n";

export default function TabsLayout() {
  const { user } = useAuthStore();
  const role = user?.role ?? "user";

  // Merchant & Distributor get "Scan" tab, others get "Send"
  const showScan = role === "merchant" || role === "distributor";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navy,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t("tab.home"),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: i18n.t("tab.wallet"),
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: showScan ? i18n.t("tab.scan") : i18n.t("tab.send"),
          tabBarIcon: ({ color, size }) =>
            showScan ? (
              <ScanLine size={size} color={color} />
            ) : (
              <Send size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: i18n.t("tab.scan"),
          tabBarIcon: ({ color, size }) => <ScanLine size={size} color={color} />,
          href: showScan ? undefined : null, // Hide for non-merchant/distributor
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: i18n.t("tab.settings"),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
