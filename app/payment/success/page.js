"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Download,
  ArrowRight,
  Ticket,
  QrCode,
  ShieldCheck,
  Building2,
  Mail,
  User,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get("payment_id") || searchParams.get("id");
  const checkoutId = searchParams.get("checkout_id");
  const eventId = searchParams.get("event_id");

  const [loading, setLoading] = useState(true);
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

          // If still pending, poll a few times as webhooks can take 1-3 seconds
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

  const handleDownloadQr = () => {
    if (!participantData?.qrCode) return;
    const link = document.createElement("a");
    link.href = participantData.qrCode;
    link.download = `${participantData.name || "ticket"}_badge_${participantData.badgeCode || "pass"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
          Verifying Your Payment...
        </h2>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
          Please wait while we confirm your EDAHABIA / CIB transaction with Chargily Pay.
        </p>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-xl">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">Payment Verification Notice</h2>
        <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
          {error || "We couldn't confirm this transaction. If you were charged, your registration will be processed shortly via email."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const isPaid = paymentData.status === "paid";
  const eventInfo = paymentData.event || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header Confirmation Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-2xl shadow-emerald-500/20 mb-2 animate-in zoom-in-95 duration-300">
            <CheckCircle2 size={40} className="stroke-[2.5]" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Chargily Pay Verified</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {isPaid ? "Payment Confirmed!" : "Transaction Processed"}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            Your admission pass has been secured. A confirmation email with your digital badge has been sent to{" "}
            <span className="text-white font-semibold">{paymentData.customerEmail}</span>.
          </p>
        </div>

        {/* Digital Ticket & Badge Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Top Decorative Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left/Middle Column: Pass details */}
            <div className="md:col-span-2 space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                  <Ticket size={12} />
                  <span>{paymentData.ticketTier || "Official Admission"}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {eventInfo.name || "Eventzone Summit"}
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                {eventInfo.start_date && (
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-blue-400 shrink-0" />
                    <span>{new Date(eventInfo.start_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                )}
                {eventInfo.location && (
                  <div className="flex items-center gap-2.5">
                    <MapPin size={15} className="text-rose-400 shrink-0" />
                    <span className="truncate">{eventInfo.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <User size={15} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">{paymentData.customerName}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Amount Paid: </span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    {Number(paymentData.amount).toLocaleString()} {paymentData.currency}
                  </span>
                </div>
                {participantData?.badgeCode && (
                  <div className="bg-slate-800 px-2.5 py-1 rounded-lg font-mono text-[11px] text-slate-300 border border-slate-700">
                    Badge: <span className="text-white font-bold">{participantData.badgeCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner text-slate-900 text-center">
              {participantData?.qrCode ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={participantData.qrCode}
                  alt="Entry QR Code"
                  className="w-36 h-36 object-contain rounded-lg"
                />
              ) : (
                <div className="w-36 h-36 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-300 rounded-lg">
                  <QrCode size={36} />
                  <span className="text-[10px] font-semibold">Generating QR...</span>
                </div>
              )}
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-2">
                Fast-Track Entry Pass
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {participantData?.qrCode && (
            <button
              onClick={handleDownloadQr}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={16} />
              <span>Download Digital Pass</span>
            </button>
          )}

          <button
            onClick={handleReturnToEvent}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <span>Return to Event Page</span>
            <ArrowRight size={16} />
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
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
