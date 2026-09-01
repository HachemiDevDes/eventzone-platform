import PDFDocument from "pdfkit";
import { interpolateCertificateText } from "./certificatePresets.js";

/**
 * Clean formal prefixes and suffix titles from signature line
 */
function getSignatureDisplayText(name) {
  if (!name || typeof name !== "string") return "Signature";
  const clean = name
    .replace(/\b(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.|Eng\.|Ph\.D\.|PhD|MD|Esq\.|Dean|Chair|Director)\b/gi, "")
    .replace(/,\s*Ph\.D\.?/gi, "")
    .replace(/,\s*MD/gi, "")
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0][0]}. ${parts[1]}`;
  if (parts.length >= 3) return `${parts[0][0]}. ${parts[parts.length - 1]}`;
  return clean || name;
}

/**
 * Maps custom font keys to standard PDFKit font family variants
 */
function mapFontToPdfKit(fontKey, isBold = false, isItalic = false) {
  const k = (fontKey || "").toLowerCase();

  const serifKeys = [
    "cinzel", "cinzel-decorative", "playfair", "cormorant", "eb-garamond",
    "libre-baskerville", "lora", "merriweather", "bodoni", "marcellus", "prata", "serif"
  ];
  const scriptKeys = [
    "cursive", "alex-brush", "pinyon", "dancing", "parisienne", "satisfy", "allura", "marck", "script"
  ];
  const monoKeys = ["mono", "courier", "monospace"];

  if (monoKeys.some(m => k.includes(m))) {
    if (isBold && isItalic) return "Courier-BoldOblique";
    if (isBold) return "Courier-Bold";
    if (isItalic) return "Courier-Oblique";
    return "Courier";
  }

  if (scriptKeys.some(s => k.includes(s))) {
    return isBold ? "Times-BoldItalic" : "Times-Italic";
  }

  if (serifKeys.some(s => k.includes(s))) {
    if (isBold && isItalic) return "Times-BoldItalic";
    if (isBold) return "Times-Bold";
    if (isItalic) return "Times-Italic";
    return "Times-Roman";
  }

  // Default Sans-Serif (Plus Jakarta Sans, Inter, Montserrat, Poppins, Outfit, Raleway, Oswald, Space Grotesk, etc.)
  if (isBold && isItalic) return "Helvetica-BoldOblique";
  if (isBold) return "Helvetica-Bold";
  if (isItalic) return "Helvetica-Oblique";
  return "Helvetica";
}

/**
 * Generates an official, high-resolution printable PDF Certificate Buffer on the server
 * Layout: Landscape A4 (841.89 x 595.28 pt)
 * Accurately reproduces the exact 1000x707 vector border architectures, typography, and positions
 */
export async function generateCertificatePdfBuffer({
  recipientName = "Valued Participant",
  recipientRole = "Attendee",
  company = "",
  jobTitle = "",
  certificateTitle = "Certificate of Attendance",
  subtitleText = "THIS IS PROUDLY PRESENTED TO",
  recipientSubtext = "",
  bodyText = "",
  certificateId = "EZ-CERT-0001",
  eventTitle = "Eventzone Summit",
  eventDate = "",
  eventLocation = "",
  organizerName = "Eventzone Organizing Committee",
  template = {},
  certificateImage = null,
}) {
  return new Promise((resolve, reject) => {
    try {
      // Landscape A4 dimensions in PostScript points: 841.89 x 595.28
      const pageWidth = 841.89;
      const pageHeight = 595.28;

      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
        info: {
          Title: `${template.certificateTitle || certificateTitle} - ${recipientName}`,
          Author: organizerName || "Eventzone Platform",
          Subject: `${template.certificateTitle || certificateTitle} conferred at ${eventTitle}`,
          Keywords: "Certificate, Eventzone, Award, Recognition, Attendance, Verified",
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // ── IF PIXEL-PERFECT RENDERED IMAGE PROVIDED FROM CLIENT CANVAS ──
      if (certificateImage && typeof certificateImage === "string") {
        try {
          const base64Data = certificateImage.replace(/^data:image\/\w+;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, "base64");
          doc.image(imgBuffer, 0, 0, { width: pageWidth, height: pageHeight });
          doc.end();
          return;
        } catch (imgErr) {
          console.warn("Could not embed certificateImage into PDF, falling back to vector rendering:", imgErr);
        }
      }

      // Theme Colors & Styles from Template
      const accentColor = template.accentColor || "#D4AF37"; // Rich Gold
      const secondaryColor = template.secondaryColor || "#1E293B"; // Dark Slate / Navy
      const borderStyle = template.borderStyle || "modern-geometric-navy-gold";
      const bgStyle = template.bgStyle || "white";
      const isDark = bgStyle === "dark" || borderStyle === "dark-obsidian-luxe";

      // Background Fill
      const bgColor = isDark
        ? "#0B1120"
        : bgStyle === "ivory"
        ? "#FAF8F2"
        : (template.bgColor || "#FFFFFF");

      doc.rect(0, 0, pageWidth, pageHeight).fill(bgColor);

      if (!isDark && bgStyle === "ivory") {
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30).fill("#F4EFE6");
      }

      // ─────────────────────────────────────────────
      //  1. DRAW EXACT VECTOR BORDER ARCHITECTURES
      //  (Scaled from 1000x707 SVG coordinates to A4 points)
      // ─────────────────────────────────────────────
      const scaleX = pageWidth / 1000;
      const scaleY = pageHeight / 707;

      doc.save();
      doc.scale(scaleX, scaleY);

      if (borderStyle === "modern-geometric-navy-gold") {
        // Top-left facets
        doc.polygon([0, 0], [280, 0], [0, 280]).fill(secondaryColor);
        doc.save().polygon([0, 0], [240, 0], [0, 240]).fillColor(accentColor, 0.9).fill().restore();
        doc.polygon([0, 0], [180, 0], [0, 180]).fill(secondaryColor);
        doc.polygon([0, 0], [110, 0], [0, 110]).fill(accentColor);
        // Bottom-right facets
        doc.polygon([1000, 707], [720, 707], [1000, 427]).fill(secondaryColor);
        doc.save().polygon([1000, 707], [760, 707], [1000, 467]).fillColor(accentColor, 0.9).fill().restore();
        doc.polygon([1000, 707], [820, 707], [1000, 527]).fill(secondaryColor);
        doc.polygon([1000, 707], [890, 707], [1000, 597]).fill(accentColor);
        // Inner rectangular frame
        doc.save().rect(35, 35, 930, 637).lineWidth(1.5).strokeColor(accentColor, 0.4).stroke().restore();
      } else if (borderStyle === "fluid-wave-teal-gold") {
        doc.save().path("M0,0 L360,0 C280,140 140,200 0,260 Z").fill(secondaryColor).restore();
        doc.save().path("M0,0 L300,0 C220,120 110,160 0,200 Z").fillColor(accentColor, 0.85).fill().restore();
        doc.save().path("M1000,707 L640,707 C720,567 860,507 1000,447 Z").fill(secondaryColor).restore();
        doc.save().path("M1000,707 L700,707 C780,587 890,547 1000,507 Z").fillColor(accentColor, 0.85).fill().restore();
        doc.save().roundedRect(30, 30, 940, 647, 8).lineWidth(1).strokeColor(secondaryColor, 0.25).stroke().restore();
      } else if (borderStyle === "corporate-diagonal-red-gold") {
        doc.polygon([0, 0], [340, 0], [0, 220]).fill(secondaryColor);
        doc.save().moveTo(348, 0).lineTo(0, 228).lineWidth(5).strokeColor(accentColor).stroke().restore();
        doc.polygon([1000, 707], [660, 707], [1000, 487]).fill("#1E293B");
        doc.save().moveTo(652, 707).lineTo(1000, 479).lineWidth(5).strokeColor(accentColor).stroke().restore();
        doc.save().rect(36, 36, 928, 635).lineWidth(1.5).strokeColor("#CBD5E1").stroke().restore();
      } else if (borderStyle === "dark-obsidian-luxe") {
        doc.save().rect(30, 30, 940, 647).lineWidth(2).strokeColor(accentColor, 0.8).stroke().restore();
        doc.save().rect(42, 42, 916, 623).lineWidth(1).dash(6, { space: 6 }).strokeColor(accentColor, 0.5).stroke().restore();
        doc.polygon([30, 30], [80, 30], [30, 80]).fill(accentColor);
        doc.polygon([970, 30], [920, 30], [970, 80]).fill(accentColor);
        doc.polygon([30, 677], [80, 677], [30, 627]).fill(accentColor);
        doc.polygon([970, 677], [920, 677], [970, 627]).fill(accentColor);
      } else if (borderStyle === "asymmetric-royal-blue") {
        doc.polygon([0, 0], [120, 0], [70, 707], [0, 707]).fill(secondaryColor);
        doc.polygon([120, 0], [140, 0], [90, 707], [70, 707]).fill(accentColor);
        doc.polygon([0, 0], [70, 0], [0, 220]).fill("#1E40AF");
        doc.polygon([1000, 0], [930, 0], [1000, 90]).fill(secondaryColor);
        doc.polygon([1000, 707], [920, 707], [1000, 580]).fill(accentColor);
        doc.save().rect(40, 35, 920, 637).lineWidth(1.5).strokeColor("#E2E8F0").stroke().restore();
      } else if (borderStyle === "emerald-botanical-crest") {
        doc.polygon([0, 0], [240, 0], [0, 240]).fill(secondaryColor);
        doc.save().moveTo(248, 0).lineTo(0, 248).lineWidth(4).strokeColor(accentColor).stroke().restore();
        doc.polygon([1000, 707], [760, 707], [1000, 467]).fill(secondaryColor);
        doc.save().moveTo(752, 707).lineTo(1000, 459).lineWidth(4).strokeColor(accentColor).stroke().restore();
        doc.save().roundedRect(36, 36, 928, 635, 16).lineWidth(1.5).strokeColor(secondaryColor, 0.4).stroke().restore();
      } else if (borderStyle === "creative-coral-violet") {
        doc.save().path("M0,0 L320,0 C250,140 140,220 0,260 Z").fillColor("#7C3AED", 0.95).fill().restore();
        doc.save().path("M1000,707 L680,707 C750,567 860,487 1000,447 Z").fillColor("#F43F5E", 0.95).fill().restore();
        doc.save().roundedRect(30, 30, 940, 647, 12).lineWidth(1.5).strokeColor("#7C3AED", 0.3).stroke().restore();
      } else if (borderStyle === "art-deco") {
        doc.save().rect(30, 30, 940, 647).lineWidth(3).strokeColor(accentColor).stroke().restore();
        doc.save().rect(42, 42, 916, 623).lineWidth(1).strokeColor(accentColor, 0.6).stroke().restore();
        doc.polygon([30, 30], [90, 30], [90, 42], [42, 42], [42, 90], [30, 90]).fill(accentColor);
        doc.polygon([970, 30], [910, 30], [910, 42], [958, 42], [958, 90], [970, 90]).fill(accentColor);
        doc.polygon([30, 677], [90, 677], [90, 665], [42, 665], [42, 617], [30, 617]).fill(accentColor);
        doc.polygon([970, 677], [910, 677], [910, 665], [958, 665], [958, 617], [970, 617]).fill(accentColor);
      } else if (borderStyle === "corporate-navy") {
        doc.rect(0, 0, 1000, 26).fill(secondaryColor);
        doc.rect(0, 26, 1000, 6).fill(accentColor);
        doc.rect(0, 681, 1000, 26).fill(secondaryColor);
        doc.rect(0, 675, 1000, 6).fill(accentColor);
        doc.save().rect(35, 45, 930, 617).lineWidth(1.5).strokeColor("#E2E8F0").stroke().restore();
      } else if (borderStyle === "vintage-filigree") {
        doc.save().rect(30, 30, 940, 647).lineWidth(4).strokeColor(accentColor).stroke().restore();
        doc.save().rect(38, 38, 924, 631).lineWidth(1.5).strokeColor(accentColor).stroke().restore();
        doc.save().rect(44, 44, 912, 619).lineWidth(1).dash(3, { space: 3 }).strokeColor("#78350F", 0.6).stroke().restore();
      } else {
        // Classic Gold Default Frame & Rosettes
        doc.save().roundedRect(30, 30, 940, 647, 4).lineWidth(3).strokeColor(accentColor).stroke().restore();
        doc.save().roundedRect(38, 38, 924, 631, 2).lineWidth(1).dash(4, { space: 4 }).strokeColor(accentColor, 0.8).stroke().restore();
        // Corner diamonds
        const corners = [[30, 30], [970, 30], [30, 677], [970, 677]];
        corners.forEach(([cx, cy]) => {
          doc.save().polygon([cx - 8, cy], [cx, cy - 8], [cx + 8, cy], [cx, cy + 8]).fill(accentColor).restore();
        });
      }

      doc.restore(); // Restore back to points space

      // ─────────────────────────────────────────────
      //  2. CONTENT CONTEXT DATA
      // ─────────────────────────────────────────────
      const contextData = {
        name: recipientName,
        role: recipientRole,
        company,
        organization: company,
        jobTitle,
        job_title: jobTitle,
        eventTitle,
        eventName: eventTitle,
        event_name: eventTitle,
        eventLocation,
        location: eventLocation,
        event_location: eventLocation,
        eventDate,
        dates: eventDate,
        event_date: eventDate,
        certificateId,
        certId: certificateId,
        organizerName,
        customNotes: template.customNotes || "",
      };

      // ─────────────────────────────────────────────
      //  3. MAIN CERTIFICATE TITLE
      // ─────────────────────────────────────────────
      if (!template.hideTitle) {
        const titleRaw = template.certificateTitle || certificateTitle || "CERTIFICATE OF ATTENDANCE";
        const titleRendered = interpolateCertificateText(titleRaw, contextData).toUpperCase();

        const titleXpct = template.titleX !== undefined ? template.titleX : 50;
        const titleYpct = template.titleY !== undefined ? template.titleY : 18;
        const titlePtSize = template.titleFontSize || 22;
        const titleCol = template.titleColor || (isDark ? "#FDE047" : accentColor);
        const titleOp = template.titleOpacity !== undefined ? template.titleOpacity : 1;
        const titleItalic = !!template.titleItalic;
        const titleWeight = template.titleFontWeight || "bold";
        const isTitleBold = titleWeight !== "normal" && titleWeight !== "medium";
        const titleFontKey = template.titleFontFamily || (template.fontPairing === "montserrat-sans" ? "montserrat" : template.fontPairing === "playfair-inter" ? "playfair" : template.fontPairing === "cormorant-serif" ? "cormorant" : "cinzel");
        const resolvedTitleFont = mapFontToPdfKit(titleFontKey, isTitleBold, titleItalic);
        const titleLetterSp = typeof template.titleLetterSpacing === "number" ? template.titleLetterSpacing : 2;

        const titleX = (titleXpct / 100) * pageWidth;
        const titleY = (titleYpct / 100) * pageHeight - (titlePtSize / 2);

        doc.save();
        if (titleOp < 1) doc.opacity(titleOp);
        doc
          .fillColor(titleCol)
          .fontSize(titlePtSize)
          .font(resolvedTitleFont)
          .text(titleRendered, 40, titleY, {
            width: pageWidth - 80,
            align: "center",
            characterSpacing: titleLetterSp,
          });
        doc.restore();
      }

      // ─────────────────────────────────────────────
      //  4. PRESENTATION SUBTITLE
      // ─────────────────────────────────────────────
      if (!template.hideSubtitle) {
        const subRaw = template.subtitleText || subtitleText || "THIS IS PROUDLY PRESENTED TO";
        const subRendered = interpolateCertificateText(subRaw, contextData).toUpperCase();

        const subXpct = template.subtitleX !== undefined ? template.subtitleX : 50;
        const subYpct = template.subtitleY !== undefined ? template.subtitleY : 26;
        const subPtSize = template.subtitleFontSize || 9.5;
        const subCol = template.subtitleColor || (isDark ? "#94A3B8" : "#64748B");
        const subOp = template.subtitleOpacity !== undefined ? template.subtitleOpacity : 1;
        const subItalic = !!template.subtitleItalic;
        const subWeight = template.subtitleFontWeight || "bold";
        const isSubBold = subWeight !== "normal";
        const subFontKey = template.subtitleFontFamily || (template.fontPairing?.includes("inter") ? "inter" : "sans");
        const resolvedSubFont = mapFontToPdfKit(subFontKey, isSubBold, subItalic);
        const subLetterSp = typeof template.subtitleLetterSpacing === "number" ? template.subtitleLetterSpacing : 2.5;

        const subY = (subYpct / 100) * pageHeight - (subPtSize / 2);

        doc.save();
        if (subOp < 1) doc.opacity(subOp);
        doc
          .fillColor(subCol)
          .fontSize(subPtSize)
          .font(resolvedSubFont)
          .text(subRendered, 40, subY, {
            width: pageWidth - 80,
            align: "center",
            characterSpacing: subLetterSp,
          });
        doc.restore();
      }

      // ─────────────────────────────────────────────
      //  5. RECIPIENT NAME & SUBTEXT (CENTERPIECE)
      // ─────────────────────────────────────────────
      const nameY = (43 / 100) * pageHeight - 16;
      const nameColor = isDark ? "#FFFFFF" : secondaryColor;
      const recipientFontKey = template.recipientFontFamily || template.titleFontFamily || (template.fontPairing === "playfair-inter" ? "playfair" : template.fontPairing === "montserrat-sans" ? "montserrat" : template.fontPairing === "cormorant-serif" ? "cormorant" : "cinzel");
      const recipientWeight = template.recipientFontWeight || "bold";
      const isRecBold = recipientWeight !== "normal" && recipientWeight !== "medium";
      const isRecItalic = !!template.recipientItalic;
      const resolvedRecFont = mapFontToPdfKit(recipientFontKey, isRecBold, isRecItalic);

      // Draw recipient name
      doc.save();
      doc
        .fillColor(nameColor)
        .fontSize(28)
        .font(resolvedRecFont)
        .text(recipientName, 40, nameY, {
          width: pageWidth - 80,
          align: "center",
          lineBreak: false,
        });

      // Gold baseline rule under recipient name
      const nameWidth = Math.min(pageWidth - 200, Math.max(220, recipientName.length * 15));
      const lineY = nameY + 36;
      doc
        .moveTo((pageWidth - nameWidth) / 2, lineY)
        .lineTo((pageWidth + nameWidth) / 2, lineY)
        .lineWidth(1.5)
        .strokeColor(accentColor)
        .stroke();
      doc.restore();

      // Recipient Subtext (e.g. Job Title • Organization)
      let resolvedSubtext = template.recipientSubtext || recipientSubtext;
      if (!resolvedSubtext) {
        const parts = [jobTitle, company].filter(Boolean);
        resolvedSubtext = parts.join(" • ");
      } else {
        resolvedSubtext = interpolateCertificateText(resolvedSubtext, contextData).replace(/^[•\s—-]+|[•\s—-]+$/g, "");
      }

      if (resolvedSubtext) {
        doc.save();
        doc
          .fillColor(isDark ? "#CBD5E1" : "#475569")
          .fontSize(10.5)
          .font("Helvetica-Bold")
          .text(resolvedSubtext, 40, lineY + 6, {
            width: pageWidth - 80,
            align: "center",
          });
        doc.restore();
      }

      // ─────────────────────────────────────────────
      //  6. BODY STATEMENT PARAGRAPH
      // ─────────────────────────────────────────────
      if (!template.hideBody) {
        const bodyRaw = template.bodyText || bodyText ||
          "For distinguished and active participation in the **{{event_name}}**.";

        const bodyClean = interpolateCertificateText(bodyRaw, contextData).replace(/\*\*/g, "");

        const bodyYpct = template.bodyY !== undefined ? template.bodyY : 64;
        const bodyPtSize = template.bodyFontSize || 10;
        const bodyCol = template.bodyColor || (isDark ? "#CBD5E1" : "#334155");
        const bodyOp = template.bodyOpacity !== undefined ? template.bodyOpacity : 1;
        const bodyItalic = !!template.bodyItalic;
        const bodyWeight = template.bodyFontWeight || "normal";
        const isBodyBold = bodyWeight === "bold" || bodyWeight === "semibold" || bodyWeight === "extrabold" || bodyWeight === "black";
        const bodyFontKey = template.bodyFontFamily || (template.fontPairing?.includes("inter") ? "inter" : "sans");
        const resolvedBodyFont = mapFontToPdfKit(bodyFontKey, isBodyBold, bodyItalic);
        const bodyAlign = template.bodyTextAlign || "center";

        const bodyY = (bodyYpct / 100) * pageHeight - 10;

        doc.save();
        if (bodyOp < 1) doc.opacity(bodyOp);
        doc
          .fillColor(bodyCol)
          .fontSize(bodyPtSize)
          .font(resolvedBodyFont)
          .text(bodyClean, 80, bodyY, {
            width: pageWidth - 160,
            align: bodyAlign,
            lineGap: 4,
          });
        doc.restore();
      }

      // ─────────────────────────────────────────────
      //  7. BOTTOM SIGNATORIES
      // ─────────────────────────────────────────────
      const signatories = (template.signatories || []).slice(0, 3);
      if (signatories.length > 0) {
        const sigBottomPct = template.signatureBottom !== undefined ? template.signatureBottom : 8.5;
        const sigY = pageHeight - (pageHeight * (sigBottomPct / 100)) - 38;
        const sigCount = signatories.length;
        const colWidth = (pageWidth - 160) / sigCount;

        signatories.forEach((sig, index) => {
          const colX = 80 + index * colWidth;
          const centerX = colX + colWidth / 2;
          const sigDisplayName = getSignatureDisplayText(sig.name);

          doc.save();
          // Calligraphy Script Signature
          doc
            .fillColor(isDark ? "#FDE047" : accentColor)
            .fontSize(16)
            .font("Times-Italic")
            .text(sigDisplayName, colX, sigY, {
              width: colWidth,
              align: "center",
            });

          // Signature Line
          const sigRuleY = sigY + 22;
          doc
            .moveTo(centerX - 55, sigRuleY)
            .lineTo(centerX + 55, sigRuleY)
            .lineWidth(1)
            .strokeColor(isDark ? "#475569" : "#CBD5E1")
            .stroke();

          // Signatory Name
          doc
            .fillColor(isDark ? "#FFFFFF" : secondaryColor)
            .fontSize(8.5)
            .font("Helvetica-Bold")
            .text(sig.name, colX, sigRuleY + 4, {
              width: colWidth,
              align: "center",
            });

          // Signatory Title
          if (sig.title) {
            doc
              .fillColor(isDark ? "#94A3B8" : "#64748B")
              .fontSize(7.5)
              .font("Helvetica")
              .text(sig.title, colX, sigRuleY + 15, {
                width: colWidth,
                align: "center",
              });
          }
          doc.restore();
        });
      }

      // ─────────────────────────────────────────────
      //  8. CUSTOM OVERLAY TEXT ELEMENTS (IF ANY)
      // ─────────────────────────────────────────────
      (template.customElements || []).forEach((el) => {
        if (el.type === "text" && el.text) {
          const customText = interpolateCertificateText(el.text, contextData);
          const x = ((el.x !== undefined ? el.x : 50) / 100) * pageWidth;
          const y = ((el.y !== undefined ? el.y : 50) / 100) * pageHeight;
          const size = el.fontSize || 11;
          const col = el.color || accentColor;
          const op = el.opacity !== undefined ? el.opacity : 1;
          const isBold = el.fontWeight === "bold" || el.fontWeight === "extrabold" || el.fontWeight === "black";
          const isItalic = el.italic;

          doc.save();
          if (op < 1) doc.opacity(op);
          doc
            .fillColor(col)
            .fontSize(size)
            .font(isBold && isItalic ? "Times-BoldItalic" : isBold ? "Times-Bold" : isItalic ? "Times-Italic" : "Helvetica")
            .text(customText, x - 150, y - size / 2, {
              width: 300,
              align: "center",
            });
          doc.restore();
        }
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
