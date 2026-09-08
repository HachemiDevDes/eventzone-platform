"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useLanguage, translations } from "@/lib/i18n";

export default function GlobalErrorPage({ error, reset }) {
  const langContext = useLanguage();
  let currentLang = langContext?.lang;
  if (!currentLang && typeof window !== "undefined") {
    try {
      currentLang = localStorage.getItem("app_language") || document.documentElement.lang || "en";
    } catch (e) {
      currentLang = "en";
    }
  }
  if (!["en", "fr", "ar"].includes(currentLang)) currentLang = "en";
  const isRTL = currentLang === "ar";
  const t = langContext?.t || ((key, fallback) => translations[currentLang]?.[key] || translations.en?.[key] || fallback || key);

  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log the error to client console or monitoring
    console.error("Eventzone Application Error:", error);
  }, [error]);

  const handleCopy = () => {
    const errorText = `${error?.name || "Error"}: ${error?.message || "Unknown error"}\nDigest: ${error?.digest || "N/A"}\n\nStack:\n${error?.stack || "No stack trace available"}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans"
    >
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 max-w-md w-full shadow-xl space-y-6">
        <div className="flex justify-center">
          <img
            src="https://i.imgur.com/jFDrQbM.png"
            alt="eventzone"
            style={{ width: "130px", height: "32px", objectFit: "contain" }}
            className="h-8 w-auto object-contain"
          />
        </div>

        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
          <AlertCircle size={28} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            {t("error.unexpectedTitle", "Something unexpected occurred")}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t("error.unexpectedDesc", "We ran into an issue while loading this page. You can reload the view or return to the Eventzone home page.")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/20"
          >
            <RefreshCw size={13} />
            <span>{t("error.reloadView", "Reload View")}</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home size={13} />
            <span>{t("error.goToHome", "Go to Home")}</span>
          </Link>
        </div>

        {/* Diagnostic collapsible details for developer / debugging */}
        {error && (
          <div className="pt-2 border-t border-slate-100 text-start">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-start flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
            >
              <span>{showDetails ? t("error.hideDetails", "Hide Error Details") : t("error.viewDetails", "View Error Details")}</span>
              {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 bg-slate-950 text-slate-200 rounded-xl text-[10px] font-mono leading-relaxed overflow-x-auto relative text-start rtl:text-left">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                  <span className="font-bold text-rose-400">{error.name || "Error"}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copied ? t("error.copied", "Copied!") : t("error.copyError", "Copy")}</span>
                  </button>
                </div>
                <p className="text-rose-300 font-bold mb-1">{error.message || "An unexpected error occurred."}</p>
                {error.digest && (
                  <p className="text-slate-500 text-[9px] mb-1">Digest: {error.digest}</p>
                )}
                {error.stack && (
                  <pre className="text-slate-400 text-[9px] whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
