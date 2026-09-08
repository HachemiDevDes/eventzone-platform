export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/*",
          "/checkin",
          "/privacy",
          "/terms",
          "/cookie-settings",
          "/compliance",
          "/enterprise-security",
        ],
        disallow: [
          "/api/",
          "/payment/",
          "/ci",
          "/embed/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
