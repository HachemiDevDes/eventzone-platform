"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalErrorPage({ error, reset }) {
  useEffect(() => {
    // Log the error to client console or monitoring
    console.error("Eventzone Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
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
            Something unexpected occurred
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            We ran into an issue while loading this page. You can reload the view or return to the Eventzone home page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/20"
          >
            <RefreshCw size={13} />
            <span>Reload View</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home size={13} />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
