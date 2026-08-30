import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase configuration environment variables.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function hashApiKey(key) {
  if (!key || typeof key !== "string") return "";
  return crypto.createHash("sha256").update(key.trim()).digest("hex");
}

export function generateSecureApiKey(prefix = "ez_live_") {
  const random = crypto.randomBytes(24).toString("hex");
  return `${prefix}${random}`;
}

/**
 * Validates whether an authenticated user is the organizer/owner of an event
 */
export async function verifyOrganizerSession(request, eventId) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return { authorized: false, error: "Authentication token required.", status: 401 };
    }

    const supabase = getServiceSupabase();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return { authorized: false, error: "Invalid or expired session token.", status: 401 };
    }

    // If eventId is provided, check if user owns event or is in team
    if (eventId) {
      const { data: ev, error: evErr } = await supabase
        .from("events")
        .select("id, organizer_id")
        .eq("id", eventId)
        .maybeSingle();

      if (evErr || !ev) {
        return { authorized: false, error: "Event not found.", status: 404 };
      }

      if (ev.organizer_id !== user.id) {
        // Check if user is an admin team member
        const { data: tm } = await supabase
          .from("team_members")
          .select("id, role")
          .eq("event_id", eventId)
          .eq("email", user.email)
          .maybeSingle();

        const isTeamAdmin = tm && (tm.role?.toLowerCase() === "admin" || tm.role?.toLowerCase() === "organizer");
        if (!isTeamAdmin) {
          return { authorized: false, error: "Forbidden: You do not have permission to manage this event.", status: 403 };
        }
      }
    }

    return { authorized: true, user };
  } catch (err) {
    console.error("verifyOrganizerSession error:", err);
    return { authorized: false, error: "Authorization error occurred.", status: 500 };
  }
}

/**
 * Validates an API key (via x-api-key header) OR fallback organizer session
 */
export async function verifyApiKeyOrOrganizer(request, eventId) {
  const apiKey = request.headers.get("x-api-key");

  if (apiKey && eventId) {
    const supabase = getServiceSupabase();
    const keyHash = hashApiKey(apiKey);

    // Check matches for hashed key or direct key (during migration)
    const { data: keyRow, error } = await supabase
      .from("developer_api_keys")
      .select("id, event_id, is_active, permissions")
      .eq("event_id", eventId)
      .or(`key.eq.${apiKey},key_hash.eq.${keyHash}`)
      .maybeSingle();

    if (!error && keyRow && keyRow.is_active !== false) {
      // Update last_used_at timestamp asynchronously
      supabase.from("developer_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then();
      return { authorized: true, isApiKey: true, permissions: keyRow.permissions || "read_write" };
    }
  }

  // Fallback to organizer bearer session
  const sessionResult = await verifyOrganizerSession(request, eventId);
  return sessionResult;
}

/**
 * SSRF Filter: Validates that a webhook destination URL is public HTTP/HTTPS
 */
export function isSafeWebhookUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

    const hostname = parsed.hostname.toLowerCase();
    // Block loopback, localhost, and cloud metadata
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "169.254.169.254" || // AWS/GCP metadata
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    ) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}
