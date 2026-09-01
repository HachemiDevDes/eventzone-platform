import { NextResponse } from "next/server";
import { performQrCheckin } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventId, payload, checkedInBy } = body || {};

    if (!payload) {
      return NextResponse.json(
        { status: "invalid", message: "No QR code data provided." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await performQrCheckin({
      eventId,
      rawPayload: payload,
      checkedInBy: checkedInBy || "Gate Staff",
    });

    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("POST /api/checkin/scan error:", err);
    return NextResponse.json(
      { status: "invalid", message: err.message || "Failed to process QR scan." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
