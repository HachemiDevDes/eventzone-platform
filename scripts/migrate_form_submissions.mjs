import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";

const SUPABASE_URL = "https://awkreadldqmidcrrqukm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3a3JlYWRsZHFtaWRjcnJxdWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MDY2MzgsImV4cCI6MjA5ODE4MjYzOH0.OuXsk83gk4b9IUkS5K_cwCcM2u0JYUv6m-H4V5H8P5E";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

function base64ToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return null;
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  const contentType = match[1] || "image/png";
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  const ext = contentType.split("/")[1] || "png";
  return { buffer, contentType, ext };
}

async function uploadBase64ToStorage(dataUrl, bucket = "documents", folder = "form-attachments") {
  const parsed = base64ToBuffer(dataUrl);
  if (!parsed) return null;
  const { buffer, contentType, ext } = parsed;
  const hash = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 12);
  const fileName = `${folder}/${Date.now()}_${hash}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType,
      cacheControl: "31536000, public, immutable",
      upsert: true
    });

  if (error) {
    console.error(`Failed to upload to ${bucket}/${fileName}:`, error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

// Read raw form_submissions from step file
const stepFile = "C:/Users/hache/.gemini/antigravity/brain/67408c53-d0c4-467a-a790-dca75fc2afc6/.system_generated/steps/137/output.txt";
const fileContent = fs.readFileSync(stepFile, "utf-8");
const parsedWrapper = JSON.parse(fileContent);
const rawResult = parsedWrapper.result;
const startIdx = rawResult.indexOf("[{");
const endIdx = rawResult.lastIndexOf("}]") + 2;

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find json array in step file");
  process.exit(1);
}

const rows = JSON.parse(rawResult.substring(startIdx, endIdx));
console.log(`Found ${rows.length} submissions with base64.`);

const sqlUpdates = [];

for (const row of rows) {
  const newAnswers = { ...row.answers };
  let changed = false;

  for (const [key, val] of Object.entries(newAnswers)) {
    if (typeof val === "string" && val.startsWith("data:")) {
      console.log(`Uploading key '${key}' for row ${row.id}...`);
      const cdnUrl = await uploadBase64ToStorage(val, "documents", "form-attachments");
      if (cdnUrl) {
        newAnswers[key] = cdnUrl;
        changed = true;
      }
    } else if (typeof val === "object" && val !== null && typeof val.base64 === "string" && val.base64.startsWith("data:")) {
      console.log(`Uploading nested base64 for row ${row.id}...`);
      const cdnUrl = await uploadBase64ToStorage(val.base64, "documents", "form-attachments");
      if (cdnUrl) {
        newAnswers[key] = {
          ...val,
          url: cdnUrl
        };
        delete newAnswers[key].base64;
        changed = true;
      }
    }
  }

  if (changed) {
    const jsonStr = JSON.stringify(newAnswers).replace(/'/g, "''");
    sqlUpdates.push(`UPDATE form_submissions SET answers = '${jsonStr}'::jsonb WHERE id = '${row.id}';`);
  }
}

fs.writeFileSync("scripts/update_form_submissions.sql", sqlUpdates.join("\n"));
console.log(`Generated ${sqlUpdates.length} SQL updates in scripts/update_form_submissions.sql`);
