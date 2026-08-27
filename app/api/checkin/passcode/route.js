import { NextResponse } from "next/server";
import { updateEventCheckinPasscode } from "@/lib/db";

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
    const { eventId, passcode } = body || {};

    if (!eventId || !passcode) {
      return NextResponse.json(
        { success: false, error: "Event ID and passcode are required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await updateEventCheckinPasscode(eventId, passcode);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update passcode." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("POST /api/checkin/passcode error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update event passcode." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
