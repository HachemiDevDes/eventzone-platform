import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email,
          status: "subscribed",
          source: body.source || "footer_newsletter",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (error) {
      console.error("Newsletter subscription DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscriber: data });
  } catch (err) {
    console.error("POST /api/newsletter/subscribe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
