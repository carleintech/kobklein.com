"use client";

/**
 * QrScanner — Camera-based QR code reader
 *
 * Uses the browser's camera (getUserMedia) + BarcodeDetector API
 * (Chrome 83+, Android Chrome, Edge) to read KobKlein QR codes.
 *
 * Falls back to manual code entry on unsupported browsers (Safari/iOS).
 *
 * Usage:
 *   <QrScanner onResult={(payload) => handlePayload(payload)} onClose={() => setOpen(false)} />
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Keyboard, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  onResult: (payload: string) => void;
  onClose: () => void;
  title?: string;
  hint?: string;
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const TEAL = "#0D9E8A";
const BORDER = "rgba(13,158,138,0.2)";

// ─── Detect BarcodeDetector support ──────────────────────────────────────────

const hasBarcodeDetector =
  typeof window !== "undefined" && "BarcodeDetector" in window;

// ─── Component ────────────────────────────────────────────────────────────────

export function QrScanner({ onResult, onClose, title = "Scan QR Code", hint = "Point your camera at a KobKlein QR code" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);

  const [mode, setMode] = useState<"camera" | "manual">(hasBarcodeDetector ? "camera" : "manual");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanning(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch (err: any) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : "Camera not available. Use manual entry instead.",
      );
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  // Barcode detection loop
  useEffect(() => {
    if (mode !== "camera" || !scanning || !hasBarcodeDetector) return;

    if (!detectorRef.current) {
      // @ts-ignore — BarcodeDetector is not in TS lib yet
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
    }

    let active = true;

    const detect = async () => {
      if (!active || !videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue as string;
          if (raw && active) {
            active = false;
            setFound(true);
            stopCamera();
            setTimeout(() => onResult(raw), 400);
          }
        }
      } catch {
        // Ignore per-frame errors
      }
      if (active) rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, scanning, stopCamera, onResult]);

  // Start camera on mount
  useEffect(() => {
    if (mode === "camera") startCamera();
    return () => stopCamera();
  }, [mode, facingMode, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const flipCamera = () => {
    stopCamera();
    setFacingMode((f) => (f === "environment" ? "user" : "environment"));
  };

  const submitManual = () => {
    const val = manualInput.trim();
    if (!val) return;
    onResult(val.startsWith("kobklein://") || val.startsWith("KK-") ? val : `kobklein://pay?kid=${val}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#000" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 z-10 relative"
        style={{ background: "rgba(0,0,0,0.7)" }}
      >
        <div>
          <div className="text-base font-bold text-white">{title}</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            {hint}
          </div>
        </div>
        <button
          type="button"
          onClick={() => { stopCamera(); onClose(); }}
          aria-label="Close scanner"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Camera view */}
      {mode === "camera" && (
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Scan frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner markers */}
              {[
                "top-0 left-0",
                "top-0 right-0 rotate-90",
                "bottom-0 right-0 rotate-180",
                "bottom-0 left-0 -rotate-90",
              ].map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos} w-10 h-10`}
                  style={{
                    borderTop: `3px solid ${TEAL}`,
                    borderLeft: `3px solid ${TEAL}`,
                  }}
                />
              ))}
              {/* Animated scan line */}
              {scanning && !found && (
                <motion.div
                  className="absolute left-2 right-2 h-0.5"
                  style={{ background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)` }}
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {/* Success flash */}
              <AnimatePresence>
                {found && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl"
                    style={{ background: "rgba(13,158,138,0.3)" }}
                  >
                    <CheckCircle2 className="h-16 w-16" style={{ color: TEAL }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Camera error */}
          <AnimatePresence>
            {cameraError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-24 left-4 right-4 p-4 rounded-2xl flex items-start gap-3"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">{cameraError}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom controls */}
          <div
            className="absolute bottom-0 left-0 right-0 px-6 py-6 flex items-center justify-between"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
          >
            <button
              type="button"
              onClick={() => { stopCamera(); setMode("manual"); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Keyboard className="h-4 w-4" />
              Enter code
            </button>

            <button
              type="button"
              onClick={cameraError ? startCamera : flipCamera}
              aria-label={cameraError ? "Retry camera" : "Flip camera"}
              title={cameraError ? "Retry camera" : "Flip camera"}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <RefreshCw className="h-5 w-5 text-white" />
            </button>

            <div style={{ width: 96 }} />
          </div>
        </div>
      )}

      {/* Manual entry mode */}
      {mode === "manual" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: `${TEAL}18`, border: `2px solid ${BORDER}` }}
          >
            <Camera className="h-10 w-10" style={{ color: TEAL }} />
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-white mb-1">Enter K-ID or Code</div>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Type a KobKlein K-ID (e.g. KK-3F9A-12B7) or handle
            </div>
          </div>

          <div className="w-full space-y-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
              placeholder="KK-XXXX-XXXX or @handle"
              className="w-full px-4 py-3.5 rounded-2xl text-white text-center text-lg font-mono outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1.5px solid ${BORDER}`,
                caretColor: TEAL,
              }}
              autoFocus
            />

            <button
              type="button"
              onClick={submitManual}
              disabled={!manualInput.trim()}
              className="w-full py-4 rounded-2xl text-base font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${TEAL}, #0A8A78)` }}
            >
              Continue
            </button>

            {hasBarcodeDetector && (
              <button
                type="button"
                onClick={() => { setManualInput(""); setMode("camera"); }}
                className="w-full py-3 rounded-2xl text-sm font-medium"
                style={{ color: TEAL, background: "transparent" }}
              >
                Use camera instead
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
