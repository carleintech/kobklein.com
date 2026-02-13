import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { QrCode, ScanLine } from "lucide-react-native";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/context/auth-store";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

type Tab = "scan" | "myqr";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("scan");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Try parsing as kobklein:// deep link
      if (data.startsWith("kobklein://pay")) {
        const url = new URL(data);
        const recipientId = url.searchParams.get("to") ?? "";
        const amount = url.searchParams.get("amount") ?? "";
        const currency = url.searchParams.get("currency") ?? "HTG";
        router.push({
          pathname: "/(tabs)/send",
          params: { recipientId, amount, currency },
        });
        return;
      }

      // Try parsing as JSON QR code
      const parsed = JSON.parse(data);
      if (parsed.type === "pay" && parsed.recipientId) {
        router.push({
          pathname: "/(tabs)/send",
          params: {
            recipientId: parsed.recipientId,
            amount: parsed.amount ? String(parsed.amount) : "",
            currency: parsed.currency ?? "HTG",
          },
        });
        return;
      }

      // Valid JSON but not a recognized KobKlein QR format
      Alert.alert("Invalid QR Code", "This QR code is not a valid KobKlein payment code.");
    } catch {
      // Not JSON — treat as a plain K-ID or phone number
      const trimmed = data.trim();
      if (trimmed.length > 0) {
        router.push({
          pathname: "/(tabs)/send",
          params: { recipientId: trimmed },
        });
        return;
      }

      Alert.alert("Invalid QR Code", "Could not read this QR code. Please try again.");
    } finally {
      setTimeout(() => setScanned(false), 3000);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "scan" && styles.tabActive]}
          onPress={() => setTab("scan")}
        >
          <ScanLine size={16} color={tab === "scan" ? colors.gold : colors.textMuted} />
          <Text style={[styles.tabText, tab === "scan" && styles.tabTextActive]}>
            {i18n.t("pay.scanQr")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "myqr" && styles.tabActive]}
          onPress={() => setTab("myqr")}
        >
          <QrCode size={16} color={tab === "myqr" ? colors.gold : colors.textMuted} />
          <Text style={[styles.tabText, tab === "myqr" && styles.tabTextActive]}>
            {i18n.t("pay.myQr")}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "scan" ? (
        <View style={styles.scanContainer}>
          {!permission?.granted ? (
            <View style={styles.permissionContainer}>
              <ScanLine size={48} color={colors.textMuted} />
              <Text style={styles.permissionText}>
                Camera access is needed to scan QR codes
              </Text>
              <Button onPress={requestPermission}>
                Allow Camera
              </Button>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={handleBarCodeScanned}
              />
              {/* Scan overlay */}
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
              </View>
              <Text style={styles.scanHint}>
                Point your camera at a merchant QR code
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.qrContainer}>
          <Card variant="gold" style={styles.qrCard}>
            <View style={styles.qrPlaceholder}>
              <QrCode size={120} color={colors.gold} />
            </View>
            <Text style={styles.qrName}>{user?.name}</Text>
            <Text style={styles.qrKid}>{user?.kId}</Text>
            {user?.handle && (
              <Text style={styles.qrHandle}>@{user.handle}</Text>
            )}
          </Card>
          <Text style={styles.qrHint}>{i18n.t("pay.shareQr")}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
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
  scanContainer: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: spacing["2xl"],
  },
  permissionText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
  cameraWrapper: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radii.xl,
    backgroundColor: "transparent",
  },
  scanHint: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textBody,
    textAlign: "center",
    padding: spacing.lg,
    backgroundColor: colors.black,
  },
  qrContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  qrCard: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing["2xl"],
    width: "100%",
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
  },
  qrName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.textHeading,
  },
  qrKid: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  qrHandle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.gold,
    marginTop: 2,
  },
  qrHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
