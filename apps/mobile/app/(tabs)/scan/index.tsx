import { useAuthStore } from "@/context/auth-store";
import PosTerminalScreen from "@/screens/pos/PosTerminalScreen";
import ScanQrScreen from "./ScanQrScreen";

/**
 * Scan / POS tab entry point.
 * - Merchant / Distributor → full POS Terminal (K-NFC + QR session + NFC reader)
 * - Client / Diaspora       → Customer QR scanner
 */
export default function ScanTab() {
  const { user } = useAuthStore();
  const role = user?.role ?? "user";

  if (role === "merchant" || role === "distributor") {
    return <PosTerminalScreen />;
  }

  return <ScanQrScreen />;
}
