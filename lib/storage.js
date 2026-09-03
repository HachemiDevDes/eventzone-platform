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
 * Context-aware image compression presets tailored to specific media roles.
 * Balances razor-sharp visual clarity with minimal storage footprint.
 */
export const COMPRESSION_PRESETS = {
  badge: { maxDimension: 500, quality: 0.78, outputType: "image/webp" },       // ~25 - 45 KB
  avatar: { maxDimension: 400, quality: 0.80, outputType: "image/webp" },      // ~20 - 35 KB
  photo: { maxDimension: 600, quality: 0.80, outputType: "image/webp" },       // ~30 - 55 KB
  speaker: { maxDimension: 500, quality: 0.80, outputType: "image/webp" },     // ~25 - 45 KB
  logo: { maxDimension: 600, quality: 0.82, outputType: "image/webp" },        // ~15 - 35 KB
  sponsor: { maxDimension: 600, quality: 0.82, outputType: "image/webp" },     // ~15 - 35 KB
  cover: { maxDimension: 1400, quality: 0.80, outputType: "image/webp" },      // ~90 - 150 KB
  banner: { maxDimension: 1400, quality: 0.80, outputType: "image/webp" },     // ~90 - 150 KB
  floorplan: { maxDimension: 1800, quality: 0.85, outputType: "image/webp" },  // ~150 - 280 KB
  default: { maxDimension: 1200, quality: 0.80, outputType: "image/webp" }     // ~60 - 110 KB
};

/**
 * Resolve the optimal compression settings based on a preset name, folder, or custom object
 */
export function resolveCompressionPreset(presetOrFolder) {
  if (!presetOrFolder) return COMPRESSION_PRESETS.default;
  if (typeof presetOrFolder === "object" && presetOrFolder.maxDimension) {
    return { ...COMPRESSION_PRESETS.default, ...presetOrFolder };
  }
  const key = String(presetOrFolder).toLowerCase().trim();
  if (COMPRESSION_PRESETS[key]) return COMPRESSION_PRESETS[key];
  if (key.includes("badge")) return COMPRESSION_PRESETS.badge;
  if (key.includes("avatar") || key.includes("profile")) return COMPRESSION_PRESETS.avatar;
  if (key.includes("speaker")) return COMPRESSION_PRESETS.speaker;
  if (key.includes("logo") || key.includes("sponsor") || key.includes("exhibitor") || key.includes("partner")) return COMPRESSION_PRESETS.logo;
  if (key.includes("cover") || key.includes("banner") || key.includes("header")) return COMPRESSION_PRESETS.cover;
  if (key.includes("floor") || key.includes("map")) return COMPRESSION_PRESETS.floorplan;
  return COMPRESSION_PRESETS.default;
}

/**
 * Compresses an image File/Blob on the client using HTML5 Canvas.
 * Dynamically scales and compresses using context-aware presets.
 * Preserves SVG, GIF (animations), and non-image files as-is.
 */
export async function compressImage(fileOrBlob, options = {}) {
  if (!fileOrBlob) return fileOrBlob;
  
  const preset = typeof options === "string" 
    ? resolveCompressionPreset(options)
    : resolveCompressionPreset(options.preset || options);

  const {
    maxDimension = 1200,
    quality = 0.80,
    outputType = "image/webp"
  } = preset;

  // Only run compression in browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fileOrBlob;
  }

  const mimeType = fileOrBlob.type || "";
  
  // Skip SVGs, GIFs, and PDFs or non-images
  if (
    !mimeType.startsWith("image/") ||
    mimeType === "image/svg+xml" ||
    mimeType === "image/gif"
  ) {
    return fileOrBlob;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;

        if (width <= 0 || height <= 0) {
          return resolve(fileOrBlob);
        }

        // Scale down if dimensions exceed maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return resolve(fileOrBlob);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Check if browser supports requested outputType (default image/webp)
        const isWebpSupported = typeof canvas.toDataURL === "function" && canvas.toDataURL(outputType).indexOf(`data:${outputType}`) === 0;
        const targetFormat = isWebpSupported ? outputType : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < fileOrBlob.size) {
              resolve(blob);
            } else {
              // If compression didn't reduce size, return original
              resolve(fileOrBlob);
            }
          },
          targetFormat,
          quality
        );
      };
      img.onerror = () => resolve(fileOrBlob);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(fileOrBlob);
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Upload any File or Blob to a public Supabase Storage bucket
 * Automatically compresses images client-side before upload
 * Returns public CDN URL
 */
