/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { 
  Building2, Ticket, Sparkles, ArrowRight, 
  CheckCircle2, Lock, Mail, User, ShieldCheck, 
  KeyRound, AlertCircle, ArrowLeft, Zap, Eye, EyeOff, Globe, ChevronDown, Check
} from "lucide-react";
import { supabase, safeLocalStorageSet, sanitizeUserForStorage } from "../lib/supabase";
import { useLanguage } from "../lib/i18n";

export default function AuthView({ 
  onAuthSuccess, 
  onClose, 
  onGoToHome,
  initialMode = "signin" 
}) {
  const { t, lang, setLang, isRTL, languages } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(initialMode); // "signin" | "signup" | "forgot-password" | "check-email"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState("organizer"); // "organizer" | "attendee"
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [tempUser, setTempUser] = useState(null);

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
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/?view=events-hub` : undefined;
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

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: selectedRole,
            },
          },
        });

        if (authError) {
          throw authError;
        }

        const authUser = authData?.user;
        const userId = authUser?.id || `user-${Date.now()}`;
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0b5cdb&color=fff`;

        // 2. Create / Upsert Profile in 'public.profiles'
        const dbRole = selectedRole === "visitor" || selectedRole === "attendee" ? "attendee" : "organizer";
        const profilePayload = {
          id: userId,
          email: email.trim(),
          full_name: fullName.trim(),
          role: dbRole,
          avatar_url: avatarUrl,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
        } catch (profileErr) {
          console.warn("Profile sync warning:", profileErr);
        }

        // 3. Handle Email Confirmation if required
        if (authData?.session === null && authUser && !authUser.confirmed_at) {
          const tempUserData = {
            id: userId,
            email: email.trim(),
            fullName: fullName.trim(),
            role: selectedRole === "attendee" ? "visitor" : selectedRole,
            avatar: avatarUrl,
          };
          setTempUser(tempUserData);
          setAuthMode("check-email");
          setLoading(false);
          return;
        }

        // Active Session -> Proceed
        const createdUser = {
          id: userId,
          email: email.trim(),
          fullName: fullName.trim(),
          role: selectedRole === "attendee" ? "visitor" : selectedRole,
          avatar: avatarUrl,
        };

        safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(createdUser));
        onAuthSuccess(createdUser);

      } else {
        // Sign in
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (authError) {
          throw authError;
        }

        const authUser = authData?.user;
        const userId = authUser?.id;

        // Fetch User Profile from 'public.profiles'
        let userProfile = null;
        if (userId) {
          try {
            const { data: prof } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle();
            userProfile = prof;
          } catch (e) {
            console.warn("Fetch profile warning:", e);
          }
        }

        const retrievedName = userProfile?.full_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || email.split("@")[0] || "Eventzone User";
        const retrievedRole = userProfile?.role || authUser?.user_metadata?.role || "organizer";
        const retrievedAvatar = userProfile?.avatar_url || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(retrievedName)}&background=0b5cdb&color=fff`;

        const signedInUser = {
          id: userId || `user-${Date.now()}`,
          email: email.trim(),
          fullName: retrievedName,
          role: retrievedRole === "attendee" || retrievedRole === "visitor" ? "visitor" : "organizer",
          companyName: userProfile?.company_name || "",
          jobTitle: userProfile?.job_title || "",
          phone: userProfile?.phone || "",
          avatar: retrievedAvatar,
          isAdmin: !!userProfile?.is_admin,
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
    <div className="min-h-screen w-full relative bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-8 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
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

      {/* Top Left Eventzone Logo */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
        <button
          type="button"
          onClick={handleReturnHome}
          className="flex items-center gap-2 p-1 transition-opacity hover:opacity-80 cursor-pointer group bg-transparent border-0 outline-none"
          title="Return to Home"
        >
          <img 
            src="https://i.imgur.com/jFDrQbM.png" 
            alt="Eventzone" 
            style={{ height: '28px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }}
            className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </button>
      </div>

      {/* Top Right Language Selector */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
        <div className="relative">
          {(() => {
            const curLang = languages.find(l => l.code === lang) || languages[0];
            return (
              <button
                onClick={() => setLangMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Change Language"
              >
                <img src={curLang?.icon || "https://i.imgur.com/NXtMImD.png"} alt={lang} className="w-5 h-5 object-contain shrink-0" />
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
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    lang === item.code 
                      ? "bg-blue-50 text-blue-600 font-bold" 
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={item.icon} alt={item.code} className="w-5 h-5 object-contain shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {lang === item.code && <Check size={12} className="text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Authentication Card (Light Mode & Clean, Centered Horizontally) */}
      <div className="relative z-10 w-full max-w-[440px] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-300/40 my-auto">
        {authMode === "check-email" ? (
          /* Email Verification Notice */
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <Mail size={28} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Check your email
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              We sent a verification link to <strong className="text-slate-800">{email}</strong>. Please check your inbox to activate your account.
            </p>

            <button
              type="button"
              onClick={() => {
                if (tempUser) {
                  safeLocalStorageSet("eventzone_user", sanitizeUserForStorage(tempUser));
                  onAuthSuccess(tempUser);
                } else {
                  setAuthMode("signin");
                }
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer mt-2"
            >
              Continue to Eventzone
            </button>

            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer block mx-auto pt-2"
            >
              Back to Sign In
            </button>
          </div>
        ) : authMode === "forgot-password" ? (
          /* Forgot Password View */
          <div className="space-y-5 text-left animate-fade-in">
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

            <form onSubmit={handleForgotPassword} className="space-y-4">
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
          <div className="space-y-5 text-left animate-fade-in">
            {/* Clean Switcher Tabs */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setErrorMsg(""); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
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
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  authMode === "signup" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("auth.signUpButton", "Create Account")}
              </button>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {authMode === "signin" ? t("auth.welcomeBack", "Welcome back") : t("auth.createAccount", "Create your account")}
              </h2>
              <p className="text-slate-500 text-xs mt-1">
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
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative text-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <span className="relative px-3 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Or with email
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === "signup" && (
                <>
                  {/* Role Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {t("auth.iAmOrganizer", "Account Type")}
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("organizer")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
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
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          selectedRole === "attendee"
                            ? "bg-white text-emerald-600 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {t("nav.roleVisitor", "Visitor")}
                      </button>
                    </div>
                  </div>

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
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
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
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
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
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
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
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 mt-1"
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
      <div className="relative z-10 text-xs text-slate-400 flex items-center justify-center gap-4 mt-6">
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
