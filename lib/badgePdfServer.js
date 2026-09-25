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

      // Initials for avatar fallback
      const initials = (attendeeName || "Attendee")
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      // 5. If custom artwork template provided, render it. Otherwise, render Standard Badge Template!
      if (templateImageBuffer) {
        try {
          doc.image(templateImageBuffer, 0, 0, { width: pageWidth, height: pageHeight });
        } catch (bgErr) {
          console.warn("Failed to render background image in PDFKit:", bgErr);
          doc.rect(0, 0, pageWidth, pageHeight).fill("#ffffff");
        }

        // Render traditional overlay badges for custom artwork
        const q1CenterX = halfWidth / 2;
        const q1CenterY = halfHeight / 2;
        renderCustomOverlayBadge(q1CenterX, q1CenterY);

        const q2CenterX = halfWidth + halfWidth / 2;
        const q2CenterY = halfHeight / 2;
        renderCustomOverlayBadge(q2CenterX, q2CenterY);
      } else {
        // STANDARD EVENTZONE BADGE TEMPLATE (A4 4-FOLD)
        renderStandardA4BadgeTemplate();
      }

      // 6. Draw Center Fold / Cut Guidelines Crosshairs (Dashed lines)
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

        // Guide Labels
        doc
          .save()
          .fillColor("#94a3b8")
          .fontSize(6)
          .font("Helvetica-Bold")
          .text("✄  VERTICAL CENTER FOLD (OUTWARDS)", halfWidth - 80, 3, { width: 160, align: "center" })
          .text("✄  HORIZONTAL CENTER FOLD (BACKWARDS)", 8, halfHeight - 9, { width: 180, align: "left" })
          .restore();
      }

      // Helper to render custom overlay badge on top of organizer's uploaded background
      function renderCustomOverlayBadge(centerX, centerY) {
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

        const photoRadius = 28;
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
      }

      function drawInitialsAvatar(x, y, r) {
        doc.save();
        doc.circle(x, y, r).fill("#2563eb");
        doc
          .fillColor("#ffffff")
          .fontSize(Math.max(12, Math.floor(r * 0.65)))
          .font("Helvetica-Bold")
          .text(initials, x - r, y - Math.floor(r * 0.35), {
            width: r * 2,
            align: "center",
          });
        doc.restore();
      }

      // Tier styling helper
      function getTierColorTheme(tier = "") {
        const t = (tier || "").toLowerCase();
        if (t.includes("vip") || t.includes("gold") || t.includes("platinum") || t.includes("premium")) {
          return {
            bg: "#fef3c7",
            border: "#f59e0b",
            text: "#92400e",
            tag: "VIP ACCESS PASS",
            accent: "#d97706"
          };
        }
        if (t.includes("speaker") || t.includes("keynote") || t.includes("panelist")) {
          return {
            bg: "#ede9fe",
            border: "#8b5cf6",
            text: "#5b21b6",
            tag: "SPEAKER / KEYNOTE",
            accent: "#7c3aed"
          };
        }
        if (t.includes("organizer") || t.includes("staff") || t.includes("crew") || t.includes("host") || t.includes("admin")) {
          return {
            bg: "#d1fae5",
            border: "#10b981",
            text: "#065f46",
            tag: "ORGANIZER / CREW",
            accent: "#059669"
          };
        }
        if (t.includes("press") || t.includes("media") || t.includes("journalist")) {
          return {
            bg: "#ffe4e6",
            border: "#f43f5e",
            text: "#9f1239",
            tag: "PRESS / MEDIA",
            accent: "#e11d48"
          };
        }
        return {
          bg: "#eff6ff",
          border: "#3b82f6",
          text: "#1d4ed8",
          tag: (tier || "STANDARD ADMISSION").toUpperCase(),
          accent: "#2563eb"
        };
      }

      // Complete Standard Eventzone A4 4-Fold Badge Template Renderer
      function renderStandardA4BadgeTemplate() {
        // Crisp clean white paper with subtle outer sheet border
        doc.rect(0, 0, pageWidth, pageHeight).fill("#ffffff");

        const margin = 12;
        const cardW = halfWidth - margin * 2; // ~273.6 pt
        const cardH = halfHeight - margin * 2; // ~396.9 pt
        const tierTheme = getTierColorTheme(ticketTier);

        // Helper: Draw Lanyard Slot Punch Indicator at top center of a card
        const drawSlotGuide = (cx, topY) => {
          const slotW = 34;
          const slotH = 7;
          doc.save();
          doc
            .roundedRect(cx - slotW / 2, topY, slotW, slotH, 3.5)
            .fill("#f8fafc")
            .lineWidth(0.8)
            .dash(2, { space: 2 })
            .strokeColor("#94a3b8")
            .stroke();
          // tiny slot punch dot
          doc.circle(cx, topY + slotH / 2, 1.2).fill("#cbd5e1");
          doc.restore();
        };

        // Helper: Draw Header Bar
        const drawHeaderBanner = (x, y, w, subtitleText = "") => {
          const headerH = 54;
          // Navy Banner with rounded top corners
          doc.save();
          doc
            .roundedRect(x, y, w, headerH, 8)
            .fill("#0f172a");
          
          // Accent bottom strip in primary blue
          doc
            .rect(x, y + headerH - 3, w, 3)
            .fill(tierTheme.accent || "#2563eb");
          doc.restore();

          // Header Text
          doc
            .save()
            .fillColor("#93c5fd")
            .fontSize(6)
            .font("Helvetica-Bold")
            .text("EVENTZONE OFFICIAL PASS", x + 10, y + 8, {
              width: w - 20,
              align: "center",
              characterSpacing: 0.5,
            });

          doc
            .fillColor("#ffffff")
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(eventTitle || "Conference & Summit", x + 8, y + 18, {
              width: w - 16,
              align: "center",
              ellipsis: true,
              height: 14,
            });

          const metaText = subtitleText || [eventDate, eventLocation].filter(Boolean).join(" • ") || "Eventzone Platform";
          doc
            .fillColor("#cbd5e1")
            .fontSize(7)
            .font("Helvetica")
            .text(metaText, x + 8, y + 36, {
              width: w - 16,
              align: "center",
              ellipsis: true,
            });
          doc.restore();
        };

        // Helper: Draw Tier Pill
        const drawTierPill = (cx, y) => {
          const pillW = 146;
          const pillH = 18;
          doc.save();
          doc
            .roundedRect(cx - pillW / 2, y, pillW, pillH, 9)
            .fill(tierTheme.bg)
            .lineWidth(1)
            .strokeColor(tierTheme.border)
            .stroke();

          doc
            .fillColor(tierTheme.text)
            .fontSize(8)
            .font("Helvetica-Bold")
            .text(tierTheme.tag, cx - pillW / 2, y + 4.5, {
              width: pillW,
              align: "center",
              characterSpacing: 0.3,
            });
          doc.restore();
        };

        // =====================================================================
        // QUADRANT 1: FRONT BADGE (Top-Left, 0, 0 to halfWidth, halfHeight)
        // =====================================================================
        const q1X = margin;
        const q1Y = margin;
        const q1Cx = q1X + cardW / 2;

        // Q1 Card Container
        doc.save();
        doc
          .roundedRect(q1X, q1Y, cardW, cardH, 10)
          .fill("#ffffff")
          .lineWidth(1)
          .strokeColor("#cbd5e1")
          .stroke();
        doc.restore();

        // Q1 Top Lanyard Slot Guide
        drawSlotGuide(q1Cx, q1Y + 6);

        // Q1 Header Banner
        drawHeaderBanner(q1X + 4, q1Y + 16, cardW - 8);

        // Q1 Tier Pill
        drawTierPill(q1Cx, q1Y + 76);

        // Q1 Avatar / Photo Section
        const q1PhotoR = 25;
        const q1PhotoY = q1Y + 124;
        if (isShowPhoto) {
          if (photoImageBuffer) {
            try {
              doc.save();
              doc.circle(q1Cx, q1PhotoY, q1PhotoR).clip();
              doc.image(photoImageBuffer, q1Cx - q1PhotoR, q1PhotoY - q1PhotoR, {
                width: q1PhotoR * 2,
                height: q1PhotoR * 2,
              });
              doc.restore();

              doc.save();
              doc.circle(q1Cx, q1PhotoY, q1PhotoR).lineWidth(1.5).strokeColor("#cbd5e1").stroke();
              doc.restore();
            } catch (pErr) {
              drawInitialsAvatar(q1Cx, q1PhotoY, q1PhotoR);
            }
          } else {
            drawInitialsAvatar(q1Cx, q1PhotoY, q1PhotoR);
          }
        }

        // Q1 Attendee Name & Role
        const q1NameY = isShowPhoto ? q1Y + 155 : q1Y + 115;
        doc
          .save()
          .fillColor("#0f172a")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(attendeeName || "Attendee Name", q1X + 10, q1NameY, {
            width: cardW - 20,
            align: "center",
            ellipsis: true,
          });

        let currentCredentialY = q1NameY + 18;
        if (attendeeJobTitle) {
          doc
            .fillColor("#475569")
            .fontSize(8)
            .font("Helvetica")
            .text(attendeeJobTitle, q1X + 10, currentCredentialY, {
              width: cardW - 20,
              align: "center",
              ellipsis: true,
            });
          currentCredentialY += 12;
        }

        if (attendeeCompany) {
          doc
            .fillColor("#2563eb")
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(attendeeCompany, q1X + 10, currentCredentialY, {
              width: cardW - 20,
              align: "center",
              ellipsis: true,
            });
        }
        doc.restore();

        // Q1 Scannable QR Pass Container
        if (isShowQr && qrImageBuffer) {
          const qrBoxW = 120;
          const qrBoxH = 124;
          const qrBoxY = q1Y + 215;
          const qrBoxX = q1Cx - qrBoxW / 2;

          doc.save();
          doc
            .roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 8)
            .fill("#f8fafc")
            .lineWidth(1)
            .strokeColor("#e2e8f0")
            .stroke();

          // Door pass micro tag
          doc
            .fillColor("#64748b")
            .fontSize(6)
            .font("Helvetica-Bold")
            .text("DOOR CHECK-IN PASS", qrBoxX + 4, qrBoxY + 7, {
              width: qrBoxW - 8,
              align: "center",
              characterSpacing: 0.4,
            });

          // QR Code Image
          const qrSize = 68;
          try {
            doc.image(qrImageBuffer, q1Cx - qrSize / 2, qrBoxY + 18, {
              width: qrSize,
              height: qrSize,
            });
          } catch (e) {
            console.warn("Failed drawing Q1 QR:", e);
          }

          // Badge Code & Notice
          doc
            .fillColor("#0f172a")
            .fontSize(8.5)
            .font("Helvetica-Bold")
            .text(`#${badgeCode || "EZ-PASS"}`, qrBoxX + 4, qrBoxY + 92, {
              width: qrBoxW - 8,
              align: "center",
            });

          doc
            .fillColor("#94a3b8")
            .fontSize(6)
            .font("Helvetica")
            .text("Scan for fast-track entry", qrBoxX + 4, qrBoxY + 106, {
              width: qrBoxW - 8,
              align: "center",
            });
          doc.restore();
        }

        // Q1 Bottom Watermark
        doc
          .save()
          .fillColor("#94a3b8")
          .fontSize(6)
          .font("Helvetica")
          .text("Eventzone Verified Pass • www.eventzone.dz", q1X + 10, q1Y + cardH - 14, {
            width: cardW - 20,
            align: "center",
          })
          .restore();

        // =====================================================================
        // QUADRANT 2: BACK BADGE (Top-Right, halfWidth, 0 to pageWidth, halfHeight)
        // =====================================================================
        const q2X = halfWidth + margin;
        const q2Y = margin;
        const q2Cx = q2X + cardW / 2;

        // Q2 Card Container
        doc.save();
        doc
          .roundedRect(q2X, q2Y, cardW, cardH, 10)
          .fill("#ffffff")
          .lineWidth(1)
          .strokeColor("#cbd5e1")
          .stroke();
        doc.restore();

        // Q2 Top Lanyard Slot Guide
        drawSlotGuide(q2Cx, q2Y + 6);

        // Q2 Header Banner
        drawHeaderBanner(q2X + 4, q2Y + 16, cardW - 8, "Fast-Track Lanyard Back Pass");

        // Q2 Tier Pill
        drawTierPill(q2Cx, q2Y + 76);

        // Q2 Attendee Overview (Bold & Centered)
        doc
          .save()
          .fillColor("#0f172a")
          .fontSize(13.5)
          .font("Helvetica-Bold")
          .text(attendeeName || "Attendee Name", q2X + 10, q2Y + 104, {
            width: cardW - 20,
            align: "center",
            ellipsis: true,
          });

        if (attendeeCompany) {
          doc
            .fillColor("#2563eb")
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(attendeeCompany, q2X + 10, q2Y + 120, {
              width: cardW - 20,
              align: "center",
              ellipsis: true,
            });
        }
        doc.restore();

        // Q2 Large Scannable QR Container (Instant reverse scan)
        if (isShowQr && qrImageBuffer) {
          const q2QrBoxW = 144;
          const q2QrBoxH = 150;
          const q2QrBoxY = q2Y + 138;
          const q2QrBoxX = q2Cx - q2QrBoxW / 2;

          doc.save();
          doc
            .roundedRect(q2QrBoxX, q2QrBoxY, q2QrBoxW, q2QrBoxH, 8)
            .fill("#f8fafc")
            .lineWidth(1)
            .strokeColor("#e2e8f0")
            .stroke();

          doc
            .fillColor("#2563eb")
            .fontSize(6.5)
            .font("Helvetica-Bold")
            .text("REVERSE ACCESS PASS", q2QrBoxX + 4, q2QrBoxY + 8, {
              width: q2QrBoxW - 8,
              align: "center",
              characterSpacing: 0.5,
            });

          const largeQrSize = 88;
          try {
            doc.image(qrImageBuffer, q2Cx - largeQrSize / 2, q2QrBoxY + 20, {
              width: largeQrSize,
              height: largeQrSize,
            });
          } catch (e) {
            console.warn("Failed drawing Q2 QR:", e);
          }

          doc
            .fillColor("#0f172a")
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(`#${badgeCode || "EZ-PASS"}`, q2QrBoxX + 4, q2QrBoxY + 116, {
              width: q2QrBoxW - 8,
              align: "center",
            });

          doc
            .fillColor("#64748b")
            .fontSize(6)
            .font("Helvetica")
            .text("Scannable at all venue sessions & gates", q2QrBoxX + 4, q2QrBoxY + 130, {
              width: q2QrBoxW - 8,
              align: "center",
            });
          doc.restore();
        }

        // Q2 Venue Notice Strip
        const q2NoticeY = q2Y + 300;
        doc.save();
        doc
          .roundedRect(q2X + 12, q2NoticeY, cardW - 24, 46, 6)
          .fill("#f1f5f9")
          .strokeColor("#e2e8f0")
          .lineWidth(0.8)
          .stroke();

        doc
          .fillColor("#475569")
          .fontSize(6.5)
          .font("Helvetica")
          .text("• Wear badge visibly at all conference premises & halls.", q2X + 18, q2NoticeY + 7, {
            width: cardW - 36,
          })
          .text("• Non-transferable credential tied to registered attendee ID.", q2X + 18, q2NoticeY + 18, {
            width: cardW - 36,
          })
          .text("• Inquiries & lost badges: visit the Eventzone Information Desk.", q2X + 18, q2NoticeY + 29, {
            width: cardW - 36,
          });
        doc.restore();

        // Q2 Bottom Watermark
        doc
          .save()
          .fillColor("#94a3b8")
          .fontSize(6)
          .font("Helvetica")
          .text("Powered by Eventzone Platform • Official Credential", q2X + 10, q2Y + cardH - 14, {
            width: cardW - 20,
            align: "center",
          })
          .restore();

        // =====================================================================
        // QUADRANT 3: INSIDE PANEL 1 (Bottom-Left - Event Info & Venue Access)
        // =====================================================================
        const q3X = margin;
        const q3Y = halfHeight + margin;

        // Q3 Card Container
        doc.save();
        doc
          .roundedRect(q3X, q3Y, cardW, cardH, 10)
          .fill("#ffffff")
          .lineWidth(1)
          .strokeColor("#cbd5e1")
          .stroke();

        // Q3 Slate Header Banner
        const q3HeaderH = 36;
        doc
          .roundedRect(q3X + 4, q3Y + 8, cardW - 8, q3HeaderH, 6)
          .fill("#1e293b");
        doc
          .rect(q3X + 4, q3Y + 8 + q3HeaderH - 2.5, cardW - 8, 2.5)
          .fill("#4f46e5");
        doc.restore();

        doc
          .save()
          .fillColor("#e0e7ff")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("EVENT INFORMATION & VENUE ACCESS GUIDE", q3X + 10, q3Y + 20, {
            width: cardW - 20,
            align: "center",
            characterSpacing: 0.3,
          })
          .restore();

        // Q3 Summary Info Table
        const q3TableY = q3Y + 54;
        const q3TableH = 136;
        doc.save();
        doc
          .roundedRect(q3X + 8, q3TableY, cardW - 16, q3TableH, 6)
          .fill("#f8fafc")
          .strokeColor("#e2e8f0")
          .lineWidth(0.8)
          .stroke();

        const infoRows = [
          { label: "Event", value: eventTitle || "Conference Summit" },
          { label: "Attendee", value: attendeeName || "Attendee" },
          { label: "Access Tier", value: ticketTier || "Standard Admission" },
          { label: "Badge Pass Code", value: `#${badgeCode || "EZ-PASS"}` },
          { label: "Date & Schedule", value: eventDate || "See published agenda" },
          { label: "Venue Location", value: eventLocation || "Main Conference Center" },
        ];

        let curRowY = q3TableY + 6;
        infoRows.forEach((r, idx) => {
          doc
            .fillColor("#64748b")
            .fontSize(6.8)
            .font("Helvetica")
            .text(r.label, q3X + 14, curRowY, { width: 75 })
            .fillColor("#0f172a")
            .fontSize(6.8)
            .font("Helvetica-Bold")
            .text(r.value, q3X + 92, curRowY, { width: cardW - 114, ellipsis: true });

          curRowY += 20;
          if (idx < infoRows.length - 1) {
            doc
              .moveTo(q3X + 12, curRowY - 4)
              .lineTo(q3X + cardW - 20, curRowY - 4)
              .strokeColor("#f1f5f9")
              .lineWidth(0.5)
              .stroke();
          }
        });
        doc.restore();

        // Q3 Venue Guidelines & Policies
        const q3PolicyY = q3Y + 200;
        doc.save();
        doc
          .fillColor("#0f172a")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("VENUE ACCESS GUIDELINES & PROTOCOLS", q3X + 12, q3PolicyY, {
            width: cardW - 24,
          });

        const guidelines = [
          { num: "1", title: "Credential Security", desc: "This badge is personal, non-transferable, and required for venue entry." },
          { num: "2", title: "Session Admission", desc: "Workshop & keynote access is subject to tier rights and room capacities." },
          { num: "3", title: "Fast-Track Scanning", desc: "Scan your QR pass at doors, exhibition halls, and catering terminals." },
          { num: "4", title: "Assistance & Support", desc: "Report lost credentials immediately to the Eventzone Information Desk." },
        ];

        let curGuideY = q3PolicyY + 16;
        guidelines.forEach((g) => {
          doc
            .circle(q3X + 18, curGuideY + 5, 4.5)
            .fill("#e0e7ff");
          doc
            .fillColor("#4338ca")
            .fontSize(5.5)
            .font("Helvetica-Bold")
            .text(g.num, q3X + 14, curGuideY + 2.5, { width: 8, align: "center" });

          doc
            .fillColor("#1e293b")
            .fontSize(6.8)
            .font("Helvetica-Bold")
            .text(g.title + ": ", q3X + 28, curGuideY, { continued: true })
            .font("Helvetica")
            .fillColor("#475569")
            .text(g.desc, { width: cardW - 46 });

          curGuideY += 28;
        });

        // Bottom Q3 Security Footer
        doc
          .roundedRect(q3X + 8, q3Y + cardH - 28, cardW - 16, 20, 4)
          .fill("#f1f5f9");
        doc
          .fillColor("#64748b")
          .fontSize(6.2)
          .font("Helvetica-Bold")
          .text("OFFICIAL EVENTZONE CREDENTIAL • DIGITALLY VERIFIED", q3X + 10, q3Y + cardH - 22, {
            width: cardW - 20,
            align: "center",
          });
        doc.restore();

        // =====================================================================
        // QUADRANT 4: INSIDE PANEL 2 (Bottom-Right - Folding Guide & Support)
        // =====================================================================
        const q4X = halfWidth + margin;
        const q4Y = halfHeight + margin;
        const q4Cx = q4X + cardW / 2;

        // Q4 Card Container
        doc.save();
        doc
          .roundedRect(q4X, q4Y, cardW, cardH, 10)
          .fill("#ffffff")
          .lineWidth(1)
          .strokeColor("#cbd5e1")
          .stroke();

        // Q4 Emerald Header Banner
        const q4HeaderH = 36;
        doc
          .roundedRect(q4X + 4, q4Y + 8, cardW - 8, q4HeaderH, 6)
          .fill("#1e293b");
        doc
          .rect(q4X + 4, q4Y + 8 + q4HeaderH - 2.5, cardW - 8, 2.5)
          .fill("#059669");
        doc.restore();

        doc
          .save()
          .fillColor("#d1fae5")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text("BADGE FOLDING GUIDE & DIGITAL PASS", q4X + 10, q4Y + 20, {
            width: cardW - 20,
            align: "center",
            characterSpacing: 0.3,
          })
          .restore();

        // Q4 3-Step Folding Instructions
        const q4StepY = q4Y + 54;
        const steps = [
          {
            step: "1",
            color: "#2563eb",
            title: "HORIZONTAL FOLD",
            desc: "Fold the lower half of this A4 sheet backwards along the horizontal center dashed guideline.",
          },
          {
            step: "2",
            color: "#4f46e5",
            title: "VERTICAL FOLD",
            desc: "Fold the sheet along the vertical center dashed guideline so Front and Back badges face outwards.",
          },
          {
            step: "3",
            color: "#059669",
            title: "INSERT INTO LANYARD POUCH",
            desc: "Slide the folded 4-ply badge into your standard 105 × 148 mm (A6) lanyard sleeve or clip the top punch slot.",
          },
        ];

        let curStepY = q4StepY;
        steps.forEach((s) => {
          doc.save();
          // Step pill
          doc
            .roundedRect(q4X + 10, curStepY, 18, 18, 4)
            .fill(s.color);
          doc
            .fillColor("#ffffff")
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(s.step, q4X + 10, curStepY + 4, { width: 18, align: "center" });

          // Step title & description
          doc
            .fillColor("#0f172a")
            .fontSize(7.5)
            .font("Helvetica-Bold")
            .text(s.title, q4X + 34, curStepY + 1);

          doc
            .fillColor("#475569")
            .fontSize(6.8)
            .font("Helvetica")
            .text(s.desc, q4X + 34, curStepY + 12, {
              width: cardW - 48,
              lineGap: 1.5,
            });
          doc.restore();

          curStepY += 44;
        });

        // Q4 Digital Pass Mobile Notice Box
        const q4MobileY = curStepY + 4;
        doc.save();
        doc
          .roundedRect(q4X + 8, q4MobileY, cardW - 16, 52, 6)
          .fill("#eff6ff")
          .strokeColor("#bfdbfe")
          .lineWidth(0.8)
          .stroke();

        doc
          .fillColor("#1d4ed8")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text("MOBILE DIGITAL PASS READY", q4X + 14, q4MobileY + 8);

        doc
          .fillColor("#3b82f6")
          .fontSize(6.5)
          .font("Helvetica")
          .text("A dynamic scannable QR pass is also available on your smartphone via your registration confirmation email. Keep it offline for instant door check-in.", q4X + 14, q4MobileY + 20, {
            width: cardW - 28,
            lineGap: 1.5,
          });
        doc.restore();

        // Q4 Official Verification Seal
        const q4SealY = q4MobileY + 62;
        doc.save();
        doc
          .roundedRect(q4X + 8, q4SealY, cardW - 16, 68, 6)
          .fill("#f8fafc")
          .strokeColor("#cbd5e1")
          .lineWidth(0.8)
          .stroke();

        doc
          .fillColor("#f59e0b")
          .fontSize(7)
          .font("Helvetica-Bold")
          .text("★ ★ ★", q4X + 10, q4SealY + 7, { width: cardW - 20, align: "center" });

        doc
          .fillColor("#0f172a")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text("OFFICIAL EVENTZONE CREDENTIAL", q4X + 10, q4SealY + 18, {
            width: cardW - 20,
            align: "center",
            characterSpacing: 0.3,
          });

        doc
          .fillColor("#64748b")
          .fontSize(6.2)
          .font("Helvetica")
          .text("Digitally authenticated and synced with live door scanners", q4X + 10, q4SealY + 30, {
            width: cardW - 20,
            align: "center",
          });

        doc
          .fillColor("#2563eb")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(`PASS ID: #${badgeCode || "EZ-PASS"}`, q4X + 10, q4SealY + 44, {
            width: cardW - 20,
            align: "center",
          });
        doc.restore();

        // Q4 Bottom URL
        doc
          .save()
          .fillColor("#94a3b8")
          .fontSize(6)
          .font("Helvetica")
          .text("www.eventzone.dz • Eventzone Platform", q4X + 10, q4Y + cardH - 14, {
            width: cardW - 20,
            align: "center",
          })
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

