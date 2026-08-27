"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  Zap,
  ZapOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Clock,
  Sparkles,
} from "lucide-react";

/**
 * Synthesizes short, crisp Web Audio chimes without external audio assets.
 */
function playAudioFeedback(type = "success") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "success") {
      // Crisp 2-tone melodic chime (C6 -> G6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      osc2.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.08); // G6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.08);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === "already") {
      // Double reminder beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(440.0, ctx.currentTime + 0.12); // A4

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.1); // E3

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    // Ignore audio context autoplay errors
  }
}

/**
 * Triggers device haptic vibration if available
 */
function triggerHaptic(type = "success") {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      if (type === "success") {
        navigator.vibrate([80]);
      } else if (type === "already") {
        navigator.vibrate([100, 60, 100]);
      } else {
        navigator.vibrate([180, 80, 180]);
      }
    } catch {
      // Ignore vibration errors
    }
  }
}

export default function CheckInScanner({
  eventId,
  eventTitle = "Event",
  staffEmail = "",
  onScanResult,
  onClose,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isScanningRef = useRef(true);
  const lastScannedCodeRef = useRef("");
  const lastScanTimestampRef = useRef(0);

  const [cameraPermission, setCameraPermission] = useState("prompt"); // "prompt" | "granted" | "denied"
  const [errorMessage, setErrorMessage] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [activeResult, setActiveResult] = useState(null); // { status: "success" | "already_checked_in" | "invalid", attendee, message, checkedInAt }
  const [isProcessing, setIsProcessing] = useState(false);
  const [statsIncrement, setStatsIncrement] = useState(0);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage("");
    setTorchOn(false);
    setTorchAvailable(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("denied");
        setErrorMessage("Camera access is not supported by your browser. Please use a modern mobile browser (Safari, Chrome).");
        return;
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // Required for iOS Safari
        await videoRef.current.play();
      }

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities) {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.torch) {
          setTorchAvailable(true);
        }
      }

      // Start frame scanning loop
      isScanningRef.current = true;
      requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      console.warn("Camera init error:", err);
      setCameraPermission("denied");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission was denied. Please allow camera access in your mobile browser settings to scan QR passes.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera device found on this phone.");
      } else {
        setErrorMessage("Could not start camera. " + (err.message || ""));
      }
    }
  }, [facingMode, stopCamera]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !torchAvailable) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn("Torch toggle error:", e);
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Handle scanned QR payload
  const handleScannedPayload = useCallback(
    async (code) => {
      if (!code || isProcessing) return;

      // Prevent re-scanning the exact same code within 3 seconds
      const now = Date.now();
      if (lastScannedCodeRef.current === code && now - lastScanTimestampRef.current < 3000) {
        return;
      }

      lastScannedCodeRef.current = code;
      lastScanTimestampRef.current = now;
      isScanningRef.current = false;
      setIsProcessing(true);

      try {
        const res = await fetch("/api/checkin/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            payload: code,
            checkedInBy: staffEmail || "Gate Staff",
          }),
        });

        const data = await res.json();

        if (data.status === "success") {
          playAudioFeedback("success");
          triggerHaptic("success");
          setActiveResult({
            status: "success",
            attendee: data.attendee,
            message: data.message || "Attendee Checked In Successfully!",
            checkedInAt: data.attendee?.checkedInAt || new Date().toISOString(),
          });
          setStatsIncrement((prev) => prev + 1);
          if (onScanResult) onScanResult(data);
        } else if (data.status === "already_checked_in") {
          playAudioFeedback("already");
          triggerHaptic("already");
          setActiveResult({
            status: "already_checked_in",
            attendee: data.attendee,
            message: "Already Checked In",
            checkedInAt: data.checkedInAt || data.attendee?.checkedInAt || new Date().toISOString(),
            checkedInBy: data.checkedInBy || "Gate Staff",
          });
        } else {
          playAudioFeedback("invalid");
          triggerHaptic("invalid");
          setActiveResult({
            status: "invalid",
            attendee: null,
            message: data.message || "Invalid QR pass for this event.",
          });
        }
      } catch (err) {
        console.error("Scan processing error:", err);
        playAudioFeedback("invalid");
        setActiveResult({
          status: "invalid",
          attendee: null,
          message: "Network or scanning error. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [eventId, isProcessing, onScanResult, staffEmail]
  );

  // Scan video frame using BarcodeDetector if available or jsQR fallback
  const scanVideoFrame = useCallback(() => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        if (videoWidth > 0 && videoHeight > 0) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

          // Fast native BarcodeDetector if available in browser
          if (typeof window !== "undefined" && "BarcodeDetector" in window) {
            try {
              const barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
              barcodeDetector
                .detect(canvas)
                .then((barcodes) => {
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    handleScannedPayload(barcodes[0].rawValue);
                  } else if (isScanningRef.current) {
                    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
                  }
                })
                .catch(() => {
                  // Fallback to jsQR
                  runJsQrFallback(ctx, videoWidth, videoHeight);
                });
              return;
            } catch {
              // BarcodeDetector failed, fallback to jsQR
            }
          }

          // Universal jsQR fallback
          runJsQrFallback(ctx, videoWidth, videoHeight);
          return;
        }
      }
    }

    if (isScanningRef.current) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [handleScannedPayload]);

  const runJsQrFallback = (ctx, width, height) => {
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        handleScannedPayload(code.data);
      } else if (isScanningRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch {
      if (isScanningRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      }
    }
  };

  // Resume scanning for next attendee
  const handleScanNext = () => {
    setActiveResult(null);
    lastScannedCodeRef.current = "";
    isScanningRef.current = true;
    requestAnimationFrame(scanVideoFrame);
  };

  // Lifecycle
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Camera Controls Bar */}
      <div className="absolute top-0 inset-x-0 z-20 px-4 pt-3 pb-3 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
            Live QR Scanner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {torchAvailable && (
            <button
              onClick={toggleTorch}
              type="button"
              aria-label="Toggle Flashlight"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                torchOn
                  ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/40"
                  : "bg-slate-900/80 text-white border border-white/10 hover:bg-slate-800"
              }`}
            >
              {torchOn ? <Zap size={18} className="fill-current" /> : <ZapOff size={18} />}
            </button>
          )}

          <button
            onClick={switchCamera}
            type="button"
            aria-label="Switch Camera"
            className="w-10 h-10 rounded-full bg-slate-900/80 text-white border border-white/10 flex items-center justify-center hover:bg-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {/* Live video feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />

        {/* Viewfinder Target Frame */}
        {cameraPermission === "granted" && !activeResult && (
          <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 max-w-[78vw] max-h-[78vw] pointer-events-none flex items-center justify-center">
            {/* 4 Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-sm" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-sm" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-sm" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-sm" />

            {/* Glowing animated scanner beam */}
            <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />

            {/* Center watermark target */}
            <QrCode className="text-white/15 w-20 h-20" />
          </div>
        )}

        {/* Camera Permission Denied / Error State */}
        {cameraPermission === "denied" && (
          <div className="relative z-20 px-6 py-8 mx-4 bg-slate-900/95 border border-red-500/30 rounded-3xl text-center max-w-sm shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
              <CameraOff size={28} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Camera Access Required</h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              {errorMessage || "Please enable camera permissions in your mobile browser to scan attendee QR codes."}
            </p>
            <button
              onClick={startCamera}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && !activeResult && (
          <div className="absolute z-20 inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-slate-900/90 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold text-white">Verifying pass...</span>
            </div>
          </div>
        )}

        {/* Result Overlay Card */}
        {activeResult && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col justify-end p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-6 duration-200">
            <div
              className={`w-full rounded-3xl p-6 shadow-2xl border text-slate-900 transition-all ${
                activeResult.status === "success"
                  ? "bg-white border-emerald-300 shadow-emerald-500/10"
                  : activeResult.status === "already_checked_in"
                  ? "bg-amber-50 border-amber-300 shadow-amber-500/10"
                  : "bg-red-50 border-red-300 shadow-red-500/10"
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    activeResult.status === "success"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : activeResult.status === "already_checked_in"
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                      : "bg-red-500 text-white shadow-md shadow-red-500/30"
                  }`}
                >
                  {activeResult.status === "success" && <CheckCircle2 size={28} />}
                  {activeResult.status === "already_checked_in" && <AlertTriangle size={28} />}
                  {activeResult.status === "invalid" && <XCircle size={28} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[11px] font-black uppercase tracking-wider ${
                      activeResult.status === "success"
                        ? "text-emerald-700"
                        : activeResult.status === "already_checked_in"
                        ? "text-amber-800"
                        : "text-red-700"
                    }`}
                  >
                    {activeResult.status === "success"
                      ? "Verification Confirmed"
                      : activeResult.status === "already_checked_in"
                      ? "Duplicate Scan Notice"
                      : "Invalid Ticket Pass"}
                  </div>
                  <h4 className="text-lg font-black text-slate-900 truncate">
                    {activeResult.status === "invalid"
                      ? activeResult.message
                      : activeResult.attendee?.name || "Attendee"}
                  </h4>
                </div>
              </div>

              {/* Attendee Info Card */}
              {activeResult.attendee && (
                <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/80 mb-5 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-500">Ticket Tier:</span>
                    <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {activeResult.attendee.ticketType || activeResult.attendee.ticket_type || "Standard Admission"}
                    </span>
                  </div>

                  {activeResult.attendee.email && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Email:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">
                        {activeResult.attendee.email}
                      </span>
                    </div>
                  )}

                  {activeResult.attendee.company && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Organization:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">
                        {activeResult.attendee.company}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-slate-500">Badge Code:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {activeResult.attendee.badgeCode || activeResult.attendee.badge_code || "EZ-PASS"}
                    </span>
                  </div>

                  {activeResult.checkedInAt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                      <Clock size={13} className="text-slate-400" />
                      <span>
                        Checked in at{" "}
                        {new Date(activeResult.checkedInAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Big Scan Next Button */}
              <button
                onClick={handleScanNext}
                autoFocus
                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                  activeResult.status === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                    : activeResult.status === "already_checked_in"
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/30"
                }`}
              >
                <span>Scan Next Attendee</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      {!activeResult && cameraPermission === "granted" && (
        <div className="py-3 px-4 bg-slate-950/90 text-center border-t border-white/5">
          <p className="text-[11px] font-medium text-slate-400">
            Align attendee QR badge pass within the frame for instant check-in.
          </p>
        </div>
      )}
    </div>
  );
}
