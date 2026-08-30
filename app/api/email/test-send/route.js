import { NextResponse } from "next/server";
import { sendBroadcastEmail } from "@/lib/mailer";
import { getServiceSupabase } from "@/lib/apiAuth";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

const SUPABASE_EDGE_TRACK_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/track-email` : "";

function isValidUuid(id) {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const {
      eventId = null,
      testEmail,
      subject,
      body: rawBody,
      preheader = "",
      buttonConfig = {},
      includeQr = false,
      eventTitle = "Eventzone Summit",
      organizerName = "Eventzone Organizer",
      eventLogo = "",
      eventDate = "",
      eventLocation = "",
      headerTag = "Email Preview",
      sampleAttendee = {}
    } = payload;

    if (!testEmail || !testEmail.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid test email address." }, { status: 400 });
    }
    if (!subject || !rawBody) {
      return NextResponse.json({ error: "Missing subject line or message content." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const validEventId = isValidUuid(eventId) ? eventId : null;

    const formatEventLevelVars = (str) => {
      if (!str) return "";
      return str
        .replace(/\{\{eventTitle\}\}/gi, eventTitle)
        .replace(/\{\{eventDate\}\}/gi, eventDate || "October 24-26, 2026")
        .replace(/\{\{eventLocation\}\}/gi, eventLocation || "Convention Center")
        .replace(/\{\{venue\}\}/gi, eventLocation || "Convention Center")
        .replace(/\{\{date\}\}/gi, eventDate || "October 24-26, 2026")
        .replace(/\{\{organizerName\}\}/gi, organizerName);
    };

    // Create a tracked communication entry in Supabase
    let commRecord = null;
    let recRecord = null;
    try {
      const { data: createdComm } = await supabase
        .from("communications")
        .insert({
          event_id: validEventId,
          subject: formatEventLevelVars(subject.trim()),
          body: formatEventLevelVars(rawBody.trim()),
          recipient_count: 1,
          recipient_group: "test",
          status: "Sent",
          opens_count: 0,
          unique_opens_count: 0,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createdComm) {
        commRecord = createdComm;
        const { data: createdRec } = await supabase
          .from("communication_recipients")
          .insert({
            communication_id: createdComm.id,
            event_id: validEventId,
            recipient_email: testEmail.trim().toLowerCase(),
            recipient_name: sampleAttendee.name || "Test Recipient",
            recipient_role: "organizer",
            status: "sent",
            open_count: 0,
          })
          .select()
          .single();
        recRecord = createdRec;
      }
    } catch (dbErr) {
      console.warn("Could not log test communication:", dbErr);
    }

    const sample = {
      name: sampleAttendee.name || "Alex Morgan",
      firstName: (sampleAttendee.name || "Alex Morgan").split(" ")[0],
      company: sampleAttendee.company || "Acme Innovations",
      jobTitle: sampleAttendee.jobTitle || "Director of Product",
      ticketTier: sampleAttendee.ticketTier || "VIP All-Access Pass",
      badgeCode: sampleAttendee.badgeCode || "EZ-TEST-99",
      email: testEmail
    };

    const replaceVars = (str) => {
      if (!str) return "";
      return str
        .replace(/\{\{name\}\}/gi, sample.name)
        .replace(/\{\{first_name\}\}/gi, sample.firstName)
        .replace(/\{\{firstName\}\}/gi, sample.firstName)
        .replace(/\{\{company\}\}/gi, sample.company)
        .replace(/\{\{jobTitle\}\}/gi, sample.jobTitle)
        .replace(/\{\{ticketTier\}\}/gi, sample.ticketTier)
        .replace(/\{\{badgeCode\}\}/gi, sample.badgeCode)
        .replace(/\{\{eventTitle\}\}/gi, eventTitle)
        .replace(/\{\{eventDate\}\}/gi, eventDate || "October 24-26, 2026")
        .replace(/\{\{eventLocation\}\}/gi, eventLocation || "Metropolitan Grand Convention Center")
        .replace(/\{\{venue\}\}/gi, eventLocation || "Metropolitan Grand Convention Center")
        .replace(/\{\{date\}\}/gi, eventDate || "October 24-26, 2026")
        .replace(/\{\{organizerName\}\}/gi, organizerName)
        .replace(/\{\{formLink\}\}/gi, buttonConfig?.formUrl || "https://eventzone.pro")
        .replace(/\{\{ticketLink\}\}/gi, buttonConfig?.ticketUrl || "https://eventzone.pro");
    };

    const personalizedSubject = replaceVars(subject);
    const personalizedBody = replaceVars(rawBody);
    const personalizedPreheader = replaceVars(preheader);

    // Global Public Edge Tracking Pixel URL
    const recipientLogId = recRecord?.id || "";
    const trackingPixelUrl = commRecord?.id
      ? `${SUPABASE_EDGE_TRACK_URL}?cid=${commRecord.id}${recipientLogId ? `&rid=${recipientLogId}` : ""}&em=${encodeURIComponent(testEmail.trim())}`
      : "";

    // Trackify Action Buttons
    const trackify = (url) => {
      if (!url || !commRecord?.id) return url;
      return `${SUPABASE_EDGE_TRACK_URL}?cid=${commRecord.id}${recipientLogId ? `&rid=${recipientLogId}` : ""}&em=${encodeURIComponent(testEmail.trim())}&url=${encodeURIComponent(url)}`;
    };

    const trackedButtonConfig = {
      ...buttonConfig,
      formUrl: buttonConfig?.formUrl ? trackify(buttonConfig.formUrl) : undefined,
      ticketUrl: buttonConfig?.ticketUrl ? trackify(buttonConfig.ticketUrl) : undefined,
      customButtonUrl: buttonConfig?.customButtonUrl ? trackify(buttonConfig.customButtonUrl) : undefined,
    };

    let qrBuffer = null;
    if (includeQr) {
      try {
        const checkinPayload = JSON.stringify({
          action: "checkin_preview",
          badgeCode: sample.badgeCode,
          name: sample.name,
          email: testEmail,
          tier: sample.ticketTier,
          event: eventTitle,
        });
        qrBuffer = await QRCode.toBuffer(checkinPayload, {
          type: "png",
          width: 340,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
      } catch (qrErr) {
        console.warn("Test QR code error:", qrErr);
      }
    }

    await sendBroadcastEmail({
      to: testEmail,
      recipientName: sample.name,
      subject: personalizedSubject,
      body: personalizedBody,
      preheader: personalizedPreheader,
      eventTitle,
      organizerName,
      eventLogo,
      eventDate,
      eventLocation,
      headerTag: "Official Event Announcement",
      buttonConfig: trackedButtonConfig,
      includeQr: Boolean(includeQr),
      qrBuffer,
      includeEventCard: true,
      trackingPixelUrl,
    });

    return NextResponse.json({
      success: true,
      recipient: testEmail,
      communicationId: commRecord?.id || null,
      message: `Test email successfully sent to ${testEmail}!`,
    });
  } catch (error) {
    console.error("Test send email error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send test email." },
      { status: 500 }
    );
  }
}
