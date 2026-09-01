import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/**
 * Helper to fetch image buffer from base64 data URI, HTTP/HTTPS URL, or local path
 */
async function fetchImageBuffer(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.startsWith("data:image/")) {
    const commaIdx = trimmed.indexOf(",");
    if (commaIdx !== -1) {
      try {
        return Buffer.from(trimmed.slice(commaIdx + 1), "base64");
      } catch (e) {
        console.warn("Failed to parse base64 image data URI:", e.message);
      }
    }
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
      const res = await fetch(trimmed, { 
        signal: controller.signal,
        headers: { "User-Agent": "Eventzone-Badge-Renderer/1.0" } 
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    } catch (e) {
      console.warn("Could not fetch image URL in badgePdfServer:", trimmed, e.message);
    }
  }
  return null;
}

/**
 * Generates an official, high-resolution printable PDF A4 4-Fold Badge Buffer on the server
 * Matching the exact visual layout of the A4 Badge Sheet Component
 */
export async function generateBadgePdfBuffer({
  templateUrl = "",
  attendeeName = "Attendee",
  attendeeEmail = "",
  attendeeCompany = "",
  attendeeJobTitle = "",
  attendeePhoto = "",
  ticketTier = "Standard Admission",
  badgeCode = "EZ-PASS",
  eventId = "",
  eventTitle = "Eventzone Conference & Summit",
  eventDate = "",
  eventLocation = "",
  qrDataUrl = "",
  showFoldGuide = true,
  showPhoto = true,
  showQr = true,
  cardTheme = "transparent",
  badgeSettings = {},
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const isFoldGuide = showFoldGuide !== false && badgeSettings.showFoldGuide !== false;
      const isShowPhoto = showPhoto !== false && badgeSettings.showPhoto !== false;
      const isShowQr = showQr !== false && badgeSettings.showQr !== false;
      const resolvedTheme = cardTheme || badgeSettings.cardTheme || "transparent";

      // 1. Fetch Background Template Artwork buffer if provided
      let templateImageBuffer = null;
      if (templateUrl) {
        templateImageBuffer = await fetchImageBuffer(templateUrl);
      }

      // 2. Fetch Attendee Photo buffer if provided
      let photoImageBuffer = null;
      if (isShowPhoto && attendeePhoto) {
        photoImageBuffer = await fetchImageBuffer(attendeePhoto);
      }

      // 3. Generate High-Res Scannable QR Code PNG Buffer
      let qrImageBuffer = null;
      if (isShowQr) {
        try {
          if (qrDataUrl && qrDataUrl.startsWith("data:image/png;base64,")) {
            qrImageBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
          } else {
            const qrPayload = JSON.stringify({
              action: "checkin",
              attendeeId: badgeCode || "EZ-PASS",
              badgeCode: badgeCode || "EZ-PASS",
              name: attendeeName || "",
              email: attendeeEmail || "",
              tier: ticketTier || "",
              eventId: eventId || "",
              event: eventTitle || "",
            });

            qrImageBuffer = await QRCode.toBuffer(qrPayload, {
              type: "png",
              width: 360,
              margin: 0,
              color: {
                dark: "#0f172a",
                light: "#00000000", // Transparent background
              },
              errorCorrectionLevel: "M",
            });
          }
        } catch (qrErr) {
          console.warn("Server PDF Badge QR code buffer notice:", qrErr);
        }
      }

      // 4. Initialize PDFKit Document (A4 portrait size: 595.28 x 841.89 pt = 210 x 297 mm)
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        info: {
          Title: `Official Event Badge - ${attendeeName}`,
          Author: "Eventzone Platform",
          Subject: `${eventTitle} - ${ticketTier}`,
          Keywords: "Eventzone, Badge, Pass, Ticket, QR, A4",
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const halfWidth = pageWidth / 2; // 297.64 pt
      const halfHeight = pageHeight / 2; // 420.945 pt

      // 5. Draw Full-Bleed A4 Background
      if (templateImageBuffer) {
        try {
          doc.image(templateImageBuffer, 0, 0, { width: pageWidth, height: pageHeight });
        } catch (bgErr) {
          console.warn("Failed to render background image in PDFKit:", bgErr);
          doc.rect(0, 0, pageWidth, pageHeight).fill("#ffffff");
        }
      } else {
        // Fallback clean white A4 background
        doc.rect(0, 0, pageWidth, pageHeight).fill("#ffffff");
      }

      // 6. Initials for avatar fallback
      const initials = (attendeeName || "Attendee")
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      // Helper to render the centered Badge Card in a quadrant
      const renderQuadrantBadge = (centerX, centerY) => {
        // Card Background styling (if theme is white or glass)
        if (resolvedTheme === "white" || resolvedTheme === "glass") {
          const cardW = 160;
          const cardH = 200;
          doc
            .save()
            .roundedRect(centerX - cardW / 2, centerY - cardH / 2, cardW, cardH, 12)
            .fill(resolvedTheme === "glass" ? "#f8fafc" : "#ffffff")
            .strokeColor("#e2e8f0")
            .lineWidth(1)
            .stroke()
            .restore();
        }

        // 1. Photo Avatar (Enlarged circular photo with subtle border)
        const photoRadius = 28; // 56pt diameter (~20mm)
        const photoCenterY = centerY - 58;

        if (isShowPhoto) {
          if (photoImageBuffer) {
            try {
              doc.save();
              doc.circle(centerX, photoCenterY, photoRadius).clip();
              doc.image(photoImageBuffer, centerX - photoRadius, photoCenterY - photoRadius, {
                width: photoRadius * 2,
                height: photoRadius * 2,
              });
              doc.restore();

              // Subtle ring border
              doc.save();
              doc.circle(centerX, photoCenterY, photoRadius).lineWidth(1.5).strokeColor("#cbd5e1").stroke();
              doc.restore();
            } catch (pErr) {
              console.warn("Failed to draw photo in PDFKit:", pErr);
              drawInitialsAvatar(centerX, photoCenterY, photoRadius);
            }
          } else {
            drawInitialsAvatar(centerX, photoCenterY, photoRadius);
          }
        }

        // 2. Attendee Name (Bold black)
        const nameY = centerY - 20;
        doc
          .fillColor("#0f172a")
          .fontSize(13.5)
          .font("Helvetica-Bold")
          .text(attendeeName || "Attendee Name", centerX - 120, nameY, {
            width: 240,
            align: "center",
            ellipsis: true,
          });

        // 3. Company Name (Bold Blue #2563eb with breathing room)
        if (attendeeCompany) {
          const companyY = centerY - 2;
          doc
            .fillColor("#2563eb")
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(attendeeCompany, centerX - 120, companyY, {
              width: 240,
              align: "center",
              ellipsis: true,
            });
        }

        // 4. Centered Scannable QR Code (17mm x 17mm = ~48pt)
        if (isShowQr && qrImageBuffer) {
          const qrSize = 48;
          const qrX = centerX - qrSize / 2;
          const qrY = centerY + 16;
          try {
            doc.image(qrImageBuffer, qrX, qrY, {
              width: qrSize,
              height: qrSize,
            });
          } catch (qrDrawErr) {
            console.warn("Failed to draw QR in PDFKit:", qrDrawErr);
          }
        }
      };

      const drawInitialsAvatar = (x, y, r) => {
        doc.save();
        doc.circle(x, y, r).fill("#2563eb");
        doc
          .fillColor("#ffffff")
          .fontSize(18)
          .font("Helvetica-Bold")
          .text(initials, x - r, y - 9, {
            width: r * 2,
            align: "center",
          });
        doc.restore();
      };

      // 7. Render Quadrant 1 (Top-Left Center)
      const q1CenterX = halfWidth / 2; // 148.82 pt
      const q1CenterY = halfHeight / 2; // 210.47 pt
      renderQuadrantBadge(q1CenterX, q1CenterY);

      // 8. Render Quadrant 2 (Top-Right Center)
      const q2CenterX = halfWidth + halfWidth / 2; // 446.46 pt
      const q2CenterY = halfHeight / 2; // 210.47 pt
      renderQuadrantBadge(q2CenterX, q2CenterY);

      // 9. Draw Center Fold / Cut Guidelines Crosshairs (Dashed lines)
      if (isFoldGuide) {
        doc
          .save()
          .lineWidth(0.75)
          .dash(4, { space: 4 })
          .strokeColor("#94a3b8")
          // Vertical Center Fold Line
          .moveTo(halfWidth, 0)
          .lineTo(halfWidth, pageHeight)
          .stroke()
          // Horizontal Center Fold Line
          .moveTo(0, halfHeight)
          .lineTo(pageWidth, halfHeight)
          .stroke()
          .restore();
      }

      // Finalize document
      doc.end();
    } catch (err) {
      console.error("Error generating badge PDF buffer:", err);
      reject(err);
    }
  });
}
