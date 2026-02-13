import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle } from "lucide-react-native";
import { kkPost } from "@/lib/api";
import { colors, fonts, spacing, radii } from "@/constants/theme";

interface CodeLookupResponse {
  amount: number;
  currency: string;
  customerName: string;
}

interface CashOutResponse {
  transactionId: string;
  reference: string;
  amount: number;
  currency: string;
}

export default function CashOutScreen() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<CodeLookupResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CashOutResponse | null>(null);

  const handleLookup = async () => {
    if (code.trim().length === 0) return;
    setLookupLoading(true);
    setLookup(null);
    try {
      const data = await kkPost<CodeLookupResponse>("/v1/distributor/cash-out/lookup", {
        code: code.trim(),
      });
      setLookup(data);
    } catch (err: any) {
      Alert.alert("Lookup Failed", err?.message ?? "Invalid or expired withdrawal code.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!lookup) return;
    setLoading(true);
    try {
      const data = await kkPost<CashOutResponse>("/v1/distributor/cash-out", {
        code: code.trim(),
      });
      setResult(data);
    } catch (err: any) {
      Alert.alert("Cash Out Failed", err?.message ?? "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <CheckCircle size={56} color={colors.emerald} />
          <Text style={styles.successTitle}>Cash Out Successful</Text>
          <Text style={styles.successRef}>Reference: {result.reference}</Text>
          <Text style={styles.successAmount}>
            {result.currency} {result.amount.toLocaleString()}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setResult(null);
              setLookup(null);
              setCode("");
            }}
          >
            <Text style={styles.primaryButtonText}>New Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={22} color={colors.textHeading} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cash Out</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Withdrawal Code</Text>
              <View style={styles.codeRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    setLookup(null);
                  }}
                  placeholder="Enter customer's withdrawal code"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.lookupButton, code.trim().length === 0 && styles.lookupButtonDisabled]}
                  onPress={handleLookup}
                  disabled={code.trim().length === 0 || lookupLoading}
                >
                  {lookupLoading ? (
                    <ActivityIndicator color={colors.black} size="small" />
                  ) : (
                    <Text style={styles.lookupButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Lookup result */}
            {lookup && (
              <View style={styles.lookupCard}>
                <Text style={styles.lookupLabel}>Customer</Text>
                <Text style={styles.lookupValue}>{lookup.customerName}</Text>
                <View style={styles.lookupDivider} />
                <Text style={styles.lookupLabel}>Amount to Disburse</Text>
                <Text style={styles.lookupAmount}>
                  {lookup.currency} {lookup.amount.toLocaleString()}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, !lookup && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!lookup || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.black} />
              ) : (
                <Text style={styles.submitButtonText}>Process Cash Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.textHeading,
  },
  form: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.textHeading,
  },
  codeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  lookupButton: {
    backgroundColor: colors.gold,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  lookupButtonDisabled: {
    opacity: 0.5,
  },
  lookupButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.black,
  },
  lookupCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  lookupLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lookupValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.textHeading,
    marginTop: 4,
  },
  lookupDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  lookupAmount: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    color: colors.gold,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.gold,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.black,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  successTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.textHeading,
    marginTop: spacing.md,
  },
  successRef: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  successAmount: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    color: colors.emerald,
  },
  primaryButton: {
    backgroundColor: colors.gold,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["3xl"],
    alignItems: "center",
    marginTop: spacing.xl,
    width: "100%",
  },
  primaryButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.black,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
});
