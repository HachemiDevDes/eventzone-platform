import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";

function getClientIp(request) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ip = xForwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const trueClientIp = request.headers.get("true-client-ip");
  if (trueClientIp) return trueClientIp.trim();

  const fastlyClientIp = request.headers.get("fastly-client-ip");
  if (fastlyClientIp) return fastlyClientIp.trim();

  return "127.0.0.1";
}

export async function GET(request) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const supabase = getServiceSupabase();

    // Check if this machine IP has already seen or interacted with the banner
    const { data: existing, error: fetchErr } = await supabase
      .from("cookie_consents")
      .select("ip, status, created_at")
      .eq("ip", ip)
      .maybeSingle();

    if (fetchErr) {
      console.warn("Error fetching cookie consent for IP:", fetchErr.message);
      return NextResponse.json({ showBanner: false, error: fetchErr.message });
    }

    if (existing) {
      // IP has already been shown the banner or made a selection
      return NextResponse.json({
        showBanner: false,
        status: existing.status,
        alreadyRecorded: true,
      });
    }

    // First time this IP is seen: record it immediately so it is shown only once per machine IP
    const { error: insertErr } = await supabase
      .from("cookie_consents")
      .insert({
        ip,
        status: "shown",
        user_agent: userAgent.slice(0, 500),
      });

    if (insertErr) {
      console.warn("Error recording initial cookie consent for IP:", insertErr.message);
    }

    return NextResponse.json({
      showBanner: true,
      status: "shown",
      alreadyRecorded: false,
    });
  } catch (err) {
    console.error("GET /api/cookies/consent error:", err);
    return NextResponse.json({ showBanner: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const body = await request.json().catch(() => ({}));
    const status = body.status === "essential" ? "essential" : "accepted";
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("cookie_consents")
      .upsert(
        {
          ip,
          status,
          user_agent: userAgent.slice(0, 500),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "ip" }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating cookie consent for IP:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status, record: data });
  } catch (err) {
    console.error("POST /api/cookies/consent error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
