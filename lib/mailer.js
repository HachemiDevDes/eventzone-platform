import nodemailer from "nodemailer";
import { SUPER_ADMIN_EMAILS } from "./constants.js";

// Lazy-loaded or cached transporter
let transporter = null;

export function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "smtp.hostinger.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE !== "false"; // true for port 465, false for 587
    const user = process.env.SMTP_USER || "contact@eventzone.pro";
    const pass = process.env.SMTP_PASS;

    if (!pass) {
      console.warn("Notice: SMTP_PASS environment variable is not configured.");
    }

    transporter = nodemailer.createTransport({
      pool: true, // Connection pooling to prevent socket exhaustion and rate bans
      maxConnections: 3, // Controlled concurrency for shared SMTP servers
      maxMessages: 100, // Gracefully recycle connections
      rateDelta: 1000, // 1 second window
      rateLimit: 5, // Maximum 5 messages/second per connection to avoid spam heuristic triggers
      host,
      port,
      secure,
      auth: {
        user,
        pass: pass || "",
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_ALLOW_SELFSIGNED === "true" ? false : true,
      },
    });
  }
  return transporter;
}

export const SENDER_EMAIL = process.env.SMTP_FROM_EMAIL || "contact@eventzone.pro";
export const SENDER_NAME = process.env.SMTP_FROM_NAME || "Eventzone Platform";
export const DEFAULT_FROM = `"${SENDER_NAME}" <${SENDER_EMAIL}>`;

/**
 * Returns canonical super admin notification recipients
 */
export function getAdminNotificationRecipients() {
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    const list = process.env.ADMIN_NOTIFICATION_EMAIL
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return SUPER_ADMIN_EMAILS;
}

/**
 * Verify SMTP credentials and connection health
 */
export async function verifySmtpConnection() {
  const mailer = getTransporter();
  return await mailer.verify();
}

/**
 * Extract clean, human-readable plain text from an HTML email string
 * (Strips <head>, <style>, <script>, tags and decodes entities to prevent CSS leak in notifications)
 */
