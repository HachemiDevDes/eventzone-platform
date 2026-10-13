/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo } from "react";
import {
  Calendar, MapPin, Users, Mic2, Building2, Share2, Sparkles,
  CheckCircle2, Clock, ShieldCheck, Check, Globe, Tv,
  TrendingUp, Award, Quote, FileText, CheckSquare, Mail, Phone,
  Layers, Package, Coffee, Car, Store
} from "lucide-react";
import {
  COLOR_THEMES,
  FONT_PAIRINGS,
  CALLIGRAPHY_SIGNATURES,
  interpolateDocumentVariables,
} from "../lib/documentDesignerPresets";

// Icon lookup dictionary
const ICON_MAP = {
  Users, Mic2, Building2, Share2, Sparkles, CheckCircle2,
  Clock, ShieldCheck, Check, Globe, Tv, TrendingUp, Award,
  Calendar, MapPin, Mail, Phone, Layers, Package, Coffee, Car, Store
};

function renderBlockIcon(iconName, className = "w-4 h-4") {
  const IconComponent = ICON_MAP[iconName] || Sparkles;
  return <IconComponent className={className} />;
}

/**
 * A4VisualDocumentSheet
 * Pixel-perfect A4 Visual Document Renderer
 *
 * Dimensions:
 * - Portrait: 210mm x 297mm (Approx 794px x 1123px at 96 DPI)
 * - Landscape: 297mm x 210mm (Approx 1123px x 794px at 96 DPI)
 */
