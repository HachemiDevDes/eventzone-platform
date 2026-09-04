import crypto from "crypto";

/**
 * Helper to fetch Chargily Secret Key from environment variables.
 */
export function getChargilySecretKey() {
  const key = process.env.CHARGILY_SECRET_KEY;
  if (!key) {
    console.warn("CHARGILY_SECRET_KEY is not defined in environment variables.");
  }
  return key || "";
}

/**
 * Determines Chargily API v2 base URL based on key prefix or mode.
 */
export function getChargilyBaseUrl() {
  const secretKey = getChargilySecretKey();
  const isTest = secretKey.startsWith("test_") || process.env.CHARGILY_MODE === "test";
  return isTest
    ? "https://pay.chargily.net/test/api/v2"
    : "https://pay.chargily.net/api/v2";
}

/**
 * Creates a checkout session with Chargily Pay API v2.
 *
 * @param {Object} params
 * @param {number} params.amount - Amount in DZD (must be >= 100)
 * @param {string} [params.currency='dzd'] - Currency code
 * @param {string} params.success_url - Redirect URL upon payment success
 * @param {string} [params.failure_url] - Redirect URL upon payment failure/cancellation
 * @param {string} [params.webhook_endpoint] - URL for Chargily server webhook
 * @param {string} [params.description] - Description of item or pass
 * @param {Array|Object} [params.metadata] - Custom metadata stored with the checkout
 * @param {Object} [params.customer] - Optional customer info
 */
export async function createChargilyCheckout({
  amount,
  currency = "dzd",
  success_url,
  failure_url,
  webhook_endpoint,
  description,
  metadata = [],
  locale,
}) {
  const secretKey = getChargilySecretKey();
  if (!secretKey) {
    throw new Error("Chargily Secret Key is not configured. Please set CHARGILY_SECRET_KEY in your environment.");
  }

  const baseUrl = getChargilyBaseUrl();
  const endpoint = `${baseUrl}/checkouts`;

  // Chargily API v2 payload schema
  const bodyPayload = {
    amount: Math.round(Number(amount)),
    currency: (currency || "dzd").toLowerCase(),
    success_url,
    failure_url: failure_url || success_url,
    ...(webhook_endpoint ? { webhook_endpoint } : {}),
    ...(description ? { description } : {}),
    ...(metadata && (Array.isArray(metadata) ? metadata.length > 0 : Object.keys(metadata).length > 0) ? { metadata } : {}),
    ...(locale ? { locale } : {}),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  const responseText = await response.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse Chargily response JSON:", responseText);
    throw new Error(`Invalid response from Chargily API: ${responseText.substring(0, 150)}`);
  }

  if (!response.ok) {
    console.error("Chargily API checkout creation error:", responseData);
    const msg = responseData?.message || responseData?.error || responseText;
    throw new Error(`Chargily checkout failed: ${msg}`);
  }

  return responseData;
}

/**
 * Retrieves a checkout from Chargily Pay API v2.
 *
 * @param {string} checkoutId - The Chargily checkout UUID
 */
export async function getChargilyCheckout(checkoutId) {
  const secretKey = getChargilySecretKey();
  if (!secretKey) {
    throw new Error("Chargily Secret Key is not configured.");
  }

  const baseUrl = getChargilyBaseUrl();
  const endpoint = `${baseUrl}/checkouts/${checkoutId}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Chargily checkout: ${errorText}`);
  }

  return await response.json();
}

/**
 * Verifies the HMAC-SHA256 signature from Chargily webhook.
 *
 * @param {string} rawBody - Exact raw payload string received in request
 * @param {string} signatureHeader - The 'signature' header value from Chargily
 * @returns {boolean} True if signature is authentic
 */
export function verifyChargilySignature(rawBody, signatureHeader) {
  const secretKey = getChargilySecretKey();
  if (!secretKey || !signatureHeader || !rawBody) {
    return false;
  }

  try {
    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawBody)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signatureHeader, "utf8");
    const compBuffer = Buffer.from(computedSignature, "utf8");

    if (sigBuffer.length !== compBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, compBuffer);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
