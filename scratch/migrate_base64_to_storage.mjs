import { createClient } from "@supabase/supabase-js";
import fs from "fs";

let envVars = {};
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      envVars[key] = value.trim();
    }
  });
} catch (e) {}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://awkreadldqmidcrrqukm.supabase.co";
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function base64ToBuffer(base64Str) {
  if (!base64Str || typeof base64Str !== "string" || !base64Str.startsWith("data:")) return null;
  const parts = base64Str.split(";base64,");
  if (parts.length !== 2) return null;
  const mime = parts[0].replace("data:", "");
  const ext = mime.split("/")[1] || "png";
  const buffer = Buffer.from(parts[1], "base64");
  return { buffer, mime, ext };
}

async function uploadBuffer(buffer, mime, ext, folder, prefix) {
  const fileName = `${folder}/${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("event-images").upload(fileName, buffer, {
    contentType: mime,
    upsert: true
  });
  if (error) {
    console.warn("Upload error:", error.message);
    return null;
  }
  const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(fileName);
  return publicUrl;
}

async function migrate() {
  console.log("--- Starting Base64 to Storage Migration ---");

  // 1. Organizations
  const { data: orgs, error: orgErr } = await supabase.from("organizations").select("id, name, logo, logo_url");
  if (orgs) {
    for (const org of orgs) {
      const target = org.logo_url || org.logo;
      if (target && target.startsWith("data:")) {
        const parsed = base64ToBuffer(target);
        if (parsed) {
          const url = await uploadBuffer(parsed.buffer, parsed.mime, parsed.ext, "organizations", org.id);
          if (url) {
            await supabase.from("organizations").update({ logo_url: url, logo: url }).eq("id", org.id);
            console.log(`✓ Migrated organization: ${org.name || org.id}`);
          }
        }
      }
    }
  }

  // 2. Sponsors
  const { data: sponsors } = await supabase.from("sponsors").select("id, name, logo_url, image");
  if (sponsors) {
    for (const sp of sponsors) {
      const target = sp.logo_url || sp.image;
      if (target && target.startsWith("data:")) {
        const parsed = base64ToBuffer(target);
        if (parsed) {
          const url = await uploadBuffer(parsed.buffer, parsed.mime, parsed.ext, "sponsors", sp.id);
          if (url) {
            await supabase.from("sponsors").update({ logo_url: url, image: url }).eq("id", sp.id);
            console.log(`✓ Migrated sponsor: ${sp.name || sp.id}`);
          }
        }
      }
    }
  }

  // 3. Exhibitors
  const { data: exhibitors } = await supabase.from("exhibitors").select("id, name, logo_url, image");
  if (exhibitors) {
    for (const ex of exhibitors) {
      const target = ex.logo_url || ex.image;
      if (target && target.startsWith("data:")) {
        const parsed = base64ToBuffer(target);
        if (parsed) {
          const url = await uploadBuffer(parsed.buffer, parsed.mime, parsed.ext, "exhibitors", ex.id);
          if (url) {
            await supabase.from("exhibitors").update({ logo_url: url, image: url }).eq("id", ex.id);
            console.log(`✓ Migrated exhibitor: ${ex.name || ex.id}`);
          }
        }
      }
    }
  }

  // 4. Events
  const { data: events } = await supabase.from("events").select("id, name, cover_url, logo_url, banner");
  if (events) {
    for (const ev of events) {
      const updates = {};
      for (const field of ["cover_url", "logo_url", "banner"]) {
        const val = ev[field];
        if (val && typeof val === "string" && val.startsWith("data:")) {
          const parsed = base64ToBuffer(val);
          if (parsed) {
            const url = await uploadBuffer(parsed.buffer, parsed.mime, parsed.ext, "events", `${ev.id}_${field}`);
            if (url) updates[field] = url;
          }
        }
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("events").update(updates).eq("id", ev.id);
        console.log(`✓ Migrated event images: ${ev.name || ev.id}`);
      }
    }
  }

  console.log("--- Migration Completed Successfully ---");
}

migrate().catch(console.error);
