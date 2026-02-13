import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/context/auth-store";
import { colors, fonts, spacing } from "@/constants/theme";
import i18n from "@/i18n";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuthStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gold gradient accent */}
      <View style={styles.gradientAccent} />

      <View style={styles.content}>
        {/* Logo placeholder */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>K</Text>
        </View>

        <Text style={styles.title}>{i18n.t("auth.welcome")}</Text>
        <Text style={styles.tagline}>{i18n.t("auth.tagline")}</Text>

        {/* Feature highlights */}
        <View style={styles.features}>
          {[
            { emoji: "⚡", text: "Instant transfers" },
            { emoji: "🔒", text: "Bank-grade security" },
            { emoji: "🌍", text: "Send money worldwide" },
            { emoji: "💰", text: "Lowest fees" },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          onPress={login}
          loading={isLoading}
          size="lg"
          style={styles.signInBtn}
        >
          {i18n.t("auth.signIn")}
        </Button>

        <Button
          onPress={login}
          variant="outline"
          size="lg"
          style={styles.signUpBtn}
        >
          {i18n.t("auth.signUp")}
        </Button>

        <Text style={styles.disclaimer}>
          By continuing, you agree to KobKlein's Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  gradientAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: colors.navy,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing["2xl"],
  },
  logoText: {
    fontFamily: fonts.serif,
    fontSize: 40,
    color: colors.black,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.textHeading,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing["4xl"],
  },
  features: {
    alignSelf: "stretch",
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.textBody,
  },
  bottom: {
    paddingHorizontal: spacing["2xl"],
    gap: 12,
  },
  signInBtn: {
    width: "100%",
  },
  signUpBtn: {
    width: "100%",
  },
  disclaimer: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
