import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const BUCKET = "profile-photos";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/upload/profile-photo
 *
 * Accepts multipart/form-data with a single "file" field.
 * Uses the Supabase service-role key server-side so no RLS policy is
 * needed on the storage.objects table for this upload path.
 *
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  // ── 1. Authenticate caller ────────────────────────────────────────────────
  const cookieStore = await cookies();

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse uploaded file ────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
      { status: 400 },
    );
  }

  // ── 3. Upload with service-role key (bypasses RLS) ────────────────────────
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { get: () => undefined, set: () => {}, remove: () => {} },
      auth: { persistSession: false },
    },
  );

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(path, buffer, {
      upsert:      true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("[profile-photo upload]", uploadError);

    // Helpful message if bucket doesn't exist yet
    if (
      uploadError.message?.toLowerCase().includes("bucket") ||
      (uploadError as any).error === "Bucket not found"
    ) {
      return NextResponse.json(
        {
          error:
            "Storage bucket not set up. Create a bucket named 'profile-photos' " +
            "in Supabase Dashboard → Storage and set it to Public.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // ── 4. Return public URL ──────────────────────────────────────────────────
  const { data: urlData } = adminClient.storage
    .from(BUCKET)
    .getPublicUrl(path);

  // Cache-bust so the browser re-fetches the new avatar immediately
  const url = `${urlData.publicUrl}?t=${Date.now()}`;

  return NextResponse.json({ url });
}
