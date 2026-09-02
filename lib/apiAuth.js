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

/**
 * Validates whether a request comes from an authorized check-in gate staff, organizer, or API key.
 */
export async function verifyCheckinStaffOrOrganizer(request, eventId) {
  if (!eventId) {
    return { authorized: false, error: "Event ID is required.", status: 400 };
  }

  // 1. Check if an API key is provided
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const keyResult = await verifyApiKeyOrOrganizer(request, eventId);
    if (keyResult.authorized) return keyResult;
  }

  // 2. Check if Bearer organizer token is provided
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ") && authHeader.length > 15) {
    const sessionResult = await verifyOrganizerSession(request, eventId);
    if (sessionResult.authorized) return sessionResult;
  }

  // 3. Check Gate Staff passcode headers / query
  const passcode = (
    request.headers.get("x-checkin-passcode") ||
    request.headers.get("x-passcode") ||
    ""
  ).trim().toUpperCase();

  const staffEmail = (
    request.headers.get("x-staff-email") ||
    request.headers.get("x-email") ||
    ""
  ).trim().toLowerCase();

  if (passcode) {
    const supabase = getServiceSupabase();
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id, organizer_id, contact_email, checkin_passcode")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr || !ev) {
      return { authorized: false, error: "Event not found.", status: 404 };
    }

    const evPass = (ev.checkin_passcode || "").trim().toUpperCase();
    const syntheticPass = (ev.id ? String(ev.id).slice(0, 6).toUpperCase() : "");
    const isPassValid = (evPass && evPass === passcode) || (syntheticPass && syntheticPass === passcode);

    if (isPassValid) {
      // If staff email was provided, check authorized staff
      if (staffEmail) {
        // Check team_members
        const { data: tm } = await supabase
          .from("team_members")
          .select("id, name, role, email")
          .eq("event_id", eventId)
          .ilike("email", staffEmail)
          .maybeSingle();

        if (tm) {
          return { authorized: true, isStaff: true, staff: { name: tm.name, email: staffEmail, role: tm.role } };
        }

        // Check profiles / organizer
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .ilike("email", staffEmail)
          .maybeSingle();

        if (prof && prof.id === ev.organizer_id) {
          return { authorized: true, isOrganizer: true, staff: { name: prof.full_name, email: staffEmail, role: "Organizer" } };
        }

        const hostEmail = (ev.contact_email || "").trim().toLowerCase();
        if (hostEmail && hostEmail === staffEmail) {
          return { authorized: true, isOrganizer: true, staff: { name: "Organizer", email: staffEmail, role: "Organizer" } };
        }

        // If exact passcode is verified, allow Gate Staff role
        return { authorized: true, isStaff: true, staff: { name: staffEmail.split('@')[0], email: staffEmail, role: "Gate Staff" } };
      }

      // Passcode is valid, authorized as Gate Terminal
      return { authorized: true, isStaff: true, staff: { name: "Gate Staff", role: "Gate Staff" } };
    }
  }

  return {
    authorized: false,
    error: "Unauthorized: Valid event passcode or organizer session required.",
    status: 401,
  };
}
