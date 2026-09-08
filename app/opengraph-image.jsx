import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Eventzone — All-in-One Event Management Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "linear-gradient(135deg, #020617 0%, #0b132b 55%, #1c1954 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow Spheres */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-100px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "rgba(37, 99, 235, 0.22)",
            filter: "blur(100px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "550px",
            height: "550px",
            borderRadius: "50%",
            background: "rgba(147, 51, 234, 0.18)",
            filter: "blur(110px)",
          }}
        />

        {/* Top Branding Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #2563eb, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "28px",
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
              }}
            >
              E
            </div>
            <span
              style={{
                fontSize: "36px",
                fontWeight: "900",
                letterSpacing: "-1px",
                color: "#ffffff",
              }}
            >
              Eventzone
            </span>
          </div>

          <div
            style={{
              padding: "10px 24px",
              borderRadius: "9999px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              fontSize: "15px",
              fontWeight: "700",
              color: "#93c5fd",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Conferences &amp; Expos Platform
          </div>
        </div>

        {/* Hero Title & Value Proposition */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "1000px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: "900",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              color: "#ffffff",
            }}
          >
            Discover Events, Conferences &amp; Expos
          </div>

          <div
            style={{
              fontSize: "24px",
              fontWeight: "400",
              color: "#cbd5e1",
              lineHeight: 1.45,
              maxWidth: "850px",
            }}
          >
            The modern platform to explore upcoming summits, design interactive 2D floor plans, book digital badge passes, and connect with attendees.
          </div>
        </div>

        {/* Feature Badges Footer */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", color: "#94a3b8" }}>
              <span style={{ color: "#38bdf8", fontWeight: "900" }}>+</span>
              <span>Interactive 2D Floor Plans</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", color: "#94a3b8" }}>
              <span style={{ color: "#38bdf8", fontWeight: "900" }}>+</span>
              <span>Instant QR Badges &amp; Tickets</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", color: "#94a3b8" }}>
              <span style={{ color: "#38bdf8", fontWeight: "900" }}>+</span>
              <span>Real-Time Agendas</span>
            </div>
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#60a5fa",
              letterSpacing: "0.5px",
            }}
          >
            eventzone.pro
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
