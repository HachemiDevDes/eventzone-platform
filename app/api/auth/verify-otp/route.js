import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceSupabase } from "@/lib/apiAuth";

const OTP_SECRET = process.env.OTP_SECRET || "eventzone_secure_otp_salt_2026";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim().replace(/\D/g, "");

    if (!cleanEmail) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      return NextResponse.json(
        { error: "A 6-digit verification code is required." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Compute hash of the entered OTP
    const otpHash = crypto
      .createHash("sha256")
      .update(`${cleanEmail}:${cleanOtp}:${OTP_SECRET}`)
      .digest("hex");

    // 2. Call stored procedure to atomically verify code, confirm user, and create profile
    const { data: rpcResult, error: rpcError } = await supabase.rpc("verify_email_otp", {
      p_email: cleanEmail,
      p_otp_hash: otpHash,
    });

    if (rpcError) {
      console.error("verify_email_otp RPC error:", rpcError);
      return NextResponse.json(
        { error: "Database error during verification. Please try again." },
        { status: 500 }
      );
    }

    if (!rpcResult || !rpcResult.success) {
      return NextResponse.json(
        {
          error: rpcResult?.error || "Invalid or expired verification code.",
          remainingAttempts: rpcResult?.remaining_attempts,
        },
        { status: 400 }
      );
    }

    // 3. Dispatch organizer registration notification to super admin if applicable
    if (rpcResult.role === "organizer") {
      try {
        const origin = request.nextUrl.origin || "https://eventzone.pro";
        fetch(`${origin}/api/email/admin-notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "organizer_joined",
            organizer: {
              id: rpcResult.user_id,
              fullName: rpcResult.full_name,
              email: rpcResult.email,
              role: "organizer",
              createdAt: new Date().toISOString(),
            },
          }),
        }).catch((e) => console.warn("Admin notification dispatch notice:", e));
      } catch (notifyErr) {
        console.warn("Admin notification trigger warning:", notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Email successfully verified and account created.",
      user: {
        id: rpcResult.user_id,
        email: rpcResult.email,
        fullName: rpcResult.full_name,
        role: rpcResult.role,
      },
    });
  } catch (err) {
    console.error("POST /api/auth/verify-otp error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify code." },
      { status: 500 }
    );
  }
}
