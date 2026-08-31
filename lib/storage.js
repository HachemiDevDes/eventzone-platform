import { supabase } from "./supabase";

/**
 * Clean and sanitize a filename for cloud storage
 */
export function sanitizeStorageFileName(originalName = "upload.jpg") {
  const clean = String(originalName)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
  const ext = clean.includes(".") ? clean.split(".").pop() : "jpg";
  const base = clean.includes(".") ? clean.substring(0, clean.lastIndexOf(".")) : clean;
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  return `${base.slice(0, 30)}_${timestamp}_${uniqueId}.${ext}`;
}

/**
 * Check if a URL string is an HTTP/HTTPS CDN URL (not base64)
 */
export function isStorageUrl(str) {
  if (!str || typeof str !== "string") return false;
  return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("/");
}

/**
 * Converts a Base64 Data URL to a native Blob
 */
export function base64ToBlob(base64Data) {
  if (!base64Data || typeof base64Data !== "string") return null;
  try {
    const parts = base64Data.split(";base64,");
    if (parts.length !== 2) return null;
    const contentType = parts[0].replace("data:", "") || "image/png";
    const raw = atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } catch (e) {
    console.warn("base64ToBlob conversion error:", e);
    return null;
  }
}

/**
 * Upload any File or Blob to a public Supabase Storage bucket
 * Returns public CDN URL
 */
export async function uploadMedia(fileOrBlob, bucket = "event-images", eventId = null, folder = "") {
  if (!fileOrBlob) return null;

  // If already an HTTP/HTTPS URL, return directly
  if (typeof fileOrBlob === "string" && isStorageUrl(fileOrBlob) && !fileOrBlob.startsWith("data:")) {
    return fileOrBlob;
  }

  let uploadPayload = fileOrBlob;
  let fileName = "upload.jpg";

  // Handle Base64 strings passed in
  if (typeof fileOrBlob === "string" && fileOrBlob.startsWith("data:")) {
    const blob = base64ToBlob(fileOrBlob);
    if (!blob) return fileOrBlob; // Fallback to raw if conversion fails
    uploadPayload = blob;
    const mime = fileOrBlob.match(/data:([^;]+);/)?.[1] || "image/png";
    const ext = mime.split("/")[1] || "png";
    fileName = `image_${Date.now()}.${ext}`;
  } else if (fileOrBlob.name) {
    fileName = fileOrBlob.name;
  }

  const safeFileName = sanitizeStorageFileName(fileName);
  const pathParts = [];
  if (eventId) pathParts.push(String(eventId));
  if (folder) pathParts.push(String(folder));
  pathParts.push(safeFileName);
  const filePath = pathParts.join("/");

  const targetBucket = bucket || "event-images";

  try {
    // Upload to target bucket
    const { error: uploadErr } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, uploadPayload, {
        cacheControl: "31536000", // 1 year cache
        upsert: true,
      });

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      if (publicUrl) return publicUrl;
    } else {
      console.warn(`Storage upload to '${targetBucket}' returned error:`, uploadErr.message);
    }
  } catch (err) {
    console.warn(`Storage upload to '${targetBucket}' threw error:`, err);
  }

  // Fallback 1: Try 'public-assets' if different bucket
  if (targetBucket !== "public-assets") {
    try {
      const { error: fbErr } = await supabase.storage
        .from("public-assets")
        .upload(filePath, uploadPayload, {
          cacheControl: "31536000",
          upsert: true,
        });

      if (!fbErr) {
        const { data: { publicUrl } } = supabase.storage
          .from("public-assets")
          .getPublicUrl(filePath);

        if (publicUrl) return publicUrl;
      }
    } catch (e) {}
  }

  // Fallback 2: If client-side and offline, read as DataURL so user data is NEVER lost
  if (typeof window !== "undefined" && uploadPayload instanceof Blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(uploadPayload);
    });
  }

  return null;
}