export function htmlToPlainText(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generic email dispatcher with automatic base64-to-CID conversion & Anti-Spam Headers
 * (Ensures QR codes and embedded images display reliably in Gmail/Outlook/Apple Mail)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  replyTo = SENDER_EMAIL,
  attachments = [],
  headers = {},
  listUnsubscribe = true,
  eventTitle = "",
}) {
  const mailer = getTransporter();
  let finalHtml = html || "";
  const finalAttachments = [...(attachments || [])];

  // Auto-convert inline base64 images into robust CID inline attachments
  // (Email clients like Gmail, Outlook, and Apple Mail strictly block raw base64 data URIs)
  if (finalHtml && typeof finalHtml === "string") {
    let imgCount = 0;
    finalHtml = finalHtml.replace(/src=["']data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=\r\n\s]+)["']/gi, (match, mimeSubtype, base64Data) => {
      try {
        const cleanBase64 = base64Data.replace(/[\r\n\s]/g, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        const isJpg = mimeSubtype.toLowerCase().includes("jpeg") || mimeSubtype.toLowerCase().includes("jpg");
        const ext = isJpg ? "jpg" : mimeSubtype.toLowerCase().includes("png") ? "png" : mimeSubtype.toLowerCase().includes("gif") ? "gif" : "png";
        const cid = `eventzone_auto_img_${Date.now()}_${imgCount++}`;
        
        finalAttachments.push({
          filename: `asset_${imgCount}.${ext}`,
          content: buffer,
          cid: cid,
          contentType: `image/${isJpg ? "jpeg" : ext}`,
          contentDisposition: "inline",
        });
        
        return `src="cid:${cid}"`;
      } catch (err) {
        console.warn("Failed to convert base64 image to cid attachment:", err);
        return match;
      }
    });
  }

  // Clean Subject line (removes newlines/tabs that trigger spam filters)
  const sanitizedSubject = (subject || "Eventzone Notification")
    .replace(/[\r\n\t]+/g, " ")
    .trim();

  // Generate unique RFC 5322 compliant Message-ID with verified domain
  const senderDomain = SENDER_EMAIL.split("@")[1] || "eventzone.pro";
  const uniqueMessageId = `<ez.${Date.now()}.${Math.random().toString(36).substring(2, 11)}@${senderDomain}>`;

  // Standard Anti-Spam & Deliverability Headers
  const recipientEmail = Array.isArray(to) ? to[0] : to;
  const antiSpamHeaders = {
    "X-Mailer": "Eventzone Platform Mailer 2.0",
    "X-Priority": "3", // Normal priority (avoid high priority 1 spam flags)
    "X-MSMail-Priority": "Normal",
    "Importance": "Normal",
    "Auto-Submitted": "auto-generated",
    "Precedence": "bulk",
    "X-Auto-Response-Suppress": "OOF, AutoReply",
    ...headers,
  };

  // RFC 8058 & RFC 2369 compliant List-Unsubscribe headers for Gmail, Yahoo & Outlook
  if (listUnsubscribe && recipientEmail) {
    antiSpamHeaders["List-Unsubscribe"] = `<mailto:${SENDER_EMAIL}?subject=Unsubscribe%20${encodeURIComponent(recipientEmail)}>, <https://eventzone.pro/unsubscribe?email=${encodeURIComponent(recipientEmail)}>`;
    antiSpamHeaders["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const plainText = text && typeof text === "string" && text.trim().length > 0 
    ? text.trim() 
    : htmlToPlainText(finalHtml);

  const info = await mailer.sendMail({
    from,
    to,
    replyTo,
    subject: sanitizedSubject,
    text: plainText,
    html: finalHtml,
    attachments: finalAttachments,
    headers: antiSpamHeaders,
    messageId: uniqueMessageId,
  });
  return info;
}

import { generateBadgePdfBuffer } from "./badgePdfServer.js";
import { generateCertificatePdfBuffer } from "./certificatePdfServer.js";
import QRCode from "qrcode";

/**
 * Clean, modern base HTML wrapper for Eventzone emails
 */
export function getEmailLayout({ title, content, footerText = "", eventTitle, eventLogo, headerTag = "Official Event Experience", preheader = "" }) {
  const displayTitle = eventTitle || title || "EVENTZONE";
  const previewSnippet = (preheader || title || displayTitle || "Your official event communication from Eventzone Platform.")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>${displayTitle}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&family=Product+Sans:wght@400;700&display=swap" rel="stylesheet">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&family=Product+Sans:wght@400;700&display=swap');
        :root {
          color-scheme: light dark;
          supported-color-schemes: light dark;
        }
        body, table, td, p, a, h1, h2, h3, h4, span, div {
          font-family: 'Google Sans', 'Product Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
        body { background-color: #f8fafc; color: #334155; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 32px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); }
        .header { background-color: #ffffff; padding: 28px 28px 22px 28px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .logo-img { max-height: 44px; max-width: 180px; object-fit: contain; margin: 0 0 12px 0; display: block; }
        .logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; margin: 0; color: #0f172a; text-align: left; }
        .logo-tag { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; font-weight: 800; margin-top: 4px; text-align: left; }
        .body { padding: 32px 28px; color: #334155; line-height: 1.65; }
        .body h1, .body h2, .body h3 { color: #0f172a; margin-top: 0; margin-bottom: 14px; letter-spacing: -0.4px; }
        .body p { color: #475569; margin: 0 0 16px 0; }
        .body strong { color: #0f172a; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0; }
        .card-header { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 9px 0; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .info-table tr:last-child td { border-bottom: none; }
        .info-label { font-size: 12.5px; color: #64748b; font-weight: 600; text-align: left; }
        .info-val { font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; }
        .tier-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-size: 11.5px; font-weight: 700; }
        .pdf-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 18px; margin: 24px 0; }
        .footer { background-color: #f8fafc; padding: 24px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .qr-box { text-align: center; margin: 24px 0; padding: 20px; background-color: #ffffff; border: 2px dashed #cbd5e1; border-radius: 16px; display: inline-block; }
        .qr-pad { background-color: #ffffff; padding: 10px; border-radius: 12px; display: inline-block; }

        /* ── Dark Mode Automatic Overrides (Email Client Compliant) ── */
        @media (prefers-color-scheme: dark) {
          body, .wrapper, .email-bg {
            background-color: #0b0f19 !important;
            color: #e2e8f0 !important;
          }
          .container, .email-container {
            background-color: #111827 !important;
            border-color: #1e293b !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7) !important;
          }
          .header, .email-header {
            background-color: #0f172a !important;
            border-bottom-color: #1e293b !important;
          }
          .logo-text, .email-title, h1, h2, h3, h4 {
            color: #f8fafc !important;
          }
          .logo-tag {
            color: #60a5fa !important;
          }
          .body, .email-body {
            color: #e2e8f0 !important;
          }
          p, li, td, .email-paragraph, .email-list-item {
            color: #cbd5e1 !important;
          }
          .email-subtext, .email-footer-notice {
            color: #94a3b8 !important;
          }
          .email-msg-box {
            background-color: #1a2234 !important;
            border-color: #27354f !important;
            border-left-color: #3b82f6 !important;
            color: #f1f5f9 !important;
          }
          .email-msg-box p, .email-msg-box li, .email-msg-box span, .email-msg-box div {
            color: #f1f5f9 !important;
          }
          strong, b, .email-strong {
            color: #ffffff !important;
          }
          .card, .email-card {
            background-color: #0f172a !important;
            border-color: #1e293b !important;
          }
          .card-header, .email-card-header {
            color: #94a3b8 !important;
            border-bottom-color: #1e293b !important;
          }
          .info-table td {
            border-bottom-color: #1e293b !important;
          }
          .info-label {
            color: #94a3b8 !important;
          }
          .info-val {
            color: #f8fafc !important;
          }
          .tier-badge {
            background-color: #064e3b !important;
            color: #34d399 !important;
            border-color: #065f46 !important;
          }
          .pdf-notice {
            background-color: #0f172a !important;
            border-color: #1e3a8a !important;
          }
          .pdf-notice-title {
            color: #93c5fd !important;
          }
          .pdf-notice-desc {
            color: #bfdbfe !important;
          }
          .action-box, .email-action-box {
            background-color: #1a2234 !important;
            border-color: #27354f !important;
            color: #f8fafc !important;
          }
          .action-box-title {
            color: #f8fafc !important;
          }
          .action-box-link {
            color: #60a5fa !important;
          }
          .footer, .email-footer {
            background-color: #0b0f19 !important;
            border-top-color: #1e293b !important;
            color: #64748b !important;
          }
          .footer p, .footer span {
            color: #94a3b8 !important;
          }
          .footer strong {
            color: #cbd5e1 !important;
          }
          .footer a {
            color: #60a5fa !important;
          }
          .qr-box {
            background-color: #0f172a !important;
            border-color: #334155 !important;
          }
          .qr-pad {
            background-color: #ffffff !important;
          }
        }

        /* ── Outlook App & Office 365 Dark Mode Hooks ── */
        [data-ogsc] .wrapper, [data-ogsb] .wrapper { background-color: #0b0f19 !important; }
        [data-ogsc] .container, [data-ogsb] .container { background-color: #111827 !important; border-color: #1e293b !important; }
        [data-ogsc] .header, [data-ogsb] .header { background-color: #0f172a !important; border-bottom-color: #1e293b !important; }
        [data-ogsc] .logo-text, [data-ogsc] h1, [data-ogsc] h2, [data-ogsc] h3, [data-ogsc] .email-title { color: #f8fafc !important; }
        [data-ogsc] .email-msg-box, [data-ogsb] .email-msg-box { background-color: #1a2234 !important; border-color: #27354f !important; color: #f8fafc !important; }
        [data-ogsc] p, [data-ogsc] li, [data-ogsc] td { color: #cbd5e1 !important; }
        [data-ogsc] strong, [data-ogsc] b { color: #ffffff !important; }
        [data-ogsc] .card, [data-ogsb] .card { background-color: #0f172a !important; border-color: #1e293b !important; }
        [data-ogsc] .footer, [data-ogsb] .footer { background-color: #0b0f19 !important; border-top-color: #1e293b !important; color: #94a3b8 !important; }
      </style>
    </head>
    <body class="email-bg">
      <!-- Hidden Preheader Snippet for Mobile Lock-Screen & Push Notifications -->
      <div style="display: none !important; font-size: 1px !important; color: #ffffff !important; line-height: 1px !important; max-height: 0px !important; max-width: 0px !important; opacity: 0 !important; overflow: hidden !important; mso-hide: all; visibility: hidden;">
        ${previewSnippet}
        &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279;
      </div>

      <div class="wrapper email-bg">
        <div class="container email-container">
          <div class="header email-header">
            ${eventLogo ? `<img src="${eventLogo}" alt="Logo" class="logo-img" />` : ""}
            <h1 class="logo-text">${displayTitle}</h1>
            <div class="logo-tag">${headerTag}</div>
          </div>
          <div class="body email-body">
            ${content}
          </div>
          <div class="footer email-footer">
            <p style="margin: 0 0 8px 0; color: #64748b;">Dispatched securely via <strong class="email-strong">Eventzone Platform</strong>.</p>
            <p style="margin: 0; font-size: 11.5px;">For inquiries or support, reply to <a href="mailto:${SENDER_EMAIL}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${SENDER_EMAIL}</a></p>
            ${footerText ? `<p style="margin-top: 14px; font-size: 11px; color: #94a3b8;">${footerText}</p>` : ""}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 1. Ticket Registration / Acceptance Confirmation Email
 */
export async function sendTicketConfirmationEmail({
  to,
  subject,
  attendeeName,
  ticketTier = "Standard Admission",
  eventTitle = "Eventzone Conference & Summit",
  eventDate,
  eventLocation,
  company = "",
  jobTitle = "",
  badgeCode,
  qrDataUrl,
  passId,
  requiresApproval = false,
  isApproval = false,
  formUrl = "",
  formButtonText = "Fill Out Form / Survey",
  eventLogo = "",
  organizerName = "Eventzone Platform",
  templateUrl = "",
  badgeSettings = {},
  attendeePhoto = "",
  eventId = "",
  cardTheme = "",
}) {
  const isPending = Boolean(requiresApproval);
  const cleanBadgeCode = badgeCode || (passId ? `EZ-${String(passId).slice(-4).toUpperCase()}` : "EZ-PASS");
  const safeAttendeeName = (attendeeName || "Attendee").replace(/[^a-zA-Z0-9_\-\s]/g, "").trim();

  // Ensure QR code Data URL is available if confirmed
  let resolvedQrUrl = qrDataUrl;
  let qrBuffer = null;
  if (!isPending) {
    try {
      const qrPayload = JSON.stringify({
        action: "checkin",
        badgeCode: cleanBadgeCode,
        name: attendeeName,
        email: to,
        tier: ticketTier,
        eventId: eventId || "",
        event: eventTitle,
      });

      if (!resolvedQrUrl || !resolvedQrUrl.startsWith("data:image/")) {
        resolvedQrUrl = await QRCode.toDataURL(qrPayload, {
          width: 320,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
          errorCorrectionLevel: "H",
        });
      }

      qrBuffer = await QRCode.toBuffer(qrPayload, {
        type: "png",
        width: 320,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    } catch (e) {
      console.warn("QR code generation in mailer notice:", e);
    }
  }

  // Generate official PDF Badge buffer
  let attachments = [];
  if (!isPending) {
    try {
      const pdfBuffer = await generateBadgePdfBuffer({
        templateUrl: templateUrl || "",
        attendeeName: attendeeName || "Attendee",
        attendeeEmail: to,
        attendeeCompany: company || "",
        attendeeJobTitle: jobTitle || "",
        attendeePhoto: attendeePhoto || "",
        ticketTier: ticketTier || "Standard Admission",
        badgeCode: cleanBadgeCode,
        eventId: eventId || "",
        eventTitle: eventTitle || "Eventzone Conference",
        eventDate: eventDate || "",
        eventLocation: eventLocation || "",
        qrDataUrl: resolvedQrUrl,
        showFoldGuide: badgeSettings.showFoldGuide !== false,
        showPhoto: badgeSettings.showPhoto !== false,
        showQr: badgeSettings.showQr !== false,
        cardTheme: cardTheme || badgeSettings.cardTheme || "transparent",
        badgeSettings: badgeSettings || {},
      });

      if (pdfBuffer && pdfBuffer.length > 0) {
        attachments.push({
          filename: `${safeAttendeeName.replace(/\s+/g, "_")}_Official_Event_Badge.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        });
      }
    } catch (pdfErr) {
      console.error("Failed to generate badge PDF attachment:", pdfErr);
    }

    // Attach QR code image with Content-ID for robust inline email rendering
    if (qrBuffer && qrBuffer.length > 0) {
      attachments.push({
        filename: "event_pass_qr.png",
        content: qrBuffer,
        cid: "eventzone_qr_code_pass",
        contentType: "image/png",
      });
    }
  }

  const statusBadge = isPending 
    ? `<div style="margin-bottom: 20px;"><span style="display:inline-block; padding: 4px 12px; border-radius: 20px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Pending Organizer Review</span></div>`
    : "";

  const heroHeadline = isPending
    ? "Registration Received & Under Review"
    : isApproval
    ? "Your Application Has Been Approved! Official Badge Attached"
    : "You're Confirmed! Official Pass & Badge Attached";

  const introText = isPending
    ? `Thank you for applying to attend <strong>${eventTitle}</strong>. Your registration is currently in the organizer review queue. You will receive an immediate confirmation email with your official badge PDF and fast-track QR pass once accepted.`
    : `Congratulations! Your registration for <strong>${eventTitle}</strong> is fully confirmed. Your official conference pass has been activated in the event roster.`;

  const content = `
    ${statusBadge}
    <h1>${heroHeadline}</h1>
    <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${attendeeName || "Attendee"}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">${introText}</p>

    <!-- Credential Details Card -->
    <div class="card">
      <div class="card-header">Pass Details</div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="info-label" width="38%">Event</td>
          <td class="info-val" width="62%">${eventTitle}</td>
        </tr>
        <tr>
          <td class="info-label">Attendee Name</td>
          <td class="info-val">${attendeeName || "Attendee"}</td>
        </tr>
        ${jobTitle ? `
        <tr>
          <td class="info-label">Job Title / Role</td>
          <td class="info-val" style="color: #2563eb;">${jobTitle}</td>
        </tr>` : ""}
        ${company ? `
        <tr>
          <td class="info-label">Organization</td>
          <td class="info-val">${company}</td>
        </tr>` : ""}
        <tr>
          <td class="info-label">Access Tier</td>
          <td class="info-val">
            <span class="tier-badge">${ticketTier}</span>
          </td>
        </tr>
        ${eventDate ? `
        <tr>
          <td class="info-label">Date & Time</td>
          <td class="info-val">${eventDate}</td>
        </tr>` : ""}
        ${eventLocation ? `
        <tr>
          <td class="info-label">Venue Location</td>
          <td class="info-val">${eventLocation}</td>
        </tr>` : ""}
      </table>
    </div>

    ${!isPending ? `
      <!-- Fast-Track Mobile QR Code -->
      <div style="text-align: center; margin: 28px 0;">
        <div class="qr-box">
          <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Fast-Track Check-In QR Pass</div>
          <div class="qr-pad">
            <img src="cid:eventzone_qr_code_pass" alt="Event Check-in Pass QR" width="180" height="180" style="display: block; margin: 0 auto; border-radius: 8px;" />
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">Present this scannable QR code on your phone upon arrival</div>
        </div>
      </div>

      ${formUrl ? `
        <!-- Form / Survey Call-to-Action -->
        <div style="text-align: center; margin: 26px 0; padding: 22px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="font-size: 13.5px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Action Required: Complete Event Form</div>
          <a href="${formUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 13.5px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
            ${formButtonText || "Open Form"} →
          </a>
          <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
            Direct link: <a href="${formUrl}" style="color: #2563eb; text-decoration: underline;">${formUrl}</a>
          </div>
        </div>
      ` : ""}
    ` : ""}

    <!-- Helpful Check-In Instructions -->
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
      <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 8px;">
        Fast-Track Venue Arrival Checklist
      </h4>
      <ul style="font-size: 12.5px; color: #64748b; margin: 0; padding-left: 20px; line-height: 1.7;">
        <li>Have your mobile QR pass or printed PDF badge ready when approaching check-in.</li>
        <li>Present a valid government ID or corporate credential matching your registered name.</li>
        <li>Collect your official physical lanyard pass and welcome packet at reception.</li>
      </ul>
    </div>
  `;

  const preheader = isPending
    ? `Registration received for ${eventTitle}. Your pass application is under review.`
    : `Your pass for ${eventTitle} is confirmed! Pass code: ${cleanBadgeCode}. Check-in QR pass and badge PDF attached.`;

  const plainText = isPending
    ? `Hello ${attendeeName || "Attendee"},\n\nThank you for applying for ${eventTitle}. Your registration is currently in the organizer review queue.\n\nEvent: ${eventTitle}\nAccess Tier: ${ticketTier}\n\nEventzone Platform`
    : `Hello ${attendeeName || "Attendee"},\n\nYour registration for ${eventTitle} is fully confirmed!\n\nPass Details:\n- Event: ${eventTitle}\n- Attendee: ${attendeeName || "Attendee"}\n- Tier: ${ticketTier}\n- Badge Code: ${cleanBadgeCode}\n${eventDate ? `- Date: ${eventDate}\n` : ''}${eventLocation ? `- Venue: ${eventLocation}\n` : ''}\nPlease find your official badge PDF and fast-track QR pass attached.\n\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: subject || (isPending 
      ? `Registration Received: ${eventTitle} (Under Review)`
      : isApproval
      ? `Application Approved: Your Official Pass for ${eventTitle}`
      : `Your Official Pass for ${eventTitle}`),
    text: plainText,
    html: getEmailLayout({
      title: `Event Pass: ${attendeeName || "Attendee"}`,
      eventTitle: eventTitle || "Eventzone Conference",
      eventLogo: eventLogo || "",
      headerTag: isPending ? "Registration Received (Under Review)" : "Official Attendee Pass",
      preheader,
      content,
      footerText: `Organizer: ${organizerName} • Eventzone Platform`,
    }),
    attachments,
  });
}

/**
 * 2. RSVP Confirmation & Status Update Email
 */
export async function sendRSVPConfirmationEmail({
  to,
  attendeeName,
  eventTitle,
  status = "attending",
  eventDate,
  eventLocation,
  dietaryPreference,
  notes,
  qrDataUrl,
}) {
  const statusLabels = {
    attending: { text: "Attending (Confirmed)", color: "#065f46", bg: "#ecfdf5" },
    waitlisted: { text: "Waitlisted", color: "#92400e", bg: "#fef3c7" },
    tentative: { text: "Tentative / Unconfirmed", color: "#1e40af", bg: "#dbeafe" },
    declined: { text: "Declined", color: "#991b1b", bg: "#fee2e2" },
  };

  const currentStatus = statusLabels[status] || statusLabels.attending;

  const content = `
    <h1>RSVP Confirmation: ${eventTitle || "Eventzone Summit"}</h1>
    <p>Hello <strong>${attendeeName || "Guest"}</strong>,</p>
    <p>Thank you for submitting your RSVP for <strong>${eventTitle || "the event"}</strong>. Your response has been recorded in our attendee roster.</p>

    <div class="card">
      <div style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
        <span class="card-header" style="margin-bottom: 0; padding-bottom: 0; border-bottom: none;">RSVP Status</span>
        <span style="display:inline-block; padding: 3px 10px; border-radius: 20px; background: ${currentStatus.bg}; color: ${currentStatus.color}; font-size: 11px; font-weight: 800; text-transform: uppercase;">
          ${currentStatus.text}
        </span>
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="info-label" width="38%">Event</td>
          <td class="info-val" width="62%">${eventTitle || "Global Summit"}</td>
        </tr>
        ${eventDate ? `
        <tr>
          <td class="info-label">Date & Time</td>
          <td class="info-val">${eventDate}</td>
        </tr>` : ""}
        ${eventLocation ? `
        <tr>
          <td class="info-label">Venue</td>
          <td class="info-val">${eventLocation}</td>
        </tr>` : ""}
        ${dietaryPreference ? `
        <tr>
          <td class="info-label">Dietary Preference</td>
          <td class="info-val">${dietaryPreference}</td>
        </tr>` : ""}
        ${notes ? `
        <tr>
          <td class="info-label">Special Request / Notes</td>
          <td class="info-val">${notes}</td>
        </tr>` : ""}
      </table>
    </div>

    ${status === "attending" && qrDataUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <div class="qr-box">
          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">Door Check-In Code</p>
          <img src="${qrDataUrl}" alt="RSVP Check-in Pass QR" width="180" height="180" style="display: block; margin: 0 auto;" />
        </div>
      </div>
    ` : ""}

    <p style="font-size: 13px; color: #64748b;">If your plans change or you need to update your reservation, simply reply to this email.</p>
  `;

  const preheader = `Your RSVP for ${eventTitle || "the event"} is recorded (${currentStatus.text}).`;
  const plainText = `Hello ${attendeeName || "Guest"},\n\nThank you for submitting your RSVP for ${eventTitle || "the event"}.\n\nRSVP Status: ${currentStatus.text}\nEvent: ${eventTitle || "Global Summit"}\n${eventDate ? `Date: ${eventDate}\n` : ""}${eventLocation ? `Venue: ${eventLocation}\n` : ""}\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: `RSVP Confirmed: ${eventTitle || "Event"} (${currentStatus.text})`,
    text: plainText,
    html: getEmailLayout({
      title: `RSVP for ${eventTitle}`,
      preheader,
      content,
    }),
  });
}

/**
 * Format markdown/bullets and paragraphs into clean HTML
 */
export function formatEmailBodyToHtml(bodyText) {
  if (!bodyText || typeof bodyText !== "string") return "";
  let text = bodyText.trim();
  
  // Format bold **text** across single and multi lines
  text = text.replace(/\*\*([\s\S]*?)\*\*/g, '<strong class="email-strong" style="font-weight: 800; color: inherit;">$1</strong>');
  // Format italic *text* or _text_
  text = text.replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<em style="color: inherit;">$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em style="color: inherit;">$1</em>');

  const lines = text.split('\n');
  let inList = false;
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        processedLines.push('<ul class="email-list" style="margin: 14px 0; padding-left: 22px; color: inherit; line-height: 1.7;">');
        inList = true;
      }
      const itemContent = trimmed.replace(/^[•\-\*]\s*/, '');
      processedLines.push(`<li class="email-list-item" style="margin-bottom: 6px; color: inherit;">${itemContent}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (trimmed === '') {
        processedLines.push('<div style="height: 12px;"></div>');
      } else {
        processedLines.push(`<p class="email-paragraph" style="margin: 0 0 14px 0; line-height: 1.7; color: inherit; font-size: 14.5px;">${line}</p>`);
      }
    }
  }
  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('');
}

/**
 * Generate responsive HTML email layout for broadcast announcements
 */
export function generateBroadcastHtml({
  subject,
  body,
  preheader = "",
  eventTitle = "Eventzone Summit",
  organizerName = "Eventzone Organizer",
  eventLogo = "",
  eventDate = "",
  eventLocation = "",
  headerTag = "Official Event Announcement",
  buttonConfig = {},
  includeQr = false,
  qrCid = "",
  qrDataUrl = "",
  includeEventCard = true,
  trackingPixelUrl = "",
  recipientName = "",
}) {
  const formattedBody = formatEmailBodyToHtml(body);
  const displayPreheader = preheader || (body ? body.slice(0, 140).replace(/\s+/g, ' ').trim() : subject);

  let buttonsHtml = '';
  
  // 1. Form / Survey CTA Button
  if (buttonConfig?.includeFormButton && buttonConfig?.formUrl) {
    buttonsHtml += `
      <div class="action-box email-action-box" style="text-align: center; margin: 22px 0 14px 0; padding: 20px 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div class="action-box-title" style="font-size: 13.5px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Action Required: Questionnaire / Survey</div>
        <a href="${buttonConfig.formUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 30px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
          ${buttonConfig.formButtonText || "Complete Form / Survey"} →
        </a>
        <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
          Direct link: <a href="${buttonConfig.formUrl}" class="action-box-link" style="color: #2563eb; text-decoration: underline;">${buttonConfig.formUrl}</a>
        </div>
      </div>
    `;
  }

  // 2. Ticket / Badge Pass Button
  if (buttonConfig?.includeTicketButton && buttonConfig?.ticketUrl) {
    buttonsHtml += `
      <div style="text-align: center; margin: 16px 0;">
        <a href="${buttonConfig.ticketUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; font-weight: 700; font-size: 13.5px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);">
          🎟️ ${buttonConfig.ticketButtonText || "View My Event Badge"} →
        </a>
      </div>
    `;
  }

  // 3. Custom Secondary CTA Button
  if (buttonConfig?.includeCustomButton && buttonConfig?.customButtonUrl) {
    buttonsHtml += `
      <div style="text-align: center; margin: 16px 0;">
        <a href="${buttonConfig.customButtonUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #f1f5f9; color: #1e293b !important; border: 1px solid #cbd5e1; font-weight: 700; font-size: 13px; text-decoration: none; padding: 11px 24px; border-radius: 12px;">
          🔗 ${buttonConfig.customButtonText || "Access Resource"} →
        </a>
      </div>
    `;
  }

  // 4. QR Pass Container
  let qrHtml = '';
  if (includeQr && (qrCid || qrDataUrl)) {
    const imgSrc = qrCid ? `cid:${qrCid}` : qrDataUrl;
    qrHtml = `
      <div style="text-align: center; margin: 26px 0;">
        <div class="qr-box" style="text-align: center; padding: 20px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; display: inline-block;">
          <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Fast-Track Check-In QR Pass</div>
          <div class="qr-pad" style="background-color: #ffffff; padding: 10px; border-radius: 12px; display: inline-block;">
            <img src="${imgSrc}" alt="Entry QR Pass" width="180" height="180" style="display: block; margin: 0 auto; border-radius: 8px;" />
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">Present this scannable QR code on your mobile device at check-in</div>
        </div>
      </div>
    `;
  }

  // 5. Event Info Card
  let eventCardHtml = '';
  if (includeEventCard && (eventDate || eventLocation)) {
    eventCardHtml = `
      <div class="card email-card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 22px; margin: 22px 0;">
        <div class="card-header email-card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Event Highlights</div>
        <table role="presentation" class="info-table" style="width: 100%; border-collapse: collapse;">
          ${eventDate ? `
          <tr>
            <td class="info-label" style="padding: 6px 0; font-size: 12.5px; color: #64748b; font-weight: 600;" width="35%">📅 Date & Time</td>
            <td class="info-val" style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;" width="65%">${eventDate}</td>
          </tr>` : ''}
          ${eventLocation ? `
          <tr>
            <td class="info-label" style="padding: 6px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">📍 Venue</td>
            <td class="info-val" style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventLocation}</td>
          </tr>` : ''}
          <tr>
            <td class="info-label" style="padding: 6px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">🏛️ Host</td>
            <td class="info-val" style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${organizerName}</td>
          </tr>
        </table>
      </div>
    `;
  }

  // 6. Tracking Pixel (Transparent 1x1 pixel formatted for all major mail clients)
  const pixelHtml = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" alt="" width="1" height="1" border="0" style="display:block !important; width:1px !important; min-width:1px !important; height:1px !important; min-height:1px !important; border:0 !important; outline:none !important; margin:0 !important; padding:0 !important; -ms-interpolation-mode:bicubic;" />`
    : '';

  const content = `
    <h1 class="email-title" style="color: #0f172a; margin-top: 0; margin-bottom: 8px; font-size: 22px; font-weight: 800; letter-spacing: -0.4px;">${subject}</h1>
    <p class="email-subtext" style="font-size: 12.5px; color: #64748b; margin-top: 0; margin-bottom: 22px;">
      Broadcast announcement from <strong class="email-strong">${organizerName}</strong> for <strong class="email-strong">${eventTitle}</strong>
    </p>

    <div class="email-msg-box" style="font-size: 14.5px; color: #1e293b; line-height: 1.7; background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 20px 0; border-radius: 6px 14px 14px 6px;">
      ${formattedBody}
    </div>

    ${buttonsHtml}
    ${qrHtml}
    ${eventCardHtml}

    <p class="email-footer-notice" style="font-size: 12px; color: #94a3b8; margin-top: 28px; line-height: 1.5;">
      You received this official broadcast as a registered participant, partner, or exhibitor of <strong class="email-strong">${eventTitle}</strong>.
    </p>
    ${pixelHtml}
  `;

  return getEmailLayout({
    title: subject,
    eventTitle,
    eventLogo,
    headerTag,
    preheader: displayPreheader,
    content,
    footerText: `Sent to registered participants of ${eventTitle} • Organized by ${organizerName}`
  });
}

/**
 * 3. Broadcast Announcement Email to Group of Recipients
 */
export async function sendBroadcastEmail({
  to,
  subject,
  body,
  preheader = "",
  eventTitle = "Eventzone Summit",
  organizerName = "Event Organizer",
  eventLogo = "",
  eventDate = "",
  eventLocation = "",
  headerTag = "Official Event Announcement",
  buttonConfig = {},
  includeQr = false,
  qrDataUrl = "",
  qrBuffer = null,
  includeEventCard = true,
  trackingPixelUrl = "",
  recipientName = "",
}) {
  let attachments = [];
  let qrCid = "";

  if (includeQr && qrBuffer) {
    qrCid = `ez_qr_pass_${Date.now()}`;
    attachments.push({
      filename: "fast_track_qr_pass.png",
      content: qrBuffer,
      cid: qrCid,
      contentType: "image/png"
    });
  }

  const html = generateBroadcastHtml({
    subject,
    body,
    preheader,
    eventTitle,
    organizerName,
    eventLogo,
    eventDate,
    eventLocation,
    headerTag,
    buttonConfig,
    includeQr,
    qrCid,
    qrDataUrl,
    includeEventCard,
    trackingPixelUrl,
    recipientName,
  });

  const cleanBody = body.replace(/\*\*/g, "").replace(/(?<!\*)\*(?!\*)/g, "").trim();
  const plainText = [
    `${subject}`,
    `========================================`,
    `Event: ${eventTitle}`,
    eventDate ? `Date: ${eventDate}` : "",
    eventLocation ? `Venue: ${eventLocation}` : "",
    `----------------------------------------`,
    cleanBody,
    buttonConfig?.formUrl ? `\nForm / Questionnaire: ${buttonConfig.formUrl}` : "",
    buttonConfig?.ticketUrl ? `Event Badge: ${buttonConfig.ticketUrl}` : "",
    buttonConfig?.customButtonUrl ? `Resource Link: ${buttonConfig.customButtonUrl}` : "",
    `\n----------------------------------------`,
    `Dispatched by ${organizerName} via Eventzone Platform.`,
    `For support or inquiries, reply directly to ${SENDER_EMAIL}`,
  ].filter(Boolean).join("\n");

  return await sendEmail({
    to,
    subject: subject,
    text: plainText,
    html,
    attachments,
    eventTitle,
    listUnsubscribe: true,
  });
}

/**
 * 4. Floor Plan & Booth Allocation Email (PDF and/or Interactive Link)
 */
export async function sendFloorPlanEmail({
  to,
  exhibitorName,
  recipientName,
  recipientType = "exhibitor",
  tier,
  boothNumber,
  booth,
  eventTitle,
  eventDate,
  venueAddress,
  notes,
  message,
  subject,
  deliveryFormat = "both", // 'pdf' | 'link' | 'both'
  floorPlanUrl = "",
  attachments = [],
}) {
  const name = recipientName || exhibitorName || "Valued Partner";
  const isSponsor = recipientType === "sponsor" || (tier && tier !== "standard" && tier !== "exhibitor");
  const spaceInfo = boothNumber || booth;

  const finalEventTitle = eventTitle || "Eventzone Summit";
  const defaultSubject = isSponsor
    ? `Sponsor Floor Plan & Venue Details: ${name} - ${finalEventTitle}`
    : `Exhibition Floor Plan & Booth Details: ${name} - ${finalEventTitle}`;
  const finalSubject = subject || defaultSubject;

  const headerTitle = isSponsor
    ? "Sponsor Floor Plan & Space Details"
    : "Exhibition Floor Plan & Booth Details";

  const entityLabel = isSponsor ? "Sponsoring Partner" : "Exhibiting Partner";
  const spaceLabel = isSponsor ? (spaceInfo ? "Reserved Space" : "Sponsorship Tier") : "Assigned Space";
  const spaceValue = isSponsor 
    ? (tier ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} Sponsor${spaceInfo ? ` • Booth #${spaceInfo}` : ""}` : (spaceInfo ? `Booth #${spaceInfo}` : "Sponsor Pavilion"))
    : (spaceInfo ? `Booth #${spaceInfo}` : "General Exhibition Space");

  const hasLink = (deliveryFormat === "link" || deliveryFormat === "both") && !!floorPlanUrl;
  const hasPdf = deliveryFormat === "pdf" || deliveryFormat === "both";

  const content = `
    <h1>${headerTitle}</h1>
    <p>Dear <strong>${name}</strong> team,</p>
    <p>We are pleased to share your confirmed venue details, floor plan allocation, and event setup instructions for <strong>${finalEventTitle}</strong>.</p>

    <div class="card">
      <div class="card-header">${isSponsor ? "Partner Space & Sponsorship Allocation" : "Exhibition Space Allocation"}</div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="info-label" width="38%">${entityLabel}</td>
          <td class="info-val" width="62%">${name}</td>
        </tr>
        <tr>
          <td class="info-label">${spaceLabel}</td>
          <td class="info-val" style="color: #2563eb; font-weight: 700;">${spaceValue}</td>
        </tr>
        ${tier && !isSponsor ? `
        <tr>
          <td class="info-label">Category / Tier</td>
          <td class="info-val">${tier}</td>
        </tr>` : ""}
        ${eventDate ? `
        <tr>
          <td class="info-label">Event Dates</td>
          <td class="info-val">${eventDate}</td>
        </tr>` : ""}
        ${venueAddress ? `
        <tr>
          <td class="info-label">Venue Location</td>
          <td class="info-val">${venueAddress}</td>
        </tr>` : ""}
      </table>
    </div>

    ${hasLink ? `
      <!-- Interactive Floor Plan Map CTA -->
      <div style="text-align: center; margin: 24px 0; padding: 22px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 6px;">Interactive Floor Plan Map</div>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">Explore the live interactive venue layout, browse neighboring booths, and locate key amenities.</div>
        <a href="${floorPlanUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #4f46e5; color: #ffffff; font-weight: 700; font-size: 13.5px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
          View Interactive Floor Plan →
        </a>
        <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
          Direct link: <a href="${floorPlanUrl}" style="color: #4f46e5; text-decoration: underline;">${floorPlanUrl}</a>
        </div>
      </div>
    ` : ""}

    ${hasPdf ? `
      <div style="margin-top: 18px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; font-size: 12px; color: #166534;">
        📄 <strong>PDF Attached</strong>: The official high-resolution floor plan layout PDF is attached to this email for your offline reference and printing.
      </div>
    ` : ""}

    ${message ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #475569; text-transform: uppercase;">Instructions from Event Operations</h4>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">${message.replace(/\n/g, "<br/>")}</p>
      </div>
    ` : ""}

    <p style="font-size: 13px; color: #64748b;">
      Please ensure your onsite team has this reference for event check-in and venue access.
    </p>
  `;

  const preheader = `Confirmed ${isSponsor ? "sponsorship and venue" : "exhibition booth"} details for ${name} at ${finalEventTitle}. ${spaceValue}`;
  const plainText = `Dear ${name} team,\n\nHere are your confirmed details for ${finalEventTitle}:\n\n- Partner: ${name}\n- ${spaceLabel}: ${spaceValue}\n${eventDate ? `- Dates: ${eventDate}\n` : ""}${venueAddress ? `- Location: ${venueAddress}\n` : ""}${hasLink ? `\nInteractive Floor Plan: ${floorPlanUrl}\n` : ""}${hasPdf ? `\n(Official floor plan PDF layout is attached to this email)\n` : ""}${message ? `\nInstructions:\n${message}\n` : ""}\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: finalSubject,
    text: plainText,
    attachments: hasPdf ? attachments : [],
    html: getEmailLayout({
      title: `${isSponsor ? "Sponsor Floor Plan" : "Floor Plan & Booth Details"} - ${name}`,
      preheader,
      content,
      eventTitle: finalEventTitle,
    }),
  });
}

export const sendExhibitorPacketEmail = sendFloorPlanEmail;

/**
 * 5. Certificate of Attendance / Achievement Delivery Email
 */
export async function sendCertificateEmail({
  to,
  recipientName = "Valued Participant",
  recipientRole = "attendee",
  company = "",
  jobTitle = "",
  certificateTitle = "Certificate of Attendance",
  certificateId = "",
  eventTitle = "Eventzone Summit",
  eventDate = "",
  eventLocation = "",
  organizerName = "Eventzone Organizing Committee",
  subject,
  message,
  eventId,
  attachments = [],
  template = {},
  subtitleText,
  recipientSubtext,
  bodyText,
  certificateImage,
}) {
  const finalSubject = subject || `Official Certificate: ${certificateTitle} - ${eventTitle}`;
  const preheader = `Congratulations ${recipientName}! Your official ${certificateTitle} for ${eventTitle} is attached as a PDF.`;

  // Auto-generate high-resolution official Landscape A4 Certificate PDF attachment
  const finalAttachments = [...(attachments || [])];
  try {
    const pdfBuffer = await generateCertificatePdfBuffer({
      recipientName,
      recipientRole,
      company,
      jobTitle,
      certificateTitle,
      subtitleText: subtitleText || template?.subtitleText,
      recipientSubtext: recipientSubtext || template?.recipientSubtext,
      bodyText: bodyText || template?.bodyText,
      certificateId,
      eventTitle,
      eventDate,
      eventLocation,
      organizerName,
      template: template || {},
      certificateImage,
    });

    if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
      const cleanName = (recipientName || "Official").replace(/[^a-zA-Z0-9_-]/g, "_");
      finalAttachments.push({
        filename: `Certificate_${cleanName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    }
  } catch (pdfErr) {
    console.warn("Could not generate certificate PDF attachment in mailer:", pdfErr);
  }

  const content = message ? `
    <div style="font-size: 15px; color: #1e293b; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      ${message.replace(/\n/g, "<br/>")}
    </div>
  ` : `
    <div style="font-size: 15px; color: #1e293b; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin: 0 0 16px 0;">Dear <strong>${recipientName}</strong>,</p>
      <p style="margin: 0 0 16px 0;">We are delighted to present your official certificate for distinguished participation in <strong>${eventTitle}</strong>.</p>
      <p style="margin: 0 0 24px 0;">Your official certificate is attached to this email as a printable PDF.</p>
      <p style="margin: 0;">Warm regards,<br/><strong>${organizerName || "Event Organizing Committee"}</strong></p>
    </div>
  `;

  const plainText = `Dear ${recipientName},\n\nCongratulations! Your official ${certificateTitle} for ${eventTitle} is attached as a PDF file.\n\nCredential Details:\n- Recipient: ${recipientName}\n- Certificate ID: ${certificateId || "N/A"}\n- Role: ${recipientRole}\n${company ? `- Organization: ${company}\n` : ""}${eventDate ? `- Date: ${eventDate}\n` : ""}${eventLocation ? `- Venue: ${eventLocation}\n` : ""}\n${message ? `\nNote from Organizer:\n${message}\n` : ""}\nIssued by: ${organizerName || "Eventzone Organizing Committee"}\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: finalSubject,
    text: plainText,
    attachments: finalAttachments,
    html: getEmailLayout({
      title: `${certificateTitle} - ${recipientName}`,
      preheader,
      content,
      eventTitle,
    }),
  });
}

/**
 * 6. Team Member Invitation Email
 */
export async function sendTeamInviteEmail({
  to,
  recipientName = "Team Member",
  role = "Staff",
  department = "",
  permissions = {},
  eventTitle = "Eventzone Summit",
  eventDate = "",
  eventLocation = "",
  organizerName = "Event Organizing Committee",
  message = "",
  inviteUrl = "",
  subject,
  eventId,
}) {
  const finalEventTitle = eventTitle || "Eventzone Event";
  const finalSubject = subject || `Invitation: Join the Organizing Team for ${finalEventTitle}`;
  const preheader = `You've been invited to join the ${finalEventTitle} organizer team as ${role}. Access your workspace now.`;

  // Calculate assigned modules summary
  const permissionEntries = Object.entries(permissions || {});
  const assigned = permissionEntries.filter(([, lvl]) => lvl === "editor" || lvl === "viewer");
  const editorCount = assigned.filter(([, lvl]) => lvl === "editor").length;
  const viewerCount = assigned.filter(([, lvl]) => lvl === "viewer").length;
  
  let accessSummary = "Standard Staff Access";
  if (role.toLowerCase().includes("admin") || (assigned.length >= 18 && editorCount >= 18)) {
    accessSummary = "Full Admin Access (All Modules)";
  } else if (assigned.length > 0) {
    accessSummary = `${assigned.length} Modules (${editorCount} Editor, ${viewerCount} Viewer)`;
  }

  const appBase = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";
  const fallbackInviteUrl = `${appBase}/?view=auth&email=${encodeURIComponent(to)}&inviteEventId=${eventId || ''}&teamRole=${encodeURIComponent(role || 'Staff')}&eventTitle=${encodeURIComponent(finalEventTitle)}`;
  const finalInviteUrl = inviteUrl || fallbackInviteUrl;

  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.5px;">You're Invited to the Team!</h1>
    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
      Dear <strong>${recipientName}</strong>,
    </p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
      <strong>${organizerName || "The event organizer"}</strong> has invited you to join the official organizing team for <strong>${finalEventTitle}</strong> on the Eventzone platform.
    </p>

    <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0;">
      <div class="card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
        Your Role & Workspace Credentials
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="info-label" width="38%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Invited Member</td>
          <td class="info-val" width="62%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${recipientName}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Assigned Role</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #2563eb; font-weight: 800; text-align: right;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11.5px; font-weight: 700;">
              ${role}
            </span>
          </td>
        </tr>
        ${department ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Department</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${department}</td>
        </tr>` : ""}
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Platform Permissions</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${accessSummary}</td>
        </tr>
        ${eventDate ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Event Dates</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventDate}</td>
        </tr>` : ""}
        ${eventLocation ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">Venue / Location</td>
          <td class="info-val" style="padding: 9px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventLocation}</td>
        </tr>` : ""}
      </table>
    </div>

    ${message ? `
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 12px; padding: 16px 18px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #166534; margin-bottom: 6px;">Note from the Organizer</div>
      <div style="font-size: 13.5px; color: #14532d; font-style: italic; line-height: 1.6;">"${message.replace(/\n/g, "<br/>")}"</div>
    </div>` : ""}

    <div style="text-align: center; margin: 32px 0 28px 0;">
      <a href="${finalInviteUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 800; font-size: 14px; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); transition: background-color 0.2s;">
        Sign In / Create Account & Access Workspace &rarr;
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 12px;">
        Sign in or create an account with <strong>${to}</strong>. The event will be instantly available in your dashboard.
      </p>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 24px; font-size: 12.5px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0 0 6px 0;"><strong>Need assistance?</strong> If you have any questions regarding your team assignment or credentials, reply directly to this email or reach out to your lead organizer.</p>
    </div>
  `;

  const plainText = `Dear ${recipientName},\n\nYou have been invited to join the organizing team for ${finalEventTitle} on the Eventzone platform.\n\nAssignment Details:\n- Role: ${role}\n${department ? `- Department: ${department}\n` : ""}- Platform Access: ${accessSummary}\n${eventDate ? `- Dates: ${eventDate}\n` : ""}${eventLocation ? `- Venue: ${eventLocation}\n` : ""}${message ? `\nNote from Organizer:\n"${message}"\n` : ""}\nAccept your invitation and access the event workspace here:\n${finalInviteUrl}\n\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: finalSubject,
    text: plainText,
    eventTitle: finalEventTitle,
    html: getEmailLayout({
      title: `Team Invitation - ${finalEventTitle}`,
      preheader,
      content,
      eventTitle: finalEventTitle,
      headerTag: "Event Organizing Team Invitation",
    }),
  });
}

/**
 * Dispatches company approval confirmation with secure delegation portal link
 * so corporate exhibitors and sponsors can self-assign representative passes.
 */
export async function sendCompanyApprovalDelegationEmail({
  to,
  companyName = "Partner Company",
  contactName = "Representative",
  eventTitle = "Eventzone Event",
  eventDate = "",
  eventLocation = "",
  standNumber = "",
  standDimensions = "",
  badgesIncluded = 2,
  delegationUrl = "",
  organizerName = "The Event Organizer",
  subject = "",
  eventId = null
}) {
  const finalSubject = subject || `[Approved] Company Participation & Representative Passes — ${eventTitle}`;
  const preheader = `Your company application for ${companyName} has been approved for ${eventTitle}. Access your delegation portal to claim your ${badgesIncluded} passes.`;

  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.5px;">Company Application Approved!</h1>
    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
      Dear <strong>${contactName}</strong>,
    </p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
      We are delighted to inform you that your participation application for <strong>${companyName}</strong> has been officially approved for <strong>${eventTitle}</strong>.
    </p>

    <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0;">
      <div class="card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
        Participation Summary & Stand Details
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="info-label" width="38%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Company Name</td>
          <td class="info-val" width="62%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${companyName}</td>
        </tr>
        ${standNumber ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Exhibition Stand</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #2563eb; font-weight: 800; text-align: right;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 12px; font-weight: 800;">
              Stand ${standNumber} ${standDimensions ? `(${standDimensions})` : ''}
            </span>
          </td>
        </tr>` : ''}
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Included Passes</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 800; text-align: right;">${badgesIncluded} Representative Badges</td>
        </tr>
        ${eventDate ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Event Dates</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventDate}</td>
        </tr>` : ''}
        ${eventLocation ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">Venue Location</td>
          <td class="info-val" style="padding: 9px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventLocation}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 12px; padding: 16px 18px; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1e40af; margin-bottom: 6px;">Next Step: Assign Your Passes</div>
      <div style="font-size: 13px; color: #1e3a8a; line-height: 1.6;">
        Your corporate package includes <strong>${badgesIncluded} representative passes</strong>. Please use the secure portal link below to assign these passes to the members of your team who will be representing your company at the event.
      </div>
    </div>

    <div style="text-align: center; margin: 32px 0 28px 0;">
      <a href="${delegationUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 800; font-size: 14px; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
        Open Delegation Portal & Assign Passes &rarr;
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 12px;">
        This is a private link dedicated to <strong>${companyName}</strong>. You can return to it at any time to update your delegates.
      </p>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 24px; font-size: 12.5px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0 0 6px 0;">Best regards,</p>
      <p style="margin: 0; font-weight: 700; color: #0f172a;">${organizerName} & the Eventzone Team</p>
    </div>
  `;

  const plainText = `Dear ${contactName},\n\nYour participation application for ${companyName} has been approved for ${eventTitle}!\n\nStand: ${standNumber || 'Assigned'}\nPasses: ${badgesIncluded} Representative Badges\n\nAssign your team passes using this secure portal link:\n${delegationUrl}\n\nBest regards,\n${organizerName}\nEventzone Platform`;

  return await sendEmail({
    to,
    subject: finalSubject,
    text: plainText,
    eventTitle,
    html: getEmailLayout({
      title: `Company Approval & Delegation - ${eventTitle}`,
      preheader,
      content,
      eventTitle,
      headerTag: "Company Participation Approved",
    }),
  });
}

/**
 * Dispatches an instant email alert to the platform super administrator
 * whenever a new organizer joins the Eventzone platform.
 */
export async function sendAdminOrganizerJoinedNotification({ organizer = {} }) {
  const recipients = getAdminNotificationRecipients();
  if (!recipients || recipients.length === 0) return null;

  const organizerName = organizer.fullName || organizer.full_name || organizer.name || "New Organizer";
  const organizerEmail = organizer.email || "No email provided";
  const companyName = organizer.companyName || organizer.company_name || organizer.organization || "Independent / Not Specified";
  const jobTitle = organizer.jobTitle || organizer.job_title || "";
  const phone = organizer.phone || organizer.contact_phone || "Not provided";
  const location = organizer.location || organizer.wilaya || organizer.city || "Not provided";
  const organizerId = organizer.id || "N/A";

  const rawDate = organizer.createdAt || organizer.created_at || new Date().toISOString();
  let formattedDate = "";
  try {
    formattedDate = new Date(rawDate).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Algiers",
    }) + " (Algiers Time)";
  } catch (e) {
    formattedDate = new Date(rawDate).toLocaleString();
  }

  const appBase = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";
  const adminBackofficeUrl = `${appBase}/?view=admin`;

  const subject = `[Eventzone Alert] New Organizer Joined: ${organizerName} (${companyName})`;
  const preheader = `A new organizer (${organizerName} • ${companyName}) has just registered on Eventzone. Review their profile in the back office.`;

  const content = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
        Organizer Registration Alert
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.5px;">
        New Organizer Registered on Eventzone
      </h1>
      <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin: 0;">
        A new organizer account has just been created on the platform. Below are the verified registration specifications:
      </p>
    </div>

    <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0;">
      <div class="card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
        Organizer Profile Specifications
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="info-label" width="38%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Full Name</td>
          <td class="info-val" width="62%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${organizerName}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Email Address</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #2563eb; font-weight: 700; text-align: right;">
            <a href="mailto:${organizerEmail}" style="color: #2563eb; text-decoration: none;">${organizerEmail}</a>
          </td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Organization / Entity</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${companyName}</td>
        </tr>
        ${jobTitle ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Job Title</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${jobTitle}</td>
        </tr>` : ""}
        ${phone && phone !== "Not provided" ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Phone Number</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">
            <a href="tel:${phone}" style="color: #0f172a; text-decoration: none;">${phone}</a>
          </td>
        </tr>` : ""}
        ${location && location !== "Not provided" ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Location / Wilaya</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${location}</td>
        </tr>` : ""}
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Registration Date</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${formattedDate}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">Profile ID</td>
          <td class="info-val" style="padding: 9px 0; font-size: 11.5px; color: #64748b; font-family: monospace; text-align: right;">${organizerId}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0 24px 0;">
      <a href="${adminBackofficeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 800; font-size: 14px; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
        Open Back Office &amp; View Organizers &rarr;
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
        Manage quotas, assigned features, and organizer privileges directly in your console.
      </p>
    </div>
  `;

  const plainText = `[Eventzone Alert] New Organizer Joined\n\nFull Name: ${organizerName}\nEmail: ${organizerEmail}\nOrganization: ${companyName}\n${jobTitle ? `Job Title: ${jobTitle}\n` : ""}${phone !== "Not provided" ? `Phone: ${phone}\n` : ""}${location !== "Not provided" ? `Location: ${location}\n` : ""}Registration Date: ${formattedDate}\nProfile ID: ${organizerId}\n\nAccess Back Office: ${adminBackofficeUrl}\n\nEventzone Platform`;

  return await sendEmail({
    to: recipients,
    subject,
    text: plainText,
    replyTo: organizerEmail !== "No email provided" ? organizerEmail : undefined,
    html: getEmailLayout({
      title: "New Organizer Joined",
      preheader,
      content,
      headerTag: "Platform Admin Alert • Organizer Joined",
    }),
  });
}

/**
 * Dispatches an instant email alert to the platform super administrator
 * whenever an organizer adds/creates an event on Eventzone.
 */
export async function sendAdminEventPublishedNotification({ event = {}, organizer = {} }) {
  const recipients = getAdminNotificationRecipients();
  if (!recipients || recipients.length === 0) return null;

  const eventTitle = event.name || event.title || "Untitled Event";
  const eventCategory = event.category || event.industry || "General";
  const eventType = event.type || "In-Person";
  const eventLocation = event.location || event.venue_name || "Algiers, Algeria";
  const eventCapacity = event.capacity ? `${Number(event.capacity).toLocaleString()} attendees` : "Standard (500)";
  const eventSlug = event.slug || "";
  const eventId = event.id || "";
  const eventDescription = (event.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const descriptionSnippet = eventDescription ? (eventDescription.length > 180 ? `${eventDescription.slice(0, 180)}...` : eventDescription) : "No description provided.";

  const startDate = event.startDate || event.start_date || event.date || "TBD";
  const endDate = event.endDate || event.end_date || "";
  const dateDisplay = endDate && endDate !== startDate ? `${startDate} to ${endDate}` : startDate;

  const organizerName = organizer.fullName || organizer.full_name || organizer.name || event.organizer_name || event.host_name || "Eventzone Organizer";
  const organizerEmail = organizer.email || event.contact_email || event.host_email || "N/A";
  const organization = organizer.companyName || organizer.company_name || organizer.organization || event.organization || "Independent";
  const organizerPhone = organizer.phone || event.contact_phone || "N/A";

  const appBase = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";
  const liveEventUrl = eventSlug ? `${appBase}/${eventSlug}` : (eventId ? `${appBase}/${eventId}` : appBase);
  const adminBackofficeUrl = `${appBase}/?view=admin`;

  const subject = `[Eventzone Alert] New Event Added: ${eventTitle} (by ${organizerName})`;
  const preheader = `A new event "${eventTitle}" has been added by ${organizerName} (${organization}) on Eventzone.`;

  const content = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
        New Event Added Alert
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.5px;">
        New Event Added on Eventzone
      </h1>
      <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin: 0;">
        A new event was just added to the platform catalog by <strong>${organizerName}</strong>.
      </p>
    </div>

    <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0;">
      <div class="card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
        Event Specifications
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="info-label" width="38%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Event Title</td>
          <td class="info-val" width="62%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #0f172a; font-weight: 800; text-align: right;">${eventTitle}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Industry / Category</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #2563eb; font-weight: 700; text-align: right;">${eventCategory}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Format</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventType}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Date &amp; Schedule</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${dateDisplay}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Location / Venue</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventLocation}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Capacity Limit</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${eventCapacity}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">Public Slug</td>
          <td class="info-val" style="padding: 9px 0; font-size: 12px; color: #64748b; font-family: monospace; text-align: right;">${eventSlug || "auto-generated"}</td>
        </tr>
      </table>

      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Brief Description</div>
        <p style="font-size: 13px; color: #475569; line-height: 1.5; margin: 0;">${descriptionSnippet}</p>
      </div>
    </div>

    <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0;">
      <div class="card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
        Event Organizer Details
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="info-label" width="38%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Organizer Name</td>
          <td class="info-val" width="62%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${organizerName}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Company / Entity</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${organization}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Contact Email</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #2563eb; font-weight: 700; text-align: right;">
            <a href="mailto:${organizerEmail}" style="color: #2563eb; text-decoration: none;">${organizerEmail}</a>
          </td>
        </tr>
        ${organizerPhone && organizerPhone !== "N/A" ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">Contact Phone</td>
          <td class="info-val" style="padding: 9px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${organizerPhone}</td>
        </tr>` : ""}
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0 24px 0;">
      <a href="${liveEventUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-weight: 800; font-size: 14px; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); margin: 0 6px 10px 6px;">
        View Live Event Page &rarr;
      </a>
      <a href="${adminBackofficeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-weight: 700; font-size: 13.5px; margin: 0 6px 10px 6px;">
        Open Admin Console
      </a>
    </div>
  `;

  const plainText = `[Eventzone Alert] New Event Added\n\nEvent: ${eventTitle}\nCategory: ${eventCategory}\nFormat: ${eventType}\nDates: ${dateDisplay}\nLocation: ${eventLocation}\nCapacity: ${eventCapacity}\nSlug: ${eventSlug}\n\nOrganizer: ${organizerName} (${organization})\nEmail: ${organizerEmail}\nPhone: ${organizerPhone}\n\nLive URL: ${liveEventUrl}\nBack Office: ${adminBackofficeUrl}\n\nEventzone Platform`;

  return await sendEmail({
    to: recipients,
    subject,
    text: plainText,
    replyTo: organizerEmail !== "N/A" ? organizerEmail : undefined,
    html: getEmailLayout({
      title: `New Event Added - ${eventTitle}`,
      preheader,
      content,
      eventTitle,
      headerTag: "Platform Admin Alert • New Event Added",
    }),
  });
}

export const sendAdminEventCreatedNotification = sendAdminEventPublishedNotification;

/**
 * Verification OTP Email for Account Creation & Confirmation
 */
export async function sendVerificationOtpEmail({
  to,
  otp,
  fullName = "there",
}) {
  const sanitizedOtp = String(otp || "").trim();
  const subject = `Your Eventzone Verification Code: ${sanitizedOtp}`;
  const preheader = `Your 6-digit confirmation code is ${sanitizedOtp}. Valid for 10 minutes.`;

  const content = `
    <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; tracking-tight;">Verify your email address</h1>
    <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
      Hello <strong>${fullName}</strong>,
    </p>
    <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">
      Thank you for signing up with Eventzone. To secure your account and activate access to your dashboard, please enter the following 6-digit verification code:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%); border: 2px solid #2563eb; border-radius: 16px; padding: 20px 36px; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.12);">
        <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1e40af; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; display: block;">
          ${sanitizedOtp}
        </span>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 12px; font-weight: 600;">
        ⏱ This verification code will expire in <strong>10 minutes</strong>.
      </p>
    </div>

    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px 16px; margin: 24px 0;">
      <p style="font-size: 12.5px; color: #475569; margin: 0; line-height: 1.5;">
        <strong>Security Notice:</strong> If you did not initiate this signup request on Eventzone, please disregard this email. Your account will not be activated without entering this code.
      </p>
    </div>
  `;

  const plainText = `Hello ${fullName},\n\nYour Eventzone verification code is: ${sanitizedOtp}\n\nThis code will expire in 10 minutes.\n\nIf you did not initiate this signup request, please disregard this email.\n\nEventzone Platform`;

  return await sendEmail({
    to,
    subject,
    text: plainText,
    html: getEmailLayout({
      title: "Email Verification",
      preheader,
      content,
      headerTag: "Account Verification",
    }),
  });
}

function escapeHtml(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Error Diagnostic Notification sent to contact@eventzone.pro
 */
export async function sendErrorReportEmail({
  errorName = "Error",
  errorMessage = "An unexpected error occurred",
  errorStack = "",
  errorDigest = "",
  url = "",
  referrer = "",
  userAgent = "",
  userEmail = "",
  userId = "",
  timestamp = new Date().toISOString(),
  language = "en",
}) {
  const safeName = errorName || "Application Error";
  const safeMessage = (errorMessage || "Unexpected error occurred").substring(0, 500);
  const subject = `[Eventzone Error Report] ${safeName}: ${safeMessage.replace(/[\r\n\t]+/g, " ").substring(0, 80)}`;
  const preheader = `Diagnostic report from ${url || "Platform"}: ${safeMessage.substring(0, 100)}`;

  const content = `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 12px; padding: 16px 18px; margin: 0 0 24px 0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #b91c1c; margin-bottom: 4px;">
        Incident Captured via Error Boundary
      </div>
      <div style="font-size: 15px; font-weight: 800; color: #991b1b; margin-bottom: 6px; word-break: break-word;">
        ${escapeHtml(safeName)}: ${escapeHtml(safeMessage)}
      </div>
      ${errorDigest ? `<div style="font-size: 11.5px; color: #b91c1c; font-family: monospace; font-weight: 600;">Next.js Digest: ${escapeHtml(errorDigest)}</div>` : ""}
    </div>

    <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0;">
      <div class="card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;">
        Client &amp; Session Environment
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="info-label" width="32%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Timestamp</td>
          <td class="info-val" width="68%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(timestamp)}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Page URL</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #2563eb; font-weight: 700; text-align: right; word-break: break-all;">
            <a href="${escapeHtml(url)}" style="color: #2563eb; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${escapeHtml(url || "N/A")}</a>
          </td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Active User</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(userEmail || userId || "Guest / Anonymous")}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Referrer</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b; text-align: right; word-break: break-all;">${escapeHtml(referrer || "Direct / None")}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Language</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(language?.toUpperCase() || "EN")}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">User Agent</td>
          <td class="info-val" style="padding: 9px 0; font-size: 11px; color: #64748b; text-align: right; word-break: break-all; font-family: monospace;">${escapeHtml(userAgent || "N/A")}</td>
        </tr>
      </table>
    </div>

    <div style="margin: 24px 0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 8px;">
        Stack Trace
      </div>
      <pre style="background-color: #0f172a; color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 11px; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; line-height: 1.5; overflow-x: auto; white-space: pre-wrap; word-break: break-all; margin: 0;">${escapeHtml(errorStack || "No stack trace captured.")}</pre>
    </div>
  `;

  const plainText = `[Eventzone Error Report]\n\nError: ${safeName}: ${safeMessage}\nDigest: ${errorDigest || "N/A"}\nTimestamp: ${timestamp}\nURL: ${url || "N/A"}\nUser: ${userEmail || userId || "Guest"}\nReferrer: ${referrer || "N/A"}\nLanguage: ${language}\nUser Agent: ${userAgent || "N/A"}\n\nStack Trace:\n${errorStack || "No stack trace captured."}\n\nEventzone Platform Diagnostics`;

  return await sendEmail({
    to: "contact@eventzone.pro",
    subject,
    text: plainText,
    html: getEmailLayout({
      title: "Application Error Report",
      preheader,
      content,
      headerTag: "Platform Diagnostic",
    }),
  });
}




/**
 * Urgent Notification sent to the Event Organizer and Admin Team Members
 * when a corporate sponsor/exhibitor registers and is in the pending approval queue.
 */
export async function sendPendingCompanyAdminNotification({
  recipients = [],
  event = {},
  company = {},
  representative = {},
  ticket = {},
  answers = {},
}) {
  if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
    console.warn("sendPendingCompanyAdminNotification notice: No recipients specified.");
    return null;
  }

  const companyName = company.name || company.companyName || "Partner Organization";
  const industry = company.industry || "General";
  const companyRole = (company.companyRole || ticket.companyRole || "Exhibitor").toUpperCase();
  const website = company.website || "";
  const nif = company.nif || "";

  const eventTitle = event.name || event.title || "Your Event";
  const eventId = event.id || "";
  const eventDate = event.startDate || event.start_date || "";
  const eventLocation = event.location || event.venue_name || "";

  const contactName = representative.name || representative.contact || "Representative";
  const contactEmail = representative.email || "N/A";
  const contactPhone = representative.phone || "N/A";
  const jobTitle = representative.jobTitle || representative.job_title || "Corporate Representative";

  const ticketType = ticket.name || ticket.tier || ticket.ticketType || "Company Package";
  const badgesIncluded = Number(company.badgesIncluded || ticket.badgesIncluded || 2);
  const standInfo = company.selectedBooth
    ? `Stand ${company.selectedBooth.boothNumber || company.selectedBooth.name || ""}${company.selectedBooth.dimensions ? ` (${company.selectedBooth.dimensions})` : ""}`
    : "Pending Allocation / To Be Assigned";

  const appBase = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";
  const reviewUrl = eventId
    ? `${appBase}/?eventId=${eventId}&view=organizations&tab=pending`
    : `${appBase}/?view=pending_companies`;

  const subject = `[Action Required] New Pending Company Registration: ${companyName} — ${eventTitle}`;
  const preheader = `Urgent: ${companyName} registered for ${eventTitle} and requires confirmation from your organizer team.`;

  const content = `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; padding: 4px 14px; border-radius: 9999px; background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
        Action Required: Pending Review
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.5px;">
        New Company Registration Awaiting Review
      </h1>
      <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin: 0;">
        A new company application for <strong>${escapeHtml(companyName)}</strong> has been submitted for <strong>${escapeHtml(eventTitle)}</strong> and is awaiting confirmation.
      </p>
    </div>

    <!-- Urgent Notice Banner -->
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 12px; padding: 16px 18px; margin: 0 0 24px 0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1e40af; margin-bottom: 4px;">
        Urgent Response Recommended
      </div>
      <div style="font-size: 13.5px; color: #1e3a8a; line-height: 1.6;">
        Corporate sponsors and exhibitors require prompt communication regarding their participation, stand placement, and invoicing. Please review this submission as soon as possible.
      </div>
    </div>

    <!-- Company & Representative Specifications Card -->
    <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin: 24px 0;">
      <div class="card-header" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
        Company &amp; Representative Details
      </div>
      <table role="presentation" class="info-table" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="info-label" width="38%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Company Name</td>
          <td class="info-val" width="62%" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #0f172a; font-weight: 800; text-align: right;">${escapeHtml(companyName)}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Partner Role</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background-color: #dbeafe; color: #1e40af; font-size: 11.5px; font-weight: 800;">
              ${escapeHtml(companyRole)}
            </span>
          </td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Industry / Sector</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(industry)}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Representative Contact</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">
            ${escapeHtml(contactName)} <span style="font-size: 11px; color: #64748b; font-weight: normal;">(${escapeHtml(jobTitle)})</span>
          </td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Email Address</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #2563eb; font-weight: 700; text-align: right;">
            <a href="mailto:${escapeHtml(contactEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(contactEmail)}</a>
          </td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Contact Phone</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(contactPhone)}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Package / Ticket Tier</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(ticketType)}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #64748b; font-weight: 600;">Stand / Booth</td>
          <td class="info-val" style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(standInfo)}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 9px 0; ${website || nif ? 'border-bottom: 1px solid #f1f5f9;' : ''} font-size: 12.5px; color: #64748b; font-weight: 600;">Included Passes</td>
          <td class="info-val" style="padding: 9px 0; ${website || nif ? 'border-bottom: 1px solid #f1f5f9;' : ''} font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${badgesIncluded} Representative Badges</td>
        </tr>
        ${website ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; ${nif ? 'border-bottom: 1px solid #f1f5f9;' : ''} font-size: 12.5px; color: #64748b; font-weight: 600;">Website</td>
          <td class="info-val" style="padding: 9px 0; ${nif ? 'border-bottom: 1px solid #f1f5f9;' : ''} font-size: 12.5px; color: #2563eb; font-weight: 600; text-align: right;">
            <a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${escapeHtml(website)}</a>
          </td>
        </tr>` : ''}
        ${nif ? `
        <tr>
          <td class="info-label" style="padding: 9px 0; font-size: 12.5px; color: #64748b; font-weight: 600;">Tax ID (NIF)</td>
          <td class="info-val" style="padding: 9px 0; font-size: 12.5px; color: #0f172a; font-weight: 600; text-align: right; font-family: monospace;">${escapeHtml(nif)}</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Review Queue CTA -->
    <div style="text-align: center; margin: 32px 0 24px 0;">
      <a href="${reviewUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 800; font-size: 14px; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
        Review &amp; Approve in Dashboard &rarr;
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 12px;">
        Approving this application will automatically generate their company pass portal and notify the representative.
      </p>
    </div>
  `;

  const plainText = `[Eventzone Alert] New Pending Company Registration\n\nEvent: ${eventTitle}\nCompany: ${companyName} (${companyRole})\nIndustry: ${industry}\nRepresentative: ${contactName} (${jobTitle})\nEmail: ${contactEmail}\nPhone: ${contactPhone}\nPackage: ${ticketType}\nStand: ${standInfo}\nIncluded Passes: ${badgesIncluded}\n\nReview this application in your dashboard:\n${reviewUrl}\n\nEventzone Organizer Command`;

  return await sendEmail({
    to: recipients,
    subject,
    text: plainText,
    html: getEmailLayout({
      title: "Pending Company Registration",
      preheader,
      content,
      headerTag: "Organizer Alert",
      eventTitle,
    }),
  });
}
