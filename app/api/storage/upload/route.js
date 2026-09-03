import { NextResponse } from "next/server";
import { uploadToR2, getR2Client, isR2Configured } from "@/lib/r2";
import { supabase } from "@/lib/supabase";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB hard cap
const BLOCKED_EXTENSIONS = new Set(["exe", "bat", "cmd", "sh", "php", "dll", "msi", "vbs", "ps1", "scr"]);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "event-images";
    const eventId = formData.get("eventId") || "";
    const customFileName = formData.get("fileName") || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Guardrail 1: 10 MB server-side limit
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds the maximum 10 MB limit. Please compress your document or image." },
        { status: 413 }
      );
    }

    const originalName = customFileName || file.name || "upload.jpg";
    const ext = (originalName.includes(".") ? originalName.split(".").pop() : "jpg").toLowerCase();

    // Guardrail 2: Block dangerous executable file formats
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Executable file format (.${ext}) is blocked for platform security.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base = originalName.includes(".") ? originalName.substring(0, originalName.lastIndexOf(".")) : originalName;
    const cleanBase = base.toLowerCase().replace(/[^a-z0-9.\-_]/g, "").slice(0, 30);
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const fileName = `${cleanBase}_${Date.now()}_${uniqueId}.${ext}`;

    const pathParts = [];
    if (eventId) pathParts.push(String(eventId));
    if (folder) pathParts.push(String(folder));
    pathParts.push(fileName);
    const storageKey = pathParts.join("/");

    const contentType = file.type || "application/octet-stream";

    // 1. If R2 is configured, upload to Cloudflare R2 (0 Egress)
    if (isR2Configured()) {
      try {
        const publicUrl = await uploadToR2({
          key: storageKey,
          body: buffer,
          contentType,
          cacheControl: "public, max-age=31536000, immutable",
        });
        return NextResponse.json({ success: true, url: publicUrl, provider: "r2" });
      } catch (r2Err) {
        console.warn("R2 upload error, attempting fallback to Supabase:", r2Err);
      }
    }

    // 2. Fallback to Supabase Storage
    const bucket = folder.includes("avatar") ? "avatars" : folder.includes("floor") ? "floor-plans" : "event-images";
    const { error: sbErr } = await supabase.storage
      .from(bucket)
      .upload(storageKey, buffer, {
        contentType,
        cacheControl: "31536000, public, immutable",
        upsert: true,
      });

    if (sbErr) {
      // Try public-assets fallback
      const { error: fbErr } = await supabase.storage
        .from("public-assets")
        .upload(storageKey, buffer, {
          contentType,
          cacheControl: "31536000, public, immutable",
          upsert: true,
        });

      if (fbErr) {
        return NextResponse.json({ error: fbErr.message }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage.from("public-assets").getPublicUrl(storageKey);
      return NextResponse.json({ success: true, url: publicUrl, provider: "supabase" });
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(storageKey);
    return NextResponse.json({ success: true, url: publicUrl, provider: "supabase" });
  } catch (err) {
    console.error("Storage upload API error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload file." }, { status: 500 });
  }
}
