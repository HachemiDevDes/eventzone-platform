/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect } from "react";
import { Award, CheckCircle2, ShieldCheck, Sparkles, Star, Medal } from "lucide-react";
import { interpolateCertificateText, formatCertificateBodyHtml, CALLIGRAPHY_SIGNATURES } from "../lib/certificatePresets";

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
 * Calculates adaptive font size & styles for recipient name based on character length
 */
function getAdaptiveRecipientStyles(name = "") {
  const len = (name || "").length;
  if (len <= 16) {
    return {
      className: "text-lg sm:text-2xl md:text-3xl lg:text-4xl",
      printFontSize: "26pt",
      letterSpacing: "-0.01em",
    };
  }
  if (len <= 26) {
    return {
      className: "text-base sm:text-xl md:text-2xl lg:text-3xl",
      printFontSize: "21pt",
      letterSpacing: "-0.015em",
    };
  }
  if (len <= 38) {
    return {
      className: "text-sm sm:text-base md:text-lg lg:text-xl",
      printFontSize: "16pt",
      letterSpacing: "-0.02em",
    };
  }
  if (len <= 52) {
    return {
      className: "text-xs sm:text-sm md:text-base lg:text-lg",
      printFontSize: "13pt",
      letterSpacing: "-0.02em",
    };
  }
  return {
    className: "text-[11px] sm:text-xs md:text-sm lg:text-base",
    printFontSize: "10.5pt",
    letterSpacing: "-0.025em",
  };
}

/**
 * Calculates adaptive font size for certificate title based on character length
 */
function getAdaptiveTitleStyles(title = "") {
  const len = (title || "").length;
  if (len <= 24) {
    return {
      className: "text-base sm:text-xl md:text-2xl lg:text-3xl",
      printFontSize: "24pt",
    };
  }
  if (len <= 38) {
    return {
      className: "text-sm sm:text-lg md:text-xl lg:text-2xl",
      printFontSize: "19pt",
    };
  }
  return {
    className: "text-xs sm:text-base md:text-lg lg:text-xl",
    printFontSize: "15pt",
  };
}

/**
 * Calculates adaptive font size for body paragraph text based on character length
 */
function getAdaptiveBodyStyles(body = "") {
  const len = (body || "").length;
  if (len <= 140) {
    return {
      className: "text-[8.5px] sm:text-[10px] md:text-[11.5px] leading-relaxed",
      printFontSize: "10.5pt",
    };
  }
  if (len <= 220) {
    return {
      className: "text-[7.5px] sm:text-[9px] md:text-[10px] leading-snug",
      printFontSize: "9.5pt",
    };
  }
  return {
    className: "text-[6.5px] sm:text-[8px] md:text-[9px] leading-tight",
    printFontSize: "8.5pt",
  };
}

function resolveFontFamilyString(fontKey) {
  switch (fontKey) {
    case "cinzel": return "'Cinzel', serif";
    case "cinzel-decorative": return "'Cinzel Decorative', serif";
    case "playfair": return "'Playfair Display', Georgia, serif";
    case "cormorant": return "'Cormorant Garamond', Garamond, serif";
    case "eb-garamond": return "'EB Garamond', Garamond, serif";
    case "libre-baskerville": return "'Libre Baskerville', Georgia, serif";
    case "lora": return "'Lora', serif";
    case "merriweather": return "'Merriweather', serif";
    case "bodoni": return "'Bodoni Moda', serif";
    case "marcellus": return "'Marcellus', serif";
    case "prata": return "'Prata', serif";
    case "montserrat": return "'Montserrat', sans-serif";
    case "sans": return "'Plus Jakarta Sans', sans-serif";
    case "poppins": return "'Poppins', sans-serif";
    case "inter": return "'Inter', sans-serif";
    case "outfit": return "'Outfit', sans-serif";
    case "raleway": return "'Raleway', sans-serif";
    case "oswald": return "'Oswald', sans-serif";
    case "space-grotesk": return "'Space Grotesk', sans-serif";
    case "cursive": return "'Great Vibes', cursive";
    case "alex-brush": return "'Alex Brush', cursive";
    case "pinyon": return "'Pinyon Script', cursive";
    case "dancing": return "'Dancing Script', cursive";
    case "parisienne": return "'Parisienne', cursive";
    case "satisfy": return "'Satisfy', cursive";
    case "mono": return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    default: return fontKey ? `'${fontKey}', sans-serif` : undefined;
  }
}

/**
 * A4CertificateSheet
 * Renders an official horizontal A4 certificate (297 x 210 mm | 1.414:1 aspect ratio)
 * with 17 distinct vector SVG geometric architectures, dynamic auto-fitting text scaling,
 * custom artwork opacity controls, digital calligraphy signatures, and high-precision browser print / PDF export.
 */
