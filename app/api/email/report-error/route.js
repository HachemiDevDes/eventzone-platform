import { NextResponse } from "next/server";
import { sendErrorReportEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// In-memory rate limiting / de-duplication cache
const recentReportCache = new Map();
const REPORT_COOLDOWN_MS = 15 * 1000; // 15 seconds cooldown per identical error

function isDuplicateReport(key) {
  if (!key) return false;
  const now = Date.now();
  const last = recentReportCache.get(key);
  if (last && now - last < REPORT_COOLDOWN_MS) {
    return true;
  }
  recentReportCache.set(key, now);

  if (recentReportCache.size > 200) {
    for (const [k, ts] of recentReportCache.entries()) {
      if (now - ts > REPORT_COOLDOWN_MS) {
        recentReportCache.delete(k);
      }
    }
  }
  return false;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      error = {},
      url = "",
      referrer = "",
      userAgent = "",
      language = "en",
      timestamp = new Date().toISOString(),
      user = {},
    } = body;

    const errorName = error?.name || "Error";
    const errorMessage = error?.message || "Unknown error";
    const errorStack = error?.stack || "";
    const errorDigest = error?.digest || "";

    const dedupeKey = `${url}:${errorMessage}:${errorDigest}`;
    if (isDuplicateReport(dedupeKey)) {
      return NextResponse.json({
        success: true,
        message: "Error report already received recently. Thank you!",
        deduplicated: true,
      });
    }

    await sendErrorReportEmail({
      errorName,
      errorMessage,
      errorStack,
      errorDigest,
      url,
      referrer,
      userAgent,
      language,
      timestamp,
      userEmail: user?.email,
      userId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: "Error report dispatched successfully to Eventzone support.",
    });
  } catch (err) {
    console.error("Failed to process error report:", err);
    return NextResponse.json(
      { error: "Failed to dispatch error report" },
      { status: 500 }
    );
  }
}
