import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuthStore } from "@/context/auth-store";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [done, setDone]           = useState(false);

  async function handleRegister() {
    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { needsEmailConfirmation } = await register(
        email.trim().toLowerCase(),
        password,
        firstName.trim(),
        lastName.trim(),
      );
      if (needsEmailConfirmation) {
        setDone(true);
      }
      // If no email confirmation required, onAuthStateChange(SIGNED_IN) handles routing
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  // Email confirmation pending screen
  if (done) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <View style={styles.confirmedContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>K</Text>
          </View>
          <Text style={styles.confirmedTitle}>Check your email</Text>
          <Text style={styles.confirmedBody}>
            We sent a confirmation link to{"\n"}
            <Text style={{ color: colors.gold }}>{email}</Text>
            {"\n\n"}Click the link to activate your account, then sign in.
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnGold, { marginTop: spacing["3xl"] }]}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.btnGoldText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join KobKlein — it's free</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={[styles.field, styles.flex]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Jean"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.field, styles.flex]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Pierre"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              onSubmitEditing={handleRegister}
              returnKeyType="go"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnGold, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.btnGoldText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign in link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          By creating an account, you agree to KobKlein's Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.black },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing["2xl"],
    backgroundColor: colors.black,
  },
  header: {
    marginBottom: spacing["3xl"],
  },
  backBtn: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.textHeading,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing["3xl"],
  },
  errorBox: {
    backgroundColor: "rgba(220,38,38,0.12)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.3)",
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "#F87171",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textHeading,
  },
  btn: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGold: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGoldText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.black,
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  footerLink: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.gold,
  },
  disclaimer: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    opacity: 0.7,
  },
  confirmedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing["2xl"],
  },
  logoLetter: {
    fontFamily: fonts.serif,
    fontSize: 38,
    color: colors.black,
  },
  confirmedTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.textHeading,
    marginBottom: spacing.md,
  },
  confirmedBody: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textBody,
    textAlign: "center",
    lineHeight: 22,
  },
});
