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

interface TransferResponse {
  transactionId: string;
  reference: string;
  amount: number;
  currency: string;
}

export default function TransferFloatScreen() {
  const router = useRouter();

  const [agentId, setAgentId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResponse | null>(null);

  const canSubmit = agentId.trim().length > 0 && parseFloat(amount) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const data = await kkPost<TransferResponse>("/v1/distributor/float/transfer", {
        agentId: agentId.trim(),
        amount: parseFloat(amount),
        note: note.trim() || undefined,
      });
      setResult(data);
    } catch (err: any) {
      Alert.alert("Transfer Failed", err?.message ?? "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <CheckCircle size={56} color={colors.emerald} />
          <Text style={styles.successTitle}>Float Transfer Successful</Text>
          <Text style={styles.successRef}>Reference: {result.reference}</Text>
          <Text style={styles.successAmount}>
            HTG {result.amount.toLocaleString()}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setResult(null);
              setAgentId("");
              setAmount("");
              setNote("");
            }}
          >
            <Text style={styles.primaryButtonText}>New Transfer</Text>
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
            <Text style={styles.headerTitle}>Transfer Float</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Recipient Agent Phone or K-ID</Text>
              <TextInput
                style={styles.input}
                value={agentId}
                onChangeText={setAgentId}
                placeholder="e.g. +509 1234 5678 or K-654321"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Amount (HTG)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="Add a description..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.black} />
              ) : (
                <Text style={styles.submitButtonText}>Transfer Float</Text>
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
  noteInput: {
    minHeight: 80,
    paddingTop: spacing.md,
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
    color: colors.gold,
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
