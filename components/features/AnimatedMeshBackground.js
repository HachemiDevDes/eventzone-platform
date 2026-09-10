"use client";

import React from "react";

/**
 * AnimatedMeshBackground
 * A vibrant, clearly moving, blurry blue animated mesh background.
 * Uses hardware-accelerated CSS transforms, liquid morphing, and continuous multi-axis motion.
 */
export default function AnimatedMeshBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
    >
      {/* Mesh Blob 1 - Top Right - Soft Sky Azure */}
      <div
        className="absolute -top-[12%] -right-[8%] w-[600px] h-[600px] sm:w-[850px] sm:h-[850px] rounded-full animate-mesh-1"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.24) 0%, rgba(186, 230, 253, 0.18) 45%, rgba(147, 197, 253, 0) 75%)",
          filter: "blur(95px)",
          WebkitFilter: "blur(95px)",
          willChange: "transform, border-radius",
        }}
      />

      {/* Mesh Blob 2 - Mid Left - Soft Mist Cyan & Powder Blue */}
      <div
        className="absolute top-[20%] -left-[10%] w-[550px] h-[550px] sm:w-[800px] sm:h-[800px] rounded-full animate-mesh-2"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.22) 0%, rgba(147, 197, 253, 0.18) 45%, rgba(199, 210, 254, 0) 75%)",
          filter: "blur(100px)",
          WebkitFilter: "blur(100px)",
          willChange: "transform, border-radius",
        }}
      />

      {/* Mesh Blob 3 - Middle / Lower Right - Soft Periwinkle & Light Blue */}
      <div
        className="absolute top-[48%] -right-[10%] w-[600px] h-[550px] sm:w-[850px] sm:h-[750px] rounded-full animate-mesh-3"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.18) 0%, rgba(147, 197, 253, 0.20) 45%, rgba(224, 231, 255, 0) 75%)",
          filter: "blur(100px)",
          WebkitFilter: "blur(100px)",
          willChange: "transform, border-radius",
        }}
      />

      {/* Mesh Blob 4 - Bottom Center / Left - Gentle Cyan & Azure */}
      <div
        className="absolute -bottom-[8%] left-[8%] w-[600px] h-[600px] sm:w-[850px] sm:h-[800px] rounded-full animate-mesh-1"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.20) 0%, rgba(147, 197, 253, 0.16) 45%, rgba(219, 234, 254, 0) 75%)",
          filter: "blur(95px)",
          WebkitFilter: "blur(95px)",
          willChange: "transform, border-radius",
        }}
      />

      {/* Mesh Blob 5 - Center Soft Ambient Core */}
      <div
        className="absolute top-[35%] left-[30%] w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full animate-mesh-4"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(186, 230, 253, 0.20) 0%, rgba(147, 197, 253, 0.12) 45%, transparent 75%)",
          filter: "blur(105px)",
          WebkitFilter: "blur(105px)",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
