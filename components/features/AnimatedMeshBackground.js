"use client";

import React from "react";

/**
 * AnimatedMeshBackground
 * A blurry, low-opacity, beautiful blue animated mesh background.
 * Uses hardware-accelerated CSS transforms and smooth floating blobs for an ethereal, modern glow.
 */
export default function AnimatedMeshBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
    >
      {/* Mesh Blob 1 - Top Right - Azure & Royal Blue */}
      <div
        className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full animate-mesh-1"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.35) 0%, rgba(56, 189, 248, 0.22) 45%, rgba(99, 102, 241, 0) 70%)",
          filter: "blur(90px)",
          WebkitFilter: "blur(90px)",
          willChange: "transform",
        }}
      />

      {/* Mesh Blob 2 - Mid Left - Deep Blue & Soft Indigo */}
      <div
        className="absolute top-[25%] -left-[10%] w-[550px] h-[550px] sm:w-[750px] sm:h-[750px] rounded-full animate-mesh-2"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(29, 78, 216, 0.30) 0%, rgba(79, 70, 229, 0.20) 45%, rgba(14, 165, 233, 0) 70%)",
          filter: "blur(100px)",
          WebkitFilter: "blur(100px)",
          willChange: "transform",
        }}
      />

      {/* Mesh Blob 3 - Middle / Lower Right - Sky Blue & Cobalt */}
      <div
        className="absolute top-[52%] -right-[8%] w-[600px] h-[500px] sm:w-[800px] sm:h-[700px] rounded-full animate-mesh-3"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.28) 0%, rgba(37, 99, 235, 0.24) 45%, rgba(59, 130, 246, 0) 70%)",
          filter: "blur(95px)",
          WebkitFilter: "blur(95px)",
          willChange: "transform",
        }}
      />

      {/* Mesh Blob 4 - Bottom Center / Left - Cyan & Azure */}
      <div
        className="absolute -bottom-[10%] left-[15%] w-[650px] h-[600px] sm:w-[850px] sm:h-[750px] rounded-full animate-mesh-1"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.20) 45%, rgba(99, 102, 241, 0) 70%)",
          filter: "blur(105px)",
          WebkitFilter: "blur(105px)",
          animationDuration: "25s",
          willChange: "transform",
        }}
      />
    </div>
  );
}
