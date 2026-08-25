import { NextResponse } from "next/server";
import { sendBroadcastEmail } from "@/lib/mailer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { recipients = [], subject, body: messageBody, eventTitle, organizerName } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Recipients array must not be empty." }, { status: 400 });
    }
    if (!subject || !messageBody) {
      return NextResponse.json({ error: "Missing subject or message body." }, { status: 400 });
    }

    const validEmails = recipients.filter(email => typeof email === "string" && email.includes("@"));

    const results = {
      total: validEmails.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Send emails in batches of 5 to avoid throttling
    const batchSize = 5;
    for (let i = 0; i < validEmails.length; i += batchSize) {
      const batch = validEmails.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (email) => {
          try {
            await sendBroadcastEmail({
              to: email,
              subject,
              body: messageBody,
              eventTitle: eventTitle || "Eventzone Summit",
              organizerName: organizerName || "Eventzone Organizer",
            });
            results.sent++;
          } catch (err) {
            results.failed++;
            results.errors.push({ email, error: err.message });
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Broadcast email API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to broadcast emails." },
      { status: 500 }
    );
  }
}
