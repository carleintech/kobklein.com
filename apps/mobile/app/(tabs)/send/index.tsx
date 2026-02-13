import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, ArrowRight, CheckCircle2, Shield } from "lucide-react-native";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useWalletStore } from "@/context/wallet-store";
import { kkPost } from "@/lib/api";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

type Step = "input" | "preview" | "otp" | "success";

interface TransferPreview {
  attemptId: string;
  fromCurrency: string;
  toCurrency: string;
  sendAmount: number;
  receiveAmount: number;
  fxRate: number | null;
  fee: number;
  total: number;
  recipientName: string;
}

export default function SendScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ to?: string }>();
  const { show } = useToast();
  const { optimisticDebit, refresh } = useWalletStore();

  const [step, setStep] = useState<Step>("input");
  const [recipient, setRecipient] = useState(params.to ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("HTG");
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePreview = useCallback(async () => {
    if (!recipient || !amount) return;
    setLoading(true);
    try {
      const data = await kkPost<TransferPreview>("/v1/transfers/attempt", {
        recipientIdentifier: recipient,
        amount: parseFloat(amount),
        currency,
      });
      setPreview(data);
      setStep("preview");
    } catch (err: any) {
      show(err?.message ?? i18n.t("error.generic"), "error");
    }
    setLoading(false);
  }, [recipient, amount, currency]);

  const handleConfirm = useCallback(async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await kkPost("/v1/transfers/confirm", {
        attemptId: preview.attemptId,
        otp,
      });
      optimisticDebit(preview.fromCurrency, preview.total);
      setStep("success");
    } catch (err: any) {
      show(err?.message ?? i18n.t("error.generic"), "error");
    }
    setLoading(false);
  }, [preview, otp]);

  const handleDone = () => {
    refresh();
    router.back();
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
        >
          {/* Step: Input */}
          {step === "input" && (
            <View style={styles.form}>
              <Input
                label={i18n.t("send.to")}
                value={recipient}
                onChangeText={setRecipient}
                placeholder="K-ID, phone, or @handle"
                autoCapitalize="none"
                icon={<Send size={16} color={colors.textMuted} />}
              />

              <Input
                label={i18n.t("send.amount")}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              {/* Currency Selector */}
              <View style={styles.currencyRow}>
                {["HTG", "USD"].map((c) => (
                  <Button
                    key={c}
                    variant={currency === c ? "primary" : "secondary"}
                    size="sm"
                    onPress={() => setCurrency(c)}
                    style={styles.currencyBtn}
                  >
                    {c === "HTG" ? "🇭🇹 HTG" : "🇺🇸 USD"}
                  </Button>
                ))}
              </View>

              <Button onPress={handlePreview} loading={loading} size="lg">
                {i18n.t("send.preview")}
              </Button>
            </View>
          )}

          {/* Step: Preview */}
          {step === "preview" && preview && (
            <View style={styles.form}>
              <Card variant="gold">
                <View style={styles.previewHeader}>
                  <Text style={styles.previewLabel}>{i18n.t("send.theyReceive")}</Text>
                  <Text style={styles.previewAmount}>
                    {formatCurrency(preview.receiveAmount, preview.toCurrency)}
                  </Text>
                  <Text style={styles.previewRecipient}>
                    {preview.recipientName}
                  </Text>
                </View>
              </Card>

              <Card>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{i18n.t("send.amount")}</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(preview.sendAmount, preview.fromCurrency)}
                  </Text>
                </View>
                {preview.fxRate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{i18n.t("send.rate")}</Text>
                    <Text style={styles.detailValue}>
                      1 {preview.fromCurrency} = {preview.fxRate.toFixed(2)} {preview.toCurrency}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{i18n.t("send.fee")}</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(preview.fee, preview.fromCurrency)}
                  </Text>
                </View>
                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>{i18n.t("send.total")}</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(preview.total, preview.fromCurrency)}
                  </Text>
                </View>
              </Card>

              <Button onPress={() => setStep("otp")} size="lg">
                {i18n.t("send.confirm")}
              </Button>
              <Button onPress={() => setStep("input")} variant="ghost" size="sm">
                {i18n.t("back")}
              </Button>
            </View>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <View style={styles.form}>
              <Card>
                <View style={styles.otpContainer}>
                  <Shield size={32} color={colors.gold} />
                  <Text style={styles.otpTitle}>{i18n.t("send.enterOtp")}</Text>
                  <Text style={styles.otpSub}>
                    {i18n.t("send.otpSent", { phone: "****" })}
                  </Text>
                </View>
              </Card>

              <Input
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }}
              />

              <Button onPress={handleConfirm} loading={loading} size="lg">
                {i18n.t("confirm")}
              </Button>
            </View>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <View style={styles.successContainer}>
              <CheckCircle2 size={64} color={colors.emerald} />
              <Text style={styles.successTitle}>{i18n.t("send.success")}</Text>
              {preview && (
                <Text style={styles.successAmount}>
                  {formatCurrency(preview.receiveAmount, preview.toCurrency)}
                </Text>
              )}
              <Text style={styles.successSub}>
                sent to {preview?.recipientName}
              </Text>

              <Button onPress={handleDone} size="lg" style={{ marginTop: 32 }}>
                {i18n.t("done")}
              </Button>
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
    paddingBottom: 40,
  },
  form: {
    gap: spacing.lg,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  currencyBtn: {
    flex: 1,
  },
  previewHeader: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  previewLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewAmount: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.gold,
    marginTop: 4,
  },
  previewRecipient: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textBody,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  detailLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textHeading,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 12,
  },
  totalLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textHeading,
  },
  totalValue: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.gold,
  },
  otpContainer: {
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.lg,
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
  },
  successContainer: {
    alignItems: "center",
    paddingTop: spacing["5xl"],
  },
  successTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.emerald,
    marginTop: spacing.lg,
  },
  successAmount: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.textHeading,
    marginTop: 8,
  },
  successSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
});
