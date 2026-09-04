/**
 * Cloudflare Turnstile Server-Side Siteverify
 * Validates bot-defense tokens from public registrations, ticket bookings, and forms.
 */
export async function verifyTurnstileToken(token, clientIp = "") {
  const secret = process.env.TURNSTILE_SECRET;
  
  // If Turnstile is not configured in the environment, allow bypass gracefully (e.g. local offline dev)
  if (!secret) {
    return { success: true, bypassed: true };
  }

  if (!token || typeof token !== "string" || token.length > 2048) {
    return { success: false, error: "Invalid or missing Turnstile security token." };
  }

  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES || "localhost,127.0.0.1,eventzone.pro")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { success: false, error: `Siteverify failed with status ${res.status}` };
    }

    const data = await res.json();

    if (!data.success) {
      return { 
        success: false, 
        error: "Bot verification failed.", 
        errorCodes: data["error-codes"] || [] 
      };
    }

    // Verify hostname matches allowed domains
    if (data.hostname && !expectedHostnames.has(data.hostname.toLowerCase()) && !expectedHostnames.has("*")) {
      return { success: false, error: `Unauthorized security hostname: ${data.hostname}` };
    }

    return { 
      success: true, 
      action: data.action, 
      hostname: data.hostname,
      timestamp: data.challenge_ts 
    };
  } catch (err) {
    console.warn("Turnstile siteverify error:", err);
    // In event of network timeouts to Cloudflare, fail safe or report error
    return { success: false, error: err.message || "Security challenge verification timed out." };
  }
}
