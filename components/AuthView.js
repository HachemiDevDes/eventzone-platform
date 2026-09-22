/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, Ticket, Sparkles, ArrowRight, 
  CheckCircle2, Lock, Mail, User, ShieldCheck, 
  KeyRound, AlertCircle, ArrowLeft, Zap, Eye, EyeOff, Globe, ChevronDown, Check, Users
} from "lucide-react";
import { supabase, safeLocalStorageSet, sanitizeUserForStorage, cleanupLocalStorageQuota } from "../lib/supabase";
import { useLanguage } from "../lib/i18n";
import { isPlatformSuperAdminEmail } from "../lib/constants";

export default function AuthView({ 
  onAuthSuccess, 
  onClose, 
  onGoToHome,
  initialMode = "signin",
  initialEmail = "",
  invitedEventId = null,
  invitedRole = null,
  invitedEventTitle = null
}) {
  const { t, lang, setLang, isRTL, languages } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Detect invitation params from props or search parameters
  const [teamInviteInfo, setTeamInviteInfo] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const inviteToken = searchParams.get("inviteToken") || searchParams.get("token");
      const eventId = invitedEventId || searchParams.get("inviteEventId") || searchParams.get("eventId");
      const role = invitedRole || searchParams.get("teamRole") || searchParams.get("role");
      const eventTitle = invitedEventTitle || searchParams.get("eventTitle");
      if (inviteToken || searchParams.has("teamEmail") || searchParams.has("inviteEventId")) {
        return {
          inviteToken,
          eventId,
          role: role || "Team Member",
          eventTitle: eventTitle || "your event"
        };
      }
    }
    return null;
  });

  const [authMode, setAuthMode] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const modeParam = searchParams.get("auth") || searchParams.get("mode");
      if (modeParam === "signup" || modeParam === "register") return "signup";
      if (modeParam === "signin" || modeParam === "login") return "signin";
    }
    return initialMode || "signin";
  }); // "signin" | "signup" | "forgot-password" | "check-email"
  
  const [pendingEventTitle, setPendingEventTitle] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("eventzone_pending_event_creation");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.title || "your event";
        }
      } catch (e) {}
    }
    return null;
  });

  const [email, setEmail] = useState(() => {
    if (initialEmail) return initialEmail;
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlEmail = searchParams.get("email") || searchParams.get("teamEmail") || searchParams.get("invitedEmail");
      if (urlEmail) return urlEmail.trim().toLowerCase();
      try {
        const saved = sessionStorage.getItem("eventzone_pending_event_creation");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.hostEmail && parsed.hostEmail !== "organizer@eventzone.io") {
            return parsed.hostEmail;
          }
        }
      } catch (e) {}
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlName = searchParams.get("name") || searchParams.get("teamName");
      if (urlName) return urlName;
      try {
        const saved = sessionStorage.getItem("eventzone_pending_event_creation");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.hostName && parsed.hostName !== "Event Organizer") {
            return parsed.hostName;
          }
        }
      } catch (e) {}
    }
    return "";
  });
  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("inviteToken") || searchParams.get("teamEmail") || searchParams.get("inviteEventId")) {
        return "organizer";
      }
    }
    return "organizer";
  }); // "organizer" | "attendee"
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [tempUser, setTempUser] = useState(null);

  // 6-digit OTP verification state
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if ((authMode === "verify-otp" || authMode === "check-email") && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [authMode, otpCountdown]);

  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split("");
      const updated = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        updated[i] = chars[i] || "";
      }
      setOtpDigits(updated);
      const nextFocus = Math.min(chars.length, 5);
      if (otpInputRefs.current[nextFocus]) {
        otpInputRefs.current[nextFocus].focus();
      }
      return;
    }

    const updated = [...otpDigits];
    updated[index] = cleanVal[cleanVal.length - 1];
    setOtpDigits(updated);

    if (index < 5) {
      if (otpInputRefs.current[index + 1]) {
        otpInputRefs.current[index + 1].focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
        if (otpInputRefs.current[index - 1]) {
          otpInputRefs.current[index - 1].focus();
        }
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const chars = paste.split("");
    const updated = ["", "", "", "", "", ""];
    for (let i = 0; i < chars.length; i++) {
      updated[i] = chars[i];
    }
    setOtpDigits(updated);
    const focusIdx = Math.min(chars.length, 5);
    if (otpInputRefs.current[focusIdx]) {
      otpInputRefs.current[focusIdx].focus();
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isResendingOtp) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsResendingOtp(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          role: selectedRole,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not resend verification code.");
      }

      setOtpDigits(["", "", "", "", "", ""]);
      setOtpCountdown(60);
      setSuccessMsg(`A new 6-digit code has been sent to ${email.trim()}`);
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setErrorMsg(err.message || "Failed to resend code.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredOtp = otpDigits.join("").trim();
    if (enteredOtp.length !== 6) {
      setErrorMsg("Please enter all 6 digits of your verification code.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: enteredOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Please check the code.");
      }

      // Automatically sign in now that email is verified
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInErr) {
        console.warn("Auto sign-in notice:", signInErr);
      }

      const authUser = signInData?.user;
      const userId = authUser?.id || data?.user?.id;
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "User")}&background=0b5cdb&color=fff`;

      const verifiedUser = {
        id: userId,
        email: email.trim(),
        fullName: fullName.trim() || data?.user?.fullName || "Eventzone User",
        role: selectedRole === "attendee" ? "visitor" : selectedRole,
        avatar: avatarUrl,
      };

      safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(verifiedUser));
      onAuthSuccess(verifiedUser);
    } catch (err) {
      console.error("OTP verification error:", err);
      setErrorMsg(err.message || "Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = () => {
    if (onClose) onClose();
    else if (onGoToHome) onGoToHome();
    else if (typeof window !== "undefined") window.location.href = "/";
  };

  // Quick Demo Logins for Instant Testing
  const handleQuickDemo = (role) => {
    const demoUser = {
      id: role === "organizer" ? "demo-organizer-01" : "demo-visitor-01",
      email: role === "organizer" ? "organizer@eventzone.io" : "visitor@eventzone.io",
      fullName: role === "organizer" ? "Hachemi (Organizer)" : "Sarah Visitor",
      role: role === "attendee" ? "visitor" : role,
      companyName: role === "organizer" ? "Eventzone Platforms" : "Innovation Labs",
      jobTitle: role === "organizer" ? "Event Director" : "Senior Delegate",
      avatar: role === "organizer" 
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
        : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    };
    safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(demoUser));
    onAuthSuccess(demoUser);
  };

  // Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setOauthLoading(true);
    try {
      cleanupLocalStorageQuota();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("eventzone_auth_return_view", "events-hub");
      }
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
      if (data?.url && typeof window !== "undefined") {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Google OAuth error:", err);
      setErrorMsg(err.message || "Google sign-in failed. Please try email login.");
      setOauthLoading(false);
    }
  };

  // Password Reset
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your email address to reset password.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });
      if (error) throw error;
      setSuccessMsg("Password reset link has been sent to your email!");
    } catch (err) {
      setErrorMsg(err.message || "Could not send reset email. Please verify the address.");
    } finally {
      setLoading(false);
    }
  };

  // Primary Email / Password Authentication
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (authMode === "signup") {
        if (!fullName.trim()) {
          setErrorMsg("Please enter your full name.");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match. Please re-enter.");
          setLoading(false);
          return;
        }

        // Mandatory 6-Digit Email OTP Verification
        // Do NOT create profile or grant session until OTP is confirmed!
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            fullName: fullName.trim(),
            role: selectedRole,
            password: password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to send verification code.");
        }

        setAuthMode("verify-otp");
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpCountdown(60);
        setErrorMsg("");
        setSuccessMsg(`A 6-digit verification code has been sent to ${email.trim()}`);
        setLoading(false);
        setTimeout(() => {
          if (otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus();
          }
        }, 100);
        return;

      } else {
        // Sign in
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes("email not confirmed")) {
            // Trigger 6-digit OTP dispatch and direct to verify-otp view
            fetch("/api/auth/send-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email.trim(),
                fullName: fullName.trim() || email.split("@")[0],
                role: selectedRole,
                password: password,
              }),
            }).catch(() => {});

            setAuthMode("verify-otp");
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpCountdown(60);
            setErrorMsg("Your email is not verified yet. We have sent a 6-digit verification code to your inbox.");
            setLoading(false);
            return;
          }
          throw authError;
        }

        const authUser = authData?.user;
        const userId = authUser?.id;

        // Security check: If user account is not confirmed, block dashboard access
        if (authUser && !authUser.confirmed_at && !authUser.email_confirmed_at) {
          await supabase.auth.signOut();
          fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              fullName: fullName.trim() || email.split("@")[0],
              role: selectedRole,
              password: password,
            }),
          }).catch(() => {});

          setAuthMode("verify-otp");
          setOtpDigits(["", "", "", "", "", ""]);
          setOtpCountdown(60);
          setErrorMsg("Your account is not confirmed yet. A 6-digit verification code has been sent to your email.");
          setLoading(false);
          return;
        }

        // Fetch User Profile from 'public.profiles'
        let directProfile = null;
        let userProfile = null;
        let siblingProfiles = [];
        if (userId) {
          try {
            const { data: prof } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle();
            directProfile = prof;
            userProfile = prof;
          } catch (e) {
            console.warn("Fetch profile warning:", e);
          }
        }

        if (email) {
          try {
            const { data: sibs } = await supabase
              .from("profiles")
              .select("*")
              .ilike("email", email.trim())
              .order("created_at", { ascending: true });
            if (Array.isArray(sibs) && sibs.length > 0) {
              siblingProfiles = sibs;
              if (!userProfile) {
                userProfile = sibs.find(s => s.role === 'organizer') || sibs[0];
              }
            }
          } catch (e) {}
        }

        const siblingWithQuota = siblingProfiles.find(s => {
          const sm = s.metadata || {};
          const ss = s.social_links || {};
          return (s.max_events !== undefined && s.max_events !== null) ||
                 (sm.max_events !== undefined && sm.max_events !== null) ||
                 (ss.max_events !== undefined && ss.max_events !== null);
        });

        const siblingWithDetails = siblingProfiles.find(s => s.company_name || s.phone || s.job_title);
        const retrievedName = userProfile?.full_name || siblingWithDetails?.full_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || email.split("@")[0] || "Eventzone User";
        const meta = userProfile?.metadata && typeof userProfile?.metadata === 'object' ? userProfile.metadata : {};
        const socials = typeof userProfile?.social_links === 'object' && userProfile?.social_links !== null && !Array.isArray(userProfile?.social_links) ? userProfile.social_links : {};
        const sibMeta = siblingWithQuota?.metadata && typeof siblingWithQuota?.metadata === 'object' ? siblingWithQuota.metadata : {};
        const sibSocials = typeof siblingWithQuota?.social_links === 'object' && siblingWithQuota?.social_links !== null ? siblingWithQuota.social_links : {};

        // Strict Super Admin Verification: ONLY direct DB profile role or recognized owner emails
        const isSuperAdmin = !!(
          (directProfile?.role === "super_admin" || directProfile?.is_admin === true) ||
          isPlatformSuperAdminEmail(email)
        );

        let rawMaxEvents = userProfile?.max_events !== undefined && userProfile?.max_events !== null
          ? userProfile.max_events
          : (meta.max_events !== undefined && meta.max_events !== null ? meta.max_events : (socials.max_events !== undefined && socials.max_events !== null ? socials.max_events : null));

        if (rawMaxEvents === null && siblingWithQuota) {
          rawMaxEvents = siblingWithQuota.max_events !== undefined && siblingWithQuota.max_events !== null
            ? siblingWithQuota.max_events
            : (sibMeta.max_events !== undefined && sibMeta.max_events !== null ? sibMeta.max_events : (sibSocials.max_events !== undefined && sibSocials.max_events !== null ? sibSocials.max_events : null));
        }

        let rawMaxAttendees = userProfile?.max_attendees !== undefined && userProfile?.max_attendees !== null
          ? userProfile.max_attendees
          : (meta.max_attendees !== undefined && meta.max_attendees !== null ? meta.max_attendees : (socials.max_attendees !== undefined && socials.max_attendees !== null ? socials.max_attendees : null));

        if (rawMaxAttendees === null && siblingWithQuota) {
          rawMaxAttendees = siblingWithQuota.max_attendees !== undefined && siblingWithQuota.max_attendees !== null
            ? siblingWithQuota.max_attendees
            : (sibMeta.max_attendees !== undefined && sibMeta.max_attendees !== null ? sibMeta.max_attendees : (sibSocials.max_attendees !== undefined && sibSocials.max_attendees !== null ? sibSocials.max_attendees : null));
        }

        const signedInUser = {
          id: userId || `user-${Date.now()}`,
          email: email.trim(),
          fullName: retrievedName,
          role: isSuperAdmin ? "super_admin" : (retrievedRole === "attendee" || retrievedRole === "visitor" ? "visitor" : "organizer"),
          companyName: userProfile?.company_name || "",
          jobTitle: userProfile?.job_title || "",
          phone: userProfile?.phone || "",
          avatar: retrievedAvatar,
          isAdmin: isSuperAdmin,
          isVerifiedAdmin: isSuperAdmin,
          maxEvents: rawMaxEvents !== null && rawMaxEvents !== undefined && rawMaxEvents !== "" ? Number(rawMaxEvents) : null,
          maxAttendees: rawMaxAttendees !== null && rawMaxAttendees !== undefined && rawMaxAttendees !== "" ? Number(rawMaxAttendees) : null,
          accountStatus: userProfile?.status || meta.status || socials.status || "active",
        };

        // Ensure profile exists in DB
        if (userId && !userProfile) {
          try {
            const dbRole = retrievedRole === "attendee" || retrievedRole === "visitor" ? "attendee" : "organizer";
            await supabase.from("profiles").upsert({
              id: userId,
              email: email.trim(),
              full_name: retrievedName,
              role: dbRole,
              avatar_url: retrievedAvatar,
              onboarding_completed: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "id" });

            if (dbRole === "organizer") {
              fetch("/api/email/admin-notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "organizer_joined",
                  organizer: {
                    id: userId,
                    fullName: retrievedName,
                    email: email.trim(),
                    role: "organizer",
                    createdAt: new Date().toISOString(),
                  }
                })
              }).catch(() => {});
            }
          } catch (e) {
            console.warn("Auto profile creation on login warning:", e);
          }
        }

        safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(signedInUser));
        onAuthSuccess(signedInUser);
      }
    } catch (err) {
      console.error("Auth error:", err);
      let message = err.message || "Authentication failed. Please check your credentials.";
      if (message.includes("Invalid login credentials")) {
        message = "Incorrect email or password. Please try again or use Demo login.";
      } else if (message.includes("Email not confirmed")) {
        message = "Please check your inbox and confirm your email address before signing in.";
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-slate-50 text-slate-900 flex flex-col justify-start sm:justify-center items-center px-3 sm:px-8 py-3 sm:py-8 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden overflow-y-auto">
      {/* Soft Picture Illustration Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80" 
          alt="Event Background" 
          className="w-full h-full object-cover filter blur-xs scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-slate-50/95 to-slate-100/90" />
      </div>

      {/* Ambient Soft Blue Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Navigation Header (Above Card, Never Overlaps) */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between px-1 sm:px-2 py-2 sm:py-4 relative z-20 shrink-0 mb-1 sm:mb-3">
        {/* Eventzone Logo */}
        <button
          type="button"
          onClick={handleReturnHome}
          className="flex items-center gap-2 p-1 transition-opacity hover:opacity-80 cursor-pointer group bg-transparent border-0 outline-none shrink-0"
          title="Return to Home"
        >
          <img 
            src="https://i.imgur.com/jFDrQbM.png" 
            alt="Eventzone" 
            style={{ height: '24px', width: 'auto', maxWidth: '130px' }}
            className="h-5 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </button>

        {/* Language Selector */}
        <div className="relative shrink-0">
          {(() => {
            const curLang = languages.find(l => l.code === lang) || languages[0];
            return (
              <button
                onClick={() => setLangMenuOpen(o => !o)}
                className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Change Language"
              >
                <img src={curLang?.icon || "https://i.imgur.com/NXtMImD.png"} alt={lang} className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain shrink-0" />
                <span className="uppercase tracking-wide font-extrabold text-[11px]">{lang}</span>
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>
            );
          })()}

          {langMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 animate-scale-up space-y-0.5">
              {languages.map(item => (
                <button
                  key={item.code}
                  onClick={() => {
                    setLang(item.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    lang === item.code 
                      ? "bg-blue-50 text-blue-600 font-bold" 
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={item.icon} alt={item.code} className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {lang === item.code && <Check size={12} className="text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4.5 sm:p-9 shadow-xl sm:shadow-2xl shadow-slate-300/40">
        {authMode === "verify-otp" || authMode === "check-email" ? (
          /* 6-Digit Email OTP Verification View */
          <div className="space-y-4 sm:space-y-5 text-start animate-fade-in">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs mb-3">
                <ShieldCheck size={28} className="text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {t("auth.verifyEmailTitle", "Verify Your Email")}
              </h2>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                {t("auth.enter6DigitOtp", "Enter the 6-digit verification code sent to")}{" "}
                <strong className="text-slate-800 font-bold break-all">{email}</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-[11px] text-blue-600 hover:underline font-bold mt-1 inline-block cursor-pointer"
              >
                Change email address
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  6-Digit Verification Code
                </label>
                <div 
                  className="flex items-center justify-center gap-1.5 sm:gap-2.5"
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-extrabold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join("").trim().length !== 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Confirm & Activate Account</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400 font-medium">
                  {otpCountdown > 0 ? (
                    `Resend code in ${otpCountdown}s`
                  ) : (
                    "Didn't receive the code?"
                  )}
                </span>
                <button
                  type="button"
                  disabled={otpCountdown > 0 || isResendingOtp}
                  onClick={handleResendOtp}
                  className={`font-bold transition-all ${
                    otpCountdown > 0 || isResendingOtp
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-blue-600 hover:underline cursor-pointer"
                  }`}
                >
                  {isResendingOtp ? "Sending..." : "Resend Code"}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          </div>
        ) : authMode === "forgot-password" ? (
          /* Forgot Password View */
          <div className="space-y-4 sm:space-y-5 text-start animate-fade-in">
            <div>
              <button 
                onClick={() => { setAuthMode("signin"); setErrorMsg(""); setSuccessMsg(""); }} 
                className="inline-flex items-center text-slate-400 hover:text-slate-800 text-xs font-semibold mb-3 cursor-pointer"
              >
                Back to Sign In
              </button>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reset password</h2>
              <p className="text-slate-500 text-xs mt-1">
                Enter your email address to receive reset instructions.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        ) : (
          /* Standard Sign In / Create Account */
          <div className="space-y-4 sm:space-y-5 text-start animate-fade-in">
            {/* Team Invitation Notification Banner */}
            {teamInviteInfo && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-200 mt-0.5">
                  <Users size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-blue-950 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                    <span>Official Team Invitation</span>
                    {teamInviteInfo.role && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {teamInviteInfo.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-900 font-medium mt-1 leading-relaxed">
                    You were invited to join the organizing team for <strong>{teamInviteInfo.eventTitle}</strong>. 
                    {authMode === "signup" 
                      ? " Create your password below to accept and access your workspace." 
                      : " Sign in to access your event dashboard."}
                  </p>
                </div>
              </div>
            )}

            {/* Clean Switcher Tabs */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl sm:rounded-2xl">
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setErrorMsg(""); }}
                className={`py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  authMode === "signin" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("auth.signInButton", "Sign In")}
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode("signup"); setErrorMsg(""); }}
                className={`py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  authMode === "signup" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("auth.signUpButton", "Create Account")}
              </button>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {authMode === "signin" ? t("auth.welcomeBack", "Welcome back") : t("auth.createAccount", "Create your account")}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 sm:mt-1 leading-relaxed">
                {authMode === "signin" 
                  ? t("auth.signInDesc", "Sign in to access your conferences, floor plans and tickets.")
                  : t("auth.signUpDesc", "Join the premier platform for summits, expos and digital badges.")}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative text-center my-1.5 sm:my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <span className="relative px-3 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Or with email
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3 sm:space-y-3.5">
              {authMode === "signup" && (
                <>
                  {/* Role Selector (Hidden if arriving from an official team invite) */}
                  {!teamInviteInfo && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {t("auth.iAmOrganizer", "Account Type")}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSelectedRole("organizer")}
                          className={`py-1.5 sm:py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            selectedRole === "organizer"
                              ? "bg-white text-blue-600 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {t("nav.roleOrganizer", "Organizer")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole("attendee")}
                          className={`py-1.5 sm:py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            selectedRole === "attendee"
                              ? "bg-white text-emerald-600 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {t("nav.roleVisitor", "Visitor")}
                        </button>
                      </div>
                    </div>
                  )}


                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {t("auth.fullName", "Full Name")}
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("auth.email", "Email Address")}
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t("auth.password", "Password")}
                  </label>
                  {authMode === "signin" && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode("forgot-password"); setErrorMsg(""); }}
                      className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      {t("auth.forgotPassword", "Forgot?")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password on Sign Up */}
              {authMode === "signup" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t("auth.confirmPassword", "Confirm Password")}
                  </label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 mt-1"
              >
                {loading 
                  ? t("common.loading", "Please wait...") 
                  : (authMode === "signin" ? t("auth.signInButton", "Sign In") : t("auth.signUpButton", "Create Account"))}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Clean Bottom Footer */}
      <div className="relative z-10 text-[11px] sm:text-xs text-slate-400 flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6 pb-8 sm:pb-4 shrink-0">
        <span>© 2026 Eventzone</span>
        <span>•</span>
        <span className="hover:text-slate-600 cursor-pointer">Privacy</span>
        <span>•</span>
        <span className="hover:text-slate-600 cursor-pointer">Terms</span>
        <span>•</span>
        <span className="hover:text-slate-600 cursor-pointer">Support</span>
      </div>
    </div>
  );
}
