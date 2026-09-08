/**
 * IndexNow Instant Search Engine Indexing Utility for Eventzone.
 * Submits published event URLs and directory changes directly to Microsoft Bing, Yandex,
 * and participating IndexNow search engine nodes.
 */

const INDEXNOW_HOST = "eventzone.pro";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "eventzone2026indexnowkey";

/**
 * Submit one or more URLs to the IndexNow protocol.
 * @param {string[]|string} urls - Array of absolute or relative URLs to submit.
 */
export async function submitToIndexNow(urls = []) {
  const urlList = Array.isArray(urls) ? urls : [urls];
  if (urlList.length === 0) {
    return { success: false, reason: "No URLs provided" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${INDEXNOW_HOST}`;
  const host = baseUrl.replace(/^https?:\/\//, "").split("/")[0];

  const formattedUrls = urlList.map(u => {
    if (typeof u !== "string") return null;
    const clean = u.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      return clean;
    }
    return `${baseUrl}${clean.startsWith("/") ? "" : "/"}${clean}`;
  }).filter(Boolean);

  if (formattedUrls.length === 0) {
    return { success: false, reason: "No valid URLs formatted" };
  }

  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
    urlList: formattedUrls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    // 200 OK or 202 Accepted means IndexNow received the batch
    const isSuccess = res.status === 200 || res.status === 202;
    return {
      success: isSuccess,
      status: res.status,
      count: formattedUrls.length,
      urls: formattedUrls,
    };
  } catch (err) {
    console.warn("IndexNow request error:", err);
    return {
      success: false,
      error: err?.message || String(err),
      urls: formattedUrls,
    };
  }
}
