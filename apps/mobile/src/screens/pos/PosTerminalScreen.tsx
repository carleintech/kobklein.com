import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, Wifi, WifiOff, RefreshCw, Smartphone, Shield } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import * as Device from "expo-device";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { kkGet, kkPost } from "@/lib/api";
import { useAuthStore } from "@/context/auth-store";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii, shadows } from "@/constants/theme";
import { KNfcIconNative } from "./KNfcIconNative";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PosDevice {
  id: string;
  platform: string;
  deviceLabel: string;
  status: string;
}

interface PosSession {
  sessionToken: string;
  ndefUri: string;
  expiresAt: string;
  merchantHandle: string;
  platform: string;
}

interface RecentPayment {
  id: string;
  amount: number;
  currency: string;
  payerHandle: string;
  createdAt: string;
}

// ── NFC Manager (dynamic import — only on Android native) ─────────────────────

let NfcManager: any = null;
let NfcEvents: any  = null;

if (Platform.OS === "android") {
  try {
    const nfc = require("react-native-nfc-manager");
    NfcManager = nfc.default;
    NfcEvents  = nfc.NfcEvents;
  } catch {
    // Not installed — NFC unavailable
  }
}

// ── NFC helpers ────────────────────────────────────────────────────────────────

async function initNfc(): Promise<boolean> {
  if (!NfcManager) return false;
  try {
    const supported = await NfcManager.isSupported();
    if (!supported) return false;
    await NfcManager.start();
    return true;
  } catch {
    return false;
  }
}

async function startNfcReading(
  onDetected: (uri: string) => void
): Promise<void> {
  if (!NfcManager) return;
  try {
    await NfcManager.registerTagEvent();
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
      const ndefPayload = tag?.ndefMessage?.[0];
      if (ndefPayload?.payload) {
        // Decode NDEF URI record (first byte is URI prefix code)
        const bytes = ndefPayload.payload;
        const prefix = bytes[0] === 0x04 ? "https://" : ""; // 0x04 = https
        const uri = prefix + String.fromCharCode(...bytes.slice(1));
        if (uri.startsWith("kobklein://")) {
          onDetected(uri);
        }
      }
    });
  } catch {
    // NFC read failed silently
  }
}

async function stopNfcReading(): Promise<void> {
  if (!NfcManager) return;
  try {
    NfcManager.setEventListener(NfcEvents?.DiscoverTag, null);
    await NfcManager.unregisterTagEvent();
  } catch {}
}

// ── Main Component ─────────────────────────────────────────────────────────────

type Step = "checking" | "activation" | "activating" | "terminal";

