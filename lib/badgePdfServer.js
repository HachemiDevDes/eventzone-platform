import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/**
 * Generates an official, high-resolution printable PDF Badge Buffer on the server
 * Layout: Standard A6 / Foldable A4 Conference Badge Card
 */
export async function generateBadgePdfBuffer({
  attendeeName = "Attendee",
  attendeeEmail = "",
  attendeeCompany = "",
  attendeeJobTitle = "",
  ticketTier = "General Admission",
  badgeCode = "EZ-PASS",
  eventTitle = "Eventzone Conference & Summit",
  eventDate = "",
  eventLocation = "",
  qrDataUrl = "",
}) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Generate QR Code PNG Buffer if not provided as Data URL or generate fresh high-res QR
      let qrImageBuffer = null;
      try {
        const qrPayload = JSON.stringify({
          action: "checkin",
          badgeCode: badgeCode || "EZ-PASS",
          name: attendeeName,
          email: attendeeEmail,
          tier: ticketTier,
          event: eventTitle,
        });

        if (qrDataUrl && qrDataUrl.startsWith("data:image/png;base64,")) {
          qrImageBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
        } else {
          qrImageBuffer = await QRCode.toBuffer(qrPayload, {
            type: "png",
            width: 400,
            margin: 1,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
            errorCorrectionLevel: "H",
          });
        }
      } catch (qrErr) {
        console.warn("Server PDF Badge QR code buffer notice:", qrErr);
      }

      // 2. Initialize PDFKit Document (A4 size: 595.28 x 841.89 pt)
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        info: {
          Title: `Official Event Badge - ${attendeeName}`,
          Author: "Eventzone Platform",
          Subject: `${eventTitle} - ${ticketTier}`,
          Keywords: "Eventzone, Badge, Pass, Ticket, QR",
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;

      // Draw background styling
      doc.rect(0, 0, pageWidth, pageHeight).fill("#f8fafc");

      // Badge Dimensions (A6 portrait proportion centered on top half of A4 page for easy printing/folding)
      const badgeWidth = 320;
      const badgeHeight = 460;
      const badgeX = (pageWidth - badgeWidth) / 2;
      const badgeY = 60;

      // ── Outer Cut & Fold Container ──
      // Subtle dashed border for scissor cut guidelines
      doc
        .save()
        .roundedRect(badgeX - 4, badgeY - 4, badgeWidth + 8, badgeHeight + 8, 20)
        .lineWidth(1)
        .dash(4, { space: 3 })
        .strokeColor("#cbd5e1")
        .stroke()
        .restore();

      // Scissor helper text
      doc
        .fillColor("#94a3b8")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("✂ CUT ALONG DOTTED LINE • FOLD & INSERT INTO LANYARD POUCH", badgeX, badgeY - 18, {
          width: badgeWidth,
          align: "center",
        });

      // ── Main Badge Card ──
      doc
        .save()
        .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 16)
        .fill("#ffffff")
        .restore();

      // Card border
      doc
        .save()
        .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 16)
        .lineWidth(1.5)
        .strokeColor("#e2e8f0")
        .stroke()
        .restore();

      // ── Badge Header Banner (Dark Indigo Gradient style) ──
      const headerHeight = 90;
      doc
        .save()
        .roundedRect(badgeX, badgeY, badgeWidth, headerHeight, 16)
        .fill("#0f172a")
        .restore();

      // Fix rounded corners on bottom of header by drawing rect over bottom part
      doc.rect(badgeX, badgeY + headerHeight - 16, badgeWidth, 16).fill("#0f172a");

      // Branding Title
      doc
        .fillColor("#60a5fa")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("EVENTZONE OFFICIAL CREDENTIAL", badgeX + 16, badgeY + 16, {
          characterSpacing: 1.5,
        });

      // Event Title
      doc
        .fillColor("#ffffff")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(eventTitle || "Global Conference & Summit", badgeX + 16, badgeY + 32, {
          width: badgeWidth - 32,
          height: 38,
          ellipsis: true,
        });

      // ── Pass Tier Ribbon ──
      const ribbonY = badgeY + headerHeight;
      const ribbonHeight = 26;
      let ribbonBg = "#2563eb";
      let ribbonText = "#ffffff";

      const tierLower = (ticketTier || "").toLowerCase();
      if (tierLower.includes("vip")) {
        ribbonBg = "#d97706"; // Amber / Gold
      } else if (tierLower.includes("speaker") || tierLower.includes("delegate")) {
        ribbonBg = "#7c3aed"; // Purple
      } else if (tierLower.includes("press") || tierLower.includes("media")) {
        ribbonBg = "#059669"; // Emerald
      }

      doc.rect(badgeX, ribbonY, badgeWidth, ribbonHeight).fill(ribbonBg);

      doc
        .fillColor(ribbonText)
        .fontSize(10.5)
        .font("Helvetica-Bold")
        .text((ticketTier || "GENERAL ADMISSION").toUpperCase(), badgeX, ribbonY + 7, {
          width: badgeWidth,
          align: "center",
          characterSpacing: 1.2,
        });

      // ── Attendee Details Section ──
      let currentY = ribbonY + ribbonHeight + 24;

      // Name Avatar circle placeholder or initials
      const initials = (attendeeName || "HM")
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      doc
        .save()
        .circle(badgeX + badgeWidth / 2, currentY + 18, 22)
        .fill("#f1f5f9")
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .stroke()
        .restore();

      doc
        .fillColor("#2563eb")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(initials, badgeX, currentY + 11, {
          width: badgeWidth,
          align: "center",
        });

      currentY += 50;

      // Full Name
      doc
        .fillColor("#0f172a")
        .fontSize(18)
        .font("Helvetica-Bold")
        .text((attendeeName || "Attendee Name").toUpperCase(), badgeX + 16, currentY, {
          width: badgeWidth - 32,
          align: "center",
        });

      currentY += 26;

      // Job Title / Function
      if (attendeeJobTitle) {
        doc
          .fillColor("#2563eb")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(attendeeJobTitle.toUpperCase(), badgeX + 16, currentY, {
            width: badgeWidth - 32,
            align: "center",
            characterSpacing: 0.5,
          });
        currentY += 16;
      }

      // Company / Organization
      if (attendeeCompany) {
        doc
          .fillColor("#475569")
          .fontSize(10.5)
          .font("Helvetica")
          .text(attendeeCompany, badgeX + 16, currentY, {
            width: badgeWidth - 32,
            align: "center",
          });
        currentY += 16;
      }

      // Email Address
      if (attendeeEmail) {
        doc
          .fillColor("#94a3b8")
          .fontSize(8.5)
          .font("Helvetica")
          .text(attendeeEmail, badgeX + 16, currentY, {
            width: badgeWidth - 32,
            align: "center",
          });
        currentY += 14;
      }

      // ── Scannable Fast-Track QR Code ──
      const qrBoxSize = 105;
      const qrBoxX = badgeX + (badgeWidth - qrBoxSize) / 2;
      const qrBoxY = badgeY + badgeHeight - 142;

      doc
        .save()
        .roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 10)
        .fill("#ffffff")
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .stroke()
        .restore();

      if (qrImageBuffer) {
        try {
          doc.image(qrImageBuffer, qrBoxX + 6, qrBoxY + 6, {
            width: qrBoxSize - 12,
            height: qrBoxSize - 12,
          });
        } catch (imgErr) {
          console.warn("Could not embed QR in PDFKit:", imgErr);
        }
      }

      // Badge Code
      doc
        .fillColor("#64748b")
        .fontSize(8.5)
        .font("Courier-Bold")
        .text(`#${badgeCode || "EZ-PASS"}`, badgeX, qrBoxY + qrBoxSize + 4, {
          width: badgeWidth,
          align: "center",
        });

      // ── Badge Footer Band ──
      const footerY = badgeY + badgeHeight - 22;
      doc
        .save()
        .roundedRect(badgeX, footerY, badgeWidth, 22, 0)
        .fill("#0f172a")
        .restore();

      // Bottom rounded corners
      doc.rect(badgeX, footerY, badgeWidth, 10).fill("#0f172a");

      const footerLocation = eventLocation ? eventLocation.split(",")[0] : "Official Venue";
      doc
        .fillColor("#94a3b8")
        .fontSize(7.5)
        .font("Helvetica-Bold")
        .text(eventDate || "CONFIRMED ACCESS", badgeX + 12, footerY + 6);

      doc
        .fillColor("#94a3b8")
        .fontSize(7.5)
        .font("Helvetica")
        .text(footerLocation, badgeX + badgeWidth - 140, footerY + 6, {
          width: 128,
          align: "right",
          ellipsis: true,
        });

      // ── Instructions at bottom of printed A4 page ──
      const bottomGuideY = badgeY + badgeHeight + 35;
      doc
        .fillColor("#64748b")
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .text("EVENT ENTRY & VERIFICATION GUIDELINES", 40, bottomGuideY, {
          width: pageWidth - 80,
          align: "center",
        });

      doc
        .fillColor("#475569")
        .fontSize(8.5)
        .font("Helvetica")
        .text(
          "1. Present this official badge (printed or digital QR) at the event reception for expedited check-in.\n2. Do not share or duplicate this credential pass. Each QR code is cryptographically assigned to one registered delegate.\n3. For security and assistance on the event day, visit the Eventzone Information Desk.",
          60,
          bottomGuideY + 16,
          {
            width: pageWidth - 120,
            lineGap: 4,
            align: "center",
          }
        );

      // Finalize document
      doc.end();
    } catch (err) {
      console.error("Error generating badge PDF buffer:", err);
      reject(err);
    }
  });
}
