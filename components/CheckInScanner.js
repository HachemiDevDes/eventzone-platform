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
  Search,
  Upload,
  X,
  Building,
  Mail,
  Ticket,
  User,
  Check
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
      // Crisp 3-tone celebratory chime (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      [
        { freq: 523.25, time: 0, dur: 0.1 },
        { freq: 659.25, time: 0.08, dur: 0.12 },
        { freq: 783.99, time: 0.18, dur: 0.28 }
      ].forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + time);
        gain.gain.setValueAtTime(0.25, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } else if (type === "already") {
      // 2-tone warning beep (D5 -> A4)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(440.0, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Error buzz (low sawtooth)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(146.83, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    }
  } catch (err) {
    // Audio autoplay restriction
  }
}

/**
 * Triggers device haptic vibration if available
 */
function triggerHaptic(type = "success") {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      if (type === "success") {
        navigator.vibrate([70, 40, 70]);
      } else if (type === "already") {
        navigator.vibrate([120, 60, 120]);
      } else {
        navigator.vibrate([180, 80, 180, 80, 180]);
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
  staffName = "",
  checkedInCount = 0,
  totalCount = 0,
  onScanResult,
  onSwitchToList,
  onClose,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isScanningRef = useRef(true);
  const lastScannedCodeRef = useRef("");
  const lastScanTimestampRef = useRef(0);
  const autoNextTimerRef = useRef(null);

  const [cameraPermission, setCameraPermission] = useState("prompt"); // "prompt" | "granted" | "denied"
  const [errorMessage, setErrorMessage] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [activeResult, setActiveResult] = useState(null); // { status: "success" | "already_checked_in" | "invalid", attendee, message, checkedInAt, rawScanned }
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdownPct, setCountdownPct] = useState(100);

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

  // Initialize camera with iOS Safari compatibility & graceful fallbacks
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage("");
    setTorchOn(false);
    setTorchAvailable(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("denied");
        setErrorMessage("Camera access is not supported in this browser. Please use mobile Safari or Chrome.");
        return;
      }

      let stream = null;
      // 1. Try with preferred ideal facing mode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode === "user" ? "user" : { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
        // 2. Fallback for iOS Safari exact constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode === "user" ? "user" : "environment" },
            audio: false,
          });
        } catch (err2) {
          // 3. Final fallback with generic video constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;
      setCameraPermission("granted");

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.setAttribute("muted", "true");
        video.setAttribute("autoplay", "true");

        // Handle iOS autoplay resolution
        video.onloadedmetadata = () => {
          video.play().catch((e) => console.warn("Video play error:", e));
        };

        try {
          await video.play();
        } catch (e) {
          // Play will succeed on loadedmetadata
        }
      }

      // Check for torch capability
      try {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
          const capabilities = videoTrack.getCapabilities();
          if (capabilities.torch) {
            setTorchAvailable(true);
          }
        }
      } catch (tErr) {}

      // Start frame scanning loop
      isScanningRef.current = true;
      requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      console.warn("Camera init error:", err);
      setCameraPermission("denied");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission was denied. Please allow camera access in your browser settings to scan QR passes.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera device was detected on this device.");
      } else {
        setErrorMessage(err.message || "Could not access camera.");
      }
    }
  }, [facingMode, stopCamera, scanVideoFrame]);

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
    async (rawCode) => {
      if (!rawCode || isProcessing) return;
      const code = String(rawCode).trim();
      if (!code) return;

      // Prevent re-scanning the exact same code within 3 seconds
      const now = Date.now();
      if (lastScannedCodeRef.current === code && now - lastScanTimestampRef.current < 3000) {
        return;
      }

      lastScannedCodeRef.current = code;
      lastScanTimestampRef.current = now;
      isScanningRef.current = false;
      setIsProcessing(true);

      // Clear any previous auto-timer
      if (autoNextTimerRef.current) {
        clearInterval(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }

      try {
        const res = await fetch("/api/checkin/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            payload: code,
            checkedInBy: staffName || staffEmail || "Gate Staff",
          }),
        });

        const data = await res.json();

        if (data.status === "success") {
          playAudioFeedback("success");
          triggerHaptic("success");
          setActiveResult({
            status: "success",
            attendee: data.attendee,
            message: data.message || "Attendance Confirmed!",
            checkedInAt: data.attendee?.checkedInAt || new Date().toISOString(),
            rawScanned: code,
          });
          if (onScanResult) onScanResult(data);
          startAutoNextCountdown();
        } else if (data.status === "already_checked_in") {
          playAudioFeedback("already");
          triggerHaptic("already");
          setActiveResult({
            status: "already_checked_in",
            attendee: data.attendee,
            message: "Already Checked In",
            checkedInAt: data.checkedInAt || data.attendee?.checkedInAt || new Date().toISOString(),
            checkedInBy: data.checkedInBy || "Gate Staff",
            rawScanned: code,
          });
        } else {
          playAudioFeedback("invalid");
          triggerHaptic("invalid");
          setActiveResult({
            status: "invalid",
            attendee: null,
            message: data.message || "Invalid ticket pass for this event.",
            rawScanned: code,
          });
        }
      } catch (err) {
        console.error("Scan processing error:", err);
        playAudioFeedback("invalid");
        setActiveResult({
          status: "invalid",
          attendee: null,
          message: "Network error during pass verification. Please try again.",
          rawScanned: code,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [eventId, isProcessing, onScanResult, staffEmail, staffName]
  );

  // Auto-dismiss countdown bar for successful check-ins (3.5s)
  const startAutoNextCountdown = () => {
    setCountdownPct(100);
    const duration = 3500;
    const interval = 50;
    const step = (interval / duration) * 100;

    let remaining = 100;
    autoNextTimerRef.current = setInterval(() => {
      remaining -= step;
      if (remaining <= 0) {
        clearInterval(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
        handleScanNext();
      } else {
        setCountdownPct(remaining);
      }
    }, interval);
  };

  // Scan video frame using BarcodeDetector if available or jsQR fallback
  const scanVideoFrame = useCallback(() => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState >= 2 && canvas) {
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
                  runJsQrFallback(ctx, videoWidth, videoHeight);
                });
              return;
            } catch {
              // BarcodeDetector fallback
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

  // Decode QR from uploaded image file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleScannedPayload(code.data);
        } else {
          playAudioFeedback("invalid");
          setActiveResult({
            status: "invalid",
            attendee: null,
            message: "No QR code could be detected in the uploaded image.",
          });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Resume scanning for next attendee
  const handleScanNext = () => {
    if (autoNextTimerRef.current) {
      clearInterval(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
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
      if (autoNextTimerRef.current) {
        clearInterval(autoNextTimerRef.current);
      }
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="relative w-full h-full flex flex-col bg-black text-white overflow-hidden select-none font-sans">
      {/* Hidden processing canvas & file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Viewfinder Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {/* Live video feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          muted
          playsInline
          autoPlay
        />

        {/* Top Controls Floating Bar */}
        <div className="absolute top-0 inset-x-0 z-20 p-3 sm:p-4 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-lg">
            <div className={`w-2.5 h-2.5 rounded-full ${cameraPermission === "granted" ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" : "bg-amber-400"}`} />
            <span className="text-[11px] font-black tracking-wide uppercase text-white">
              {cameraPermission === "granted" ? "Live Scanner" : "Camera Ready"}
            </span>
            {totalCount > 0 && (
              <>
                <span className="text-white/30">&bull;</span>
                <span className="text-[11px] font-bold text-emerald-400 font-mono">
                  {checkedInCount}/{totalCount}
                </span>
              </>
            )}
          </div>

          {/* Right Tools: Flashlight & Camera Switch */}
          <div className="flex items-center gap-2">
            {torchAvailable && (
              <button
                onClick={toggleTorch}
                type="button"
                aria-label="Toggle Flashlight"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  torchOn
                    ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50 scale-105"
                    : "bg-slate-900/80 text-white border border-white/10 hover:bg-slate-800 backdrop-blur-md"
                }`}
              >
                {torchOn ? <Zap size={16} className="fill-current" /> : <ZapOff size={16} />}
              </button>
            )}

            <button
              onClick={switchCamera}
              type="button"
              aria-label="Switch Camera"
              className="w-9 h-9 rounded-xl bg-slate-900/80 text-white border border-white/10 flex items-center justify-center hover:bg-slate-800 backdrop-blur-md transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Viewfinder Reticle Overlay */}
        {cameraPermission === "granted" && !activeResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            {/* Target Reticle Box */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 max-w-[76vw] max-h-[76vw] flex items-center justify-center rounded-3xl">
              {/* Neon Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl shadow-[0_0_15px_#34d399]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl shadow-[0_0_15px_#34d399]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl shadow-[0_0_15px_#34d399]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl shadow-[0_0_15px_#34d399]" />

              {/* Glowing Animated Laser Scan Beam */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-pulse" />

              {/* Center Watermark Guide */}
              <QrCode className="text-white/20 w-20 h-20" />
            </div>

            {/* Hint below target */}
            <div className="mt-6 px-4 py-1.5 rounded-full bg-slate-950/75 border border-white/10 text-[11px] font-semibold text-slate-300 backdrop-blur-md shadow-lg">
              Point camera at delegate QR code
            </div>
          </div>
        )}

        {/* Camera Permission Denied / Desktop Fallback Screen */}
        {cameraPermission === "denied" && !activeResult && (
          <div className="relative z-20 px-6 py-8 mx-4 bg-slate-900/95 border border-white/15 rounded-3xl text-center max-w-sm shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 shadow-inner">
              <CameraOff size={28} />
            </div>
            <h3 className="text-base font-black text-white mb-2">Camera Access Required</h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              {errorMessage || "Please enable camera access in your browser settings to scan QR passes."}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={startCamera}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw size={15} />
                Try Enabling Camera
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-semibold text-xs border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload size={15} />
                Upload QR Code Photo
              </button>

              {onSwitchToList && (
                <button
                  onClick={onSwitchToList}
                  className="w-full pt-2 text-[11px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Browse Full Attendee List &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Processing Spinner Overlay */}
        {isProcessing && !activeResult && (
          <div className="absolute z-30 inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center animate-fade-in">
            <div className="bg-slate-900 border border-white/15 px-6 py-4 rounded-3xl flex items-center gap-3.5 shadow-2xl">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-black text-white">Verifying delegate pass...</span>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            FEEDBACK MODAL: SUCCESS / ALREADY / FAILED
           ───────────────────────────────────────────────────────────── */}
        {activeResult && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-xl flex flex-col justify-end sm:justify-center p-4 sm:p-6 animate-in fade-in duration-150">
            <div
              className={`w-full max-w-md mx-auto rounded-3xl p-6 sm:p-7 shadow-2xl border transition-all animate-in slide-in-from-bottom-8 duration-200 ${
                activeResult.status === "success"
                  ? "bg-slate-900 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)]"
                  : activeResult.status === "already_checked_in"
                  ? "bg-slate-900 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)]"
                  : "bg-slate-900 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.25)]"
              }`}
            >
              {/* Top Banner & Status Header */}
              <div className="text-center space-y-3 mb-5">
                {/* Big Animated Icon Halo */}
                <div
                  className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-2xl animate-bounce duration-700 ${
                    activeResult.status === "success"
                      ? "bg-emerald-500 text-white shadow-emerald-500/50 ring-8 ring-emerald-500/20"
                      : activeResult.status === "already_checked_in"
                      ? "bg-amber-500 text-white shadow-amber-500/50 ring-8 ring-amber-500/20"
                      : "bg-red-500 text-white shadow-red-500/50 ring-8 ring-red-500/20"
                  }`}
                >
                  {activeResult.status === "success" && <Check size={44} strokeWidth={3.5} />}
                  {activeResult.status === "already_checked_in" && <AlertTriangle size={42} strokeWidth={2.5} />}
                  {activeResult.status === "invalid" && <X size={44} strokeWidth={3.5} />}
                </div>

                <div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-1 ${
                      activeResult.status === "success"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                        : activeResult.status === "already_checked_in"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                        : "bg-red-500/20 text-red-300 border border-red-400/30"
                    }`}
                  >
                    {activeResult.status === "success" && <Sparkles size={12} />}
                    {activeResult.status === "success"
                      ? "Check-In Confirmed"
                      : activeResult.status === "already_checked_in"
                      ? "Duplicate Badge Scan"
                      : "Invalid Pass / Scan Failed"}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {activeResult.status === "invalid"
                      ? "Unrecognized Ticket"
                      : activeResult.attendee?.name || "Delegate"}
                  </h3>

                  {activeResult.status === "invalid" && (
                    <p className="text-xs text-red-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
                      {activeResult.message}
                    </p>
                  )}

                  {activeResult.status === "already_checked_in" && (
                    <p className="text-xs text-amber-300 mt-1 max-w-xs mx-auto">
                      {activeResult.message || "This attendee was already checked in earlier."}
                    </p>
                  )}
                </div>
              </div>

              {/* Attendee Details Card */}
              {activeResult.attendee ? (
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10 mb-5 space-y-2.5 text-xs text-slate-300 shadow-inner">
                  {/* Ticket Tier */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                      <Ticket size={14} className="text-blue-400" />
                      Ticket Tier:
                    </span>
                    <span className="font-black text-white bg-blue-500/20 border border-blue-400/30 px-2.5 py-1 rounded-lg text-xs">
                      {activeResult.attendee.ticketType || activeResult.attendee.ticket_type || "Standard Admission"}
                    </span>
                  </div>

                  {/* Email */}
                  {activeResult.attendee.email && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                        <Mail size={14} className="text-slate-400" />
                        Email:
                      </span>
                      <span className="font-medium text-white truncate max-w-[190px]">
                        {activeResult.attendee.email}
                      </span>
                    </div>
                  )}

                  {/* Organization / Company */}
                  {activeResult.attendee.company && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                        <Building size={14} className="text-slate-400" />
                        Company:
                      </span>
                      <span className="font-bold text-white truncate max-w-[190px]">
                        {activeResult.attendee.company}
                      </span>
                    </div>
                  )}

                  {/* Badge Code */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-slate-400">Badge Code:</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {activeResult.attendee.badgeCode || activeResult.attendee.badge_code || "EZ-PASS"}
                    </span>
                  </div>

                  {/* Timestamp */}
                  {activeResult.checkedInAt && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Check-in Time:
                      </span>
                      <span className="font-mono text-slate-200">
                        {new Date(activeResult.checkedInAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Raw Scanned Payload Info on failure */
                activeResult.rawScanned && (
                  <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-white/10 mb-5 text-center shadow-inner">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Scanned Content:
                    </span>
                    <p className="font-mono text-xs text-red-300 break-all bg-red-950/40 p-2 rounded-xl border border-red-900/40">
                      {activeResult.rawScanned.slice(0, 90)}
                      {activeResult.rawScanned.length > 90 ? "..." : ""}
                    </p>
                  </div>
                )
              )}

              {/* Auto-Next Countdown Bar for success */}
              {activeResult.status === "success" && (
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${countdownPct}%` }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleScanNext}
                  autoFocus
                  className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                    activeResult.status === "success"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30"
                      : activeResult.status === "already_checked_in"
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                  }`}
                >
                  <span>{activeResult.status === "invalid" ? "Try Scanning Again" : "Scan Next Delegate"}</span>
                  <ArrowRight size={18} />
                </button>

                {activeResult.status === "invalid" && onSwitchToList && (
                  <button
                    onClick={() => {
                      setActiveResult(null);
                      onSwitchToList();
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Search Attendee Manually
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Quick Actions Toolbar */}
      {!activeResult && cameraPermission === "granted" && (
        <div className="p-3 bg-slate-950/90 border-t border-white/10 flex items-center justify-center shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs py-2.5 px-4 bg-white/5 hover:bg-white/10 active:scale-98 text-slate-300 hover:text-white border border-white/10 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="Scan QR code from photo"
          >
            <Upload size={14} className="text-emerald-400" />
            <span>Scan QR from Photo</span>
          </button>
        </div>
      )}
    </div>
  );
}
