import { NextResponse } from "next/server";
import { verifySmtpConnection, sendEmail, SENDER_EMAIL, SENDER_NAME } from "@/lib/mailer";

export async function GET() {
  try {
    const isHealthy = await verifySmtpConnection();
    return NextResponse.json({
      status: "connected",
      verified: isHealthy,
      sender: SENDER_EMAIL,
      senderName: SENDER_NAME,
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: process.env.SMTP_PORT || "465",
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error.message || "Failed to connect to SMTP server." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetEmail = body.to || SENDER_EMAIL;

    const info = await sendEmail({
      to: targetEmail,
      subject: "Test Email from Eventzone (Hostinger SMTP)",
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">Hostinger SMTP is Active & Ready!</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            This is a test notification confirming that your custom Hostinger email domain (<strong>${SENDER_EMAIL}</strong>) is properly connected and sending live emails via Eventzone.
          </p>
          <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #64748b; margin: 16px 0;">
            <p style="margin: 0 0 4px 0;"><strong>Sender:</strong> ${SENDER_NAME} (${SENDER_EMAIL})</p>
            <p style="margin: 0 0 4px 0;"><strong>Server:</strong> smtp.hostinger.com:465 (SSL)</p>
            <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
          </div>
          <p style="color: #10b981; font-weight: 700; font-size: 13px; margin-bottom: 0;">
            All system transactional emails (passes, confirmations, broadcasts) are now live!
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      sentTo: targetEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test email failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send test email." },
      { status: 500 }
    );
  }
}
