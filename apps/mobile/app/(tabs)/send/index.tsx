import { useCallback, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, Send, Shield } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "@/components/ui/Toast";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { useWalletStore } from "@/context/wallet-store";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import i18n from "@/i18n";
import { kkPost } from "@/lib/api";

type Step = "input" | "preview" | "otp" | "success";

const DIGIT_KEYS = ["d0", "d1", "d2", "d3", "d4", "d5"] as const;

interface RecipientInfo {
  recipientId: string;
  firstName: string | null;
  lastName: string | null;
  handle: string | null;
  kId: string | null;
}

interface AttemptResponse {
  ok?: boolean;
  transferId?: string;
  otpRequired?: boolean;
  challengeId?: string;
  otpCode?: string;
  riskLevel?: string;
  riskScore?: number;
}

function recipientDisplayName(r: RecipientInfo): string {
  const full = [r.firstName, r.lastName].filter(Boolean).join(" ");
  return full || r.handle || r.kId || "Unknown";
}

export default function SendScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const params   = useLocalSearchParams<{ to?: string }>();
  const { show } = useToast();
  const { optimisticDebit, refresh } = useWalletStore();

  const [step, setStep]         = useState<Step>("input");
  const [query, setQuery]       = useState(params.to ?? "");
  const [amount, setAmount]     = useState("");
  const [currency, setCurrency] = useState("HTG");

  const [recipient, setRecipient]   = useState<RecipientInfo | null>(null);
  const [resolving, setResolving]   = useState(false);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode]         = useState<string | null>(null);
  const [manualOtp, setManualOtp]     = useState("");
  const [transferId, setTransferId]   = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  /* ── Resolve recipient ──────────────────────────────────────────── */
  const handleResolve = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setResolving(true);
    setRecipient(null);
    try {
      const res = await kkPost<{
        exists: boolean;
        selfMatch?: boolean;
        recipientId?: string;
        firstName?: string | null;
        lastName?: string | null;
        handle?: string | null;
        kId?: string | null;
      }>("/v1/transfers/check-recipient", { query: q });

      if (!res.exists) {
        show(
          res.selfMatch ? "Cannot send to yourself." : "Recipient not found.",
          "error",
        );
        return;
      }
      setRecipient({
        recipientId: res.recipientId ?? "",
        firstName: res.firstName ?? null,
        lastName: res.lastName ?? null,
        handle: res.handle ?? null,
        kId: res.kId ?? null,
      });
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : i18n.t("error.generic"), "error");
    } finally {
      setResolving(false);
    }
  }, [query, show]);

  /* ── Attempt transfer ───────────────────────────────────────────── */
  const handleAttempt = useCallback(async () => {
    if (!recipient || !amount) return;
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      show("Enter a valid amount.", "error");
      return;
    }
    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await kkPost<AttemptResponse>(
        "/v1/transfers/attempt",
        { recipientUserId: recipient.recipientId, amount: numAmount, currency },
        { "Idempotency-Key": idempotencyKey },
      );

      if (res.otpRequired && res.challengeId) {
        setChallengeId(res.challengeId);
        setOtpCode(res.otpCode ?? null);
        setStep("otp");
      } else if (res.ok && res.transferId) {
        optimisticDebit(currency, numAmount);
        setTransferId(res.transferId);
        setStep("success");
      }
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : i18n.t("error.generic"), "error");
    } finally {
      setLoading(false);
    }
  }, [recipient, amount, currency, optimisticDebit, show]);

  /* ── Confirm OTP ────────────────────────────────────────────────── */
  const handleConfirm = useCallback(async () => {
    const code = otpCode ?? manualOtp;
    if (!challengeId || !code || code.length < 6) return;
    setLoading(true);
    try {
      const res = await kkPost<{ ok: boolean; transferId?: string }>(
        "/v1/transfers/confirm",
        { challengeId, otpCode: code },
      );
      if (res.ok) {
        optimisticDebit(currency, parseFloat(amount));
        setTransferId(res.transferId ?? null);
        setStep("success");
      }
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : i18n.t("error.generic"), "error");
    } finally {
      setLoading(false);
    }
  }, [challengeId, otpCode, manualOtp, currency, amount, optimisticDebit, show]);

  const handleDone = () => {
    refresh();
    router.back();
  };

  const reset = () => {
    setStep("input");
    setQuery("");
    setAmount("");
    setRecipient(null);
    setChallengeId(null);
    setOtpCode(null);
    setManualOtp("");
    setTransferId(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.screenTitle}>{i18n.t("send.title")}</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── INPUT ───────────────────────────────────────────── */}
          {step === "input" && (
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{i18n.t("send.to")}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flex]}
                    value={query}
                    onChangeText={(t) => { setQuery(t); setRecipient(null); }}
                    placeholder="K-ID, phone, or @handle"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    returnKeyType="search"
                    onSubmitEditing={handleResolve}
                  />
                  <TouchableOpacity
                    style={styles.lookupBtn}
                    onPress={handleResolve}
                    disabled={resolving || !query.trim()}
                  >
                    {resolving
                      ? <ActivityIndicator size="small" color={colors.gold} />
                      : <Send size={18} color={colors.gold} />}
                  </TouchableOpacity>
                </View>

                {recipient && (
                  <View style={styles.recipientChip}>
                    <Text style={styles.recipientName}>
                      {recipientDisplayName(recipient)}
                    </Text>
                    {recipient.kId && (
                      <Text style={styles.recipientSub}>{recipient.kId}</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{i18n.t("send.amount")}</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.currencyRow}>
                {["HTG", "USD"].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                    onPress={() => setCurrency(c)}
                  >
                    <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                      {c === "HTG" ? "🇭🇹 HTG" : "🇺🇸 USD"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.btn, styles.btnGold, (!recipient || !amount) && styles.btnDisabled]}
                onPress={() => { if (recipient && amount) setStep("preview"); }}
                disabled={!recipient || !amount}
              >
                <Text style={styles.btnGoldText}>Review Transfer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── PREVIEW ─────────────────────────────────────────── */}
          {step === "preview" && recipient && (
            <View style={styles.form}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>You're sending</Text>
                <Text style={styles.summaryAmount}>
                  {formatCurrency(parseFloat(amount) || 0, currency)}
                </Text>
                <Text style={styles.summaryTo}>to</Text>
                <Text style={styles.summaryRecipient}>
                  {recipientDisplayName(recipient)}
                </Text>
                {recipient.kId && (
                  <Text style={styles.summaryKid}>{recipient.kId}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.btn, styles.btnGold, loading && styles.btnDisabled]}
                onPress={handleAttempt}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color={colors.black} />
                  : <Text style={styles.btnGoldText}>Send Now</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnGhost} onPress={() => setStep("input")} disabled={loading}>
                <Text style={styles.btnGhostText}>{i18n.t("back")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── OTP ─────────────────────────────────────────────── */}
          {step === "otp" && (
            <View style={styles.form}>
              <View style={styles.otpCard}>
                <View style={styles.otpIconWrap}>
                  <Shield size={28} color={colors.gold} />
                </View>
                <Text style={styles.otpTitle}>Security Verification</Text>
                <Text style={styles.otpSub}>
                  {otpCode
                    ? "Your code is ready. Tap Confirm & Send."
                    : "Enter the 6-digit verification code."}
                </Text>

                {otpCode ? (
                  <View style={styles.digitRow}>
                    {DIGIT_KEYS.map((key, i) => (
                      <View key={key} style={styles.digitBox}>
                        <Text style={styles.digitText}>{otpCode[i] ?? ""}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    style={styles.otpInput}
                    value={manualOtp}
                    onChangeText={(v) => setManualOtp(v.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                )}
              </View>

              <TouchableOpacity
                style={[styles.btn, styles.btnGold, loading && styles.btnDisabled]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color={colors.black} />
                  : <Text style={styles.btnGoldText}>Confirm & Send</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnGhost} onPress={reset} disabled={loading}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── SUCCESS ─────────────────────────────────────────── */}
          {step === "success" && (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <CheckCircle2 size={56} color={colors.emerald} />
              </View>
              <Text style={styles.successTitle}>{i18n.t("send.success")}</Text>
              {recipient && (
                <Text style={styles.successRecipient}>
                  {formatCurrency(parseFloat(amount) || 0, currency)} sent to{" "}
                  {recipientDisplayName(recipient)}
                </Text>
              )}
              {transferId && (
                <Text style={styles.successRef}>Ref: {transferId.slice(0, 12)}…</Text>
              )}

              <TouchableOpacity
                style={[styles.btn, styles.btnGold, { marginTop: spacing["3xl"] }]}
                onPress={handleDone}
              >
                <Text style={styles.btnGoldText}>{i18n.t("done")}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnGhost} onPress={reset}>
                <Text style={styles.btnGhostText}>Send Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    paddingBottom: 48,
  },
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  lookupBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  recipientChip: {
    backgroundColor: "rgba(31,111,74,0.12)",
    borderWidth: 1,
    borderColor: "rgba(31,111,74,0.3)",
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  recipientName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.emerald,
  },
  recipientSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  currencyRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  currencyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyBtnActive: {
    backgroundColor: "rgba(198,167,86,0.15)",
    borderColor: colors.gold,
  },
  currencyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  currencyTextActive: {
    color: colors.gold,
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
  btnGhost: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  btnGhostText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  btnDisabled: { opacity: 0.5 },
  // Preview
  summaryCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderGold,
    padding: spacing["2xl"],
    alignItems: "center",
    gap: spacing.xs,
  },
  summaryLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryAmount: {
    fontFamily: fonts.serif,
    fontSize: 40,
    color: colors.gold,
    marginVertical: 4,
  },
  summaryTo: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryRecipient: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.textHeading,
  },
  summaryKid: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  // OTP
  otpCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderGold,
    padding: spacing["2xl"],
    alignItems: "center",
    gap: spacing.lg,
  },
  otpIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(198,167,86,0.10)",
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: "center",
    justifyContent: "center",
  },
  otpTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.textHeading,
  },
  otpSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  digitRow: {
    flexDirection: "row",
    gap: 8,
  },
  digitBox: {
    width: 40,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(198,167,86,0.08)",
    borderWidth: 1,
    borderColor: "rgba(198,167,86,0.30)",
    alignItems: "center",
    justifyContent: "center",
  },
  digitText: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: colors.goldLight,
  },
  otpInput: {
    height: 56,
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: "rgba(198,167,86,0.06)",
    textAlign: "center",
    fontFamily: fonts.sansBold,
    fontSize: 28,
    letterSpacing: 12,
    color: colors.goldLight,
  },
  // Success
  successContainer: {
    alignItems: "center",
    paddingTop: spacing["5xl"],
    gap: spacing.md,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "rgba(31,111,74,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.emerald,
  },
  successRecipient: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textBody,
    textAlign: "center",
  },
  successRef: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
  },
});