export default function PosTerminalScreen() {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [step, setStep]                 = useState<Step>("checking");
  const [agreed, setAgreed]             = useState(false);
  const [activating, setActivating]     = useState(false);
  const [session, setSession]           = useState<PosSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [nfcReady, setNfcReady]         = useState(false);
  const [nfcReading, setNfcReading]     = useState(false);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [posDevice, setPosDevice]       = useState<PosDevice | null>(null);
  const [activeTab, setActiveTab]       = useState<"qr" | "nfc">("qr");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── On mount: check device registration ────────────────────────────────────
  useEffect(() => {
    checkDeviceRegistration();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      stopNfcReading();
    };
  }, []);

  async function checkDeviceRegistration() {
    try {
      const res = await kkGet<{ devices: PosDevice[]; hasActivePosDevice: boolean }>(
        "/v1/pos/devices/my"
      );
      if (res.hasActivePosDevice && res.devices.length > 0) {
        setPosDevice(res.devices[0]);
        setStep("terminal");
        await loadSession();
        startPolling();
        initNfcIfAndroid();
      } else {
        setStep("activation");
      }
    } catch {
      setStep("activation");
    }
  }

  // ── Activate this device as POS ────────────────────────────────────────────
  async function handleActivate() {
    if (!agreed) return;
    setActivating(true);
    try {
      const fingerprint = await getDeviceFingerprint();
      const label       = Device.deviceName ?? `${Device.manufacturer} ${Device.modelName}`;
      const platform    = Platform.OS === "ios" ? "ios" : "android";

      const device = await kkPost<PosDevice>("/v1/pos/devices/register", {
        deviceFingerprint:   fingerprint,
        deviceLabel:         label,
        platform,
        agreementAcceptedAt: new Date().toISOString(),
      });

      setPosDevice(device);
      setStep("terminal");
      await loadSession();
      startPolling();
      initNfcIfAndroid();
    } catch (err: any) {
      Alert.alert("Activation Failed", err?.message ?? "Please try again.");
    } finally {
      setActivating(false);
    }
  }

  async function getDeviceFingerprint(): Promise<string> {
    const raw = [
      Device.deviceName ?? "",
      Device.manufacturer ?? "",
      Device.modelName ?? "",
      Platform.OS,
      Device.osVersion ?? "",
    ].join("|");

    // Simple djb2 hash
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }

  // ── Load / refresh POS session ─────────────────────────────────────────────
  async function loadSession() {
    setSessionLoading(true);
    try {
      const s = await kkGet<PosSession>("/v1/pos/session/init");
      setSession(s);
    } catch {
      Alert.alert("Session Error", "Could not initialize payment session.");
    } finally {
      setSessionLoading(false);
    }
  }

  // ── NFC init (Android only) ────────────────────────────────────────────────
  async function initNfcIfAndroid() {
    if (Platform.OS !== "android") return;
    const ok = await initNfc();
    if (ok) {
      setNfcReady(true);
    }
  }

  async function toggleNfcReading() {
    if (nfcReading) {
      await stopNfcReading();
      setNfcReading(false);
    } else {
      await startNfcReading((uri) => {
        Alert.alert("Payment Detected", `NFC payment initiated:\n${uri}`);
        setNfcReading(false);
        stopNfcReading();
        setTimeout(loadRecentPayments, 2000);
      });
      setNfcReading(true);
    }
  }

  // ── Poll for new payments every 12 seconds ─────────────────────────────────
  function startPolling() {
    loadRecentPayments();
    pollRef.current = setInterval(loadRecentPayments, 12_000);
  }

  async function loadRecentPayments() {
    try {
      const res = await kkGet<RecentPayment[]>("/v1/merchant/recent-payments?limit=5");
      setRecentPayments(res);
    } catch {
      // Silently fail — polling will retry
    }
  }

  // ── Session expiry check ───────────────────────────────────────────────────
  const isExpired = session ? new Date(session.expiresAt) < new Date() : false;

  // ── Render: checking ───────────────────────────────────────────────────────
  if (step === "checking") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.loadingText}>Checking device status…</Text>
      </View>
    );
  }

  // ── Render: activation gate ────────────────────────────────────────────────
  if (step === "activation") {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.black }}
        contentContainerStyle={[styles.activationContainer, { paddingTop: insets.top + 16 }]}
      >
        {/* Icon */}
        <View style={styles.iconRing}>
          <KNfcIconNative size={64} active={false} />
        </View>

        <Text style={styles.activationTitle}>Activate POS Terminal</Text>
        <Text style={styles.activationSub}>
          Turn your phone into a KobKlein payment terminal
        </Text>

        {/* Device info */}
        <Card style={styles.deviceCard}>
          <Smartphone size={18} color={colors.textMuted} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.deviceName}>
              {Device.deviceName ?? `${Device.manufacturer} ${Device.modelName}`}
            </Text>
            <Text style={styles.devicePlatform}>{Platform.OS} · V1 terminal</Text>
          </View>
        </Card>

        {/* Agreement terms */}
        <Text style={styles.agreementHeader}>By activating, you confirm:</Text>
        {AGREEMENT_ITEMS.map((item, i) => (
          <View key={i} style={styles.agreementItem}>
            <View style={styles.checkDot}>
              <CheckCircle2 size={12} color={colors.gold} />
            </View>
            <Text style={styles.agreementText}>{item}</Text>
          </View>
        ))}

        {/* Security note */}
        <Card style={styles.securityCard}>
          <Shield size={14} color={colors.gold} />
          <Text style={styles.securityText}>
            <Text style={{ color: colors.gold, fontFamily: fonts.sansSemiBold }}>Secure: </Text>
            Sessions are signed with HMAC-SHA256. Expire in 15 minutes. No card data stored.
          </Text>
        </Card>

        {/* Agree checkbox */}
        <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed((v) => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <CheckCircle2 size={14} color={colors.black} />}
          </View>
          <Text style={styles.agreeText}>I agree to the KobKlein POS Merchant Terms</Text>
        </TouchableOpacity>

        {/* Buttons */}
        <Button
          onPress={handleActivate}
          disabled={!agreed || activating}
          loading={activating}
          style={{ marginTop: 8 }}
        >
          {activating ? "Activating…" : "Accept & Activate"}
        </Button>
      </ScrollView>
    );
  }

  // ── Render: POS terminal ───────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={[styles.terminalContainer, { paddingTop: insets.top + 8 }]}
    >
      {/* Header */}
      <View style={styles.terminalHeader}>
        <View>
          <Text style={styles.terminalTitle}>POS Terminal</Text>
          <Text style={styles.terminalSub}>
            @{session?.merchantHandle ?? user?.handle ?? "merchant"}
          </Text>
        </View>
        <KNfcIconNative size={44} active />
      </View>

      {/* Tab selector: QR | NFC */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "qr" && styles.tabActive]}
          onPress={() => setActiveTab("qr")}
        >
          <Text style={[styles.tabText, activeTab === "qr" && styles.tabTextActive]}>
            QR Code
          </Text>
        </TouchableOpacity>
        {Platform.OS === "android" && nfcReady && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "nfc" && styles.tabActive]}
            onPress={() => setActiveTab("nfc")}
          >
            <Text style={[styles.tabText, activeTab === "nfc" && styles.tabTextActive]}>
              NFC Mode
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── QR Tab ────────────────────────────────────────────────────── */}
      {activeTab === "qr" && (
        <Card variant="gold" style={styles.qrCard}>
          {sessionLoading ? (
            <ActivityIndicator color={colors.gold} size="large" style={{ padding: 60 }} />
          ) : session && !isExpired ? (
            <>
              <View style={styles.qrBox}>
                <QRCode
                  value={session.ndefUri}
                  size={200}
                  backgroundColor="#FFFFFF"
                  color="#080B14"
                />
              </View>
              <Text style={styles.qrHint}>
                Customer scans this QR to pay
              </Text>
              <Text style={styles.qrExpiry}>
                Expires: {new Date(session.expiresAt).toLocaleTimeString()}
              </Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={loadSession}>
                <RefreshCw size={14} color={colors.gold} />
                <Text style={styles.refreshText}>Refresh Session</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.expiredContainer}>
              <WifiOff size={32} color={colors.textMuted} />
              <Text style={styles.expiredText}>Session expired</Text>
              <Button onPress={loadSession} size="sm" variant="outline">
                New Session
              </Button>
            </View>
          )}
        </Card>
      )}

      {/* ── NFC Tab (Android only) ─────────────────────────────────────── */}
      {activeTab === "nfc" && Platform.OS === "android" && (
        <Card variant="gold" style={styles.nfcCard}>
          <KNfcIconNative size={72} active={nfcReading} />
          <Text style={styles.nfcStatus}>
            {nfcReading ? "Listening for payment…" : "Tap to start NFC payment"}
          </Text>
          <Text style={styles.nfcHint}>
            {nfcReading
              ? "Hold customer's phone near yours"
              : "Activates NFC reader on this device"}
          </Text>
          <Button
            onPress={toggleNfcReading}
            variant={nfcReading ? "outline" : "primary"}
            style={{ marginTop: 12 }}
          >
            {nfcReading ? "Stop NFC" : "Start NFC"}
          </Button>
        </Card>
      )}

      {/* ── Recent Payments ──────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        <TouchableOpacity onPress={loadRecentPayments}>
          <RefreshCw size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {recentPayments.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No payments yet — share your QR code</Text>
        </Card>
      ) : (
        recentPayments.map((p) => (
          <View key={p.id} style={styles.paymentRow}>
            <View style={styles.paymentIcon}>
              <CheckCircle2 size={18} color="#16C784" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentFrom}>@{p.payerHandle}</Text>
              <Text style={styles.paymentTime}>
                {new Date(p.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.paymentAmount}>
              +{formatCurrency(p.amount, p.currency)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ── Agreement items ────────────────────────────────────────────────────────────

const AGREEMENT_ITEMS = [
  "This device is authorized to receive KobKlein payments",
  "All transactions are logged, auditable, and reported",
  "You are responsible for the physical security of this device",
  "KobKlein may revoke POS access if misuse is detected",
  "You accept responsibility for all payments processed",
];

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Activation
  activationContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: 48,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(201,168,76,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.20)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
  },
  activationTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.textHeading,
    textAlign: "center",
  },
  activationSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: -4,
  },
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  deviceName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.textBody,
  },
  devicePlatform: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  agreementHeader: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  agreementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 2,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(201,168,76,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  agreementText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 20,
  },
  securityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: spacing.md,
    backgroundColor: "rgba(201,168,76,0.05)",
    borderColor: "rgba(201,168,76,0.15)",
  },
  securityText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 17,
  },
  agreeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(201,168,76,0.40)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  agreeText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textBody,
  },

  // Terminal
  terminalContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: 32,
  },
  terminalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  terminalTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.textHeading,
  },
  terminalSub: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.gold,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radii.md,
  },
  tabActive: {
    backgroundColor: colors.panel,
  },
  tabText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.gold,
  },

  // QR
  qrCard: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  qrBox: {
    width: 220,
    height: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  qrHint: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textBody,
    marginTop: spacing.lg,
  },
  qrExpiry: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    padding: spacing.sm,
  },
  refreshText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.gold,
  },
  expiredContainer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: spacing["2xl"],
  },
  expiredText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },

  // NFC
  nfcCard: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing["3xl"],
  },
  nfcStatus: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.textHeading,
  },
  nfcHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Payments
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(22,199,132,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentFrom: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textHeading,
  },
  paymentTime: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentAmount: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: "#16C784",
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
