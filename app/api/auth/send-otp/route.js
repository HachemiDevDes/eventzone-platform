import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceSupabase } from "@/lib/apiAuth";
import { sendVerificationOtpEmail } from "@/lib/mailer";

const OTP_SECRET = process.env.OTP_SECRET || "eventzone_secure_otp_salt_2026";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, fullName, role = "organizer", password } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(fullName || "").trim();
    const cleanRole = role === "attendee" || role === "visitor" ? "attendee" : "organizer";

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!cleanName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Check if user already exists and has a confirmed account
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .ilike("email", cleanEmail)
      .limit(1)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    // 2. Register unconfirmed user in Supabase Auth (safe password hashing)
    // If the user already signed up previously but never confirmed, Supabase handles it gracefully
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            role: cleanRole,
          },
        },
      });

      if (signUpError && !signUpError.message?.toLowerCase().includes("already registered")) {
        console.warn("Supabase auth signUp notice:", signUpError.message);
      }
    } catch (authErr) {
      console.warn("Supabase signUp warning:", authErr);
    }

    // 3. Generate cryptographically secure 6-digit OTP code
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto
      .createHash("sha256")
      .update(`${cleanEmail}:${otp}:${OTP_SECRET}`)
      .digest("hex");

    // 4. Store pending OTP in PostgreSQL
    const { error: rpcError } = await supabase.rpc("create_email_otp", {
      p_email: cleanEmail,
      p_otp_hash: otpHash,
      p_full_name: cleanName,
      p_role: cleanRole,
    });

    if (rpcError) {
      console.error("Failed to create email OTP in database:", rpcError);
      return NextResponse.json(
        { error: "Failed to initialize verification. Please try again." },
        { status: 500 }
      );
    }

    // 5. Dispatch 6-digit OTP email via Eventzone's dedicated SMTP transporter
    await sendVerificationOtpEmail({
      to: cleanEmail,
      otp: otp,
      fullName: cleanName,
    });

    return NextResponse.json({
      success: true,
      message: "A 6-digit verification code has been sent to your email.",
    });
  } catch (err) {
    console.error("POST /api/auth/send-otp error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send verification code." },
      { status: 500 }
    );
  }
}
