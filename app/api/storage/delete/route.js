import { NextResponse } from "next/server";
import { deleteFromR2, deletePrefixFromR2, isR2Configured } from "@/lib/r2";
import { supabase } from "@/lib/supabase";

function extractStorageKey(urlOrKey, bucket = "event-images") {
  if (!urlOrKey || typeof urlOrKey !== "string") return null;
  const clean = urlOrKey.trim();

  // If already a relative storage path (e.g. "eventId/avatars/img.webp")
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    return clean.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(clean);
    const pathname = parsed.pathname.replace(/^\/+/, "");

    // Cloudflare R2 public domain (e.g. pub-xxx.r2.dev/eventId/folder/file.webp)
    if (parsed.hostname.includes("r2.dev") || parsed.hostname.includes("r2.cloudflarestorage.com")) {
      return pathname;
    }

    // Supabase public URL (e.g. /storage/v1/object/public/<bucket>/<path>)
    const supabasePrefix = `storage/v1/object/public/${bucket}/`;
    if (pathname.includes(supabasePrefix)) {
      return pathname.split(supabasePrefix)[1];
    }

    // Generic path fallback
    const parts = pathname.split("/");
    if (parts.length > 1) {
      return parts.slice(1).join("/");
    }
    return pathname;
  } catch {
    return clean;
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url, urls, prefix, bucket = "event-images", eventId } = body;

    // 1. Prefix-based mass deletion (e.g. deleting an entire event's storage folder)
    if (prefix || eventId) {
      const targetPrefix = prefix || `${eventId}/`;
      let r2Success = false;
      let sbSuccess = false;

      if (isR2Configured()) {
        try {
          r2Success = await deletePrefixFromR2(targetPrefix);
        } catch (err) {
          console.warn("R2 prefix deletion error:", err);
        }
      }

      // Also attempt Supabase Storage folder removal
      try {
        const targetBuckets = [bucket, "avatars", "floor-plans", "event-images", "public-assets"];
        for (const b of targetBuckets) {
          const { data: files } = await supabase.storage.from(b).list(targetPrefix.replace(/\/+$/, ""));
          if (files && files.length > 0) {
            const filePaths = files.map(f => `${targetPrefix.replace(/\/+$/, "")}/${f.name}`);
            await supabase.storage.from(b).remove(filePaths);
          }
        }
        sbSuccess = true;
      } catch (err) {
        console.warn("Supabase folder deletion error:", err);
      }

      return NextResponse.json({
        success: true,
        message: `Purged storage prefix: ${targetPrefix}`,
        r2: r2Success,
        supabase: sbSuccess,
      });
    }

    // 2. Single or multiple file deletion
    const targets = Array.isArray(urls) ? urls : url ? [url] : [];
    if (targets.length === 0) {
      return NextResponse.json({ error: "No target URL, URLs array, or prefix provided." }, { status: 400 });
    }

    const results = [];
    for (const targetUrl of targets) {
      const key = extractStorageKey(targetUrl, bucket);
      if (!key) continue;

      let r2Deleted = false;
      let sbDeleted = false;

      // Cloudflare R2
      if (isR2Configured()) {
        try {
          r2Deleted = await deleteFromR2(key);
        } catch (err) {
          console.warn(`R2 delete failed for ${key}:`, err);
        }
      }

      // Supabase Storage
      try {
        const { error: sbErr } = await supabase.storage.from(bucket).remove([key]);
        if (!sbErr) sbDeleted = true;
      } catch (err) {
        console.warn(`Supabase delete failed for ${key}:`, err);
      }

      results.push({ key, r2: r2Deleted, supabase: sbDeleted });
    }

    return NextResponse.json({ success: true, deleted: results });
  } catch (err) {
    console.error("Storage delete API error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete storage objects." }, { status: 500 });
  }
}
