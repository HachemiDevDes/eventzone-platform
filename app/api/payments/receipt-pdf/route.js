import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/apiAuth";
import { generateReceiptPdfBuffer } from "@/lib/receiptPdfServer";

const supabase = getServiceSupabase();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id") || searchParams.get("id");
    const checkoutId = searchParams.get("checkout_id");

    if (!paymentId && !checkoutId) {
      return NextResponse.json(
        { success: false, error: "Payment ID or Checkout ID is required." },
        { status: 400 }
      );
    }

    // 1. Fetch Payment Record
    let query = supabase.from("payments").select("*");
    if (paymentId) {
      query = query.eq("id", paymentId);
    } else {
      query = query.eq("chargily_checkout_id", checkoutId);
    }
    const { data: payment, error: payErr } = await query.maybeSingle();

    if (payErr || !payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found." },
        { status: 404 }
      );
    }

    // 2. Fetch Associated Event
    let eventName = "Eventzone Conference & Summit";
    let eventDate = "";
    let eventLocation = "";
    let organizerName = "Eventzone";

    if (payment.event_id) {
      const { data: ev } = await supabase
        .from("events")
        .select("id, name, location, start_date, organizer_name")
        .eq("id", payment.event_id)
        .maybeSingle();

      if (ev) {
        eventName = ev.name || eventName;
        eventLocation = ev.location || eventLocation;
        organizerName = ev.organizer_name || organizerName;
        eventDate = ev.start_date
          ? new Date(ev.start_date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";
      }
    }

    // 3. Fetch Participant Reference (Badge Code)
    let badgeCode = "";
    if (payment.participant_id) {
      const { data: part } = await supabase
        .from("participants")
        .select("badge_code, phone")
        .eq("id", payment.participant_id)
        .maybeSingle();

      if (part) {
        badgeCode = part.badge_code || "";
        if (!payment.customer_phone && part.phone) {
          payment.customer_phone = part.phone;
        }
      }
    }

    const receiptNumber = `REC-${(payment.id || "00000000").slice(0, 8).toUpperCase()}`;
    const paymentDate = payment.paid_at
      ? new Date(payment.paid_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : new Date(payment.created_at || Date.now()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

    // 4. Generate Official Receipt PDF Buffer
    const pdfBuffer = await generateReceiptPdfBuffer({
      receiptNumber,
      paymentDate,
      customerName: payment.customer_name || "Attendee",
      customerEmail: payment.customer_email || "",
      customerPhone: payment.customer_phone || "",
      eventName,
      eventDate,
      eventLocation,
      organizerName,
      ticketTier: payment.ticket_tier || "Standard Admission",
      quantity: payment.quantity || 1,
      unitPrice: payment.amount || 0,
      amount: payment.amount || 0,
      currency: payment.currency || "DZD",
      paymentMethod: "EDAHABIA / CIB (Chargily Pay)",
      transactionId: payment.chargily_checkout_id || payment.id,
      badgeCode,
    });

    const safeFilename = (payment.customer_name || "attendee")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 30);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}_receipt.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("GET /api/payments/receipt-pdf error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate receipt PDF" },
      { status: 500 }
    );
  }
}
