import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function isValidUuid(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const userIdsParam = searchParams.get("userIds") || "";

  if (!date) {
    return NextResponse.json({ bookedSlots: [] });
  }

  const userIds = userIdsParam
    .split(",")
    .map((s) => s.trim())
    .filter(isValidUuid);

  if (userIds.length === 0) {
    return NextResponse.json({ bookedSlots: [] });
  }

  try {
    const supabase = getServiceSupabase();

    // Build OR condition for any participant
    const orConditions = userIds
      .map((id) => `organizer_id.eq.${id},attendee_id.eq.${id}`)
      .join(",");

    const { data, error } = await supabase
      .from("meetings")
      .select("start_time, end_time, organizer_id, attendee_id")
      .eq("date", date)
      .eq("status", "accepted")
      .or(orConditions);

    if (error) {
      console.warn("Error fetching booked slots:", error);
      return NextResponse.json({ bookedSlots: [] });
    }

    const bookedSlots = (data || []).map((row) => ({
      startTime: String(row.start_time || "").substring(0, 5),
      endTime: String(row.end_time || "").substring(0, 5),
    }));

    return NextResponse.json(
      { bookedSlots },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err) {
    console.error("Booked slots API error:", err);
    return NextResponse.json({ bookedSlots: [] });
  }
}
