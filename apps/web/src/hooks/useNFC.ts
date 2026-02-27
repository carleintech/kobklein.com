/**
 * useNFC — Web NFC API hook for tap-to-receive / tap-to-pay
 *
 * Reads NFC NDEF records when a card/device is tapped.
 * Falls back gracefully when Web NFC is not supported (non-Android or desktop).
 *
 * Usage:
 *   const { supported, scanning, error, lastRead, startScan, stopScan } = useNFC();
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type NFCReadResult = {
  serialNumber: string;
  records: { recordType: string; data: string }[];
  timestamp: number;
};

declare global {
  interface Window {
    NDEFReader: new () => NDEFReader;
  }
  interface NDEFReader extends EventTarget {
    scan(options?: { signal?: AbortSignal }): Promise<void>;
    write(message: NDEFMessageInit): Promise<void>;
  }
  interface NDEFReadingEvent extends Event {
    serialNumber: string;
    message: NDEFMessage;
  }
  interface NDEFMessage {
    records: NDEFRecord[];
  }
  interface NDEFRecord {
    recordType: string;
    data: DataView;
  }
  interface NDEFMessageInit {
    records: { recordType: string; data: string }[];
  }
}

export function useNFC() {
  const [supported] = useState(
    typeof window !== "undefined" && "NDEFReader" in window,
  );
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRead, setLastRead] = useState<NFCReadResult | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const startScan = useCallback(
    async (onRead?: (result: NFCReadResult) => void) => {
      if (!supported) {
        setError("Web NFC is not supported on this device");
        return;
      }

      // Stop any existing scan
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setError(null);
      setScanning(true);

      try {
        const reader = new window.NDEFReader();
        await reader.scan({ signal: abortRef.current.signal });

        reader.addEventListener("reading", (event) => {
          const e = event as NDEFReadingEvent;
          const records = e.message.records.map((r) => {
            let data = "";
            try {
              data = new TextDecoder().decode(r.data);
            } catch {
              data = "";
            }
            return { recordType: r.recordType, data };
          });

          const result: NFCReadResult = {
            serialNumber: e.serialNumber,
            records,
            timestamp: Date.now(),
          };

          setLastRead(result);
          onRead?.(result);
        });

        reader.addEventListener("readingerror", () => {
          setError("Could not read NFC tag — try again");
        });
      } catch (err: unknown) {
        if ((err as DOMException)?.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "NFC scan failed. Ensure NFC is enabled on your device.",
        );
        setScanning(false);
      }
    },
    [supported],
  );

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setScanning(false);
    setError(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return { supported, scanning, error, lastRead, startScan, stopScan };
}
