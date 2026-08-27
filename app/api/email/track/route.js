import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 1x1 transparent GIF binary (43 bytes)
const TRANSPARENT_1X1_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://awkreadldqmidcrrqukm.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3a3JlYWRsZHFtaWRjcnJxdWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjg2MzgsImV4cCI6MjA2NjY0NDYzOH0.Z1iVvA983vKq37P2d_F7z27L3Rj3b-g4P-7e5yQk0z0";
  return createClient(supabaseUrl, supabaseKey);
}

function isValidUuid(id) {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

export async function GET(request) {
  let redirectTarget = "";
  try {
    const { searchParams } = new URL(request.url);
    const commId = (searchParams.get("cid") || searchParams.get("id") || "").trim();
    const recipientId = (searchParams.get("rid") || "").trim();
    const rawEmail = (searchParams.get("em") || searchParams.get("email") || searchParams.get("r") || "").trim();
    const recipientEmail = decodeURIComponent(rawEmail).toLowerCase();
    
    // Support click-through redirect tracking
    const rawRedirect = searchParams.get("url") || searchParams.get("redirect") || searchParams.get("target") || "";
    if (rawRedirect) {
      try {
        redirectTarget = decodeURIComponent(rawRedirect).trim();
      } catch (e) {
        redirectTarget = rawRedirect.trim();
      }
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";

    const hasValidCommId = isValidUuid(commId);
    const hasValidRecipientId = isValidUuid(recipientId);

    if (hasValidCommId || hasValidRecipientId || recipientEmail) {
      const supabase = getSupabaseClient();
      let matchedRecLog = null;

      // 1. Try finding recipient log by UUID
      if (hasValidRecipientId) {
        const { data: recLog, error: rErr } = await supabase
          .from("communication_recipients")
          .select("id, open_count, opened_at, communication_id, status")
          .eq("id", recipientId)
          .single();

        if (!rErr && recLog) {
          matchedRecLog = recLog;
        }
      }

      // 2. If not found by ID, try finding by communication_id + email
      if (!matchedRecLog && hasValidCommId && recipientEmail) {
        const { data: recLogByEmail, error: eErr } = await supabase
          .from("communication_recipients")
          .select("id, open_count, opened_at, communication_id, status")
          .eq("communication_id", commId)
          .ilike("recipient_email", recipientEmail)
          .limit(1)
          .single();

        if (!eErr && recLogByEmail) {
          matchedRecLog = recLogByEmail;
        }
      }

      // 3. If still not found, search by email across recent logs for this event
      if (!matchedRecLog && recipientEmail) {
        const { data: recLogRecent } = await supabase
          .from("communication_recipients")
          .select("id, open_count, opened_at, communication_id, status")
          .ilike("recipient_email", recipientEmail)
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (recLogRecent) {
          matchedRecLog = recLogRecent;
        }
      }

      // 4. Update recipient log if found
      if (matchedRecLog) {
        const isFirstOpen = !matchedRecLog.opened_at || matchedRecLog.open_count === 0 || matchedRecLog.status !== "opened";
        const newCount = (matchedRecLog.open_count || 0) + 1;

        await supabase
          .from("communication_recipients")
          .update({
            status: "opened",
            open_count: newCount,
            opened_at: matchedRecLog.opened_at || new Date().toISOString(),
            last_opened_at: new Date().toISOString(),
            user_agent: userAgent ? userAgent.slice(0, 500) : null,
            ip_address: ip ? ip.slice(0, 100) : null,
          })
          .eq("id", matchedRecLog.id);

        const targetCommId = matchedRecLog.communication_id || (hasValidCommId ? commId : null);
        if (targetCommId && isValidUuid(targetCommId)) {
          const { data: commData } = await supabase
            .from("communications")
            .select("opens_count, unique_opens_count")
            .eq("id", targetCommId)
            .single();

          if (commData) {
            const currentTotal = commData.opens_count || 0;
            const currentUnique = commData.unique_opens_count || 0;

            await supabase
              .from("communications")
              .update({
                opens_count: currentTotal + 1,
                unique_opens_count: isFirstOpen ? currentUnique + 1 : currentUnique,
              })
              .eq("id", targetCommId);
          }
        }
      } else if (hasValidCommId) {
        // If only commId was passed and no recipient row matched
        const { data: commData } = await supabase
          .from("communications")
          .select("opens_count, unique_opens_count")
          .eq("id", commId)
          .single();

        if (commData) {
          await supabase
            .from("communications")
            .update({
              opens_count: (commData.opens_count || 0) + 1,
              unique_opens_count: Math.max((commData.unique_opens_count || 0), 1),
            })
            .eq("id", commId);
        }
      }
    }
  } catch (err) {
    console.warn("Tracking pixel error:", err);
  }

  // If this was a click-through redirect link, redirect to target URL
  if (redirectTarget && (redirectTarget.startsWith("http://") || redirectTarget.startsWith("https://") || redirectTarget.startsWith("/"))) {
    return NextResponse.redirect(redirectTarget, 302);
  }

  // Otherwise return the transparent 1x1 GIF with HTTP headers preventing proxy caching
  return new Response(TRANSPARENT_1X1_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_1X1_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, post-check=0, pre-check=0",
      "Pragma": "no-cache",
      "Expires": "Thu, 01 Jan 1970 00:00:00 GMT",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
