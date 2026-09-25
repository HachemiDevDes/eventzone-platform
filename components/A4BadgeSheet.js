/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { QrCode as QrIcon } from "lucide-react";
import QRCode from "qrcode";

/**
 * Tier styling helper
 */
export function getTierColorTheme(tier = "") {
  const t = (tier || "").toLowerCase();
  if (t.includes("vip") || t.includes("gold") || t.includes("platinum") || t.includes("premium")) {
    return {
      bg: "#fef3c7",
      border: "#f59e0b",
      text: "#92400e",
      tag: "VIP ACCESS PASS",
      accent: "#d97706",
      accentBg: "bg-amber-500",
      pillClass: "bg-amber-100 text-amber-900 border-amber-400"
    };
  }
  if (t.includes("speaker") || t.includes("keynote") || t.includes("panelist")) {
    return {
      bg: "#ede9fe",
      border: "#8b5cf6",
      text: "#5b21b6",
      tag: "SPEAKER / KEYNOTE",
      accent: "#7c3aed",
      accentBg: "bg-purple-600",
      pillClass: "bg-purple-100 text-purple-900 border-purple-400"
    };
  }
  if (t.includes("organizer") || t.includes("staff") || t.includes("crew") || t.includes("host") || t.includes("admin")) {
    return {
      bg: "#d1fae5",
      border: "#10b981",
      text: "#065f46",
      tag: "ORGANIZER / CREW",
      accent: "#059669",
      accentBg: "bg-emerald-600",
      pillClass: "bg-emerald-100 text-emerald-900 border-emerald-400"
    };
  }
  if (t.includes("press") || t.includes("media") || t.includes("journalist")) {
    return {
      bg: "#ffe4e6",
      border: "#f43f5e",
      text: "#9f1239",
      tag: "PRESS / MEDIA",
      accent: "#e11d48",
      accentBg: "bg-rose-600",
      pillClass: "bg-rose-100 text-rose-900 border-rose-400"
    };
  }
  return {
    bg: "#eff6ff",
    border: "#3b82f6",
    text: "#1d4ed8",
    tag: (tier || "STANDARD ADMISSION").toUpperCase(),
    accent: "#2563eb",
    accentBg: "bg-blue-600",
    pillClass: "bg-blue-100 text-blue-900 border-blue-400"
  };
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * A4BadgeSheet Component
 * Renders an A4 4-fold conference badge sheet (210 x 297 mm):
 * - If custom templateUrl is uploaded: overlays attendee badges onto custom artwork background.
 * - If NO templateUrl is uploaded: renders the full Standard Eventzone 4-Fold Badge Template (Front, Back, Info Panel, Folding Guide).
 */
export default function A4BadgeSheet({
  templateUrl = "",
  attendeeId = "",
  attendeeName = "Elena Rostova",
  attendeeEmail = "",
  attendeePhoto = "",
  attendeeCompany = "InnovateTech Labs",
  attendeeJobTitle = "Lead AI Engineer",
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

  const tierTheme = getTierColorTheme(ticketType);
  const initials = (attendeeName || "Attendee")
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dateAndLoc = [eventDate, eventLocation].filter(Boolean).join(" • ") || "Eventzone Official Pass";

  // Card Background styling (for custom artwork overlay mode)
  const getCardStyle = () => {
    if (cardTheme === "white") {
      return "bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-sm text-slate-900 rounded-xl p-3";
    }
    if (cardTheme === "glass") {
      return "bg-white/85 backdrop-blur-md border border-white/60 shadow-md text-slate-900 rounded-xl p-3";
    }
    return "bg-transparent text-slate-900";
  };

  // Render Single Attendee Badge Card (Floating on custom artwork)
  const renderCustomArtworkBadgeCard = (keySuffix = "front") => {
    return (
      <div
        key={keySuffix}
        className={`w-full max-w-[125px] sm:max-w-[140px] flex flex-col items-center justify-center text-center transition-all ${getCardStyle()}`}
        style={{ 
          fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" 
        }}
      >
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
                {initials}
              </div>
            )}
          </div>
        )}

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
      style={{
        fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* 1. Custom Artwork Mode */}
      {templateUrl ? (
        <>
          <img
            src={templateUrl}
            alt="A4 Badge Artwork"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
          <div className="relative z-10 grid grid-cols-2 grid-rows-2 w-full h-full">
            <div className="flex items-center justify-center p-3 sm:p-5 relative">
              {renderCustomArtworkBadgeCard("front")}
            </div>
            <div className="flex items-center justify-center p-3 sm:p-5 relative">
              {renderCustomArtworkBadgeCard("back")}
            </div>
            <div className="flex flex-col items-center justify-end p-4 text-center opacity-70" />
            <div className="flex flex-col items-center justify-end p-4 text-center opacity-70" />
          </div>
        </>
      ) : (
        /* 2. Standard Eventzone Badge Template Mode (A4 4-Fold) */
        <div className="relative z-10 grid grid-cols-2 grid-rows-2 w-full h-full p-1.5 sm:p-2.5 gap-1.5 sm:gap-2.5 bg-slate-100/60">
          
          {/* QUADRANT 1: FRONT BADGE (Top-Left) */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col items-center justify-between p-2 sm:p-3 relative overflow-hidden">
            {/* Lanyard slot punch guide */}
            <div className="w-8 h-1.5 rounded-full border border-dashed border-slate-400 bg-slate-50 flex items-center justify-center shrink-0">
              <span className="w-1 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header banner */}
            <div className="w-full bg-slate-900 rounded-lg p-1.5 text-center mt-1 border-b-2" style={{ borderBottomColor: tierTheme.accent }}>
              <div className="text-[6px] font-black text-blue-300 uppercase tracking-widest leading-none">Eventzone Official Pass</div>
              <div className="text-[9px] sm:text-[10px] font-black text-white leading-tight line-clamp-1 mt-0.5">{eventTitle}</div>
              <div className="text-[6.5px] text-slate-300 font-medium line-clamp-1 mt-0.5">{dateAndLoc}</div>
            </div>

            {/* Access Tier pill */}
            <div
              className="mt-1 px-2.5 py-0.5 rounded-full text-[7px] sm:text-[7.5px] font-black uppercase tracking-wider border shrink-0"
              style={{ backgroundColor: tierTheme.bg, borderColor: tierTheme.border, color: tierTheme.text }}
            >
              {tierTheme.tag}
            </div>

            {/* Photo / Avatar */}
            {showPhoto && (
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-slate-300 bg-white flex items-center justify-center shrink-0 mt-1">
                {attendeePhoto ? (
                  <img src={attendeePhoto} alt={attendeeName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center">
                    {initials}
                  </div>
                )}
              </div>
            )}

            {/* Attendee Name & Role */}
            <div className="text-center w-full px-1 my-0.5">
              <h3 className="text-[10px] sm:text-[11.5px] font-black text-slate-900 tracking-tight leading-tight line-clamp-2">
                {attendeeName || "Attendee Name"}
              </h3>
              {attendeeJobTitle && (
                <p className="text-[6.5px] sm:text-[7.5px] text-slate-500 font-semibold line-clamp-1 mt-0.5">
                  {attendeeJobTitle}
                </p>
              )}
              {attendeeCompany && (
                <p className="text-[7.5px] sm:text-[8.5px] font-bold text-blue-600 line-clamp-1 mt-0.5">
                  {attendeeCompany}
                </p>
              )}
            </div>

            {/* Scannable QR Container */}
            {showQr && (
              <div className="w-[85%] bg-slate-50 border border-slate-200 rounded-lg p-1 flex flex-col items-center shrink-0">
                <span className="text-[5.5px] font-black uppercase text-slate-500 tracking-wider">Door Check-In Pass</span>
                <div className="w-9 h-9 sm:w-11 sm:h-11 my-0.5">
                  {generatedQr ? (
                    <img src={generatedQr} alt="QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrIcon size={18} className="text-slate-800" />
                  )}
                </div>
                <span className="text-[6.5px] font-mono font-bold text-slate-900">#{badgeCode || "EZ-PASS"}</span>
              </div>
            )}

            {/* Footer watermark */}
            <div className="text-[5.5px] text-slate-400 font-medium text-center mt-0.5">
              Eventzone Verified Pass • eventzone.dz
            </div>
          </div>

          {/* QUADRANT 2: BACK BADGE (Top-Right) */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col items-center justify-between p-2 sm:p-3 relative overflow-hidden">
            {/* Lanyard slot punch guide */}
            <div className="w-8 h-1.5 rounded-full border border-dashed border-slate-400 bg-slate-50 flex items-center justify-center shrink-0">
              <span className="w-1 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header banner */}
            <div className="w-full bg-slate-900 rounded-lg p-1.5 text-center mt-1 border-b-2" style={{ borderBottomColor: tierTheme.accent }}>
              <div className="text-[6px] font-black text-blue-300 uppercase tracking-widest leading-none">Fast-Track Lanyard Pass</div>
              <div className="text-[9px] sm:text-[10px] font-black text-white leading-tight line-clamp-1 mt-0.5">{eventTitle}</div>
              <div className="text-[6.5px] text-slate-300 font-medium line-clamp-1 mt-0.5">{dateAndLoc}</div>
            </div>

            {/* Access Tier pill */}
            <div
              className="mt-1 px-2.5 py-0.5 rounded-full text-[7px] sm:text-[7.5px] font-black uppercase tracking-wider border shrink-0"
              style={{ backgroundColor: tierTheme.bg, borderColor: tierTheme.border, color: tierTheme.text }}
            >
              {tierTheme.tag}
            </div>

            {/* Attendee Name */}
            <div className="text-center w-full px-1 my-1">
              <h3 className="text-[10px] sm:text-[11px] font-black text-slate-900 tracking-tight leading-tight line-clamp-1">
                {attendeeName || "Attendee Name"}
              </h3>
              {attendeeCompany && (
                <p className="text-[7.5px] sm:text-[8px] font-bold text-blue-600 line-clamp-1 mt-0.5">
                  {attendeeCompany}
                </p>
              )}
            </div>

            {/* Large Scannable QR Container */}
            {showQr && (
              <div className="w-[88%] bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex flex-col items-center shrink-0">
                <span className="text-[5.5px] font-black uppercase text-blue-600 tracking-wider">Reverse Access Pass</span>
                <div className="w-11 h-11 sm:w-14 sm:h-14 my-0.5">
                  {generatedQr ? (
                    <img src={generatedQr} alt="QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrIcon size={24} className="text-slate-800" />
                  )}
                </div>
                <span className="text-[7px] font-mono font-bold text-slate-900">#{badgeCode || "EZ-PASS"}</span>
                <span className="text-[5px] text-slate-500 mt-0.5">Scannable at all venue sessions & gates</span>
              </div>
            )}

            {/* Venue Guidelines */}
            <div className="w-full bg-slate-100 rounded-md p-1 text-[5px] sm:text-[5.5px] text-slate-600 text-left space-y-0.5 mt-0.5">
              <div>• Wear badge visibly at all conference premises & halls.</div>
              <div>• Non-transferable credential tied to registered attendee ID.</div>
              <div>• Inquiries & lost badges: visit the Eventzone Desk.</div>
            </div>

            {/* Footer watermark */}
            <div className="text-[5.5px] text-slate-400 font-medium text-center mt-0.5">
              Powered by Eventzone Platform • Official Credential
            </div>
          </div>

          {/* QUADRANT 3: INSIDE PANEL 1 (Bottom-Left - Event Info & Venue Access) */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col justify-between p-2 sm:p-2.5 overflow-hidden">
            <div className="w-full bg-slate-800 rounded-md p-1 text-center border-b-2 border-indigo-500">
              <span className="text-[6.5px] sm:text-[7px] font-black text-indigo-100 uppercase tracking-wide">
                Event Information & Venue Access Guide
              </span>
            </div>

            {/* Details Table */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 my-1 text-[6px] sm:text-[7px] space-y-1">
              <div className="flex justify-between border-b border-slate-200/60 pb-0.5">
                <span className="text-slate-500 font-semibold">Event:</span>
                <span className="font-extrabold text-slate-900 text-right line-clamp-1">{eventTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-0.5">
                <span className="text-slate-500 font-semibold">Attendee:</span>
                <span className="font-extrabold text-slate-900">{attendeeName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-0.5">
                <span className="text-slate-500 font-semibold">Access Tier:</span>
                <span className="font-extrabold text-blue-600">{ticketType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-0.5">
                <span className="text-slate-500 font-semibold">Pass Code:</span>
                <span className="font-mono font-extrabold text-slate-900">#{badgeCode || "EZ-PASS"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-0.5">
                <span className="text-slate-500 font-semibold">Schedule:</span>
                <span className="font-bold text-slate-700 text-right line-clamp-1">{eventDate || "See official agenda"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Venue:</span>
                <span className="font-bold text-slate-700 text-right line-clamp-1">{eventLocation || "Main Conference Center"}</span>
              </div>
            </div>

            {/* Guidelines */}
            <div className="text-[5.5px] sm:text-[6.5px] text-slate-600 space-y-1 my-0.5">
              <div className="font-bold text-slate-800 text-[6.5px] uppercase">Venue Guidelines:</div>
              <div className="flex items-start gap-1">
                <span className="w-3 h-3 rounded-full bg-indigo-100 text-indigo-700 font-black text-[5.5px] flex items-center justify-center shrink-0">1</span>
                <span><strong>Security:</strong> Wear badge visibly at all times within the perimeter.</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="w-3 h-3 rounded-full bg-indigo-100 text-indigo-700 font-black text-[5.5px] flex items-center justify-center shrink-0">2</span>
                <span><strong>Admission:</strong> Keynote and room access are governed by tier permissions.</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="w-3 h-3 rounded-full bg-indigo-100 text-indigo-700 font-black text-[5.5px] flex items-center justify-center shrink-0">3</span>
                <span><strong>Support:</strong> Report lost passes to the Eventzone Information Desk.</span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded p-1 text-[5px] sm:text-[6px] font-bold text-slate-500 text-center uppercase tracking-wide">
              Official Eventzone Credential • Digitally Verified
            </div>
          </div>

          {/* QUADRANT 4: INSIDE PANEL 2 (Bottom-Right - Folding Guide & Digital Pass) */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col justify-between p-2 sm:p-2.5 overflow-hidden">
            <div className="w-full bg-slate-800 rounded-md p-1 text-center border-b-2 border-emerald-500">
              <span className="text-[6.5px] sm:text-[7px] font-black text-emerald-100 uppercase tracking-wide">
                Badge Folding Guide & Digital Pass
              </span>
            </div>

            {/* 3 Steps */}
            <div className="space-y-1.5 my-1 text-[6px] sm:text-[6.5px]">
              <div className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-600 text-white font-black text-[7px] flex items-center justify-center shrink-0">1</span>
                <div>
                  <div className="font-extrabold text-slate-900 leading-tight">HORIZONTAL FOLD</div>
                  <div className="text-slate-500 text-[5.5px] leading-tight">Fold sheet backwards along horizontal center dashed line.</div>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded bg-indigo-600 text-white font-black text-[7px] flex items-center justify-center shrink-0">2</span>
                <div>
                  <div className="font-extrabold text-slate-900 leading-tight">VERTICAL FOLD</div>
                  <div className="text-slate-500 text-[5.5px] leading-tight">Fold along vertical center line so Front & Back face outwards.</div>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-600 text-white font-black text-[7px] flex items-center justify-center shrink-0">3</span>
                <div>
                  <div className="font-extrabold text-slate-900 leading-tight">INSERT INTO LANYARD SLEEVE</div>
                  <div className="text-slate-500 text-[5.5px] leading-tight">Slide 4-ply badge into standard 105 × 148 mm (A6) holder.</div>
                </div>
              </div>
            </div>

            {/* Digital Pass Notice */}
            <div className="w-full bg-blue-50 border border-blue-200 rounded-md p-1 text-[5.5px] sm:text-[6.5px] text-blue-900 my-0.5">
              <div className="font-extrabold text-blue-700">MOBILE DIGITAL PASS READY</div>
              <div className="text-blue-600 text-[5px] sm:text-[5.5px] leading-tight mt-0.5">
                Dynamic QR pass is also available in your confirmation email for quick gate scanning.
              </div>
            </div>

            {/* Security Seal */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-1 text-center">
              <div className="text-amber-500 text-[6px] leading-none">★ ★ ★</div>
              <div className="text-[6.5px] font-black text-slate-800 leading-tight">EVENTZONE SECURE PASS</div>
              <div className="text-[5.5px] font-mono font-bold text-blue-600">PASS ID: #{badgeCode || "EZ-PASS"}</div>
            </div>

            <div className="text-[5.5px] text-slate-400 font-medium text-center">
              www.eventzone.dz • Eventzone Platform
            </div>
          </div>

        </div>
      )}

      {/* CENTER FOLD / CUT CROSSHAIR GUIDELINES */}
      {showFoldGuide && (
        <>
          {/* Vertical Center Fold Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-dashed border-slate-400/60 pointer-events-none z-20">
            <span className="absolute top-1 -left-14 text-[6px] font-bold text-slate-500 bg-white/90 px-1 rounded shadow-xs whitespace-nowrap">
              ✄ VERTICAL FOLD
            </span>
          </div>
          
          {/* Horizontal Center Fold Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-b-2 border-dashed border-slate-400/60 pointer-events-none z-20">
            <span className="absolute left-2 -top-3 text-[6px] font-bold text-slate-500 bg-white/90 px-1 rounded shadow-xs whitespace-nowrap">
              ✄ HORIZONTAL FOLD
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Standard A4 4-Fold Badge HTML Generator for High-Fidelity Browser Printing
 */
export function renderStandardA4SheetHtml({
  templateUrl = "",
  attendeeName = "Attendee",
  attendeePhoto = "",
  attendeeCompany = "",
  attendeeJobTitle = "",
  ticketType = "Standard Admission",
  badgeCode = "EZ-PASS",
  eventTitle = "Eventzone Conference",
  eventDate = "",
  eventLocation = "",
  resolvedQr = "",
  showPhoto = true,
  showQr = true,
  showFoldGuide = true,
  cardTheme = "white",
}) {
  const isVip = (ticketType || "").toLowerCase().includes("vip");
  const tier = getTierColorTheme(ticketType);
  const initials = (attendeeName || "Attendee")
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dateAndLoc = [eventDate, eventLocation].filter(Boolean).join(" • ") || "Eventzone Official Pass";

  // If custom template is provided, render overlay style
  if (templateUrl) {
    const cardBgStyle = cardTheme === "white"
      ? "background: rgba(255, 255, 255, 0.94); border: 1px solid #e2e8f0; border-radius: 12px; padding: 4.5mm 3.5mm; box-shadow: 0 2px 6px rgba(0,0,0,0.05);"
      : cardTheme === "glass" 
      ? "background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 12px; padding: 4.5mm 3.5mm; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" 
      : "background: transparent; border: none; box-shadow: none; padding: 0;";

    const cardHtml = `
      <div style="${cardBgStyle} display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-sizing: border-box; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${showPhoto ? `
          <div style="width: 64px; height: 64px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(15, 23, 42, 0.15); margin-bottom: 5px; background: #ffffff; display: flex; align-items: center; justify-content: center;">
            ${attendeePhoto 
              ? `<img src="${escapeHtml(attendeePhoto)}" style="width: 100%; height: 100%; object-fit: cover;" />` 
              : `<div style="width: 100%; height: 100%; background: #2563eb; color: #fff; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center;">${initials}</div>`
            }
          </div>
        ` : ''}

        <div style="padding: 1px 0; display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%;">
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; line-height: 1.15; margin-bottom: 2px;">
            ${escapeHtml(attendeeName)}
          </div>
          ${attendeeJobTitle ? `
            <div style="font-size: 9px; color: #475569; font-weight: 600;">
              ${escapeHtml(attendeeJobTitle)}
            </div>
          ` : ''}
          ${attendeeCompany ? `
            <div style="font-size: 10.5px; font-weight: 800; color: #2563eb; margin-top: 1.5mm;">
              ${escapeHtml(attendeeCompany)}
            </div>
          ` : ''}
        </div>

        ${showQr && resolvedQr ? `
          <div style="margin-top: 4.5mm; display: flex; align-items: center; justify-content: center;">
            <img src="${resolvedQr}" style="width: 17mm; height: 17mm; object-fit: contain;" />
          </div>
        ` : ''}
      </div>
    `;

    return `
      <div class="a4-sheet">
        <img src="${escapeHtml(templateUrl)}" style="position: absolute; top: 0; left: 0; width: 210mm; height: 297mm; object-fit: cover; z-index: 1;" />
        <div class="quadrants-grid">
          <div class="quadrant">${cardHtml}</div>
          <div class="quadrant">${cardHtml}</div>
          <div class="quadrant"></div>
          <div class="quadrant"></div>
        </div>
        ${showFoldGuide ? `
          <div class="fold-line-v"></div>
          <div class="fold-line-h"></div>
        ` : ''}
      </div>
    `;
  }

  // STANDARD BADGE TEMPLATE (A4 4-FOLD)
  return `
    <div class="a4-sheet">
      <div class="quadrants-grid">
        
        <!-- QUADRANT 1: FRONT BADGE (Top-Left) -->
        <div class="quadrant">
          <div class="badge-card">
            <!-- Lanyard Slot Guide -->
            <div class="slot-guide" title="Lanyard Punch Slot"><span class="slot-dot"></span></div>

            <!-- Header Banner -->
            <div class="header-banner" style="border-bottom-color: ${tier.accent};">
              <div class="header-tag">EVENTZONE OFFICIAL PASS</div>
              <div class="header-title">${escapeHtml(eventTitle)}</div>
              <div class="header-meta">${escapeHtml(dateAndLoc)}</div>
            </div>

            <!-- Tier Pill -->
            <div class="tier-pill" style="background: ${tier.bg}; border-color: ${tier.border}; color: ${tier.text};">
              ${tier.tag}
            </div>

            <!-- Attendee Photo / Initials -->
            ${showPhoto ? `
              <div class="avatar-circle">
                ${attendeePhoto 
                  ? `<img src="${escapeHtml(attendeePhoto)}" style="width: 100%; height: 100%; object-fit: cover;" />` 
                  : `<div class="avatar-initials">${initials}</div>`
                }
              </div>
            ` : ''}

            <!-- Attendee Name & Role -->
            <div class="attendee-info">
              <div class="attendee-name">${escapeHtml(attendeeName)}</div>
              ${attendeeJobTitle ? `<div class="attendee-title">${escapeHtml(attendeeJobTitle)}</div>` : ''}
              ${attendeeCompany ? `<div class="attendee-company">${escapeHtml(attendeeCompany)}</div>` : ''}
            </div>

            <!-- Scannable QR Pass Container -->
            ${showQr && resolvedQr ? `
              <div class="qr-container">
                <div class="qr-tag">DOOR CHECK-IN PASS</div>
                <img src="${resolvedQr}" class="qr-img" />
                <div class="qr-code">#${escapeHtml(badgeCode)}</div>
                <div class="qr-sub">Scan for fast-track entry</div>
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="card-footer">Eventzone Verified Pass • www.eventzone.dz</div>
          </div>
        </div>

        <!-- QUADRANT 2: BACK BADGE (Top-Right) -->
        <div class="quadrant">
          <div class="badge-card">
            <!-- Slot Guide -->
            <div class="slot-guide"><span class="slot-dot"></span></div>

            <!-- Header Banner -->
            <div class="header-banner" style="border-bottom-color: ${tier.accent};">
              <div class="header-tag">FAST-TRACK LANYARD BACK PASS</div>
              <div class="header-title">${escapeHtml(eventTitle)}</div>
              <div class="header-meta">${escapeHtml(dateAndLoc)}</div>
            </div>

            <!-- Tier Pill -->
            <div class="tier-pill" style="background: ${tier.bg}; border-color: ${tier.border}; color: ${tier.text};">
              ${tier.tag}
            </div>

            <!-- Attendee Name & Company -->
            <div class="attendee-info" style="margin-top: 1mm;">
              <div class="attendee-name" style="font-size: 13.5px;">${escapeHtml(attendeeName)}</div>
              ${attendeeCompany ? `<div class="attendee-company">${escapeHtml(attendeeCompany)}</div>` : ''}
            </div>

            <!-- Large Reverse Scannable QR Container -->
            ${showQr && resolvedQr ? `
              <div class="qr-container" style="width: 86%; padding: 2mm 3mm;">
                <div class="qr-tag" style="color: #2563eb;">REVERSE ACCESS PASS</div>
                <img src="${resolvedQr}" class="qr-img-large" />
                <div class="qr-code">#${escapeHtml(badgeCode)}</div>
                <div class="qr-sub">Scannable at all venue sessions & gates</div>
              </div>
            ` : ''}

            <!-- Venue Guidelines Box -->
            <div class="venue-rules-box">
              <div>• Wear badge visibly at all conference premises & halls.</div>
              <div>• Non-transferable credential tied to registered attendee ID.</div>
              <div>• Inquiries & lost badges: visit the Eventzone Desk.</div>
            </div>

            <!-- Footer -->
            <div class="card-footer">Powered by Eventzone Platform • Official Credential</div>
          </div>
        </div>

        <!-- QUADRANT 3: INSIDE PANEL 1 (Bottom-Left) -->
        <div class="quadrant">
          <div class="badge-card">
            <!-- Header -->
            <div class="panel-header indigo-panel">
              <div class="panel-title">EVENT INFORMATION & VENUE ACCESS GUIDE</div>
            </div>

            <!-- Summary Table -->
            <div class="summary-table">
              <div class="table-row"><span class="row-label">Event:</span><span class="row-val">${escapeHtml(eventTitle)}</span></div>
              <div class="table-row"><span class="row-label">Attendee:</span><span class="row-val">${escapeHtml(attendeeName)}</span></div>
              <div class="table-row"><span class="row-label">Access Tier:</span><span class="row-val">${escapeHtml(ticketType)}</span></div>
              <div class="table-row"><span class="row-label">Pass Code:</span><span class="row-val mono">#${escapeHtml(badgeCode)}</span></div>
              <div class="table-row"><span class="row-label">Date & Schedule:</span><span class="row-val">${escapeHtml(eventDate || "See published agenda")}</span></div>
              <div class="table-row"><span class="row-label">Venue Location:</span><span class="row-val">${escapeHtml(eventLocation || "Main Conference Center")}</span></div>
            </div>

            <!-- Venue Guidelines -->
            <div class="panel-section-title">VENUE ACCESS GUIDELINES & PROTOCOLS</div>
            <div class="guidelines-list">
              <div class="guide-item"><span class="guide-num">1</span><div><strong>Credential Security:</strong> This badge is personal, non-transferable, and required for venue entry.</div></div>
              <div class="guide-item"><span class="guide-num">2</span><div><strong>Session Admission:</strong> Workshop & keynote access is subject to tier rights and room capacities.</div></div>
              <div class="guide-item"><span class="guide-num">3</span><div><strong>Fast-Track Scanning:</strong> Scan your QR pass at doors, exhibition halls, and catering terminals.</div></div>
              <div class="guide-item"><span class="guide-num">4</span><div><strong>Assistance & Support:</strong> Report lost credentials immediately to the Eventzone Information Desk.</div></div>
            </div>

            <div class="panel-footer-seal">OFFICIAL EVENTZONE CREDENTIAL • DIGITALLY VERIFIED</div>
          </div>
        </div>

        <!-- QUADRANT 4: INSIDE PANEL 2 (Bottom-Right) -->
        <div class="quadrant">
          <div class="badge-card">
            <!-- Header -->
            <div class="panel-header emerald-panel">
              <div class="panel-title">BADGE FOLDING GUIDE & DIGITAL PASS</div>
            </div>

            <!-- 3-Step Folding Instructions -->
            <div class="folding-steps">
              <div class="step-item">
                <span class="step-pill step-blue">1</span>
                <div class="step-content">
                  <div class="step-title">HORIZONTAL FOLD</div>
                  <div class="step-desc">Fold the lower half of this A4 sheet backwards along the horizontal center dashed guideline.</div>
                </div>
              </div>
              <div class="step-item">
                <span class="step-pill step-indigo">2</span>
                <div class="step-content">
                  <div class="step-title">VERTICAL FOLD</div>
                  <div class="step-desc">Fold the sheet along the vertical center dashed guideline so Front and Back badges face outwards.</div>
                </div>
              </div>
              <div class="step-item">
                <span class="step-pill step-emerald">3</span>
                <div class="step-content">
                  <div class="step-title">INSERT INTO LANYARD POUCH</div>
                  <div class="step-desc">Slide the folded 4-ply badge into your standard 105 × 148 mm (A6) lanyard sleeve or clip the top punch slot.</div>
                </div>
              </div>
            </div>

            <!-- Digital Pass Notice -->
            <div class="mobile-pass-box">
              <div class="mobile-pass-title">MOBILE DIGITAL PASS READY</div>
              <div class="mobile-pass-desc">A dynamic scannable QR pass is also available on your smartphone via your registration confirmation email. Keep it offline for instant door check-in.</div>
            </div>

            <!-- Verification Seal -->
            <div class="security-seal-box">
              <div class="stars">★ ★ ★</div>
              <div class="seal-title">OFFICIAL EVENTZONE CREDENTIAL</div>
              <div class="seal-sub">Digitally authenticated and synced with live door scanners</div>
              <div class="seal-code">PASS ID: #${escapeHtml(badgeCode)}</div>
            </div>

            <div class="card-footer">www.eventzone.dz • Eventzone Platform</div>
          </div>
        </div>

      </div>

      ${showFoldGuide ? `
        <div class="fold-line-v"><span class="fold-guide-label v-label">✄ VERTICAL CENTER FOLD (OUTWARDS)</span></div>
        <div class="fold-line-h"><span class="fold-guide-label h-label">✄ HORIZONTAL CENTER FOLD (BACKWARDS)</span></div>
      ` : ''}
    </div>
  `;
}

const COMMON_PRINT_CSS = `
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
    background: #ffffff;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .a4-sheet {
    page-break-after: always;
    break-after: page;
    position: relative;
    width: 210mm;
    height: 297mm;
    background: #ffffff;
    overflow: hidden;
  }
  .a4-sheet:last-child {
    page-break-after: auto;
    break-after: auto;
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
    padding: 4mm;
    box-sizing: border-box;
  }
  .badge-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    width: 95mm;
    height: 139mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 2.5mm 3.5mm;
    position: relative;
    overflow: hidden;
  }
  .slot-guide {
    width: 14mm;
    height: 2.8mm;
    border: 1px dashed #94a3b8;
    border-radius: 4px;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .slot-dot {
    width: 1.5mm;
    height: 1.5mm;
    border-radius: 50%;
    background: #cbd5e1;
  }
  .header-banner {
    width: 100%;
    background: #0f172a;
    border-radius: 6px;
    padding: 2.2mm 2mm 1.8mm 2mm;
    text-align: center;
    border-bottom: 2.5px solid #2563eb;
  }
  .header-tag {
    font-size: 6px;
    font-weight: 800;
    color: #93c5fd;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .header-title {
    font-size: 10.5px;
    font-weight: 900;
    color: #ffffff;
    line-height: 1.2;
    max-height: 26px;
    overflow: hidden;
    margin-top: 0.5mm;
  }
  .header-meta {
    font-size: 6.8px;
    color: #cbd5e1;
    margin-top: 0.8mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tier-pill {
    margin-top: 1.5mm;
    font-size: 7.5px;
    font-weight: 800;
    padding: 1.2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    display: inline-block;
  }
  .avatar-circle {
    width: 16mm;
    height: 16mm;
    border-radius: 50%;
    overflow: hidden;
    border: 1.5px solid #cbd5e1;
    margin-top: 1.5mm;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    flex-shrink: 0;
  }
  .avatar-initials {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: #ffffff;
    font-weight: 900;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .attendee-info {
    text-align: center;
    width: 100%;
    margin-top: 1mm;
  }
  .attendee-name {
    font-size: 13px;
    font-weight: 900;
    color: #0f172a;
    line-height: 1.15;
    word-break: break-word;
  }
  .attendee-title {
    font-size: 7.5px;
    color: #475569;
    font-weight: 600;
    margin-top: 0.6mm;
  }
  .attendee-company {
    font-size: 8.5px;
    color: #2563eb;
    font-weight: 800;
    margin-top: 0.6mm;
  }
  .qr-container {
    margin-top: 1mm;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 1.5mm 3mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 82%;
    box-sizing: border-box;
  }
  .qr-tag {
    font-size: 5.5px;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .qr-img {
    width: 18mm;
    height: 18mm;
    object-fit: contain;
    margin: 0.8mm 0;
  }
  .qr-img-large {
    width: 25mm;
    height: 25mm;
    object-fit: contain;
    margin: 0.8mm 0;
  }
  .qr-code {
    font-size: 8px;
    font-weight: 800;
    color: #0f172a;
    font-family: monospace;
  }
  .qr-sub {
    font-size: 5.5px;
    color: #94a3b8;
    margin-top: 0.5mm;
  }
  .card-footer {
    font-size: 5.5px;
    color: #94a3b8;
    text-align: center;
    margin-top: 0.5mm;
  }
  .venue-rules-box {
    width: 90%;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 1.5mm 2mm;
    font-size: 6px;
    color: #475569;
    text-align: left;
    line-height: 1.4;
    margin-top: 1mm;
  }
  .panel-header {
    width: 100%;
    background: #1e293b;
    border-radius: 5px;
    padding: 2mm;
    text-align: center;
  }
  .indigo-panel { border-bottom: 2.5px solid #4f46e5; }
  .emerald-panel { border-bottom: 2.5px solid #059669; }
  .panel-title {
    font-size: 7.5px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.3px;
  }
  .summary-table {
    width: 100%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 1.5mm 2mm;
    margin-top: 1.5mm;
    font-size: 6.5px;
  }
  .table-row {
    display: flex;
    justify-content: space-between;
    padding: 0.8mm 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .table-row:last-child { border-bottom: none; }
  .row-label { color: #64748b; font-weight: 500; width: 32%; }
  .row-val { color: #0f172a; font-weight: 800; width: 68%; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row-val.mono { font-family: monospace; color: #2563eb; }
  .panel-section-title {
    font-size: 7px;
    font-weight: 800;
    color: #0f172a;
    width: 100%;
    text-align: left;
    margin-top: 1.5mm;
  }
  .guidelines-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.2mm;
    margin-top: 1mm;
  }
  .guide-item {
    display: flex;
    align-items: flex-start;
    gap: 1.5mm;
    font-size: 6.2px;
    color: #475569;
    line-height: 1.35;
  }
  .guide-num {
    width: 3.5mm;
    height: 3.5mm;
    border-radius: 50%;
    background: #e0e7ff;
    color: #4338ca;
    font-weight: 800;
    font-size: 5.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 0.3mm;
  }
  .panel-footer-seal {
    width: 100%;
    background: #f1f5f9;
    border-radius: 4px;
    padding: 1.2mm;
    font-size: 6px;
    font-weight: 800;
    color: #64748b;
    text-align: center;
    letter-spacing: 0.2px;
  }
  .folding-steps {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.8mm;
    margin-top: 1.5mm;
  }
  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 2mm;
  }
  .step-pill {
    width: 4.5mm;
    height: 4.5mm;
    border-radius: 3px;
    color: #ffffff;
    font-weight: 900;
    font-size: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 0.3mm;
  }
  .step-blue { background: #2563eb; }
  .step-indigo { background: #4f46e5; }
  .step-emerald { background: #059669; }
  .step-content { text-align: left; }
  .step-title { font-size: 7px; font-weight: 800; color: #0f172a; line-height: 1.1; }
  .step-desc { font-size: 6.2px; color: #475569; line-height: 1.35; margin-top: 0.3mm; }
  .mobile-pass-box {
    width: 100%;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 5px;
    padding: 1.5mm 2mm;
    text-align: left;
    margin-top: 1.5mm;
  }
  .mobile-pass-title { font-size: 7px; font-weight: 800; color: #1d4ed8; }
  .mobile-pass-desc { font-size: 6px; color: #3b82f6; line-height: 1.35; margin-top: 0.5mm; }
  .security-seal-box {
    width: 100%;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 1.5mm;
    text-align: center;
    margin-top: 1.5mm;
  }
  .stars { font-size: 7px; color: #f59e0b; line-height: 1; }
  .seal-title { font-size: 7px; font-weight: 800; color: #0f172a; margin-top: 0.5mm; }
  .seal-sub { font-size: 5.8px; color: #64748b; margin-top: 0.3mm; }
  .seal-code { font-size: 7px; font-weight: 800; color: #2563eb; font-family: monospace; margin-top: 0.5mm; }
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
  .fold-guide-label {
    position: absolute;
    font-size: 5.5px;
    font-weight: 800;
    color: #94a3b8;
    background: #ffffff;
    padding: 1px 3px;
    white-space: nowrap;
    border-radius: 2px;
  }
  .v-label {
    top: 3mm;
    left: 1.5mm;
  }
  .h-label {
    left: 4mm;
    top: -2.5mm;
  }
`;

/**
 * Single A4 Badge Document Print Helper
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
  eventTitle = "Conference Event",
  eventDate = "",
  eventLocation = "",
  qrCodeUrl = "",
  showFoldGuide = true,
  showPhoto = true,
  showQr = true,
  cardTheme = "white",
}) {
  if (typeof window === "undefined") return;

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

  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) {
    alert("Please allow popups to print the A4 badge sheet.");
    return;
  }

  const sheetHtml = renderStandardA4SheetHtml({
    templateUrl,
    attendeeName,
    attendeePhoto,
    attendeeCompany,
    attendeeJobTitle,
    ticketType,
    badgeCode,
    eventTitle,
    eventDate,
    eventLocation,
    resolvedQr,
    showPhoto,
    showQr,
    showFoldGuide,
    cardTheme,
  });

  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>A4 Badge Sheet - ${escapeHtml(attendeeName)}</title>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          ${COMMON_PRINT_CSS}
        </style>
      </head>
      <body>
        ${sheetHtml}
        <script>
          function triggerDocumentPrint() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 350);
          }
          const images = Array.from(document.images);
          if (images.length === 0) {
            window.onload = triggerDocumentPrint;
          } else {
            let loaded = 0;
            const onImgReady = () => {
              loaded++;
              if (loaded >= images.length) {
                triggerDocumentPrint();
              }
            };
            images.forEach(function(img) {
              if (img.complete) {
                onImgReady();
              } else {
                img.addEventListener('load', onImgReady);
                img.addEventListener('error', onImgReady);
              }
            });
            setTimeout(triggerDocumentPrint, 3000);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}

/**
 * Bulk A4 Badge Print Helper
 * Generates multi-page printable sheets with page breaks for all selected attendees
 */
export async function printBulkA4BadgeDocuments(badgeList = []) {
  if (typeof window === "undefined" || !badgeList.length) return;

  const resolvedBadges = await Promise.all(
    badgeList.map(async (b) => {
      let resolvedQr = b.qrCodeUrl;
      if (!resolvedQr && b.showQr !== false) {
        try {
          const checkinPayload = JSON.stringify({
            action: "checkin",
            attendeeId: b.attendeeId || b.badgeCode || "",
            badgeCode: b.badgeCode || "EZ-PASS",
            name: b.attendeeName || "",
            email: b.attendeeEmail || "",
            tier: b.ticketType || "",
            eventId: b.eventId || "",
            event: b.eventTitle || ""
          });
          resolvedQr = await QRCode.toDataURL(checkinPayload, {
            width: 360,
            margin: 0,
            color: { dark: "#0f172a", light: "#00000000" },
            errorCorrectionLevel: 'M'
          });
        } catch (e) {
          console.warn("QR code generation failed for bulk:", e);
        }
      }
      return { ...b, resolvedQr };
    })
  );

  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) {
    alert("Please allow popups to print the A4 badge sheets.");
    return;
  }

  const sheetsHtml = resolvedBadges
    .map((b) => renderStandardA4SheetHtml(b))
    .join("\n");

  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bulk A4 Badge Sheets (${badgeList.length} Attendees)</title>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          ${COMMON_PRINT_CSS}
        </style>
      </head>
      <body>
        ${sheetsHtml}
        <script>
          function triggerBulkPrint() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 450);
          }
          const images = Array.from(document.images);
          if (images.length === 0) {
            window.onload = triggerBulkPrint;
          } else {
            let loaded = 0;
            const onImgReady = () => {
              loaded++;
              if (loaded >= images.length) {
                triggerBulkPrint();
              }
            };
            images.forEach(function(img) {
              if (img.complete) {
                onImgReady();
              } else {
                img.addEventListener('load', onImgReady);
                img.addEventListener('error', onImgReady);
              }
            });
            setTimeout(triggerBulkPrint, 4000);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}