export default function A4CertificateSheet({
  id = "printable-a4-certificate",
  template = {},
  recipient = {},
  eventDetails = {},
  className = "",
  isPrintTarget = false,
  interactive = false,
}) {
  // Dynamically inject Google Fonts if not already in document head
  useEffect(() => {
    const fontId = "eventzone-certificate-google-fonts";
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Dancing+Script:wght@600;700&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Great+Vibes&family=Inter:wght@400;500;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Marcellus&family=Marck+Script&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Monsieur+La+Doulaise&family=Montserrat:ital,wght@0,400..900;1,400..900&family=Outfit:wght@400;500;600;700;800&family=Oswald:wght@400;600;700&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Prata&family=Raleway:ital,wght@0,400..800;1,400..800&family=Sacramento&family=Satisfy&family=Space+Grotesk:wght@400;600;700&family=Tangerine:wght@700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const name = recipient.name || recipient.fullName || "Jane Doe";
  const role = recipient.role || recipient.ticketType || template.targetRole || "Delegate";
  const company = recipient.company || recipient.organization || recipient.companyName || "";
  const jobTitle = recipient.jobTitle || recipient.title || recipient.position || "";
  const certId = recipient.certificateId || recipient.certId || `${template.certificateIdPrefix || "EZ-CERT-2026"}-${(recipient.id || "001").toString().slice(-4).toUpperCase()}`;
  
  const eventTitle = eventDetails.title || eventDetails.name || "Eventzone Global Summit 2026";
  const eventLocation = eventDetails.location || eventDetails.venue_name || `${eventDetails.city || "Algiers"}, ${eventDetails.country || "Algeria"}`;
  const eventDate = eventDetails.date_range_formatted || (eventDetails.start_date ? new Date(eventDetails.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "October 14–16, 2026");
  const issueDate = recipient.issueDate || template.issueDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const organizerName = eventDetails.organizer_name || eventDetails.organizer || "Eventzone Organizing Committee";

  const contextData = {
    name,
    role,
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
    issueDate,
    certificateId: certId,
    certId,
    certificate_id: certId,
    organizerName,
    customNotes: template.customNotes || "",
  };

  const titleText = interpolateCertificateText(template.certificateTitle || "CERTIFICATE OF ATTENDANCE", contextData);
  const subtitleText = interpolateCertificateText(template.subtitleText || "THIS IS PROUDLY PRESENTED TO", contextData);
  const recipientSubtext = interpolateCertificateText(template.recipientSubtext || "{{job_title}} • {{organization}}", contextData).replace(/^[•\s—-]+|[•\s—-]+$/g, "");
  const bodyHtml = formatCertificateBodyHtml(template.bodyText || "For distinguished and active participation in the **{{event_name}}**.", contextData);

  const accentColor = template.accentColor || "#D4AF37";
  const secondaryColor = template.secondaryColor || "#1E293B";
  const borderStyle = template.borderStyle || "symmetric-diamond-navy-gold";
  const bgStyle = template.bgStyle || "white";
  const isDark = bgStyle === "dark" || borderStyle === "dark-obsidian-luxe";
  const customBgUrl = template.customBgUrl || "";
  const customBgOpacity = template.customBgOpacity !== undefined ? template.customBgOpacity : 1;

  const adaptiveRecipient = getAdaptiveRecipientStyles(name);
  const adaptiveTitle = getAdaptiveTitleStyles(titleText);
  const adaptiveBody = getAdaptiveBodyStyles(template.bodyText);

  // Determine Base Background CSS
  const getBackgroundStyle = () => {
    if (isDark) {
      return { background: "radial-gradient(ellipse at center, #0F172A 0%, #080D1A 100%)", color: "#F8FAFC" };
    }
    if (bgStyle === "ivory") {
      return { background: "radial-gradient(ellipse at center, #FFFFFF 0%, #FAF8F2 60%, #F4EFE6 100%)" };
    }
    if (bgStyle === "gradient") {
      return { background: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, #E2E8F0 100%)" };
    }
    return { background: "#FFFFFF" };
  };

  // Determine Fonts based on individual template overrides or pairing
  const getFontFamily = (element = "title") => {
    const customFont = template[`${element}FontFamily`];
    if (customFont) {
      const resolved = resolveFontFamilyString(customFont);
      if (resolved) return resolved;
    }

    const pairing = template.fontPairing || "cinzel-sans";
    if (element === "title" || element === "recipient") {
      if (pairing === "playfair-inter") return "'Playfair Display', Georgia, serif";
      if (pairing === "montserrat-sans") return "'Montserrat', 'Plus Jakarta Sans', sans-serif";
      if (pairing === "cormorant-serif") return "'Cormorant Garamond', Garamond, serif";
      return "'Cinzel', 'Times New Roman', serif";
    }
    return "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
  };

  const getFontWeight = (element = "title") => {
    const customWeight = template[`${element}FontWeight`];
    if (customWeight) {
      if (customWeight === "normal") return "400";
      if (customWeight === "medium") return "500";
      if (customWeight === "semibold") return "600";
      if (customWeight === "bold") return "700";
      if (customWeight === "extrabold") return "800";
      if (customWeight === "black") return "900";
      return customWeight;
    }
    if (element === "title") return "900";
    if (element === "recipient") return "800";
    if (element === "subtitle") return "700";
    if (element === "body") return "400";
    return "normal";
  };

  const getFontStyle = (element = "title") => {
    return template[`${element}Italic`] ? "italic" : "normal";
  };

  const getLetterSpacing = (element = "title") => {
    const raw = template[`${element}LetterSpacing`];
    if (raw === undefined || raw === null || raw === "" || raw === "normal") {
      if (element === "title") return "2px";
      if (element === "subtitle") return "3px";
      return "0px";
    }
    if (raw === "wide") return "3px";
    if (raw === "widest") return "6px";
    if (typeof raw === "number") return `${raw}px`;
    if (typeof raw === "string" && !isNaN(parseFloat(raw)) && !raw.includes("px") && !raw.includes("em")) return `${raw}px`;
    return raw;
  };

  return (
    <div
      id={id || "printable-a4-certificate"}
      data-cert-sheet="true"
      className={`relative w-full aspect-[297/210] overflow-hidden select-none shadow-2xl transition-all ${className}`}
      style={{
        ...getBackgroundStyle(),
        color: isDark ? "#F8FAFC" : "#0F172A",
        fontFamily: getFontFamily("body"),
      }}
    >
      {/* ── CUSTOM ARTWORK BACKGROUND LAYER (WITH OPACITY) ── */}
      {customBgUrl && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity"
          style={{
            backgroundImage: `url(${customBgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: customBgOpacity,
          }}
        />
      )}

      {/* ── 1. MODERN GEOMETRIC NAVY & GOLD (POLYGON FACETS) ── */}
      {borderStyle === "modern-geometric-navy-gold" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <polygon points="0,0 280,0 0,280" fill={secondaryColor} />
          <polygon points="0,0 240,0 0,240" fill={accentColor} opacity="0.9" />
          <polygon points="0,0 180,0 0,180" fill={secondaryColor} />
          <polygon points="0,0 110,0 0,110" fill={accentColor} />
          <polygon points="1000,707 720,707 1000,427" fill={secondaryColor} />
          <polygon points="1000,707 760,707 1000,467" fill={accentColor} opacity="0.9" />
          <polygon points="1000,707 820,707 1000,527" fill={secondaryColor} />
          <polygon points="1000,707 890,707 1000,597" fill={accentColor} />
          <rect x="35" y="35" width="930" height="637" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.4" />
        </svg>
      )}

      {/* ── 7. FLUID LUXE WAVES & GOLD RIBBON ── */}
      {borderStyle === "fluid-wave-teal-gold" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <path d="M0,0 L360,0 C280,140 140,200 0,260 Z" fill={secondaryColor} />
          <path d="M0,0 L300,0 C220,120 110,160 0,200 Z" fill={accentColor} opacity="0.85" />
          <path d="M1000,707 L640,707 C720,567 860,507 1000,447 Z" fill={secondaryColor} />
          <path d="M1000,707 L700,707 C780,587 890,547 1000,507 Z" fill={accentColor} opacity="0.85" />
          <path d="M1000,0 L880,0 C940,60 980,100 1000,140 Z" fill={accentColor} opacity="0.4" />
          <path d="M0,707 L120,707 C60,647 20,607 0,567 Z" fill={accentColor} opacity="0.4" />
          <rect x="30" y="30" width="940" height="647" rx="8" fill="none" stroke={secondaryColor} strokeWidth="1" opacity="0.25" />
        </svg>
      )}

      {/* ── 8. EXECUTIVE CRIMSON & CHARCOAL DIAGONAL ── */}
      {borderStyle === "corporate-diagonal-red-gold" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <polygon points="0,0 340,0 0,220" fill={secondaryColor} />
          <line x1="348" y1="0" x2="0" y2="228" stroke={accentColor} strokeWidth="5" />
          <polygon points="1000,707 660,707 1000,487" fill="#1E293B" />
          <line x1="652" y1="707" x2="1000" y2="479" stroke={accentColor} strokeWidth="5" />
          <rect x="36" y="36" width="928" height="635" fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
        </svg>
      )}

      {/* ── 9. MIDNIGHT OBSIDIAN & GOLD CREST (DARK MODE) ── */}
      {borderStyle === "dark-obsidian-luxe" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <rect x="30" y="30" width="940" height="647" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.8" />
          <rect x="42" y="42" width="916" height="623" fill="none" stroke={accentColor} strokeWidth="1" strokeDasharray="6,6" opacity="0.5" />
          <polygon points="30,30 80,30 30,80" fill={accentColor} />
          <polygon points="970,30 920,30 970,80" fill={accentColor} />
          <polygon points="30,677 80,677 30,627" fill={accentColor} />
          <polygon points="970,677 920,677 970,627" fill={accentColor} />
        </svg>
      )}

      {/* ── 10. ASYMMETRIC ROYAL BLUE MODERN PILLAR ── */}
      {borderStyle === "asymmetric-royal-blue" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <polygon points="0,0 120,0 70,707 0,707" fill={secondaryColor} />
          <polygon points="120,0 140,0 90,707 70,707" fill={accentColor} />
          <polygon points="0,0 70,0 0,220" fill="#1E40AF" />
          <polygon points="1000,0 930,0 1000,90" fill={secondaryColor} />
          <polygon points="1000,707 920,707 1000,580" fill={accentColor} />
          <rect x="40" y="35" width="920" height="637" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
        </svg>
      )}

      {/* ── 11. BOTANICAL EMERALD & GOLD LAUREL ── */}
      {borderStyle === "emerald-botanical-crest" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <polygon points="0,0 240,0 0,240" fill={secondaryColor} />
          <line x1="248" y1="0" x2="0" y2="248" stroke={accentColor} strokeWidth="4" />
          <polygon points="1000,707 760,707 1000,467" fill={secondaryColor} />
          <line x1="752" y1="707" x2="1000" y2="459" stroke={accentColor} strokeWidth="4" />
          <rect x="36" y="36" width="928" height="635" rx="16" fill="none" stroke={secondaryColor} strokeWidth="1.5" opacity="0.4" />
        </svg>
      )}

      {/* ── 12. CREATIVE TECH VANGUARD WAVE (GRADIENT) ── */}
      {borderStyle === "creative-coral-violet" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <defs>
            <linearGradient id="vanguardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
          </defs>
          <path d="M0,0 L320,0 C250,140 140,220 0,260 Z" fill="url(#vanguardGrad)" opacity="0.95" />
          <path d="M1000,707 L680,707 C750,567 860,487 1000,447 Z" fill="url(#vanguardGrad)" opacity="0.95" />
          <path d="M1000,0 L860,0 C920,70 970,110 1000,150 Z" fill="#F43F5E" opacity="0.5" />
          <path d="M0,707 L140,707 C80,637 30,597 0,557 Z" fill="#7C3AED" opacity="0.5" />
          <rect x="30" y="30" width="940" height="647" rx="12" fill="none" stroke="#7C3AED" strokeWidth="1.5" opacity="0.3" />
        </svg>
      )}

      {/* ── 13. CLASSIC REGAL DOUBLE GOLD FRAME & ROSETTES ── */}
      {borderStyle === "classic-gold" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <rect x="30" y="30" width="940" height="647" rx="4" fill="none" stroke={accentColor} strokeWidth="3" />
          <rect x="38" y="38" width="924" height="631" rx="2" fill="none" stroke={accentColor} strokeWidth="1" strokeDasharray="4,4" opacity="0.8" />
          <g transform="translate(30, 30)" fill={accentColor}><polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" /><circle r="3" fill="#FFF" /></g>
          <g transform="translate(970, 30)" fill={accentColor}><polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" /><circle r="3" fill="#FFF" /></g>
          <g transform="translate(30, 677)" fill={accentColor}><polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" /><circle r="3" fill="#FFF" /></g>
          <g transform="translate(970, 677)" fill={accentColor}><polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" /><circle r="3" fill="#FFF" /></g>
        </svg>
      )}

      {/* ── 14. 1920s GATSBY ART DECO STEPPED ANGLES ── */}
      {borderStyle === "art-deco" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <rect x="30" y="30" width="940" height="647" fill="none" stroke={accentColor} strokeWidth="3" />
          <rect x="42" y="42" width="916" height="623" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.6" />
          <polygon points="30,30 90,30 90,42 42,42 42,90 30,90" fill={accentColor} />
          <polygon points="970,30 910,30 910,42 958,42 958,90 970,90" fill={accentColor} />
          <polygon points="30,677 90,677 90,665 42,665 42,617 30,617" fill={accentColor} />
          <polygon points="970,677 910,677 910,665 958,665 958,617 970,617" fill={accentColor} />
        </svg>
      )}

      {/* ── 15. CORPORATE EXECUTIVE NAVY HEADER & FOOTER BANDS ── */}
      {borderStyle === "corporate-navy" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <rect x="0" y="0" width="1000" height="26" fill={secondaryColor} />
          <rect x="0" y="26" width="1000" height="6" fill={accentColor} />
          <rect x="0" y="681" width="1000" height="26" fill={secondaryColor} />
          <rect x="0" y="675" width="1000" height="6" fill={accentColor} />
          <rect x="35" y="45" width="930" height="617" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
        </svg>
      )}

      {/* ── 16. VINTAGE BAROQUE HERITAGE ENGRAVED FRAME ── */}
      {borderStyle === "vintage-filigree" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <rect x="30" y="30" width="940" height="647" fill="none" stroke={accentColor} strokeWidth="4" />
          <rect x="38" y="38" width="924" height="631" fill="none" stroke={accentColor} strokeWidth="1.5" />
          <rect x="44" y="44" width="912" height="619" fill="none" stroke="#78350F" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
          <g transform="translate(30, 30)" fill={accentColor}><circle r="10" /><path d="M-10,-10 L10,10 M-10,10 L10,-10" stroke={accentColor} strokeWidth="2" /></g>
          <g transform="translate(970, 30)" fill={accentColor}><circle r="10" /><path d="M-10,-10 L10,10 M-10,10 L10,-10" stroke={accentColor} strokeWidth="2" /></g>
          <g transform="translate(30, 677)" fill={accentColor}><circle r="10" /><path d="M-10,-10 L10,10 M-10,10 L10,-10" stroke={accentColor} strokeWidth="2" /></g>
          <g transform="translate(970, 677)" fill={accentColor}><circle r="10" /><path d="M-10,-10 L10,10 M-10,10 L10,-10" stroke={accentColor} strokeWidth="2" /></g>
        </svg>
      )}

      {/* ── 17. SWISS MINIMALIST PRECISION GRID & CROSSHAIRS ── */}
      {borderStyle === "nordic-clean" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 707" preserveAspectRatio="none">
          <rect x="35" y="35" width="930" height="637" fill="none" stroke="#94A3B8" strokeWidth="1" />
          <path d="M20,35 L50,35 M35,20 L35,50" stroke="#0F172A" strokeWidth="2" />
          <path d="M950,35 L980,35 M965,20 L965,50" stroke="#0F172A" strokeWidth="2" />
          <path d="M20,672 L50,672 M35,657 L35,687" stroke="#0F172A" strokeWidth="2" />
          <path d="M950,672 L980,672 M965,657 L965,687" stroke="#0F172A" strokeWidth="2" />
        </svg>
      )}

      {/* ── MAIN CONTENT CONTAINER (A4 Landscape Relative Layer) ── */}
      <div className={`relative z-20 w-full h-full text-center box-border ${borderStyle === "asymmetric-royal-blue" ? "pl-20 sm:pl-24 md:pl-32" : ""}`}>
        
        {/* Logo (if uploaded) */}
        {eventDetails.logo_url && (
          <div
            className="absolute z-20 pointer-events-none flex items-center justify-center"
            style={{
              left: "50%",
              top: "9%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <img src={eventDetails.logo_url} alt="Event Logo" className="h-7 sm:h-9 md:h-11 max-w-[120px] object-contain" />
          </div>
        )}

        {/* 1. Certificate Main Title (Full X/Y Positioning + Adaptive Font Size) */}
        {!template.hideTitle && (
          <div
            className="absolute z-20 pointer-events-none flex flex-col items-center justify-center max-w-[85%] text-center"
            style={{
              left: `${template.titleX !== undefined ? template.titleX : 50}%`,
              top: `${template.titleY !== undefined ? template.titleY : 18}%`,
              transform: "translate(-50%, -50%)",
              width: "max-content",
              maxWidth: "85%",
            }}
          >
            <h1
              className={`uppercase leading-none max-w-2xl px-2 break-words text-center ${!template.titleFontSize ? adaptiveTitle.className : ""}`}
              style={{
                fontFamily: getFontFamily("title"),
                fontWeight: getFontWeight("title"),
                fontStyle: getFontStyle("title"),
                color: template.titleColor || (isDark ? "#FDE047" : accentColor),
                fontSize: template.titleFontSize ? `${template.titleFontSize}pt` : undefined,
                opacity: template.titleOpacity !== undefined ? template.titleOpacity : 1,
                letterSpacing: getLetterSpacing("title"),
                textShadow: isDark ? "0 2px 10px rgba(0,0,0,0.6)" : "none",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {titleText}
            </h1>
          </div>
        )}

        {/* 2. Subtitle / Conferral Line */}
        {!template.hideSubtitle && (
          <div
            className="absolute z-20 pointer-events-none flex flex-col items-center justify-center max-w-[80%] text-center"
            style={{
              left: `${template.subtitleX !== undefined ? template.subtitleX : 50}%`,
              top: `${template.subtitleY !== undefined ? template.subtitleY : 26}%`,
              transform: "translate(-50%, -50%)",
              width: "max-content",
              maxWidth: "80%",
            }}
          >
            <p
              className={`uppercase max-w-xl break-words text-center px-2 ${!template.subtitleFontSize ? "text-[7.5px] sm:text-[9px] md:text-[10.5px]" : ""}`}
              style={{
                fontFamily: getFontFamily("subtitle"),
                fontWeight: getFontWeight("subtitle"),
                fontStyle: getFontStyle("subtitle"),
                color: template.subtitleColor || (isDark ? "#94A3B8" : "#94A3B8"),
                fontSize: template.subtitleFontSize ? `${template.subtitleFontSize}pt` : undefined,
                opacity: template.subtitleOpacity !== undefined ? template.subtitleOpacity : 1,
                letterSpacing: getLetterSpacing("subtitle"),
              }}
            >
              {subtitleText}
            </p>
          </div>
        )}

        {/* Recipient Full Name Container with Auto-Fit Text Scaling */}
        <div
          className="absolute z-20 pointer-events-none flex flex-col items-center justify-center max-w-[85%] text-center"
          style={{
            left: "50%",
            top: "44%",
            transform: "translate(-50%, -50%)",
            width: "max-content",
            maxWidth: "85%",
          }}
        >
          <h2
            className={`font-extrabold tracking-tight leading-tight pb-1 border-b-2 inline-block max-w-full break-words text-center px-2 sm:px-6 ${adaptiveRecipient.className}`}
            style={{
              fontFamily: getFontFamily("recipient"),
              color: isDark ? "#FFFFFF" : secondaryColor,
              borderColor: accentColor,
              letterSpacing: adaptiveRecipient.letterSpacing,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {name}
          </h2>

          {/* Recipient Organization / Job Title */}
          {recipientSubtext && (
            <p className={`text-[8.5px] sm:text-[10px] md:text-xs font-bold mt-1 max-w-xl break-words text-center px-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {recipientSubtext}
            </p>
          )}
        </div>

        {/* 3. Personalized Body Text with Markdown support and Auto-Fit */}
        {!template.hideBody && (
          <div
            className="absolute z-20 pointer-events-none flex flex-col justify-center max-w-[82%]"
            style={{
              left: `${template.bodyX !== undefined ? template.bodyX : 50}%`,
              top: `${template.bodyY !== undefined ? template.bodyY : 64}%`,
              transform: "translate(-50%, -50%)",
              width: "max-content",
              maxWidth: "82%",
            }}
          >
            <div
              className={`max-w-2xl mx-auto px-4 break-words ${!template.bodyFontSize ? adaptiveBody.className : ""} ${!template.bodyColor ? (isDark ? "text-slate-300" : "text-slate-600") : ""}`}
              style={{
                fontFamily: getFontFamily("body"),
                fontWeight: getFontWeight("body"),
                fontStyle: getFontStyle("body"),
                textAlign: template.bodyTextAlign || "center",
                color: template.bodyColor || undefined,
                fontSize: template.bodyFontSize ? `${template.bodyFontSize}pt` : undefined,
                opacity: template.bodyOpacity !== undefined ? template.bodyOpacity : 1,
                letterSpacing: getLetterSpacing("body"),
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>
        )}

        {/* BOTTOM SECTION: Committee Signatures (Elegantly Distributed) */}
        <div
          className="absolute z-20 inset-x-8 sm:inset-x-16 flex items-end justify-around shrink-0 pointer-events-none"
          style={{
            bottom: template.signatureBottom !== undefined ? `${template.signatureBottom}%` : "8.5%",
          }}
        >
          {(template.signatories || []).slice(0, 3).map((sig, idx) => {
            const matchedCalligraphy = CALLIGRAPHY_SIGNATURES.find(c => c.id === sig.calligraphyId) || CALLIGRAPHY_SIGNATURES[idx % CALLIGRAPHY_SIGNATURES.length];
            const signatureDisplayText = getSignatureDisplayText(sig.name);

            return (
              <div key={sig.id || idx} className="flex flex-col items-center text-center max-w-[120px] sm:max-w-[160px] md:max-w-[180px] px-1 pointer-events-auto">
                {/* Signature Visual (Uploaded Image or Calligraphy Script) */}
                <div className="h-8 sm:h-10 md:h-12 w-full flex items-end justify-center pb-0.5 overflow-hidden">
                  {sig.signatureImage ? (
                    <img src={sig.signatureImage} alt={sig.name} className="h-full object-contain" />
                  ) : (
                    <div
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl select-none leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                      style={{
                        fontFamily: matchedCalligraphy.fontFamily,
                        color: isDark ? "#FDE047" : accentColor,
                        transform: "translateY(2px)",
                      }}
                    >
                      {signatureDisplayText}
                    </div>
                  )}
                </div>

                {/* Signatory Line */}
                <div className={`w-full h-0.5 mb-1 ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />

                {/* Signatory Details */}
                <div className={`text-[8px] sm:text-[9px] md:text-[10px] font-bold leading-tight break-words max-w-full ${isDark ? "text-white" : "text-slate-800"}`}>
                  {sig.name}
                </div>
                <div className={`text-[7px] sm:text-[8px] leading-tight break-words max-w-full ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {sig.title}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── CUSTOM FLOATING ELEMENTS LAYER (Text & Images) ── */}
      {(template.customElements || []).map((el, idx) => {
        const x = el.x !== undefined ? el.x : 50;
        const y = el.y !== undefined ? el.y : 50;
        const opacity = el.opacity !== undefined ? el.opacity : 1;

        if (el.type === "image" && el.url) {
          const widthPx = el.width || 60;
          return (
            <div
              key={el.id || idx}
              className="absolute pointer-events-none select-none z-30 transition-all"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                opacity,
              }}
            >
              <img
                src={el.url}
                alt={el.alt || "Custom Element"}
                className={`object-contain ${
                  el.borderRadius === "circle"
                    ? "rounded-full"
                    : el.borderRadius === "rounded"
                    ? "rounded-xl"
                    : "rounded-none"
                }`}
                style={{
                  width: `${widthPx}px`,
                  maxHeight: `${widthPx * 1.5}px`,
                }}
              />
            </div>
          );
        }

        if (el.type === "text" && el.text) {
          const interpolatedText = interpolateCertificateText(el.text, contextData);
          const fontFam = resolveFontFamilyString(el.fontFamily) || "'Plus Jakarta Sans', sans-serif";
          const fontWt = el.fontWeight === "black" ? 900 : el.fontWeight === "extrabold" ? 800 : el.fontWeight === "bold" ? 700 : el.fontWeight === "semibold" ? 600 : el.fontWeight === "medium" ? 500 : 400;
          const letterSp = typeof el.letterSpacing === "number" ? `${el.letterSpacing}px` : el.letterSpacing || "0px";

          return (
            <div
              key={el.id || idx}
              className="absolute pointer-events-none select-none z-30 whitespace-nowrap text-center transition-all"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                opacity,
                fontFamily: fontFam,
                fontSize: `${el.fontSize || 11}pt`,
                fontWeight: fontWt,
                fontStyle: el.italic ? "italic" : "normal",
                color: el.color || accentColor,
                letterSpacing: letterSp,
                textTransform: el.textTransform || "none",
              }}
            >
              {interpolatedText}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

/**
 * High-precision A4 Landscape batch print & PDF export engine
 */
export async function printA4CertificatesDocument({
  recipients = [],
  template = {},
  eventDetails = {},
}) {
  if (typeof window === "undefined" || !recipients.length) return;

  const preparedList = recipients.map((r, index) => {
    const name = r.name || r.fullName || "Recipient";
    const role = r.role || r.ticketType || template.targetRole || "Delegate";
    const company = r.company || r.organization || r.companyName || "";
    const jobTitle = r.jobTitle || r.title || "";
    const certId = r.certificateId || r.certId || `${template.certificateIdPrefix || "EZ-CERT-2026"}-${(r.id || index + 1).toString().slice(-4).toUpperCase()}`;
    const issueDate = r.issueDate || template.issueDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return {
      ...r,
      name,
      role,
      company,
      jobTitle,
      certId,
      issueDate,
    };
  });

  const printWindow = window.open("", "_blank", "width=1200,height=850");
  if (!printWindow) {
    alert("Please allow popups to generate and print A4 certificates.");
    return;
  }

  const accentColor = template.accentColor || "#D4AF37";
  const secondaryColor = template.secondaryColor || "#1E293B";
  const borderStyle = template.borderStyle || "symmetric-diamond-navy-gold";
  const bgStyle = template.bgStyle || "white";
  const isDark = bgStyle === "dark" || borderStyle === "dark-obsidian-luxe";
  const customBgUrl = template.customBgUrl || "";
  const customBgOpacity = template.customBgOpacity !== undefined ? template.customBgOpacity : 1;

  const eventTitle = eventDetails.title || "Eventzone Global Summit 2026";
  const eventLocation = eventDetails.location || eventDetails.venue_name || `${eventDetails.city || "Algiers"}, ${eventDetails.country || "Algeria"}`;
  const eventDate = eventDetails.date_range_formatted || "October 14–16, 2026";

  const renderSingleCertificateHtml = (rec) => {
    const contextData = {
      name: rec.name,
      role: rec.role,
      company: rec.company,
      organization: rec.company,
      jobTitle: rec.jobTitle,
      eventTitle,
      eventName: eventTitle,
      eventLocation,
      location: eventLocation,
      eventDate,
      dates: eventDate,
      issueDate: rec.issueDate,
      certificateId: rec.certId,
      certId: rec.certId,
      organizerName: eventDetails.organizer_name || "Eventzone Organizing Committee",
      customNotes: template.customNotes || "",
    };

    const titleText = interpolateCertificateText(template.certificateTitle || "CERTIFICATE OF ATTENDANCE", contextData);
    const subtitleText = interpolateCertificateText(template.subtitleText || "THIS IS PROUDLY PRESENTED TO", contextData);
    const recipientSubtext = interpolateCertificateText(template.recipientSubtext || "{{job_title}} • {{organization}}", contextData).replace(/^[•\s—-]+|[•\s—-]+$/g, "");
    const bodyHtml = formatCertificateBodyHtml(template.bodyText || "For distinguished and active participation in the **{{event_name}}**.", contextData);

    const adaptiveRecipient = getAdaptiveRecipientStyles(rec.name);
    const adaptiveTitle = getAdaptiveTitleStyles(titleText);
    const adaptiveBody = getAdaptiveBodyStyles(template.bodyText);

    const getPrintFontFamily = (element = "title") => {
      const customFont = template[`${element}FontFamily`];
      if (customFont) {
        const resolved = resolveFontFamilyString(customFont);
        if (resolved) return resolved;
      }
      const pairing = template.fontPairing || "cinzel-sans";
      if (element === "title" || element === "recipient") {
        if (pairing === "playfair-inter") return "'Playfair Display', Georgia, serif";
        if (pairing === "montserrat-sans") return "'Montserrat', 'Plus Jakarta Sans', sans-serif";
        if (pairing === "cormorant-serif") return "'Cormorant Garamond', Garamond, serif";
        return "'Cinzel', 'Times New Roman', serif";
      }
      return "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
    };

    const getPrintFontWeight = (element = "title") => {
      const customWeight = template[`${element}FontWeight`];
      if (customWeight) {
        if (customWeight === "normal") return "400";
        if (customWeight === "medium") return "500";
        if (customWeight === "semibold") return "600";
        if (customWeight === "bold") return "700";
        if (customWeight === "extrabold") return "800";
        if (customWeight === "black") return "900";
        return customWeight;
      }
      if (element === "title") return "900";
      if (element === "recipient") return "800";
      if (element === "subtitle") return "700";
      if (element === "body") return "400";
      return "normal";
    };

    const getPrintFontStyle = (element = "title") => {
      const isItalic = template[`${element}Italic`];
      return isItalic ? "italic" : "normal";
    };

    const getPrintLetterSpacing = (element = "title") => {
      const customSpacing = template[`${element}LetterSpacing`];
      if (customSpacing !== undefined && customSpacing !== null) {
        return typeof customSpacing === "number" ? `${customSpacing}px` : customSpacing;
      }
      if (element === "title") return "2px";
      if (element === "subtitle") return "2.5px";
      return "normal";
    };

    const bgCss = isDark
      ? `background: radial-gradient(ellipse at center, #0F172A 0%, #080D1A 100%); color: #F8FAFC;`
      : bgStyle === "ivory"
      ? `background: radial-gradient(ellipse at center, #FFFFFF 0%, #FAF8F2 60%, #F4EFE6 100%);`
      : `background: #FFFFFF;`;

    return `
      <div class="certificate-page" style="${bgCss}">
        ${customBgUrl ? `
          <div class="bg-artwork-layer" style="background-image: url('${customBgUrl}'); opacity: ${customBgOpacity};"></div>
        ` : ''}

        ${borderStyle === "modern-geometric-navy-gold" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <polygon points="0,0 280,0 0,280" fill="${secondaryColor}" />
            <polygon points="0,0 240,0 0,240" fill="${accentColor}" opacity="0.9" />
            <polygon points="0,0 180,0 0,180" fill="${secondaryColor}" />
            <polygon points="0,0 110,0 0,110" fill="${accentColor}" />
            <polygon points="1000,707 720,707 1000,427" fill="${secondaryColor}" />
            <polygon points="1000,707 760,707 1000,467" fill="${accentColor}" opacity="0.9" />
            <polygon points="1000,707 820,707 1000,527" fill="${secondaryColor}" />
            <polygon points="1000,707 890,707 1000,597" fill="${accentColor}" />
            <rect x="35" y="35" width="930" height="637" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.4" />
          </svg>
        ` : ''}

        ${borderStyle === "fluid-wave-teal-gold" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <path d="M0,0 L360,0 C280,140 140,200 0,260 Z" fill="${secondaryColor}" />
            <path d="M0,0 L300,0 C220,120 110,160 0,200 Z" fill="${accentColor}" opacity="0.85" />
            <path d="M1000,707 L640,707 C720,567 860,507 1000,447 Z" fill="${secondaryColor}" />
            <path d="M1000,707 L700,707 C780,587 890,547 1000,507 Z" fill="${accentColor}" opacity="0.85" />
            <rect x="30" y="30" width="940" height="647" rx="8" fill="none" stroke="${secondaryColor}" stroke-width="1" opacity="0.25" />
          </svg>
        ` : ''}

        ${borderStyle === "corporate-diagonal-red-gold" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <polygon points="0,0 340,0 0,220" fill="${secondaryColor}" />
            <line x1="348" y1="0" x2="0" y2="228" stroke="${accentColor}" stroke-width="5" />
            <polygon points="1000,707 660,707 1000,487" fill="#1E293B" />
            <line x1="652" y1="707" x2="1000" y2="479" stroke="${accentColor}" stroke-width="5" />
            <rect x="36" y="36" width="928" height="635" fill="none" stroke="#CBD5E1" stroke-width="1.5" />
          </svg>
        ` : ''}

        ${borderStyle === "dark-obsidian-luxe" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <rect x="30" y="30" width="940" height="647" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.8" />
            <rect x="42" y="42" width="916" height="623" fill="none" stroke="${accentColor}" stroke-width="1" stroke-dasharray="6,6" opacity="0.5" />
            <polygon points="30,30 80,30 30,80" fill="${accentColor}" />
            <polygon points="970,30 920,30 970,80" fill="${accentColor}" />
            <polygon points="30,677 80,677 30,627" fill="${accentColor}" />
            <polygon points="970,677 920,677 970,627" fill="${accentColor}" />
          </svg>
        ` : ''}

        ${borderStyle === "asymmetric-royal-blue" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <polygon points="0,0 120,0 70,707 0,707" fill="${secondaryColor}" />
            <polygon points="120,0 140,0 90,707 70,707" fill="${accentColor}" />
            <polygon points="0,0 70,0 0,220" fill="#1E40AF" />
            <polygon points="1000,0 930,0 1000,90" fill="${secondaryColor}" />
            <polygon points="1000,707 920,707 1000,580" fill="${accentColor}" />
            <rect x="40" y="35" width="920" height="637" fill="none" stroke="#E2E8F0" stroke-width="1.5" />
          </svg>
        ` : ''}

        ${borderStyle === "emerald-botanical-crest" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <polygon points="0,0 240,0 0,240" fill="${secondaryColor}" />
            <line x1="248" y1="0" x2="0" y2="248" stroke="${accentColor}" stroke-width="4" />
            <polygon points="1000,707 760,707 1000,467" fill="${secondaryColor}" />
            <line x1="752" y1="707" x2="1000" y2="459" stroke="${accentColor}" stroke-width="4" />
            <rect x="36" y="36" width="928" height="635" rx="16" fill="none" stroke="${secondaryColor}" stroke-width="1.5" opacity="0.4" />
          </svg>
        ` : ''}

        ${borderStyle === "creative-coral-violet" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <defs>
              <linearGradient id="printVanguard" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#7C3AED" />
                <stop offset="100%" stop-color="#F43F5E" />
              </linearGradient>
            </defs>
            <path d="M0,0 L320,0 C250,140 140,220 0,260 Z" fill="url(#printVanguard)" opacity="0.95" />
            <path d="M1000,707 L680,707 C750,567 860,487 1000,447 Z" fill="url(#printVanguard)" opacity="0.95" />
            <rect x="30" y="30" width="940" height="647" rx="12" fill="none" stroke="#7C3AED" stroke-width="1.5" opacity="0.3" />
          </svg>
        ` : ''}

        ${borderStyle === "classic-gold" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <rect x="30" y="30" width="940" height="647" rx="4" fill="none" stroke="${accentColor}" stroke-width="3" />
            <rect x="38" y="38" width="924" height="631" rx="2" fill="none" stroke="${accentColor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.8" />
            <g transform="translate(30, 30)" fill="${accentColor}"><polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" /></g>
            <g transform="translate(970, 30)" fill="${accentColor}"><polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" /></g>
            <g transform="translate(30, 677)" fill="${accentColor}"><polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" /></g>
            <g transform="translate(970, 677)" fill="${accentColor}"><polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" /></g>
          </svg>
        ` : ''}

        ${borderStyle === "art-deco" ? `
        ` : borderStyle === "art-deco" ? `
          <svg class="border-svg" viewBox="0 0 1000 707" preserveAspectRatio="none">
            <rect x="30" y="30" width="940" height="647" fill="none" stroke="${accentColor}" stroke-width="3" />
            <polygon points="30,30 90,30 90,42 42,42 42,90 30,90" fill="${accentColor}" />
            <polygon points="970,30 910,30 910,42 958,42 958,90 970,90" fill="${accentColor}" />
            <polygon points="30,677 90,677 90,665 42,665 42,617 30,617" fill="${accentColor}" />
            <polygon points="970,677 910,677 910,665 958,665 958,617 970,617" fill="${accentColor}" />
          </svg>
        ` : ''}

        <div class="content-box" style="position: relative; width: 100%; height: 100%; ${borderStyle === "asymmetric-royal-blue" ? "padding-left: 55mm;" : ""}">
          ${eventDetails.logo_url ? `
            <div style="position: absolute; left: 50%; top: 9%; transform: translate(-50%, -50%);">
              <img src="${eventDetails.logo_url}" style="height: 12mm; max-width: 45mm; object-fit: contain;" />
            </div>
          ` : ''}

          ${!template.hideTitle ? `
            <div style="position: absolute; left: ${template.titleX !== undefined ? template.titleX : 50}%; top: ${template.titleY !== undefined ? template.titleY : 18}%; transform: translate(-50%, -50%); width: max-content; max-width: 85%; text-align: center;">
              <h1 class="cert-title" style="color: ${template.titleColor || (isDark ? '#FDE047' : accentColor)}; font-size: ${template.titleFontSize ? `${template.titleFontSize}pt` : adaptiveTitle.printFontSize}; font-family: ${getPrintFontFamily('title')}; font-weight: ${getPrintFontWeight('title')}; font-style: ${getPrintFontStyle('title')}; opacity: ${template.titleOpacity !== undefined ? template.titleOpacity : 1}; letter-spacing: ${getPrintLetterSpacing('title')};">${titleText}</h1>
            </div>
          ` : ''}

          ${!template.hideSubtitle ? `
            <div style="position: absolute; left: ${template.subtitleX !== undefined ? template.subtitleX : 50}%; top: ${template.subtitleY !== undefined ? template.subtitleY : 26}%; transform: translate(-50%, -50%); width: max-content; max-width: 80%; text-align: center;">
              <p class="cert-subtitle" style="${template.subtitleColor ? `color: ${template.subtitleColor};` : ''} ${template.subtitleFontSize ? `font-size: ${template.subtitleFontSize}pt;` : ''} font-family: ${getPrintFontFamily('subtitle')}; font-weight: ${getPrintFontWeight('subtitle')}; font-style: ${getPrintFontStyle('subtitle')}; opacity: ${template.subtitleOpacity !== undefined ? template.subtitleOpacity : 1}; letter-spacing: ${getPrintLetterSpacing('subtitle')};">${subtitleText}</p>
            </div>
          ` : ''}

          <!-- Middle Recipient -->
          <div class="recipient-section" style="position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); width: max-content; max-width: 85%; text-align: center;">
            <h2 class="recipient-name" style="color: ${isDark ? '#FFFFFF' : secondaryColor}; border-bottom: 1.5px solid ${accentColor}; font-size: ${adaptiveRecipient.printFontSize}; font-family: ${getPrintFontFamily('recipient')}; font-weight: ${getPrintFontWeight('recipient')}; font-style: ${getPrintFontStyle('recipient')}; letter-spacing: ${adaptiveRecipient.letterSpacing}; white-space: nowrap;">
              ${rec.name}
            </h2>
            ${recipientSubtext ? `<p class="recipient-subtext" style="${isDark ? 'color: #cbd5e1;' : ''}">${recipientSubtext}</p>` : ''}
          </div>

          ${!template.hideBody ? `
            <div style="position: absolute; left: ${template.bodyX !== undefined ? template.bodyX : 50}%; top: ${template.bodyY !== undefined ? template.bodyY : 64}%; transform: translate(-50%, -50%); width: max-content; max-width: 82%; text-align: ${template.bodyTextAlign || 'center'};">
              <div class="cert-body" style="${template.bodyColor ? `color: ${template.bodyColor};` : (isDark ? 'color: #cbd5e1;' : '')} font-size: ${template.bodyFontSize ? `${template.bodyFontSize}pt` : adaptiveBody.printFontSize}; font-family: ${getPrintFontFamily('body')}; font-weight: ${getPrintFontWeight('body')}; font-style: ${getPrintFontStyle('body')}; opacity: ${template.bodyOpacity !== undefined ? template.bodyOpacity : 1}; letter-spacing: ${getPrintLetterSpacing('body')}; text-align: ${template.bodyTextAlign || 'center'};">${bodyHtml}</div>
            </div>
          ` : ''}

          <!-- Bottom Row: Signatories Gracefully Distributed -->
          <div class="bottom-section" style="position: absolute; bottom: ${template.signatureBottom !== undefined ? template.signatureBottom : 8.5}%; left: 8%; right: 8%;">
            ${(template.signatories || []).slice(0, 3).map((sig, idx) => {
              const matched = CALLIGRAPHY_SIGNATURES.find(c => c.id === sig.calligraphyId) || CALLIGRAPHY_SIGNATURES[idx % CALLIGRAPHY_SIGNATURES.length];
              const signatureDisplayText = getSignatureDisplayText(sig.name);

              return `
                <div class="sig-item">
                  <div class="sig-visual" style="color: ${isDark ? '#FDE047' : accentColor}; font-family: ${matched.fontFamily};">
                    ${sig.signatureImage ? `<img src="${sig.signatureImage}" style="height: 100%;" />` : signatureDisplayText}
                  </div>
                  <div class="sig-line" style="${isDark ? 'background: #475569;' : ''}"></div>
                  <div class="sig-name" style="${isDark ? 'color: #ffffff;' : ''}">${sig.name}</div>
                  <div class="sig-title" style="${isDark ? 'color: #94a3b8;' : ''}">${sig.title}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Custom Floating Elements (Printed) -->
        ${(template.customElements || []).map((el) => {
          const x = el.x !== undefined ? el.x : 50;
          const y = el.y !== undefined ? el.y : 50;
          const opacity = el.opacity !== undefined ? el.opacity : 1;

          if (el.type === "image" && el.url) {
            const widthPx = el.width || 60;
            const borderRad = el.borderRadius === "circle" ? "50%" : el.borderRadius === "rounded" ? "8px" : "0px";
            return `
              <div style="position: absolute; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%); opacity: ${opacity}; z-index: 30; pointer-events: none;">
                <img src="${el.url}" style="width: ${widthPx}px; max-height: ${widthPx * 1.5}px; object-fit: contain; border-radius: ${borderRad};" />
              </div>
            `;
          }

          if (el.type === "text" && el.text) {
            const interpolatedText = interpolateCertificateText(el.text, contextData);
            const fontFam = resolveFontFamilyString(el.fontFamily) || "'Plus Jakarta Sans', sans-serif";
            const fontWt = el.fontWeight === "black" ? 900 : el.fontWeight === "extrabold" ? 800 : el.fontWeight === "bold" ? 700 : el.fontWeight === "semibold" ? 600 : el.fontWeight === "medium" ? 500 : 400;
            const fontSt = el.italic ? "italic" : "normal";
            const letterSp = typeof el.letterSpacing === "number" ? `${el.letterSpacing}px` : el.letterSpacing || "0px";

            return `
              <div style="position: absolute; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%); opacity: ${opacity}; z-index: 30; font-family: ${fontFam}; font-size: ${el.fontSize || 11}pt; font-weight: ${fontWt}; font-style: ${fontSt}; color: ${el.color || accentColor}; letter-spacing: ${letterSp}; text-transform: ${el.textTransform || 'none'}; white-space: nowrap; pointer-events: none;">
                ${interpolatedText}
              </div>
            `;
          }

          return '';
        }).join('')}
      </div>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certificates Batch (${recipients.length}) - ${eventTitle}</title>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Dancing+Script:wght@600;700&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Great+Vibes&family=Inter:wght@400;500;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Marcellus&family=Marck+Script&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Monsieur+La+Doulaise&family=Montserrat:ital,wght@0,400..900;1,400..900&family=Outfit:wght@400;500;600;700;800&family=Oswald:wght@400;600;700&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Prata&family=Raleway:ital,wght@0,400..800;1,400..800&family=Sacramento&family=Satisfy&family=Space+Grotesk:wght@400;600;700&family=Tangerine:wght@700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
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
            background: #f1f5f9;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .certificate-page {
            width: 297mm;
            height: 210mm;
            position: relative;
            box-sizing: border-box;
            overflow: hidden;
            background-color: #ffffff;
            page-break-after: always;
            break-after: page;
          }
          .bg-artwork-layer {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            pointer-events: none;
            z-index: 1;
          }
          .border-svg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
          }
          .content-box {
            position: relative;
            z-index: 20;
            width: 100%;
            height: 100%;
            padding: 18mm 20mm 14mm 20mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
            box-sizing: border-box;
          }
          .cert-title {
            font-family: 'Cinzel', serif;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 0 auto;
            max-width: 90%;
            line-height: 1.15;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .cert-subtitle {
            font-size: 8.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
            margin: 1.5mm auto 0 auto;
            max-width: 90%;
            word-break: break-word;
          }
          .recipient-section {
            margin: auto 0;
            padding: 2mm 0;
            width: 100%;
          }
          .recipient-name {
            font-weight: 800;
            margin: 0 auto;
            display: inline-block;
            max-width: 95%;
            padding: 0 4mm 1.5mm 4mm;
            line-height: 1.2;
            white-space: nowrap;
          }
          .recipient-subtext {
            font-size: 10pt;
            font-weight: 700;
            color: #475569;
            margin: 2mm auto 0 auto;
            max-width: 90%;
            word-break: break-word;
          }
          .cert-body {
            color: #475569;
            max-width: 190mm;
            margin: 3mm auto 0 auto;
            line-height: 1.6;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .bottom-section {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            padding-left: 20mm;
            padding-right: 20mm;
          }
          .sig-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 50mm;
            min-width: 40mm;
            padding: 0 2mm;
          }
          .sig-visual {
            height: 10mm;
            font-size: 24pt;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            line-height: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .sig-line {
            width: 100%;
            height: 0.5mm;
            background: #cbd5e1;
            margin-bottom: 1mm;
          }
          .sig-name {
            font-size: 8pt;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.1;
            word-break: break-word;
          }
          .sig-title {
            font-size: 7pt;
            color: #64748b;
            line-height: 1.1;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        ${preparedList.map(renderSingleCertificateHtml).join('')}
        <script>
          async function executePrint() {
            try {
              if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
              }
            } catch (e) {}
            setTimeout(() => {
              window.print();
            }, 300);
          }
          if (document.readyState === 'complete') {
            executePrint();
          } else {
            window.addEventListener('load', executePrint);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
