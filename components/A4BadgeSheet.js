/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { QrCode as QrIcon, Scissors, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";

/**
 * A4BadgeSheet
 * Renders an A4 4-fold conference badge sheet (210 x 297 mm):
 * - Uploaded A4 template artwork background
 * - Top-Left Quadrant: Centered Attendee Badge
 * - Top-Right Quadrant: Centered Attendee Badge (Duplicate / Back)
 * - Bottom-Left & Bottom-Right Quadrants: Open template / fold section
 * - Optional Center Fold / Cut Crosshairs
 */
export default function A4BadgeSheet({
  templateUrl = "",
  attendeeId = "",
  attendeeName = "Elena Rostova",
  attendeeEmail = "",
  attendeePhoto = "",
  attendeeCompany = "InnovateTech Labs",
  attendeeJobTitle = "Delegate",
  ticketType = "VIP Access Pass",
  badgeCode = "EZ-8942-ELN",
  eventId = "",
  eventTitle = "Global Tech Summit 2026",
  eventDate = "",
  eventLocation = "",
  qrCodeUrl = "",
  showFoldGuide = true,
  showPhoto = true,
  showQr = true,
  cardTheme = "white", // "white" | "glass" | "clean"
  className = "",
  isPrintTarget = false,
}) {
  const [generatedQr, setGeneratedQr] = useState(qrCodeUrl || "");

  // Generate Unique Check-in QR if no URL provided
  useEffect(() => {
    if (qrCodeUrl) {
      setGeneratedQr(qrCodeUrl);
      return;
    }
    const generate = async () => {
      try {
        // Encode a structured check-in token that identifies the attendee for instant organizer check-in
        const checkinPayload = JSON.stringify({
          action: "checkin",
          attendeeId: attendeeId || badgeCode || "",
          badgeCode: badgeCode || "EZ-PASS",
          name: attendeeName || "",
          email: attendeeEmail || "",
          tier: ticketType || "",
          eventId: eventId || "",
          event: eventTitle || ""
        });
        const url = await QRCode.toDataURL(checkinPayload, {
          width: 360,
          margin: 0,
          color: { dark: "#0f172a", light: "#00000000" },
          errorCorrectionLevel: 'M'
        });
        setGeneratedQr(url);
      } catch (err) {
        console.warn("QR generation fallback:", err);
      }
    };
    generate();
  }, [qrCodeUrl, attendeeId, badgeCode, attendeeName, attendeeEmail, ticketType, eventId, eventTitle]);

  // Card Background styling (Clean transparent floating directly on artwork)
  const getCardStyle = () => {
    if (cardTheme === "white") {
      return "bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-sm text-slate-900 rounded-xl p-3";
    }
    if (cardTheme === "glass") {
      return "bg-white/80 backdrop-blur-md border border-white/60 shadow-md text-slate-900 rounded-xl p-3";
    }
    // Default: completely transparent / no white box
    return "bg-transparent text-slate-900";
  };

  // Render Single Attendee Badge Card (Floating directly on template artwork)
  const renderBadgeCard = (keySuffix = "front") => {
    return (
      <div
        key={keySuffix}
        className={`w-full max-w-[125px] sm:max-w-[140px] flex flex-col items-center justify-center text-center transition-all ${getCardStyle()}`}
        style={{ 
          fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" 
        }}
      >
        {/* 1. Badge Photo / Avatar Circle */}
        {showPhoto && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-slate-900/15 shadow-sm bg-white flex items-center justify-center shrink-0 mb-2">
            {attendeePhoto ? (
              <img
                src={attendeePhoto}
                alt={attendeeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-base sm:text-lg flex items-center justify-center">
                {(attendeeName || "Attendee")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* 2. Attendee Credentials (Name + Company in Blue) */}
        <div className="flex flex-col items-center justify-center w-full text-center">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight line-clamp-2 w-full">
            {attendeeName || "Attendee Name"}
          </h3>

          {attendeeCompany && (
            <p className="text-[8.5px] sm:text-[9.5px] font-bold text-blue-600 line-clamp-1 mt-1.5 sm:mt-2">
              {attendeeCompany}
            </p>
          )}
        </div>

        {/* 3. Centered Clean QR Code (Moved down a bit) */}
        {showQr && (
          <div className="w-full mt-3 sm:mt-3.5 flex items-center justify-center">
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
              {generatedQr ? (
                <img src={generatedQr} alt="QR" className="w-full h-full object-contain" />
              ) : (
                <QrIcon size={22} className="text-slate-800" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id={isPrintTarget ? "printable-a4-sheet" : undefined}
      className={`relative w-full aspect-[210/297] bg-white text-slate-900 overflow-hidden shadow-2xl rounded-2xl border border-slate-300 font-sans select-none ${className}`}
    >
      {/* Background Template Artwork Image */}
      {templateUrl ? (
        <img
          src={templateUrl}
          alt="A4 Badge Artwork"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
      ) : (
        /* Fallback stylized background if no custom template uploaded */
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100 pointer-events-none opacity-90 z-0">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />
        </div>
      )}

      {/* 2x2 Grid of the 4 Quadrants */}
      <div className="relative z-10 grid grid-cols-2 grid-rows-2 w-full h-full">
        
        {/* QUADRANT 1: TOP-LEFT (Attendee Badge 1 / Front) */}
        <div className="flex items-center justify-center p-3 sm:p-5 relative">
          {renderBadgeCard("front")}
        </div>

        {/* QUADRANT 2: TOP-RIGHT (Attendee Badge 2 / Back) */}
        <div className="flex items-center justify-center p-3 sm:p-5 relative">
          {renderBadgeCard("back")}
        </div>

        {/* QUADRANT 3: BOTTOM-LEFT (Template / Fold Section) */}
        <div className="flex flex-col items-center justify-end p-4 text-center opacity-70">
          {!templateUrl && (
            <div className="text-[8px] text-slate-400 font-medium">
              Eventzone A4 4-Fold Badge Sheet
            </div>
          )}
        </div>

        {/* QUADRANT 4: BOTTOM-RIGHT (Template / Fold Section) */}
        <div className="flex flex-col items-center justify-end p-4 text-center opacity-70">
          {!templateUrl && (
            <div className="text-[8px] text-slate-400 font-medium">
              Fold along guidelines for badge pouch
            </div>
          )}
        </div>
      </div>

      {/* CENTER FOLD / CUT CROSSHAIR GUIDELINES */}
      {showFoldGuide && (
        <>
          {/* Vertical Center Fold Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-dashed border-slate-400/50 pointer-events-none z-20" />
          
          {/* Horizontal Center Fold Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-b-2 border-dashed border-slate-400/50 pointer-events-none z-20" />
        </>
      )}
    </div>
  );
}

/**
 * Helper function to trigger high-precision A4 browser print / PDF export
 */
export async function printA4BadgeDocument({
  templateUrl = "",
  attendeeId = "",
  attendeeName = "Attendee",
  attendeeEmail = "",
  attendeePhoto = "",
  attendeeCompany = "",
  attendeeJobTitle = "",
  ticketType = "Standard Pass",
  badgeCode = "EZ-PASS",
  eventId = "",
  eventTitle = "Event",
  qrCodeUrl = "",
  showFoldGuide = true,
  showPhoto = true,
  showQr = true,
  cardTheme = "white",
}) {
  if (typeof window === "undefined") return;

  // Generate unique check-in QR code with transparent background if not provided
  let resolvedQr = qrCodeUrl;
  if (!resolvedQr && showQr) {
    try {
      const checkinPayload = JSON.stringify({
        action: "checkin",
        attendeeId: attendeeId || badgeCode || "",
        badgeCode: badgeCode || "EZ-PASS",
        name: attendeeName || "",
        email: attendeeEmail || "",
        tier: ticketType || "",
        eventId: eventId || "",
        event: eventTitle || ""
      });
      resolvedQr = await QRCode.toDataURL(checkinPayload, {
        width: 360,
        margin: 0,
        color: { dark: "#0f172a", light: "#00000000" },
        errorCorrectionLevel: 'M'
      });
    } catch (e) {
      console.warn("QR code generation failed:", e);
    }
  }

  const isVip = (ticketType || "").toLowerCase().includes("vip");
  const cardBgStyle = cardTheme === "white"
    ? "background: rgba(255, 255, 255, 0.92); border: 1px solid #e2e8f0; border-radius: 12px; padding: 4.5mm 3.5mm; box-shadow: 0 2px 6px rgba(0,0,0,0.05);"
    : cardTheme === "glass" 
    ? "background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 12px; padding: 4.5mm 3.5mm; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" 
    : "background: transparent; border: none; box-shadow: none; padding: 0;";

  const cardHtml = `
    <div style="${cardBgStyle} display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-sizing: border-box; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- 1. Photo / Avatar -->
      ${showPhoto ? `
        <div style="width: 68px; height: 68px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(15, 23, 42, 0.15); margin-bottom: 5px; background: #ffffff; display: flex; align-items: center; justify-content: center;">
          ${attendeePhoto 
            ? `<img src="${attendeePhoto}" style="width: 100%; height: 100%; object-fit: cover;" />` 
            : `<div style="width: 100%; height: 100%; background: #2563eb; color: #fff; font-weight: 900; font-size: 20px; display: flex; align-items: center; justify-content: center;">${(attendeeName || "A").slice(0, 2).toUpperCase()}</div>`
          }
        </div>
      ` : ''}

      <!-- 2. Name & Company (in Blue) -->
      <div style="padding: 1px 0; display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%;">
        <div style="font-size: 14.5px; font-weight: 900; color: #0f172a; line-height: 1.15; margin-bottom: 2px;">
          ${attendeeName || "Attendee Name"}
        </div>
        ${attendeeCompany ? `
          <div style="font-size: 10.5px; font-weight: 800; color: #2563eb; margin-top: 1.8mm;">
            ${attendeeCompany}
          </div>
        ` : ''}
      </div>

      <!-- 3. Centered Clean QR Code (Moved down a bit) -->
      ${showQr && resolvedQr ? `
        <div style="margin-top: 5mm; display: flex; align-items: center; justify-content: center;">
          <img src="${resolvedQr}" style="width: 17mm; height: 17mm; object-fit: contain;" />
        </div>
      ` : ''}
    </div>
  `;

  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) {
    alert("Please allow popups to print the A4 badge sheet.");
    return;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>A4 Badge Sheet - ${attendeeName}</title>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            background: #ffffff;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .a4-sheet {
            position: relative;
            width: 210mm;
            height: 297mm;
            background: #ffffff;
            overflow: hidden;
          }
          .quadrants-grid {
            display: grid;
            grid-template-columns: 105mm 105mm;
            grid-template-rows: 148.5mm 148.5mm;
            width: 210mm;
            height: 297mm;
            position: relative;
            z-index: 10;
          }
          .quadrant {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10mm;
            box-sizing: border-box;
          }
          ${showFoldGuide ? `
            .fold-line-v {
              position: absolute;
              top: 0;
              bottom: 0;
              left: 105mm;
              width: 0;
              border-right: 1px dashed rgba(100, 116, 139, 0.45);
              z-index: 20;
            }
            .fold-line-h {
              position: absolute;
              left: 0;
              right: 0;
              top: 148.5mm;
              height: 0;
              border-bottom: 1px dashed rgba(100, 116, 139, 0.45);
              z-index: 20;
            }
          ` : ''}
        </style>
      </head>
      <body>
        <div class="a4-sheet">
          ${templateUrl ? `<img src="${templateUrl}" style="position: absolute; top: 0; left: 0; width: 210mm; height: 297mm; object-fit: cover; z-index: 1;" />` : ''}
          <div class="quadrants-grid">
            <!-- Top Left Quadrant -->
            <div class="quadrant">
              ${cardHtml}
            </div>
            <!-- Top Right Quadrant -->
            <div class="quadrant">
              ${cardHtml}
            </div>
            <!-- Bottom Left Quadrant -->
            <div class="quadrant"></div>
            <!-- Bottom Right Quadrant -->
            <div class="quadrant"></div>
          </div>

          ${showFoldGuide ? `
            <div class="fold-line-v"></div>
            <div class="fold-line-h"></div>
          ` : ''}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}