export async function uploadMedia(fileOrBlob, bucket = "event-images", eventId = null, folder = "", compressionOptions = {}) {
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
    if (!blob) return null;
    uploadPayload = blob;
    const mime = fileOrBlob.match(/data:([^;]+);/)?.[1] || "image/png";
    const ext = mime.split("/")[1] || "png";
    fileName = `image_${Date.now()}.${ext}`;
  } else if (fileOrBlob.name) {
    fileName = fileOrBlob.name;
  }

  // Automatic client-side image compression using context-aware presets
  if (uploadPayload instanceof Blob && (uploadPayload.type?.startsWith("image/") || fileName.match(/\.(jpg|jpeg|png|webp|bmp)$/i))) {
    try {
      const activeOptions = typeof compressionOptions === "string"
        ? { preset: compressionOptions }
        : { preset: compressionOptions?.preset || folder || bucket, ...(compressionOptions || {}) };

      const compressed = await compressImage(uploadPayload, activeOptions);
      if (compressed && compressed instanceof Blob) {
        uploadPayload = compressed;
        if (uploadPayload.type === "image/webp" && !fileName.endsWith(".webp")) {
          fileName = `${fileName.substring(0, fileName.lastIndexOf(".")) || fileName}.webp`;
        }
      }
    } catch (compErr) {
      console.warn("Client-side compression notice:", compErr);
    }
  }

  const safeFileName = sanitizeStorageFileName(fileName);
  const pathParts = [];
  if (eventId) pathParts.push(String(eventId));
  if (folder) pathParts.push(String(folder));
  pathParts.push(safeFileName);
  const filePath = pathParts.join("/");

  const targetBucket = bucket || "event-images";
  const contentType = uploadPayload.type || "application/octet-stream";

  // Primary: Upload via /api/storage/upload (Cloudflare R2 with Supabase fallback)
  try {
    const formData = new FormData();
    formData.append("file", uploadPayload, safeFileName);
    formData.append("folder", folder || targetBucket);
    if (eventId) formData.append("eventId", String(eventId));
    formData.append("fileName", safeFileName);

    const res = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (apiErr) {
    console.warn("API storage upload failed, attempting direct Supabase upload:", apiErr);
  }

  // Direct Client-Side Fallback: Supabase Storage
  try {
    const { error: uploadErr } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, uploadPayload, {
        contentType,
        cacheControl: "31536000, public, immutable",
        upsert: true,
      });

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      if (publicUrl) return publicUrl;
    }
  } catch (err) {
    console.warn(`Direct storage upload to '${targetBucket}' error:`, err);
  }

  // Fallback: Try 'public-assets' if different bucket
  if (targetBucket !== "public-assets") {
    try {
      const { error: fbErr } = await supabase.storage
        .from("public-assets")
        .upload(filePath, uploadPayload, {
          contentType,
          cacheControl: "31536000, public, immutable",
          upsert: true,
        });

      if (!fbErr) {
        const { data: { publicUrl } } = supabase.storage
          .from("public-assets")
          .getPublicUrl(filePath);

        if (publicUrl) return publicUrl;
      }
    } catch (e) {
      console.warn("Fallback bucket upload error:", e);
    }
  }

  // Strict sustainability rule: NEVER return Base64 Data URLs into the database
  return null;
}

/**
 * Checks if a string is a raw Base64 data URL (e.g. data:image/png;base64,...)
 */
export function isBase64DataUrl(str) {
  if (!str || typeof str !== "string") return false;
  return str.startsWith("data:") && (str.includes(";base64,") || str.length > 500);
}

/**
 * Strict Anti-Base64 Sanitizer:
 * Ensures only clean HTTP/HTTPS CDN URLs are returned, rejecting Base64 blobs
 * to preserve database memory and disk limits.
 */
export function sanitizeMediaUrl(url, fallback = "") {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (isBase64DataUrl(trimmed)) {
    console.warn("[Anti-Base64 Security] Blocked raw Base64 data URL from entering database column.");
    return fallback;
  }
  return trimmed;
}

/**
 * Recursively scans and sanitizes an intake answers dictionary to guarantee
 * no Base64 strings are saved into JSONB fields.
 */
export function sanitizeAnswersObject(answers = {}) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return answers;
  const sanitized = {};
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === "string" && isBase64DataUrl(v)) {
      console.warn(`[Anti-Base64 Security] Stripped Base64 data URL from field '${k}'`);
      sanitized[k] = "";
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

/**
 * Delete a media file from Cloudflare R2 and Supabase Storage to prevent orphan bloat.
 */
export async function deleteMedia(urlOrKey, bucket = "event-images") {
  if (!urlOrKey) return false;
  try {
    const res = await fetch("/api/storage/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlOrKey, bucket })
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.success);
    }
    return false;
  } catch (err) {
    console.warn("deleteMedia error:", err);
    return false;
  }
}

/**
 * Delete all files for an event prefix (e.g. when permanently deleting an event)
 */
export async function deleteEventStorageFolder(eventId) {
  if (!eventId) return false;
  try {
    const res = await fetch("/api/storage/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: `${eventId}/`, eventId })
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.success);
    }
    return false;
  } catch (err) {
    console.warn("deleteEventStorageFolder error:", err);
    return false;
  }
}
