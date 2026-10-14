/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo } from "react";
import {
  FONT_OPTIONS,
  COLOR_OPTIONS,
  interpolateDocumentVariables,
} from "../lib/documentDesignerPresets";

/**
 * Print helper
 */
export function printVisualDocument() {
  if (typeof window !== "undefined") {
    window.print();
  }
}

/**
 * A4VisualDocumentSheet
 * Clean, pixel-accurate A4 renderer for Eventzone Document Studio.
 * Dimensions:
 * - Portrait: 210mm x 297mm (794px x 1123px at 96 DPI)
 * - Landscape: 297mm x 210mm (1123px x 794px at 96 DPI)
 */
export default function A4VisualDocumentSheet({
  doc = {},
  zoom = 1,
  selectedElementId = null,
  onSelectElement = null,
  isPrintView = false,
  className = "",
}) {
  const isLandscape = doc?.orientation === "landscape";
  const elements = doc?.elements || [];
  const variables = doc?.variables || {};

  // Resolve active theme color (supports presets and custom hex color)
  const activeColor = useMemo(() => {
    const customHex = doc?.customColor || (doc?.colorId?.startsWith("#") ? doc.colorId : null);
    if (customHex || doc?.colorId === "custom") {
      const hex = customHex || "#2563eb";
      return {
        id: "custom",
        name: "Personnalisé",
        primary: hex,
        light: hex.length === 7 ? `${hex}18` : hex,
        border: hex.length === 7 ? `${hex}38` : hex,
      };
    }
    return (
      COLOR_OPTIONS.find((c) => c.id === doc?.colorId) ||
      COLOR_OPTIONS[0]
    );
  }, [doc?.colorId, doc?.customColor]);

  // Resolve active font family
  const activeFont = useMemo(() => {
    return (
      FONT_OPTIONS.find((f) => f.id === doc?.fontId) ||
      FONT_OPTIONS[0]
    );
  }, [doc?.fontId]);

  const primaryColor = activeColor.primary;

  return (
    <div
      className={`relative select-text transition-transform origin-top ${className}`}
      style={{
        transform: !isPrintView && zoom !== 1 ? `scale(${zoom})` : undefined,
      }}
    >
      {/* Global CSS for print and Google fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Great+Vibes&family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Outfit:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

        .a4-paper-sheet {
          width: ${isLandscape ? "1123px" : "794px"};
          min-height: ${isLandscape ? "794px" : "1123px"};
          box-sizing: border-box;
          background-color: #ffffff;
        }
        .a4-paper-sheet,
        .a4-paper-sheet *:not([data-custom-font]) {
          font-family: inherit;
        }

        @media print {
          @page {
            size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
            margin: 12mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .a4-paper-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* The Physical A4 Paper */}
      <div
        id="a4-document-root"
        className="a4-paper-sheet relative mx-auto bg-white text-slate-800 shadow-xl rounded-sm p-12 md:p-14 flex flex-col justify-between"
        style={{
          fontFamily: activeFont.font,
          color: "#1e293b",
        }}
      >
        {/* Top colored accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Content Body */}
        <div className="flex-1 space-y-7">
          {elements.length === 0 ? (
            // Empty Canvas State
            <div className="h-[750px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105"
                style={{ backgroundColor: activeColor.light, color: primaryColor }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Feuille A4 Vierge
              </h3>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                Votre document est actuellement vide. Utilisez les boutons du panneau de gauche pour ajouter vos éléments : en-tête, titre, texte, encadré, tableau ou signatures.
              </p>
            </div>
          ) : (
            // Render Elements sequentially
            elements.map((element, idx) => {
              const isSelected = selectedElementId === element.id;

              return (
                <div
                  key={element.id || `el-${idx}`}
                  onClick={() => onSelectElement && onSelectElement(element.id)}
                  className={`relative group transition-all rounded-lg p-2 -mx-2 cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-blue-500/80 bg-blue-50/20"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  {renderElementContent(element, {
                    primaryColor,
                    lightColor: activeColor.light,
                    borderColor: activeColor.border,
                    variables,
                    activeFont,
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Minimalist Professional Footer */}
        <div className="mt-10 pt-4 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: primaryColor }}
            />
            <span>{doc?.name || "Document Officiel"}</span>
          </div>
          <div>
            <span>Généré avec Eventzone Document Studio</span>
          </div>
          <div>
            <span>Page 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Render single element switch
 */
function renderElementContent(element, theme) {
  const { primaryColor, lightColor, borderColor, variables, activeFont } = theme;
  const docFont = activeFont?.font || "'Plus Jakarta Sans', sans-serif";

  switch (element.type) {
    case "header": {
      const orgName = interpolateDocumentVariables(element.orgName || "Organisation", variables);
      const subtitle = interpolateDocumentVariables(element.subtitle || "", variables);
      const date = interpolateDocumentVariables(element.date || "", variables);
      const ref = interpolateDocumentVariables(element.ref || "", variables);

      return (
        <div className="border-b-2 pb-5 pt-1" style={{ borderColor: primaryColor, fontFamily: docFont }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {element.logo ? (
                <img
                  src={element.logo}
                  alt={orgName}
                  className="w-16 h-16 object-contain rounded-lg p-1 bg-white border border-slate-100"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-xs"
                  style={{ backgroundColor: primaryColor, fontFamily: docFont }}
                >
                  {orgName.charAt(0) || "E"}
                </div>
              )}
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase" style={{ fontFamily: docFont }}>
                  {orgName}
                </h2>
                {subtitle && (
                  <p className="text-xs font-semibold text-slate-500 mt-0.5" style={{ fontFamily: docFont }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              {date && (
                <p className="text-xs font-semibold text-slate-600" style={{ fontFamily: docFont }}>
                  {date}
                </p>
              )}
              {ref && (
                <span
                  className="inline-block mt-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-sm"
                  style={{ backgroundColor: lightColor, color: primaryColor }}
                >
                  {ref}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    case "heading": {
      const text = interpolateDocumentVariables(element.text || "Titre du document", variables);
      const subtitle = interpolateDocumentVariables(element.subtitle || "", variables);

      const sizeClasses = {
        sm: "text-lg",
        md: "text-xl",
        lg: "text-2xl",
        xl: "text-3xl",
        "2xl": "text-4xl",
      }[element.size || "lg"];

      const weightClass = {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        extrabold: "font-black",
      }[element.weight || "bold"];

      const alignClass = {
        left: "text-left",
        center: "text-center",
        right: "text-right",
      }[element.align || "left"];

      const elementFont = (element.fontId && element.fontId !== "inherit")
        ? FONT_OPTIONS.find((f) => f.id === element.fontId)?.font
        : docFont;

      const styleObj = {
        fontFamily: elementFont,
        color: element.color === "primary" ? primaryColor : undefined,
      };

      return (
        <div className={`py-1 ${alignClass}`} style={{ fontFamily: elementFont }}>
          <h1
            className={`${sizeClasses} ${weightClass} ${element.italic ? "italic" : ""} ${element.underline ? "underline underline-offset-4" : ""} leading-tight ${element.color === "muted" ? "text-slate-500" : element.color === "primary" ? "" : "text-slate-900"}`}
            style={styleObj}
          >
            {text}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium text-slate-500 mt-1" style={{ fontFamily: elementFont }}>
              {subtitle}
            </p>
          )}
        </div>
      );
    }

    case "paragraph":
    case "custom_text":
    case "text": {
      const text = interpolateDocumentVariables(element.text || "Rédigez votre texte ici...", variables);

      const sizeClasses = {
        xs: "text-xs leading-relaxed",
        sm: "text-sm leading-relaxed",
        md: "text-base leading-relaxed",
        lg: "text-lg leading-relaxed",
        xl: "text-xl leading-relaxed",
        "2xl": "text-2xl leading-relaxed",
      }[element.size || (element.type === "paragraph" ? "sm" : "md")];

      const weightClass = {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        extrabold: "font-black",
      }[element.weight || "normal"];

      const alignClass = {
        left: "text-left",
        center: "text-center",
        justify: "text-justify",
        right: "text-right",
      }[element.align || "left"];

      const elementFont = (element.fontId && element.fontId !== "inherit")
        ? FONT_OPTIONS.find((f) => f.id === element.fontId)?.font
        : docFont;

      const styleObj = {
        fontFamily: elementFont,
        color: element.color === "primary" ? primaryColor : undefined,
      };

      return (
        <div className={`py-1 ${alignClass}`} style={{ fontFamily: elementFont }}>
          <div
            className={`${sizeClasses} ${weightClass} ${element.italic ? "italic" : ""} ${element.underline ? "underline underline-offset-4" : ""} ${element.color === "muted" ? "text-slate-500" : element.color === "primary" ? "" : "text-slate-700"} whitespace-pre-line`}
            style={styleObj}
          >
            {text}
          </div>
        </div>
      );
    }

    case "image": {
      const url = element.url;
      const caption = interpolateDocumentVariables(element.caption || "", variables);

      const alignWrapperClass = {
        left: "flex justify-start",
        center: "flex justify-center",
        right: "flex justify-end",
      }[element.align || "center"];

      const sizeClasses = {
        sm: "max-w-[140px]",
        md: "max-w-[280px]",
        lg: "max-w-[460px]",
        full: "w-full max-w-full",
      }[element.size || "md"];

      const shapeClass = {
        rounded: "rounded-2xl",
        square: "rounded-none",
        circle: "rounded-full aspect-square object-cover",
      }[element.shape || "rounded"];

      return (
        <div className={`py-2 ${alignWrapperClass}`}>
          <div className={`${sizeClasses} text-center`}>
            {url ? (
              <img
                src={url}
                alt={caption || "Illustration du document"}
                className={`w-full object-cover max-h-[460px] mx-auto ${shapeClass} ${
                  element.border ? "border-2 border-slate-200 p-1 bg-white" : ""
                } ${element.shadow ? "shadow-md" : ""}`}
              />
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-500">
                  Aucune image sélectionnée. Importez une image dans le panneau de gauche.
                </p>
              </div>
            )}
            {caption && (
              <p className="text-xs text-slate-500 italic mt-2 text-center">
                {caption}
              </p>
            )}
          </div>
        </div>
      );
    }

    case "callout": {
      const title = interpolateDocumentVariables(element.title || "", variables);
      const text = interpolateDocumentVariables(element.text || "", variables);

      // Color scheme for callout
      const calloutStyles = {
        slate: { bg: "#f8fafc", border: "#cbd5e1", text: "#1e293b", title: "#0f172a" },
        blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", title: "#1e3a8a" },
        emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", title: "#064e3b" },
        amber: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", title: "#78350f" },
        indigo: { bg: lightColor, border: borderColor, text: "#3730a3", title: primaryColor },
      }[element.color || "slate"] || { bg: "#f8fafc", border: "#cbd5e1", text: "#1e293b", title: "#0f172a" };

      const elementFont = (element.fontId && element.fontId !== "inherit")
        ? FONT_OPTIONS.find((f) => f.id === element.fontId)?.font
        : docFont;

      return (
        <div
          className="rounded-xl p-5 border-l-4 my-2"
          style={{
            backgroundColor: calloutStyles.bg,
            borderColor: calloutStyles.border,
            borderLeftColor: primaryColor,
            fontFamily: elementFont,
          }}
        >
          {title && (
            <h4
              className="text-xs font-black uppercase tracking-wider mb-1.5"
              style={{ color: calloutStyles.title, fontFamily: elementFont }}
            >
              {title}
            </h4>
          )}
          <p
            className="text-sm font-medium leading-relaxed whitespace-pre-line"
            style={{ color: calloutStyles.text, fontFamily: elementFont }}
          >
            {text}
          </p>
        </div>
      );
    }

    case "info_grid": {
      const items = element.items || [];
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2" style={{ fontFamily: docFont }}>
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 text-center"
            >
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: docFont }}>
                {interpolateDocumentVariables(item.label || "", variables)}
              </div>
              <div
                className="text-sm font-bold truncate"
                style={{ color: primaryColor, fontFamily: docFont }}
              >
                {interpolateDocumentVariables(item.value || "", variables)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "table": {
      const title = interpolateDocumentVariables(element.title || "", variables);
      const headers = element.headers || [];
      const rows = element.rows || [];

      return (
        <div className="my-2 space-y-2" style={{ fontFamily: docFont }}>
          {title && (
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider" style={{ fontFamily: docFont }}>
              {title}
            </h4>
          )}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs" style={{ fontFamily: docFont }}>
              <thead style={{ backgroundColor: lightColor }}>
                <tr>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[11px]"
                      style={{ color: primaryColor, fontFamily: docFont }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-slate-50/50" : ""}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5 font-medium text-slate-700" style={{ fontFamily: docFont }}>
                        {interpolateDocumentVariables(cell || "", variables)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case "signature": {
      const sign1Name = interpolateDocumentVariables(element.sign1Name || "", variables);
      const sign1Title = interpolateDocumentVariables(element.sign1Title || "", variables);
      const sign2Name = interpolateDocumentVariables(element.sign2Name || "", variables);
      const sign2Title = interpolateDocumentVariables(element.sign2Title || "", variables);
      const date = interpolateDocumentVariables(element.date || "", variables);
      const stampText = interpolateDocumentVariables(element.stampText || "Eventzone Approuvé", variables);

      return (
        <div className="pt-6 mt-4 border-t border-slate-200" style={{ fontFamily: docFont }}>
          <div className="flex items-end justify-between gap-8">
            {/* Signatory 1 */}
            <div className="flex-1 text-center">
              <p className="text-xs font-semibold text-slate-500 mb-10" style={{ fontFamily: docFont }}>
                {sign1Title || "Pour l'Organisateur"}
              </p>
              <div className="border-b border-slate-400 w-40 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-slate-900" style={{ fontFamily: docFont }}>{sign1Name || "Nom et Prénom"}</p>
              {date && <p className="text-[11px] text-slate-400 mt-0.5" style={{ fontFamily: docFont }}>{date}</p>}
            </div>

            {/* Official Cachet Stamp */}
            {element.showStamp && (
              <div className="shrink-0 flex flex-col items-center justify-center p-2">
                <div
                  className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transform -rotate-6 shadow-xs"
                  style={{
                    borderColor: primaryColor,
                    color: primaryColor,
                    backgroundColor: lightColor,
                    fontFamily: docFont,
                  }}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    OFFICIEL
                  </span>
                  <span className="text-[11px] font-extrabold leading-tight my-0.5">
                    {stampText}
                  </span>
                  <span className="text-[8px] font-mono font-semibold">
                    VALIDÉ
                  </span>
                </div>
              </div>
            )}

            {/* Signatory 2 (Optional) */}
            {sign2Name || sign2Title ? (
              <div className="flex-1 text-center">
                <p className="text-xs font-semibold text-slate-500 mb-10" style={{ fontFamily: docFont }}>
                  {sign2Title || "Pour le Partenaire"}
                </p>
                <div className="border-b border-slate-400 w-40 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: docFont }}>{sign2Name || "Nom et Prénom"}</p>
                {date && <p className="text-[11px] text-slate-400 mt-0.5" style={{ fontFamily: docFont }}>{date}</p>}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    case "divider": {
      const borderStyles = {
        solid: "border-solid",
        dashed: "border-dashed",
        double: "border-double border-b-4",
      }[element.style || "solid"];

      return (
        <div className="py-2">
          <hr className={`border-slate-200 ${borderStyles}`} />
        </div>
      );
    }

    default:
      return null;
  }
}
