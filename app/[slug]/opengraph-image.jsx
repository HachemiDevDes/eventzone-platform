import { ImageResponse } from "next/og";
import { fetchEventDetails } from "../../lib/db";

export const runtime = "nodejs";
export const alt = "Eventzone Event Preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "";

  let event = null;
  try {
    event = await fetchEventDetails(slug);
  } catch (e) {}

  const title = event?.title || "Upcoming Conference & Summit";
  const dateStr = event?.startDate 
    ? (event?.endDate && event.endDate !== event.startDate ? `${event.startDate} – ${event.endDate}` : event.startDate)
    : "Date Announced on Eventzone";
  const location = event?.location || event?.venueName || (event?.type === "Virtual" ? "Online Virtual Event" : "Algiers, Algeria");
  const category = event?.category || "Technology & Business";
  const tagline = event?.tagline || event?.description?.slice(0, 100) || "Join industry leaders, founders, and delegates for high-impact keynotes and networking.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e1b4b 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle Decorative Ambient Glows */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.18)",
            filter: "blur(90px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.15)",
            filter: "blur(90px)",
          }}
        />

        {/* Top Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "22px",
                boxShadow: "0 8px 20px rgba(37, 99, 235, 0.4)",
              }}
            >
              E
            </div>
            <span
              style={{
                fontSize: "28px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                color: "#f8fafc",
              }}
            >
              Eventzone
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "9999px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              fontSize: "14px",
              fontWeight: "700",
              color: "#93c5fd",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Verified Summit
          </div>
        </div>

        {/* Middle Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "950px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "#60a5fa",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
            }}
          >
            {category}
          </div>

          <div
            style={{
              fontSize: title.length > 40 ? "46px" : "56px",
              fontWeight: "900",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              color: "#ffffff",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: "20px",
              fontWeight: "400",
              color: "#94a3b8",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Bottom Details Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: "24px",
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "16px",
                color: "#e2e8f0",
                fontWeight: "600",
              }}
            >
              <span>📅</span>
              <span>{dateStr}</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "16px",
                color: "#cbd5e1",
                fontWeight: "500",
              }}
            >
              <span>📍</span>
              <span>{location}</span>
            </div>
          </div>

          <div
            style={{
              padding: "12px 28px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "800",
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.35)",
            }}
          >
            View Event &amp; Tickets →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
