/**
 * Supabase Storage Service — Secure file upload for KYC documents.
 *
 * Bucket: "kyc-documents" (private, no public access)
 * Path convention: {userId}/{docType}/{timestamp}-{filename}
 *
 * ENV:
 *   SUPABASE_URL          — https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY   — service-role key (NOT anon key — needs storage admin)
 *
 * Falls back to local "dev" mode (returns mock URL) when env vars are missing.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const KYC_BUCKET = "kyc-documents";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}

export function isStorageConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

/**
 * Upload a file buffer to Supabase Storage.
 *
 * @param userId  — owner's user ID (used as folder prefix)
 * @param docType — "id_document" | "selfie" | "address_proof"
 * @param buffer  — raw file bytes
 * @param filename — original filename
 * @param mimeType — content-type (image/jpeg, application/pdf, etc.)
 * @returns Public signed URL (valid 1 year) or mock URL in dev
 */
export async function uploadKycDocument(
  userId: string,
  docType: string,
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const supabase = getClient();

  // ── Dev fallback ──────────────────────────────────────────
  if (!supabase) {
    const mockUrl = `https://storage.dev.kobklein.local/${KYC_BUCKET}/${userId}/${docType}/${filename}`;
    console.log(`[STORAGE-DEV] Would upload → ${mockUrl}`);
    return mockUrl;
  }

  // ── Validate file ─────────────────────────────────────────
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (buffer.length > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  const ALLOWED_MIMES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
  ];
  if (!ALLOWED_MIMES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Accepted: JPEG, PNG, WebP, HEIC, PDF.`);
  }

  // ── Upload ────────────────────────────────────────────────
  const ts = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/${docType}/${ts}-${safeName}`;

  const { error } = await supabase.storage
    .from(KYC_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error("[STORAGE] Upload failed:", error.message);
    throw new Error(`File upload failed: ${error.message}`);
  }

  // ── Generate signed URL (1 year) ──────────────────────────
  const { data: signedData, error: signError } = await supabase.storage
    .from(KYC_BUCKET)
    .createSignedUrl(storagePath, 365 * 24 * 60 * 60); // 1 year in seconds

  if (signError || !signedData?.signedUrl) {
    console.error("[STORAGE] Signed URL failed:", signError?.message);
    // Fallback: construct direct URL (admin can still access via service key)
    return `${process.env.SUPABASE_URL}/storage/v1/object/${KYC_BUCKET}/${storagePath}`;
  }

  return signedData.signedUrl;
}

/**
 * Delete a KYC document from storage.
 */
export async function deleteKycDocument(storagePath: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) {
    console.log(`[STORAGE-DEV] Would delete → ${storagePath}`);
    return;
  }

  const { error } = await supabase.storage
    .from(KYC_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error("[STORAGE] Delete failed:", error.message);
  }
}