export default function A4VisualDocumentSheet({
  doc = {},
  zoom = 1,
  selectedBlockId = null,
  onSelectBlock = null,
  isPrintView = false,
  className = "",
}) {
  const theme = useMemo(() => {
    return COLOR_THEMES.find((t) => t.id === doc.themeId) || COLOR_THEMES[0];
  }, [doc.themeId]);

  const fontPairing = useMemo(() => {
    return FONT_PAIRINGS.find((f) => f.id === doc.fontPairingId) || FONT_PAIRINGS[0];
  }, [doc.fontPairingId]);

  const calligraphy = useMemo(() => {
    return CALLIGRAPHY_SIGNATURES.find((c) => c.id === doc.calligraphySignatureId) || CALLIGRAPHY_SIGNATURES[0];
  }, [doc.calligraphySignatureId]);

  const isLandscape = doc.orientation === "landscape";

  const blocks = doc.blocks || [];
  const variables = doc.variables || {};

  return (
    <div
      className={`relative select-text transition-transform origin-top ${className}`}
      style={{
        transform: !isPrintView && zoom !== 1 ? `scale(${zoom})` : undefined,
      }}
    >
      {/* Dynamic Google Fonts injection */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Montserrat:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Great+Vibes&family=Alex+Brush&family=Allura&family=Parisienne&display=swap');

        .a4-document-page {
          width: ${isLandscape ? "297mm" : "210mm"};
          min-height: ${isLandscape ? "210mm" : "297mm"};
          box-sizing: border-box;
          background-color: #ffffff;
        }

        @media print {
          @page {
            size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .a4-document-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* A4 Paper Canvas */}
      <div
        id="a4-visual-document-sheet"
        className="a4-document-page relative mx-auto bg-white text-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
        style={{
          fontFamily: fontPairing.bodyFont,
          borderColor: theme.borderColor,
        }}
      >
        {/* Subtle Watermark Overlay */}
        {doc.showWatermark && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.035] z-0">
            <span
              className="text-[120px] font-black uppercase tracking-widest -rotate-45 select-none"
              style={{ color: theme.primary }}
            >
              Eventzone
            </span>
          </div>
        )}

        {/* Decorative Top Accent Bar */}
        <div
          className="w-full h-2.5 shrink-0"
          style={{
            background: `linear-gradient(90deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
          }}
        />

        {/* Inner Content Area */}
        <div className="p-8 sm:p-10 md:p-12 flex-1 flex flex-col justify-between relative z-10">
          <div>
            {/* 1. Header / Letterhead */}
            {doc.showLetterhead && (
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  {doc.organizerLogo ? (
                    <img
                      src={doc.organizerLogo}
                      alt="Organizer Logo"
                      className="h-12 max-w-[160px] object-contain"
                    />
                  ) : (
                    <div
                      className="h-10 px-3 rounded-lg flex items-center justify-center font-black text-white text-sm"
                      style={{ background: theme.primary }}
                    >
                      {doc.organizerName ? doc.organizerName.substring(0, 3).toUpperCase() : "EZ"}
                    </div>
                  )}
                  <div>
                    <h2
                      className="text-base font-extrabold tracking-tight text-slate-900 leading-tight"
                      style={{ fontFamily: fontPairing.titleFont }}
                    >
                      {doc.organizerName || "Eventzone Organizing Body"}
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {doc.organizerAddress || "Alger, Algérie"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase mb-1"
                    style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
                  >
                    <span>{doc.category || "Official Document"}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {doc.organizerTaxId || doc.organizerContact}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Dynamic Content Blocks */}
            <div className="space-y-6">
              {blocks.map((block) => {
                const isSelected = selectedBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    onClick={() => onSelectBlock && onSelectBlock(block.id)}
                    className={`relative transition-all duration-150 ${
                      onSelectBlock ? "cursor-pointer hover:ring-2 hover:ring-blue-400/50 rounded-xl" : ""
                    } ${isSelected ? "ring-2 ring-blue-600 rounded-xl bg-blue-50/10 p-2" : ""}`}
                  >
                    {/* Render Specific Block Type */}
                    {block.type === "hero_banner" && (
                      <div
                        className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                        }}
                      >
                        {/* Background subtle geometric shapes */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-black/10 blur-lg pointer-events-none" />

                        <div className="relative z-10">
                          {block.badge && (
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/20 text-white backdrop-blur-xs mb-3 border border-white/20">
                              {interpolateDocumentVariables(block.badge, variables)}
                            </span>
                          )}
                          <h1
                            className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2 text-white"
                            style={{ fontFamily: fontPairing.titleFont }}
                          >
                            {interpolateDocumentVariables(block.title, variables)}
                          </h1>
                          {block.subtitle && (
                            <p className="text-sm sm:text-base text-white/90 font-medium max-w-2xl leading-relaxed mb-4">
                              {interpolateDocumentVariables(block.subtitle, variables)}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-white/80 pt-2 border-t border-white/15">
                            {block.date && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-white" />
                                <span>{interpolateDocumentVariables(block.date, variables)}</span>
                              </div>
                            )}
                            {block.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-white" />
                                <span>{interpolateDocumentVariables(block.location, variables)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === "executive_summary" && (
                      <div
                        className="p-5 rounded-xl border-l-4 bg-slate-50/80 border-slate-200"
                        style={{ borderLeftColor: theme.primary }}
                      >
                        {block.heading && (
                          <h3
                            className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-700"
                            style={{ fontFamily: fontPairing.accentFont, color: theme.primary }}
                          >
                            {interpolateDocumentVariables(block.heading, variables)}
                          </h3>
                        )}
                        <p className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                          {interpolateDocumentVariables(block.content, variables)}
                        </p>
                      </div>
                    )}

                    {block.type === "stats_grid" && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(block.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-100 bg-white shadow-2xs text-center flex flex-col items-center justify-center transition-all"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
                            >
                              {renderBlockIcon(item.icon, "w-4 h-4")}
                            </div>
                            <span
                              className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
                              style={{ fontFamily: fontPairing.titleFont }}
                            >
                              {item.number}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === "content_section" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {block.badge && (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide"
                              style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                            >
                              {block.badge}
                            </span>
                          )}
                          {block.heading && (
                            <h2
                              className="text-base font-extrabold text-slate-900 tracking-tight"
                              style={{ fontFamily: fontPairing.titleFont }}
                            >
                              {interpolateDocumentVariables(block.heading, variables)}
                            </h2>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                          {interpolateDocumentVariables(block.content, variables)}
                        </div>
                      </div>
                    )}

                    {block.type === "tiers_grid" && (
                      <div className="space-y-3">
                        {block.heading && (
                          <h3
                            className="text-sm font-extrabold text-slate-900 tracking-tight"
                            style={{ fontFamily: fontPairing.titleFont }}
                          >
                            {block.heading}
                          </h3>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {(block.tiers || []).map((tier, tidx) => (
                            <div
                              key={tidx}
                              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                                tier.featured
                                  ? "border-2 shadow-xs bg-white"
                                  : "border-slate-200 bg-slate-50/50"
                              }`}
                              style={{
                                borderColor: tier.featured ? theme.primary : undefined,
                              }}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className="text-xs font-black tracking-tight"
                                    style={{ color: tier.featured ? theme.primary : "#1e293b" }}
                                  >
                                    {tier.name}
                                  </span>
                                  {tier.badge && (
                                    <span
                                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor: tier.featured ? theme.badgeBg : "#e2e8f0",
                                        color: tier.featured ? theme.badgeText : "#475569",
                                      }}
                                    >
                                      {tier.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-base font-black text-slate-900 mb-3">
                                  {tier.price}
                                </div>
                                <ul className="space-y-1.5 text-[11px] text-slate-600">
                                  {(tier.perks || []).map((perk, pidx) => (
                                    <li key={pidx} className="flex items-start gap-1.5">
                                      <CheckCircle2
                                        className="w-3.5 h-3.5 shrink-0 mt-0.5"
                                        style={{ color: theme.primary }}
                                      />
                                      <span className="leading-tight">{perk}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === "schedule_table" && (
                      <div className="space-y-2">
                        {block.heading && (
                          <h3
                            className="text-sm font-extrabold text-slate-900 tracking-tight"
                            style={{ fontFamily: fontPairing.titleFont }}
                          >
                            {block.heading}
                          </h3>
                        )}
                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-left">
                                <th className="p-2.5 w-32">Time</th>
                                <th className="p-2.5">Session / Activity</th>
                                <th className="p-2.5 w-36">Hall / Room</th>
                                <th className="p-2.5 w-40">Speaker / Host</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(block.sessions || []).map((sess, sidx) => (
                                <tr key={sidx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                                    {sess.time}
                                  </td>
                                  <td className="p-2.5 font-semibold text-slate-800">
                                    {sess.title}
                                  </td>
                                  <td className="p-2.5 text-slate-500">
                                    {sess.stage}
                                  </td>
                                  <td className="p-2.5 font-medium text-slate-600">
                                    {interpolateDocumentVariables(sess.speaker, variables)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {block.type === "quote_callout" && (
                      <div
                        className="p-6 rounded-2xl bg-linear-to-r from-slate-50 to-white border border-slate-100 relative my-2"
                        style={{ borderLeft: `4px solid ${theme.primary}` }}
                      >
                        <Quote
                          className="w-8 h-8 opacity-15 absolute top-4 right-4"
                          style={{ color: theme.primary }}
                        />
                        <blockquote
                          className="text-sm italic font-medium text-slate-700 leading-relaxed mb-3"
                          style={{ fontFamily: fontPairing.accentFont }}
                        >
                          “{interpolateDocumentVariables(block.quote, variables)}”
                        </blockquote>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {interpolateDocumentVariables(block.author, variables)}
                            </span>
                            {block.authorTitle && (
                              <span className="text-[11px] text-slate-500 ml-1.5 font-normal">
                                • {interpolateDocumentVariables(block.authorTitle, variables)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === "terms_clauses" && (
                      <div className="space-y-3">
                        {block.heading && (
                          <h3
                            className="text-sm font-extrabold text-slate-900 tracking-tight"
                            style={{ fontFamily: fontPairing.titleFont }}
                          >
                            {block.heading}
                          </h3>
                        )}
                        <div className="space-y-2.5">
                          {(block.clauses || []).map((clause, cidx) => (
                            <div key={cidx} className="text-xs leading-relaxed">
                              <h4 className="font-bold text-slate-800 mb-0.5">
                                {clause.title}
                              </h4>
                              <p className="text-slate-600 whitespace-pre-line font-normal text-[11px]">
                                {interpolateDocumentVariables(clause.text, variables)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === "signature_block" && (
                      <div className="pt-4 border-t border-slate-200 mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                          {/* Signatory 1 (Organizer) */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Authorized Signatory
                            </span>
                            <div className="h-16 flex items-end">
                              <span
                                className="text-2xl text-slate-800 select-none"
                                style={{ fontFamily: calligraphy.fontFamily }}
                              >
                                {interpolateDocumentVariables(block.signatory1Name, variables)}
                              </span>
                            </div>
                            <div className="w-full h-px bg-slate-300" />
                            <div className="text-[11px]">
                              <p className="font-bold text-slate-900">
                                {interpolateDocumentVariables(block.signatory1Name, variables)}
                              </p>
                              <p className="text-slate-500 font-medium">
                                {block.signatory1Title}
                              </p>
                              <p className="text-slate-400 text-[10px]">
                                {block.signatory1Org}
                              </p>
                            </div>
                          </div>

                          {/* Signatory 2 or Stamp */}
                          <div className="flex flex-col items-start sm:items-end space-y-2">
                            {doc.showStamp ? (
                              <div className="flex flex-col items-center">
                                {/* Official Stamp & Seal Graphic */}
                                <div
                                  className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-2 text-center rotate-[-8deg] shadow-2xs select-none transition-transform"
                                  style={{
                                    borderColor: theme.primary,
                                    color: theme.primary,
                                    backgroundColor: theme.primaryLight,
                                  }}
                                >
                                  <ShieldCheck className="w-5 h-5 mb-0.5" />
                                  <span className="text-[7.5px] font-black uppercase tracking-tight leading-tight">
                                    {doc.stampText || "Eventzone Certified"}
                                  </span>
                                  <span className="text-[7px] font-bold mt-0.5 opacity-80">
                                    {variables.current_date || "2026"}
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium mt-1">
                                  Cachet & Sceau Officiel
                                </span>
                              </div>
                            ) : block.signatory2Name ? (
                              <div className="w-full space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-right">
                                  Partner Signatory
                                </span>
                                <div className="h-16 flex items-end justify-end">
                                  <span
                                    className="text-2xl text-slate-800 select-none"
                                    style={{ fontFamily: calligraphy.fontFamily }}
                                  >
                                    {interpolateDocumentVariables(block.signatory2Name, variables)}
                                  </span>
                                </div>
                                <div className="w-full h-px bg-slate-300" />
                                <div className="text-[11px] text-right">
                                  <p className="font-bold text-slate-900">
                                    {interpolateDocumentVariables(block.signatory2Name, variables)}
                                  </p>
                                  <p className="text-slate-500 font-medium">
                                    {block.signatory2Title}
                                  </p>
                                  <p className="text-slate-400 text-[10px]">
                                    {block.signatory2Org}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Document Footer */}
          <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Eventzone</span>
              <span>•</span>
              <span>Document ID: #{doc.id?.slice(-8) || "EZ-DOC-26"}</span>
              <span>•</span>
              <span>Confidentiel & Usage Réservé</span>
            </div>
            <div>
              <span>Page 1 / 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Print Document Helper function
 * Opens a dedicated popup with exact CSS print styles and calls window.print()
 */
export function printVisualDocument(doc = {}) {
  if (typeof window === "undefined") return;

  const targetElement = document.getElementById("a4-visual-document-sheet");
  if (!targetElement) {
    window.print();
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) {
    window.print();
    return;
  }

  const isLandscape = doc.orientation === "landscape";
  const sheetHtml = targetElement.outerHTML;

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${doc.title || "Document"} — Eventzone</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Great+Vibes&family=Alex+Brush&family=Allura&family=Parisienne&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .a4-document-page {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: ${isLandscape ? "297mm" : "210mm"} !important;
            min-height: ${isLandscape ? "210mm" : "297mm"} !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        ${sheetHtml}
        <script>
          async function executePrint() {
            try {
              if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
              }
            } catch (e) {}
            setTimeout(() => {
              window.print();
            }, 350);
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
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}
