/**
 * useOfflineQueue — IndexedDB-backed offline transaction queue
 *
 * When a payment/transfer fails because the device is offline, the job is
 * persisted to IndexedDB. When connectivity is restored, the queue flushes
 * automatically and the caller's `onRetry` callback is invoked for each item.
 *
 * Usage:
 *   const { enqueue, queue, flush } = useOfflineQueue("transfers");
 */

import { useCallback, useEffect, useState } from "react";

export type QueuedJob<T = Record<string, unknown>> = {
  id: string;
  type: string;
  payload: T;
  enqueuedAt: number;
  attempts: number;
};

const DB_NAME = "kobklein_offline";
const DB_VERSION = 1;

function openDB(storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB(storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB(storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(storeName: string, id: string): Promise<void> {
  const db = await openDB(storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function useOfflineQueue<T = Record<string, unknown>>(
  storeName: string,
  onRetry?: (job: QueuedJob<T>) => Promise<void>,
) {
  const [queue, setQueue] = useState<QueuedJob<T>[]>([]);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  // Load queue from IndexedDB on mount
  useEffect(() => {
    dbGetAll<QueuedJob<T>>(storeName)
      .then(setQueue)
      .catch(() => {}); // silently fail if IndexedDB unavailable
  }, [storeName]);

  // Track online/offline
  useEffect(() => {
    function handleOnline() { setOnline(true); }
    function handleOffline() { setOnline(false); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-flush when coming back online
  useEffect(() => {
    if (online && queue.length > 0 && onRetry) {
      flush();
    }
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  const enqueue = useCallback(
    async (type: string, payload: T) => {
      const job: QueuedJob<T> = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        payload,
        enqueuedAt: Date.now(),
        attempts: 0,
      };
      await dbPut(storeName, job);
      setQueue((prev) => [...prev, job]);
      return job.id;
    },
    [storeName],
  );

  const flush = useCallback(async () => {
    if (!onRetry) return;
    const jobs = await dbGetAll<QueuedJob<T>>(storeName);
    for (const job of jobs) {
      try {
        await onRetry({ ...job, attempts: job.attempts + 1 });
        await dbDelete(storeName, job.id);
        setQueue((prev) => prev.filter((j) => j.id !== job.id));
      } catch {
        // increment attempts and keep in queue
        const updated = { ...job, attempts: job.attempts + 1 };
        await dbPut(storeName, updated);
        setQueue((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      }
    }
  }, [storeName, onRetry]);

  const remove = useCallback(
    async (id: string) => {
      await dbDelete(storeName, id);
      setQueue((prev) => prev.filter((j) => j.id !== id));
    },
    [storeName],
  );

  return { queue, enqueue, flush, remove, online };
}
