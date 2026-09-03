import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID || "4f20875b096cfe0a44bb28b187b710ac";
const R2_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_R2_API_TOKEN;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "eventzone-storage";
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || "https://pub-f27e9abad6974c9f90cac9632f24cbb0.r2.dev";

let s3Client = null;

export function isR2Configured() {
  return Boolean(R2_API_TOKEN || (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY));
}

export function getR2Client() {
  if (!s3Client && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Upload buffer or stream directly to Cloudflare R2 with 0 egress
 */
export async function uploadToR2({ key, body, contentType = "application/octet-stream", cacheControl = "public, max-age=31536000, immutable" }) {
  const cleanKey = key.replace(/^\/+/, "");

  // 1. Try S3 SDK if S3 credentials are provided
  const s3 = getR2Client();
  if (s3) {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    });
    await s3.send(command);
    const domain = R2_PUBLIC_DOMAIN.replace(/\/+$/, "");
    return `${domain}/${cleanKey}`;
  }

  // 2. Direct Cloudflare R2 REST API Upload (via API Token)
  if (R2_API_TOKEN) {
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(cleanKey)}`;
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${R2_API_TOKEN}`,
        "Content-Type": contentType,
      },
      body,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Cloudflare R2 API upload failed (${res.status}): ${errorText}`);
    }

    const domain = R2_PUBLIC_DOMAIN.replace(/\/+$/, "");
    return `${domain}/${cleanKey}`;
  }

  throw new Error("No Cloudflare R2 credentials configured (CLOUDFLARE_API_TOKEN or S3 keys).");
}

/**
 * Delete a specific object from Cloudflare R2
 */
export async function deleteFromR2(key) {
  if (!key) return false;
  const cleanKey = key.replace(/^\/+/, "");

  const s3 = getR2Client();
  if (s3) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: cleanKey,
      });
      await s3.send(command);
      return true;
    } catch (err) {
      console.warn("R2 S3 delete error:", err);
    }
  }

  if (R2_API_TOKEN) {
    try {
      const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(cleanKey)}`;
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${R2_API_TOKEN}`,
        },
      });
      return res.ok;
    } catch (err) {
      console.warn("R2 REST delete error:", err);
    }
  }

  return false;
}

/**
 * Delete all objects with a specific prefix (e.g. "eventId/") from Cloudflare R2
 */
export async function deletePrefixFromR2(prefix) {
  if (!prefix) return false;
  const cleanPrefix = prefix.replace(/^\/+/, "");

  const s3 = getR2Client();
  if (s3) {
    try {
      let continuationToken = null;
      do {
        const listCmd = new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: cleanPrefix,
          ContinuationToken: continuationToken,
        });
        const listRes = await s3.send(listCmd);
        if (listRes.Contents && listRes.Contents.length > 0) {
          const deleteCmd = new DeleteObjectsCommand({
            Bucket: R2_BUCKET_NAME,
            Delete: {
              Objects: listRes.Contents.map((item) => ({ Key: item.Key })),
              Quiet: true,
            },
          });
          await s3.send(deleteCmd);
        }
        continuationToken = listRes.NextContinuationToken;
      } while (continuationToken);
      return true;
    } catch (err) {
      console.warn("R2 prefix delete error:", err);
    }
  }

  return false;
}
