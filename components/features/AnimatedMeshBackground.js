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
      {/* Mesh Blob 1 - Top Right - Azure & Royal Blue */}
      <div
        className="absolute -top-[12%] -right-[8%] w-[550px] h-[550px] sm:w-[750px] sm:h-[750px] rounded-full animate-mesh-1"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.52) 0%, rgba(56, 189, 248, 0.38) 45%, rgba(99, 102, 241, 0) 70%)",
          filter: "blur(60px)",
          WebkitFilter: "blur(60px)",
          willChange: "transform, border-radius",
        }}
      />

      {/* Mesh Blob 2 - Mid Left - Deep Sky Blue & Electric Cobalt */}
      <div
        className="absolute top-[22%] -left-[10%] w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full animate-mesh-2"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.50) 0%, rgba(37, 99, 235, 0.42) 45%, rgba(79, 70, 229, 0) 70%)",
          filter: "blur(65px)",
          WebkitFilter: "blur(65px)",
          willChange: "transform, border-radius",
        }}
      />

      {/* Mesh Blob 3 - Middle / Lower Right - Vibrant Blue & Cyan */}
      <div
        className="absolute top-[48%] -right-[10%] w-[550px] h-[500px] sm:w-[750px] sm:h-[650px] rounded-full animate-mesh-3"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.48) 0%, rgba(6, 182, 212, 0.38) 45%, rgba(99, 102, 241, 0) 70%)",
          filter: "blur(65px)",
          WebkitFilter: "blur(65px)",
          willChange: "transform, border-radius",
        }}
      />

      {/* Mesh Blob 4 - Bottom Center / Left - Cyan & Azure */}
      <div
        className="absolute -bottom-[8%] left-[10%] w-[550px] h-[550px] sm:w-[750px] sm:h-[700px] rounded-full animate-mesh-1"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.45) 0%, rgba(37, 99, 235, 0.40) 45%, rgba(99, 102, 241, 0) 70%)",
          filter: "blur(60px)",
          WebkitFilter: "blur(60px)",
          willChange: "transform, border-radius",
        }}
      />

      {/* Mesh Blob 5 - Center Ambient Pulsing Core */}
      <div
        className="absolute top-[38%] left-[32%] w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] rounded-full animate-mesh-4"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.38) 0%, rgba(37, 99, 235, 0.28) 45%, transparent 70%)",
          filter: "blur(65px)",
          WebkitFilter: "blur(65px)",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
