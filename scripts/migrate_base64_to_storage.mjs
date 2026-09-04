import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

async function uploadBase64ToStorage(dataUrl, bucket = "event-images", folder = "migrated") {
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

async function migrateOrganizations() {
  console.log("\n--- Checking Organizations ---");
  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, name, logo, logo_url");

  if (error) {
    console.error("Error fetching organizations:", error);
    return;
  }

  for (const org of (orgs || [])) {
    if (org.logo && org.logo.startsWith("data:")) {
      console.log(`Migrating organization logo for: ${org.name} (${org.id})...`);
      const cdnUrl = await uploadBase64ToStorage(org.logo, "event-images", "org-logos");
      if (cdnUrl) {
        const { error: updErr } = await supabase
          .from("organizations")
          .update({ logo: cdnUrl, logo_url: cdnUrl })
          .eq("id", org.id);
        if (updErr) console.error(`Error updating org ${org.id}:`, updErr);
        else console.log(`✓ Org updated: ${cdnUrl}`);
      }
    }
  }
}

async function migrateProfiles() {
  console.log("\n--- Checking Profiles ---");
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url");

  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  for (const prof of (profiles || [])) {
    if (prof.avatar_url && prof.avatar_url.startsWith("data:")) {
      console.log(`Migrating avatar for profile: ${prof.full_name || prof.id}...`);
      const cdnUrl = await uploadBase64ToStorage(prof.avatar_url, "avatars", "profile-avatars");
      if (cdnUrl) {
        const { error: updErr } = await supabase
          .from("profiles")
          .update({ avatar_url: cdnUrl })
          .eq("id", prof.id);
        if (updErr) console.error(`Error updating profile ${prof.id}:`, updErr);
        else console.log(`✓ Profile updated: ${cdnUrl}`);
      }
    }
  }
}

async function migrateParticipants() {
  console.log("\n--- Checking Participants ---");
  const { data: participants, error } = await supabase
    .from("participants")
    .select("id, first_name, last_name, image");

  if (error) {
    console.error("Error fetching participants:", error);
    return;
  }

  for (const part of (participants || [])) {
    if (part.image && part.image.startsWith("data:")) {
      console.log(`Migrating image for participant: ${part.first_name} ${part.last_name} (${part.id})...`);
      const cdnUrl = await uploadBase64ToStorage(part.image, "avatars", "participant-photos");
      if (cdnUrl) {
        const { error: updErr } = await supabase
          .from("participants")
          .update({ image: cdnUrl })
          .eq("id", part.id);
        if (updErr) console.error(`Error updating participant ${part.id}:`, updErr);
        else console.log(`✓ Participant updated: ${cdnUrl}`);
      }
    }
  }
}

async function migrateExhibitors() {
  console.log("\n--- Checking Exhibitors ---");
  const { data: exhibitors, error } = await supabase
    .from("exhibitors")
    .select("id, name, logo_url");

  if (error) {
    console.error("Error fetching exhibitors:", error);
    return;
  }

  for (const ex of (exhibitors || [])) {
    if (ex.logo_url && ex.logo_url.startsWith("data:")) {
      console.log(`Migrating logo for exhibitor: ${ex.name} (${ex.id})...`);
      const cdnUrl = await uploadBase64ToStorage(ex.logo_url, "event-images", "exhibitor-logos");
      if (cdnUrl) {
        const { error: updErr } = await supabase
          .from("exhibitors")
          .update({ logo_url: cdnUrl })
          .eq("id", ex.id);
        if (updErr) console.error(`Error updating exhibitor ${ex.id}:`, updErr);
        else console.log(`✓ Exhibitor updated: ${cdnUrl}`);
      }
    }
  }
}

async function migrateFormSubmissions() {
  console.log("\n--- Checking Form Submissions ---");
  const { data: submissions, error } = await supabase
    .from("form_submissions")
    .select("id, respondent_name, answers");

  if (error) {
    console.error("Error fetching form submissions:", error);
    return;
  }

  for (const sub of (submissions || [])) {
    if (!sub.answers || typeof sub.answers !== "object") continue;
    let modified = false;
    const newAnswers = { ...sub.answers };

    for (const [key, val] of Object.entries(newAnswers)) {
      if (typeof val === "string" && val.startsWith("data:")) {
        console.log(`Migrating base64 key '${key}' in submission ${sub.id} (${sub.respondent_name})...`);
        const cdnUrl = await uploadBase64ToStorage(val, "documents", "form-attachments");
        if (cdnUrl) {
          newAnswers[key] = cdnUrl;
          modified = true;
        }
      } else if (typeof val === "object" && val !== null && typeof val.base64 === "string" && val.base64.startsWith("data:")) {
        console.log(`Migrating nested base64 object in submission ${sub.id}...`);
        const cdnUrl = await uploadBase64ToStorage(val.base64, "documents", "form-attachments");
        if (cdnUrl) {
          newAnswers[key] = {
            ...val,
            url: cdnUrl
          };
          delete newAnswers[key].base64;
          modified = true;
        }
      }
    }

    if (modified) {
      const { error: updErr } = await supabase
        .from("form_submissions")
        .update({ answers: newAnswers })
        .eq("id", sub.id);
      if (updErr) console.error(`Error updating form submission ${sub.id}:`, updErr);
      else console.log(`✓ Form submission ${sub.id} cleaned and updated.`);
    }
  }
}

async function run() {
  console.log("Starting Base64 -> Supabase Storage migration...");
  await migrateOrganizations();
  await migrateProfiles();
  await migrateParticipants();
  await migrateExhibitors();
  await migrateFormSubmissions();
  console.log("\nMigration completed successfully!");
}

run();
