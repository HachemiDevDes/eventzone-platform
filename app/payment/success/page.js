"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Download,
  QrCode,
  User,
  RefreshCw,
  AlertCircle,
} from "lucide-react";



function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get("payment_id") || searchParams.get("id");
  const checkoutId = searchParams.get("checkout_id");
  const eventId = searchParams.get("event_id");

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    let timer;
    async function checkStatus() {
      try {
        const queryParam = paymentId
          ? `payment_id=${paymentId}`
          : checkoutId
          ? `checkout_id=${checkoutId}`
          : "";

        if (!queryParam) {
          setError("No payment reference found in URL.");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/payments/chargily/status?${queryParam}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setPaymentData(data.payment);
          setParticipantData(data.participant);

          if (data.payment?.status === "pending" && pollCount < 5) {
            timer = setTimeout(() => {
              setPollCount((prev) => prev + 1);
            }, 2000);
          } else {
            setLoading(false);
          }
        } else {
          setError(data.error || "Could not retrieve payment information.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Payment status check error:", err);
        setError("Network error while verifying payment status.");
        setLoading(false);
      }
    }

    checkStatus();
    return () => clearTimeout(timer);
  }, [paymentId, checkoutId, pollCount]);

  const handleDownloadBadge = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const queryParam = paymentId
        ? `payment_id=${paymentId}`
        : checkoutId
        ? `checkout_id=${checkoutId}`
        : participantData?.id
        ? `participant_id=${participantData.id}`
        : eventId
        ? `event_id=${eventId}`
        : "";

      const res = await fetch(`/api/tickets/badge-pdf?${queryParam}`);
      if (!res.ok) {
        throw new Error("Failed to generate PDF badge");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = (paymentData?.customerName || participantData?.name || "attendee")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      link.download = `${cleanName}_official_badge.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Badge PDF download error:", err);
      // Fallback: direct browser trigger
      const fallbackQuery = paymentId
        ? `payment_id=${paymentId}`
        : checkoutId
        ? `checkout_id=${checkoutId}`
        : "";
      window.open(`/api/tickets/badge-pdf?${fallbackQuery}`, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleReturnToEvent = () => {
    const slug = paymentData?.event?.slug || eventId;
    if (slug) {
      router.push(`/${slug}`);
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 mb-4">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Verifying Payment...
        </h2>
        <p className="text-xs text-slate-500 max-w-xs">
          Confirming your transaction with Chargily Pay.
        </p>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Payment Notice</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {error || "Could not retrieve payment information."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  const eventInfo = paymentData.event || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 py-12 px-4 sm:px-6 flex flex-col items-center justify-center font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-7 sm:p-9 text-center">
        {/* Success Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <CheckCircle2 size={32} className="stroke-[2.5]" />
        </div>

        {/* Clean Bold Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Payment Confirmed
        </h1>

        {/* Event Details Single Column */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
              {paymentData.ticketTier || "Official Admission"}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {eventInfo.name || "Eventzone Summit"}
            </h2>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
            {eventInfo.start_date && (
              <div className="flex items-center gap-2.5">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span>
                  {new Date(eventInfo.start_date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {eventInfo.location && (
              <div className="flex items-center gap-2.5">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{eventInfo.location}</span>
              </div>
            )}
            {paymentData.customerName && (
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">
                  {paymentData.customerName}
                </span>
              </div>
            )}
          </div>

          {/* QR Code Pass (Badge code pill removed) */}
          <div className="pt-2 flex flex-col items-center justify-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center">
              {participantData?.qrCode ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={participantData.qrCode}
                  alt="Entry QR Code"
                  className="w-44 h-44 object-contain rounded-xl"
                />
              ) : (
                <div className="w-44 h-44 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <QrCode size={40} className="stroke-1" />
                  <span className="text-xs">Preparing badge...</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount Paid */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Amount Paid</span>
            <span className="font-bold text-slate-900 text-sm">
              {Number(paymentData.amount).toLocaleString()} {paymentData.currency}
            </span>
          </div>
        </div>

        {/* Single Action Button: Download Badge */}
        <div className="mt-6">
          <button
            onClick={handleDownloadBadge}
            disabled={downloading}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Badge PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Badge</span>
              </>
            )}
          </button>

          <button
            onClick={handleReturnToEvent}
            className="mt-3.5 text-xs text-slate-400 hover:text-slate-600 transition-colors inline-block cursor-pointer"
          >
            Return to event
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
