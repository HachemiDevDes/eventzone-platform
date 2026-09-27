"use client";

import { useLanguage } from "../lib/i18n";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Stage, Layer, Rect, Circle, Text, Group, Line, Star, Image as KonvaImage, Transformer, Path, Wedge, Arrow } from "react-konva";
import { MousePointer, Hand, Maximize, Ruler, X, AlertTriangle, Compass, Trash2, Shapes } from "lucide-react";

const getStatusColors = (status) => {
  switch (status) {
    case "reserved":
      return { fill: "#ffedd5", stroke: "#f97316", text: "#ea580c" };
    case "sold":
    case "confirmed":
      return { fill: "#fef2f2", stroke: "#ef4444", text: "#dc2626" };
    case "pending-payment":
      return { fill: "#ffedd5", stroke: "#ea580c", text: "#ea580c" };
    case "hold":
      return { fill: "#ecfeff", stroke: "#0891b2", text: "#0891b2" };
    case "negotiation":
      return { fill: "#fdf4ff", stroke: "#c084fc", text: "#c084fc" };
    case "available":
      return { fill: "#f0fdf4", stroke: "#16a34a", text: "#16a34a" };
    default:
      return { fill: null, stroke: null, text: "#475569" };
  }
};

// Helper function to resolve open/closed sides of a booth
const getSidesStatus = (openSides) => {
  if (!openSides) {
    return { top: true, right: true, bottom: true, left: true };
  }
  if (typeof openSides === "string") {
    switch (openSides) {
      case "front":
        return { top: true, right: true, bottom: false, left: true };
      case "front-left":
        return { top: true, right: true, bottom: false, left: false };
      case "front-right":
        return { top: true, right: false, bottom: false, left: true };
      case "front-left-right":
        return { top: true, right: false, bottom: false, left: false };
      case "all":
        return { top: false, right: false, bottom: false, left: false };
      case "none":
      default:
        return { top: true, right: true, bottom: true, left: true };
    }
  }
  return {
    top: !openSides.top,
    right: !openSides.right,
    bottom: !openSides.bottom,
    left: !openSides.left
  };
};

/**
 * Safe image loader for HTML5 / Konva Canvas
 * Handles CORS issues, Cloudflare R2 lack of CORS headers, and provides fallback loading
 * without tainting the canvas when possible.
 */
export function loadSafeCanvasImage(url, onLoaded, onError) {
  if (!url || typeof window === "undefined") return () => {};

  let cancelled = false;

  // 1. Data URLs or Blob URLs: load directly without crossOrigin
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) onLoaded(img);
    };
    img.onerror = (err) => {
      if (!cancelled && onError) onError(err);
    };
    img.src = url;
    return () => { cancelled = true; };
  }

  // 2. Relative URLs (same origin): load directly with crossOrigin anonymous
  if (url.startsWith("/")) {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) onLoaded(img);
    };
    img.onerror = () => {
      if (cancelled) return;
      const fallback = new window.Image();
      fallback.onload = () => { if (!cancelled) onLoaded(fallback); };
      if (onError) fallback.onerror = onError;
      fallback.src = url;
    };
    img.src = url;
    return () => { cancelled = true; };
  }

  // 3. Remote URLs:
  const proxyUrl = `/api/storage/proxy?url=${encodeURIComponent(url)}`;
  const isKnownNonCorsDomain = url.includes(".r2.dev") || url.includes("pub-");

  const tryDirectWithoutCors = () => {
    if (cancelled) return;
    const fallbackImg = new window.Image();
    fallbackImg.onload = () => {
      if (!cancelled) onLoaded(fallbackImg);
    };
    fallbackImg.onerror = (err) => {
      console.error("All canvas image load attempts failed for:", url, err);
      if (!cancelled && onError) onError(err);
    };
    fallbackImg.src = url;
  };

  const tryProxy = () => {
    if (cancelled) return;
    const proxyImg = new window.Image();
    proxyImg.crossOrigin = "anonymous";
    proxyImg.onload = () => {
      if (!cancelled) onLoaded(proxyImg);
    };
    proxyImg.onerror = () => {
      tryDirectWithoutCors();
    };
    proxyImg.src = proxyUrl;
  };

  // If known to lack CORS (like Cloudflare R2 public dev bucket), immediately use proxy to avoid CORS errors
  if (isKnownNonCorsDomain) {
    tryProxy();
    return () => { cancelled = true; };
  }

  // For other external URLs, try direct CORS first, then proxy, then non-CORS
  const primaryImg = new window.Image();
  primaryImg.crossOrigin = "anonymous";
  primaryImg.onload = () => {
    if (!cancelled) onLoaded(primaryImg);
  };
  primaryImg.onerror = () => {
    tryProxy();
  };
  primaryImg.src = url;

  return () => {
    cancelled = true;
  };
}

// Asynchronous Avatar/Attendee Image Loader for Seats
function SeatAttendeeAvatar({ src, shape, seatProps, width, height, stroke, strokeWidth }) {
  const [imageObj, setImageObj] = useState(null);

  useEffect(() => {
    if (!src) {
      setImageObj(null);
      return;
    }
    return loadSafeCanvasImage(src, setImageObj);
  }, [src]);

  const radius = Math.min(width, height) / 2;

  // Destructure seatProps to filter out fill, stroke, strokeWidth since we draw them separately
  const { fill, stroke: spStroke, strokeWidth: spStrokeWidth, cornerRadius, offsetX, offsetY, ...restProps } = seatProps;

  if (!imageObj) {
    // Show green fallback while image loads
    return shape === "circle" ? (
      <Circle
        {...restProps}
        radius={radius}
        fill="rgba(29, 158, 117, 0.4)"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    ) : (
      <Rect
        {...restProps}
        offsetX={width / 2}
        offsetY={height / 2}
        fill="rgba(29, 158, 117, 0.4)"
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={2}
      />
    );
  }

  // Draw circular or rectangular cropped image.
  if (shape === "circle") {
    return (
      <Group
        {...restProps}
        offsetX={0}
        offsetY={0}
      >
        <Group
          clipFunc={(ctx) => {
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
          }}
        >
          <KonvaImage
            image={imageObj}
            x={-radius}
            y={-radius}
            width={radius * 2}
            height={radius * 2}
          />
        </Group>
        <Circle
          radius={radius}
          fill="transparent"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </Group>
    );
  } else {
    return (
      <Group
        {...restProps}
        offsetX={width / 2}
        offsetY={height / 2}
      >
        <Group
          clipFunc={(ctx) => {
            const rx = 0;
            const ry = 0;
            const r = cornerRadius || 2;
            ctx.beginPath();
            ctx.moveTo(rx + r, ry);
            ctx.lineTo(rx + width - r, ry);
            ctx.quadraticCurveTo(rx + width, ry, rx + width, ry + r);
            ctx.lineTo(rx + width, ry + height - r);
            ctx.quadraticCurveTo(rx + width, ry + height, rx + width - r, ry + height);
            ctx.lineTo(rx + r, ry + height);
            ctx.quadraticCurveTo(rx, ry + height, rx, ry + height - r);
            ctx.lineTo(rx, ry + r);
            ctx.quadraticCurveTo(rx, ry, rx + r, ry);
            ctx.closePath();
          }}
        >
          <KonvaImage
            image={imageObj}
            x={0}
            y={0}
            width={width}
            height={height}
          />
        </Group>
        <Rect
          width={width}
          height={height}
          fill="transparent"
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={cornerRadius || 2}
        />
      </Group>
    );
  }
}

// Asynchronous Image Loader for uploaded pictures
function CanvasImageElement({ el, isSelected, isHovered, toolMode, commonProps, overlaps, renderOverlapsBadge, isSearchActive, isMatch, renderDimensionOverlay }) {
  const [imageObj, setImageObj] = useState(null);

  useEffect(() => {
    if (!el.src) {
      setImageObj(null);
      return;
    }
    return loadSafeCanvasImage(el.src, setImageObj);
  }, [el.src]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1025;

  if (!imageObj) {
    return (
      <Group key={el.id} {...commonProps}>
        <Rect
          x={0}
          y={0}
          width={el.width}
          height={el.height}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth={1.5}
          dash={[4, 4]}
          shadowColor={isMobile ? undefined : "#0f172a"}
          shadowBlur={isMobile ? 0 : (isHovered ? 12 : 0)}
          shadowOpacity={isMobile ? 0 : (isHovered ? 0.12 : 0)}
          shadowOffset={isMobile ? undefined : (isHovered ? { x: 0, y: 3 } : { x: 0, y: 0 })}
        />
        <Text
          x={5}
          y={el.height / 2 - 6}
          width={el.width - 10}
          text="Loading Picture..."
          align="center"
          fontSize={10}
          fill="#94a3b8"
        />
      </Group>
    );
  }

  return (
    <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
      {isSearchActive && isMatch && (
        <Rect 
          x={-5}
          y={-5}
          width={el.width + 10}
          height={el.height + 10}
          stroke="#eab308"
          strokeWidth={3.5}
          shadowColor={isMobile ? undefined : "#eab308"}
          shadowBlur={isMobile ? 0 : 12}
          listening={false}
        />
      )}
      <KonvaImage
        image={imageObj}
        x={0}
        y={0}
        width={el.width}
        height={el.height}
        shadowColor={isMobile ? undefined : "#0f172a"}
        shadowBlur={isMobile ? 0 : (isHovered ? 12 : (isSelected ? 6 : 0))}
        shadowOpacity={isMobile ? 0 : (isHovered ? 0.12 : (isSelected ? 0.08 : 0))}
        shadowOffset={isMobile ? undefined : (isHovered ? { x: 0, y: 3 } : { x: 0, y: 0 })}
      />
      {isSelected && (
        <Rect
          x={0}
          y={0}
          width={el.width}
          height={el.height}
          stroke="#6366f1"
          strokeWidth={1.5}
          listening={false}
          name="selection-outline"
        />
      )}
      {el.isLocked && (
        <Path
          x={el.width - 15}
          y={5}
          data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
          stroke="#ef4444"
          strokeWidth={2}
          fillEnabled={false}
          scaleX={0.4}
          scaleY={0.4}
        />
      )}
      {renderOverlapsBadge(el, overlaps)}
      {renderDimensionOverlay && renderDimensionOverlay(el)}
    </Group>
  );
}

function CanvasQRCode({ qrUrl, x, y, size = 40 }) {
  const [imageObj, setImageObj] = useState(null);

  useEffect(() => {
    if (!qrUrl) {
      setImageObj(null);
      return;
    }
    return loadSafeCanvasImage(qrUrl, setImageObj);
  }, [qrUrl]);

  if (!imageObj) return null;
  return <KonvaImage image={imageObj} x={x} y={y} width={size} height={size} listening={false} />;
}

export const generateAuditoriumSeats = (auditoriumId, rows, seatsPerRow, rowSpacing, seatSpacing, curved, arcRadius, seatWidth, seatDepth) => {
  const seats = [];
  rows = isNaN(Number(rows)) ? 1 : Math.max(1, Number(rows));
  seatsPerRow = isNaN(Number(seatsPerRow)) ? 1 : Math.max(1, Number(seatsPerRow));
  rowSpacing = isNaN(Number(rowSpacing)) ? 1.0 : Number(rowSpacing);
  seatSpacing = isNaN(Number(seatSpacing)) ? 0.6 : Number(seatSpacing);
  arcRadius = isNaN(Number(arcRadius)) ? 20 : Number(arcRadius);
  seatWidth = isNaN(Number(seatWidth)) ? 0.5 : Number(seatWidth);
  seatDepth = isNaN(Number(seatDepth)) ? 0.5 : Number(seatDepth);

  const rowSpacing_px = rowSpacing * 20;
  const seatSpacing_px = seatSpacing * 20;
  const seatWidth_px = seatWidth * 20;
  const seatDepth_px = seatDepth * 20;
  const arcRadius_px = arcRadius * 20;

  const step_px = Math.max(2, seatWidth_px + seatSpacing_px);

  for (let r = 0; r < rows; r++) {
    if (curved) {
      const R_r = arcRadius_px + r * rowSpacing_px;
      const safe_R_r = Math.abs(R_r) < 1 ? (R_r >= 0 ? 1 : -1) : R_r;
      const span = safe_R_r > 0 ? (seatsPerRow - 1) * step_px / safe_R_r : 0;
      for (let c = 0; c < seatsPerRow; c++) {
        const theta = seatsPerRow > 1 ? -span / 2 + c * (step_px / safe_R_r) : 0;
        const x = R_r * Math.sin(theta);
        const y = -arcRadius_px + R_r * Math.cos(theta);
        const rot = -theta * 180 / Math.PI;
        seats.push({
          id: `${auditoriumId}_seat_${r+1}_${c+1}`,
          type: "seat",
          label: `Row ${r+1} Seat ${c+1}`,
          x: x,
          y: y,
          width: seatWidth_px,
          height: seatDepth_px,
          rotation: rot,
          assigned_participant_id: null,
          seat_status: "unassigned"
        });
      }
    } else {
      for (let c = 0; c < seatsPerRow; c++) {
        const x = c * step_px;
        const y = r * rowSpacing_px;
        seats.push({
          id: `${auditoriumId}_seat_${r+1}_${c+1}`,
          type: "seat",
          label: `Row ${r+1} Seat ${c+1}`,
          x: x,
          y: y,
          width: seatWidth_px,
          height: seatDepth_px,
          rotation: 0,
          assigned_participant_id: null,
          seat_status: "unassigned"
        });
      }
    }
  }
  return seats;
};

export const generateTheaterSeats = (theaterId, rings, stageRadius, ringSpacing = 1.5, seatSpacing = 0.8, seatWidth = 0.5, seatDepth = 0.5, seatsPerRing = 0) => {
  const seats = [];
  rings = isNaN(Number(rings)) ? 1 : Math.max(1, Number(rings));
  stageRadius = isNaN(Number(stageRadius)) ? 5.0 : Number(stageRadius);
  ringSpacing = isNaN(Number(ringSpacing)) ? 1.5 : Number(ringSpacing);
  seatSpacing = isNaN(Number(seatSpacing)) ? 0.8 : Number(seatSpacing);
  seatWidth = isNaN(Number(seatWidth)) ? 0.5 : Number(seatWidth);
  seatDepth = isNaN(Number(seatDepth)) ? 0.5 : Number(seatDepth);
  seatsPerRing = isNaN(Number(seatsPerRing)) ? 0 : Number(seatsPerRing);

  const stageRadius_px = stageRadius * 20;
  const ringSpacing_px = ringSpacing * 20;
  const seatSpacing_px = seatSpacing * 20;
  const seatWidth_px = seatWidth * 20;
  const seatDepth_px = seatDepth * 20;

  const step_px = Math.max(2, seatWidth_px + seatSpacing_px);

  for (let r = 1; r <= rings; r++) {
    const R_r = stageRadius_px + r * ringSpacing_px;
    const circumference = 2 * Math.PI * R_r;
    const sCount = (seatsPerRing !== undefined && seatsPerRing > 0)
      ? seatsPerRing
      : Math.max(4, Math.floor(circumference / step_px));
    for (let s = 0; s < sCount; s++) {
      const angle = (s * 2 * Math.PI) / sCount;
      const x = R_r * Math.cos(angle);
      const y = R_r * Math.sin(angle);
      const rot = (angle * 180 / Math.PI) + 90;
      seats.push({
        id: `${theaterId}_seat_${r}_${s+1}`,
        type: "seat",
        label: `Ring ${r} Seat ${s+1}`,
        x: x,
        y: y,
        width: seatWidth_px,
        height: seatDepth_px,
        rotation: rot,
        assigned_participant_id: null,
        seat_status: "unassigned"
      });
    }
  }
  return seats;
};

export const generateClassroomSeats = (classroomId, rows, tablesPerRow, tableWidth, tableDepth, chairsPerTable, rowSpacing = 2.0, tableSpacing = 1.0, facingDirection = "north") => {
  const seats = [];
  rows = isNaN(Number(rows)) ? 1 : Math.max(1, Number(rows));
  tablesPerRow = isNaN(Number(tablesPerRow)) ? 1 : Math.max(1, Number(tablesPerRow));
  tableWidth = isNaN(Number(tableWidth)) ? 1.8 : Number(tableWidth);
  tableDepth = isNaN(Number(tableDepth)) ? 0.6 : Number(tableDepth);
  chairsPerTable = isNaN(Number(chairsPerTable)) ? 2 : Number(chairsPerTable);
  rowSpacing = isNaN(Number(rowSpacing)) ? 2.0 : Number(rowSpacing);
  tableSpacing = isNaN(Number(tableSpacing)) ? 1.0 : Number(tableSpacing);

  const tableWidth_px = tableWidth * 20;
  const tableDepth_px = tableDepth * 20;
  const rowSpacing_px = rowSpacing * 20;
  const tableSpacing_px = tableSpacing * 20;
  
  const chairWidth_px = 10; // 0.5m
  const chairDepth_px = 10; // 0.5m

  for (let r = 0; r < rows; r++) {
    for (let t = 0; t < tablesPerRow; t++) {
      let tx, ty, tWidth, tHeight;
      let chairRot = 0;
      
      if (facingDirection === "north") {
        tx = t * (tableWidth_px + tableSpacing_px);
        ty = r * (tableDepth_px + rowSpacing_px);
        tWidth = tableWidth_px;
        tHeight = tableDepth_px;
        chairRot = 0;
      } else if (facingDirection === "south") {
        tx = t * (tableWidth_px + tableSpacing_px);
        ty = r * (tableDepth_px + rowSpacing_px);
        tWidth = tableWidth_px;
        tHeight = tableDepth_px;
        chairRot = 180;
      } else if (facingDirection === "east") {
        tx = r * (tableDepth_px + rowSpacing_px);
        ty = t * (tableWidth_px + tableSpacing_px);
        tWidth = tableDepth_px;
        tHeight = tableWidth_px;
        chairRot = 90;
      } else { // west
        tx = r * (tableDepth_px + rowSpacing_px);
        ty = t * (tableWidth_px + tableSpacing_px);
        tWidth = tableDepth_px;
        tHeight = tableWidth_px;
        chairRot = 270;
      }

      for (let c = 0; c < chairsPerTable; c++) {
        let chairX, chairY;
        if (facingDirection === "north") {
          chairX = tx + (tableWidth_px - chairsPerTable * 16) / 2 + c * 16 + 3;
          chairY = ty + tableDepth_px + 8;
        } else if (facingDirection === "south") {
          chairX = tx + (tableWidth_px - chairsPerTable * 16) / 2 + c * 16 + 3;
          chairY = ty - 8;
        } else if (facingDirection === "east") {
          chairX = tx - 8;
          chairY = ty + (tableWidth_px - chairsPerTable * 16) / 2 + c * 16 + 3;
        } else { // west
          chairX = tx + tableDepth_px + 8;
          chairY = ty + (tableWidth_px - chairsPerTable * 16) / 2 + c * 16 + 3;
        }

        seats.push({
          id: `${classroomId}_seat_${r+1}_${t+1}_${c+1}`,
          type: "seat",
          label: `Row ${r+1} Table ${t+1} Chair ${c+1}`,
          x: chairX,
          y: chairY,
          width: chairWidth_px,
          height: chairDepth_px,
          rotation: chairRot,
          assigned_participant_id: null,
          seat_status: "unassigned"
        });
      }
    }
  }
  return seats;
};

export const generateReservedSeats = (reservedId, seatCount, label, seatSpacing = 0.8, seatWidth = 0.5, seatDepth = 0.5, rows = 1, rowSpacing = 1.5) => {
  const seats = [];
  seatCount = isNaN(Number(seatCount)) ? 1 : Math.max(1, Number(seatCount));
  rows = isNaN(Number(rows)) ? 1 : Math.max(1, Number(rows));
  seatSpacing = isNaN(Number(seatSpacing)) ? 0.8 : Number(seatSpacing);
  seatWidth = isNaN(Number(seatWidth)) ? 0.5 : Number(seatWidth);
  seatDepth = isNaN(Number(seatDepth)) ? 0.5 : Number(seatDepth);
  rowSpacing = isNaN(Number(rowSpacing)) ? 1.5 : Number(rowSpacing);

  const seatSpacing_px = seatSpacing * 20;
  const seatWidth_px = seatWidth * 20;
  const seatDepth_px = seatDepth * 20;
  const rowSpacing_px = rowSpacing * 20;
  const rowSpacingStep_px = rowSpacing_px + seatDepth_px;

  const labelClean = String(label || "Seats");
  const seatLabelPrefix = (labelClean.toLowerCase() === "seats" || labelClean.toLowerCase() === "seat") ? "" : labelClean;

  for (let r = 0; r < rows; r++) {
    for (let s = 0; s < seatCount; s++) {
      const x = s * (seatWidth_px + seatSpacing_px);
      const y = 20 + r * rowSpacingStep_px;
      const seatLabel = rows > 1 
        ? (seatLabelPrefix ? `${seatLabelPrefix} Row ${r+1} Seat ${s+1}` : `Row ${r+1} Seat ${s+1}`) 
        : (seatLabelPrefix ? `${seatLabelPrefix} Seat ${s+1}` : `Seat ${s+1}`);
      seats.push({
        id: `${reservedId}_seat_${r+1}_${s+1}`,
        type: "seat",
        label: seatLabel,
        x: x,
        y: y,
        width: seatWidth_px,
        height: seatDepth_px,
        rotation: 0,
        assigned_participant_id: null,
        seat_status: "unassigned"
      });
    }
  }
  return seats;
};

// Helper to identify non-physical zone/overlay elements
const isLayoutElement = (el) => {
  if (!el || !el.type) return false;
  return (
    el.type === "zone-overlay" ||
    el.type === "corridor" ||
    el.type.endsWith("-zone") ||
    el.type === "scheduled-meeting-room" ||
    el.type === "broadcast-studio" ||
    el.type === "safety-exit-route" ||
    el.type === "safety-accessibility-path"
  );
};

// Compute direct bounding box distance between two elements A and B
const computeElementPairDistance = (elA, elB) => {
  if (!elA || !elB || elA.id === elB.id) return [];
  const aLeft = elA.x, aRight = elA.x + elA.width, aTop = elA.y, aBottom = elA.y + elA.height;
  const bLeft = elB.x, bRight = elB.x + elB.width, bTop = elB.y, bBottom = elB.y + elB.height;

  const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
  const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);

  const guides = [];

  if (overlapY > 0) {
    const yCenter = (Math.max(aTop, bTop) + Math.min(aBottom, bBottom)) / 2;
    if (aRight <= bLeft) {
      const gap = bLeft - aRight;
      guides.push({ x1: aRight, y1: yCenter, x2: bLeft, y2: yCenter, distancePx: gap, distanceMeters: gap / 20, isWall: false });
    } else if (bRight <= aLeft) {
      const gap = aLeft - bRight;
      guides.push({ x1: bRight, y1: yCenter, x2: aLeft, y2: yCenter, distancePx: gap, distanceMeters: gap / 20, isWall: false });
    }
  }

  if (overlapX > 0) {
    const xCenter = (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2;
    if (aBottom <= bTop) {
      const gap = bTop - aBottom;
      guides.push({ x1: xCenter, y1: aBottom, x2: xCenter, y2: bTop, distancePx: gap, distanceMeters: gap / 20, isWall: false });
    } else if (bBottom <= aTop) {
      const gap = aTop - bBottom;
      guides.push({ x1: xCenter, y1: bBottom, x2: xCenter, y2: aTop, distancePx: gap, distanceMeters: gap / 20, isWall: false });
    }
  }

  if (guides.length === 0) {
    const pAx = aRight < bLeft ? aRight : (aLeft > bRight ? aLeft : aLeft + elA.width / 2);
    const pAy = aBottom < bTop ? aBottom : (aTop > bBottom ? aTop : aTop + elA.height / 2);
    const pBx = bRight < aLeft ? bRight : (bLeft > aRight ? bLeft : bLeft + elB.width / 2);
    const pBy = bBottom < aTop ? bBottom : (bTop > aBottom ? bTop : bTop + elB.height / 2);
    const distPx = Math.hypot(pBx - pAx, pBy - pAy);
    guides.push({ x1: pAx, y1: pAy, x2: pBx, y2: pBy, distancePx: distPx, distanceMeters: distPx / 20, isWall: false, isDiagonal: true });
  }

  return guides;
};

// Compute 4-way orthogonal distance lines to nearest adjacent elements and walls (CAD/Figma style)
const computeOrthogonalGuides = (targetEl, allElements, canvasWidth, canvasHeight, safetyClearance) => {
  if (!targetEl) return [];

  const guides = [];
  const tLeft = targetEl.x;
  const tRight = targetEl.x + targetEl.width;
  const tTop = targetEl.y;
  const tBottom = targetEl.y + targetEl.height;
  const tMidX = tLeft + targetEl.width / 2;
  const tMidY = tTop + targetEl.height / 2;

  const candidates = allElements.filter(el => el.id !== targetEl.id && !isLayoutElement(el));

  // 1. Right Corridor
  let nearestRight = null;
  let minGapRight = Infinity;
  for (const el of candidates) {
    if (el.x >= tRight - 1) {
      const overlapY = Math.min(tBottom, el.y + el.height) - Math.max(tTop, el.y);
      if (overlapY > 0) {
        const gap = el.x - tRight;
        if (gap >= 0 && gap < minGapRight) {
          minGapRight = gap;
          nearestRight = { el, gap };
        }
      }
    }
  }

  if (nearestRight) {
    const el = nearestRight.el;
    const yCenter = (Math.max(tTop, el.y) + Math.min(tBottom, el.y + el.height)) / 2;
    guides.push({
      direction: 'right',
      x1: tRight,
      y1: yCenter,
      x2: el.x,
      y2: yCenter,
      distancePx: nearestRight.gap,
      distanceMeters: nearestRight.gap / 20,
      targetId: el.id,
      isWall: false
    });
  } else if (canvasWidth && canvasWidth > tRight) {
    const gap = canvasWidth - tRight;
    guides.push({
      direction: 'right',
      x1: tRight,
      y1: tMidY,
      x2: canvasWidth,
      y2: tMidY,
      distancePx: gap,
      distanceMeters: gap / 20,
      isWall: true,
      wallLabel: 'Wall'
    });
  }

  // 2. Left Corridor
  let nearestLeft = null;
  let minGapLeft = Infinity;
  for (const el of candidates) {
    const elRight = el.x + el.width;
    if (elRight <= tLeft + 1) {
      const overlapY = Math.min(tBottom, el.y + el.height) - Math.max(tTop, el.y);
      if (overlapY > 0) {
        const gap = tLeft - elRight;
        if (gap >= 0 && gap < minGapLeft) {
          minGapLeft = gap;
          nearestLeft = { el, gap };
        }
      }
    }
  }

  if (nearestLeft) {
    const el = nearestLeft.el;
    const yCenter = (Math.max(tTop, el.y) + Math.min(tBottom, el.y + el.height)) / 2;
    guides.push({
      direction: 'left',
      x1: el.x + el.width,
      y1: yCenter,
      x2: tLeft,
      y2: yCenter,
      distancePx: nearestLeft.gap,
      distanceMeters: nearestLeft.gap / 20,
      targetId: el.id,
      isWall: false
    });
  } else if (tLeft > 0) {
    guides.push({
      direction: 'left',
      x1: 0,
      y1: tMidY,
      x2: tLeft,
      y2: tMidY,
      distancePx: tLeft,
      distanceMeters: tLeft / 20,
      isWall: true,
      wallLabel: 'Wall'
    });
  }

  // 3. Top Corridor
  let nearestTop = null;
  let minGapTop = Infinity;
  for (const el of candidates) {
    const elBottom = el.y + el.height;
    if (elBottom <= tTop + 1) {
      const overlapX = Math.min(tRight, el.x + el.width) - Math.max(tLeft, el.x);
      if (overlapX > 0) {
        const gap = tTop - elBottom;
        if (gap >= 0 && gap < minGapTop) {
          minGapTop = gap;
          nearestTop = { el, gap };
        }
      }
    }
  }

  if (nearestTop) {
    const el = nearestTop.el;
    const xCenter = (Math.max(tLeft, el.x) + Math.min(tRight, el.x + el.width)) / 2;
    guides.push({
      direction: 'top',
      x1: xCenter,
      y1: el.y + el.height,
      x2: xCenter,
      y2: tTop,
      distancePx: nearestTop.gap,
      distanceMeters: nearestTop.gap / 20,
      targetId: el.id,
      isWall: false
    });
  } else if (tTop > 0) {
    guides.push({
      direction: 'top',
      x1: tMidX,
      y1: 0,
      x2: tMidX,
      y2: tTop,
      distancePx: tTop,
      distanceMeters: tTop / 20,
      isWall: true,
      wallLabel: 'Wall'
    });
  }

  // 4. Bottom Corridor
  let nearestBottom = null;
  let minGapBottom = Infinity;
  for (const el of candidates) {
    if (el.y >= tBottom - 1) {
      const overlapX = Math.min(tRight, el.x + el.width) - Math.max(tLeft, el.x);
      if (overlapX > 0) {
        const gap = el.y - tBottom;
        if (gap >= 0 && gap < minGapBottom) {
          minGapBottom = gap;
          nearestBottom = { el, gap };
        }
      }
    }
  }

  if (nearestBottom) {
    const el = nearestBottom.el;
    const xCenter = (Math.max(tLeft, el.x) + Math.min(tRight, el.x + el.width)) / 2;
    guides.push({
      direction: 'bottom',
      x1: xCenter,
      y1: tBottom,
      x2: xCenter,
      y2: el.y,
      distancePx: nearestBottom.gap,
      distanceMeters: nearestBottom.gap / 20,
      targetId: el.id,
      isWall: false
    });
  } else if (canvasHeight && canvasHeight > tBottom) {
    const gap = canvasHeight - tBottom;
    guides.push({
      direction: 'bottom',
      x1: tMidX,
      y1: tBottom,
      x2: tMidX,
      y2: canvasHeight,
      distancePx: gap,
      distanceMeters: gap / 20,
      isWall: true,
      wallLabel: 'Wall'
    });
  }

  // Detect equal spacing between opposing corridors (CAD alignment indicator)
  const leftGuide = guides.find(g => g.direction === 'left' && !g.isWall);
  const rightGuide = guides.find(g => g.direction === 'right' && !g.isWall);
  if (leftGuide && rightGuide) {
    if (Math.abs(leftGuide.distancePx - rightGuide.distancePx) <= 2) {
      leftGuide.isEqualSpacing = true;
      rightGuide.isEqualSpacing = true;
    }
  }

  const topGuide = guides.find(g => g.direction === 'top' && !g.isWall);
  const bottomGuide = guides.find(g => g.direction === 'bottom' && !g.isWall);
  if (topGuide && bottomGuide) {
    if (Math.abs(topGuide.distancePx - bottomGuide.distancePx) <= 2) {
      topGuide.isEqualSpacing = true;
      bottomGuide.isEqualSpacing = true;
    }
  }

  return guides;
};

// Compute distance lines from selected reference element to all other elements and walls
const computeAllElementDistances = (targetEl, allElements, canvasWidth, canvasHeight, safetyClearance, hoveredId) => {
  if (!targetEl) return [];

  const aLeft = targetEl.x;
  const aRight = targetEl.x + targetEl.width;
  const aTop = targetEl.y;
  const aBottom = targetEl.y + targetEl.height;
  const aMidX = aLeft + targetEl.width / 2;
  const aMidY = aTop + targetEl.height / 2;

  const candidates = allElements.filter(el => el.id !== targetEl.id && !isLayoutElement(el));
  const guides = [];

  for (const el of candidates) {
    const bLeft = el.x;
    const bRight = el.x + el.width;
    const bTop = el.y;
    const bBottom = el.y + el.height;
    const bMidX = bLeft + el.width / 2;
    const bMidY = bTop + el.height / 2;

    const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
    const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);

    let x1, y1, x2, y2, distPx;
    let isOrthogonal = false;

    if (overlapY > 0) {
      // Horizontal separation with vertical overlap
      const yCenter = (Math.max(aTop, bTop) + Math.min(aBottom, bBottom)) / 2;
      if (aRight <= bLeft) {
        x1 = aRight;
        y1 = yCenter;
        x2 = bLeft;
        y2 = yCenter;
        distPx = bLeft - aRight;
        isOrthogonal = true;
      } else if (bRight <= aLeft) {
        x1 = aLeft;
        y1 = yCenter;
        x2 = bRight;
        y2 = yCenter;
        distPx = aLeft - bRight;
        isOrthogonal = true;
      } else {
        // Overlapping / touching
        x1 = aRight;
        y1 = yCenter;
        x2 = bLeft;
        y2 = yCenter;
        distPx = 0;
      }
    } else if (overlapX > 0) {
      // Vertical separation with horizontal overlap
      const xCenter = (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2;
      if (aBottom <= bTop) {
        x1 = xCenter;
        y1 = aBottom;
        x2 = xCenter;
        y2 = bTop;
        distPx = bTop - aBottom;
        isOrthogonal = true;
      } else if (bBottom <= aTop) {
        x1 = xCenter;
        y1 = aTop;
        x2 = xCenter;
        y2 = bBottom;
        distPx = aTop - bBottom;
        isOrthogonal = true;
      } else {
        // Overlapping / touching
        x1 = xCenter;
        y1 = aBottom;
        x2 = xCenter;
        y2 = bTop;
        distPx = 0;
      }
    } else {
      // Diagonal separation: closest points between bounding boxes
      const pAx = aRight < bLeft ? aRight : (aLeft > bRight ? aLeft : aMidX);
      const pAy = aBottom < bTop ? aBottom : (aTop > bBottom ? aTop : aMidY);
      const pBx = bRight < aLeft ? bRight : (bLeft > aRight ? bLeft : bMidX);
      const pBy = bBottom < aTop ? bBottom : (bTop > aBottom ? bTop : bMidY);
      x1 = pAx;
      y1 = pAy;
      x2 = pBx;
      y2 = pBy;
      distPx = Math.hypot(pBx - pAx, pBy - pAy);
    }

    const distMeters = distPx / 20;
    const isHovered = hoveredId === el.id;

    guides.push({
      targetId: el.id,
      targetLabel: el.label || el.name || el.boothNumber || el.id,
      x1,
      y1,
      x2,
      y2,
      distancePx: distPx,
      distanceMeters: distMeters,
      isOrthogonal,
      isSafetyAlert: distMeters > 0 && distMeters < safetyClearance,
      isWall: false,
      isHoveredTarget: isHovered,
      customColor: isHovered ? "#4f46e5" : (distMeters > 0 && distMeters < safetyClearance ? "#ef4444" : undefined)
    });
  }

  // Also include 4 boundary/wall guides if canvas bounds exist
  if (aLeft > 0) {
    guides.push({
      direction: 'left',
      x1: 0,
      y1: aMidY,
      x2: aLeft,
      y2: aMidY,
      distancePx: aLeft,
      distanceMeters: aLeft / 20,
      isWall: true,
      wallLabel: 'Wall'
    });
  }
  if (canvasWidth && canvasWidth > aRight) {
    const gap = canvasWidth - aRight;
    guides.push({
      direction: 'right',
      x1: aRight,
      y1: aMidY,
      x2: canvasWidth,
      y2: aMidY,
      distancePx: gap,
      distanceMeters: gap / 20,
      isWall: true,
      wallLabel: 'Wall'
    });
  }
  if (aTop > 0) {
    guides.push({
      direction: 'top',
      x1: aMidX,
      y1: 0,
      x2: aMidX,
      y2: aTop,
      distancePx: aTop,
      distanceMeters: aTop / 20,
      isWall: true,
      wallLabel: 'Wall'
    });
  }
  if (canvasHeight && canvasHeight > aBottom) {
    const gap = canvasHeight - aBottom;
    guides.push({
      direction: 'bottom',
      x1: aMidX,
      y1: aBottom,
      x2: aMidX,
      y2: canvasHeight,
      distancePx: gap,
      distanceMeters: gap / 20,
      isWall: true,
      wallLabel: 'Wall'
    });
  }

  // Sort: prioritize hovered target, then safety alerts, then closest elements
  guides.sort((a, b) => {
    if (a.isHoveredTarget) return -1;
    if (b.isHoveredTarget) return 1;
    return a.distancePx - b.distancePx;
  });

  return guides;
};

// --- Geometric Helper Functions for Constructor Closed Shape Detection ---

function getSegmentIntersection(p1, p2, p3, p4, tolerance = 1e-5) {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < tolerance) return null; // Parallel or collinear

  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

  const eps = 1e-4;
  if (u >= -eps && u <= 1 + eps && v >= -eps && v <= 1 + eps) {
    const clampedU = Math.max(0, Math.min(1, u));
    return {
      x: p1.x + clampedU * (p2.x - p1.x),
      y: p1.y + clampedU * (p2.y - p1.y),
      u: clampedU,
      v: Math.max(0, Math.min(1, v))
    };
  }
  return null;
}

function distSq(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

function detectClosedPolygons(segments, snapTol = 8) {
  if (!segments || segments.length < 3) return [];
  const snapTolSq = snapTol * snapTol;

  // 1. Cluster / unify raw endpoints that are within snapping tolerance
  const allPoints = [];
  function getOrCreatePoint(pt) {
    for (const p of allPoints) {
      if (distSq(p, pt) <= snapTolSq) {
        return p;
      }
    }
    const newPt = { x: Math.round(pt.x * 10) / 10, y: Math.round(pt.y * 10) / 10 };
    allPoints.push(newPt);
    return newPt;
  }

  // Pre-process segments with unified endpoints and filter zero-length lines
  const cleanSegs = segments.map(s => ({
    p1: getOrCreatePoint({ x: s.x1, y: s.y1 }),
    p2: getOrCreatePoint({ x: s.x2, y: s.y2 })
  })).filter(s => distSq(s.p1, s.p2) > 4);

  // 2. Find all intersections between segments
  const segPoints = cleanSegs.map(s => [s.p1, s.p2]);
  for (let i = 0; i < cleanSegs.length; i++) {
    for (let j = i + 1; j < cleanSegs.length; j++) {
      const s1 = cleanSegs[i];
      const s2 = cleanSegs[j];
      const inter = getSegmentIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
      if (inter) {
        const unified = getOrCreatePoint(inter);
        segPoints[i].push(unified);
        segPoints[j].push(unified);
      }
    }
  }

  // 3. Subdivide each segment into atomic sub-edges
  const vertices = [];
  const ptToId = (pt) => {
    for (let i = 0; i < vertices.length; i++) {
      if (distSq(vertices[i], pt) <= snapTolSq) {
        return i;
      }
    }
    const id = vertices.length;
    vertices.push({ id, x: pt.x, y: pt.y });
    return id;
  };

  const edgeSet = new Set();
  const edges = [];
  function addEdge(u, v) {
    if (u === v) return;
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ u, v });
    }
  }

  cleanSegs.forEach((s, idx) => {
    const pts = segPoints[idx];
    const uniquePts = [];
    for (const p of pts) {
      if (!uniquePts.some(up => distSq(up, p) <= snapTolSq)) {
        uniquePts.push(p);
      }
    }
    const vx = s.p2.x - s.p1.x;
    const vy = s.p2.y - s.p1.y;
    uniquePts.sort((a, b) => {
      const projA = (a.x - s.p1.x) * vx + (a.y - s.p1.y) * vy;
      const projB = (b.x - s.p1.x) * vx + (b.y - s.p1.y) * vy;
      return projA - projB;
    });
    for (let k = 0; k < uniquePts.length - 1; k++) {
      const u = ptToId(uniquePts[k]);
      const v = ptToId(uniquePts[k + 1]);
      addEdge(u, v);
    }
  });

  if (vertices.length < 3 || edges.length < 3) return [];

  // 4. Build planar adjacency list
  let adj = Array.from({ length: vertices.length }, () => []);
  for (const { u, v } of edges) {
    const ptU = vertices[u];
    const ptV = vertices[v];
    const angleUV = Math.atan2(ptV.y - ptU.y, ptV.x - ptU.x);
    const angleVU = Math.atan2(ptU.y - ptV.y, ptU.x - ptV.x);
    adj[u].push({ v, angle: angleUV });
    adj[v].push({ v: u, angle: angleVU });
  }

  // Iteratively prune antenna leaves (degree < 2)
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < vertices.length; i++) {
      if (adj[i].length === 1) {
        const neighbor = adj[i][0].v;
        adj[i] = [];
        adj[neighbor] = adj[neighbor].filter(edge => edge.v !== i);
        changed = true;
      }
    }
  }

  // Sort neighbors by counter-clockwise angle
  for (let i = 0; i < vertices.length; i++) {
    adj[i].sort((a, b) => a.angle - b.angle);
  }

  // 5. Extract minimal faces via left-turn traversal
  const visitedHalfEdges = new Set();
  const faces = [];

  for (let u = 0; u < vertices.length; u++) {
    for (const { v } of adj[u]) {
      const edgeKey = `${u}->${v}`;
      if (visitedHalfEdges.has(edgeKey)) continue;

      const cycle = [u];
      let currU = u;
      let currV = v;
      let valid = true;

      while (true) {
        visitedHalfEdges.add(`${currU}->${currV}`);
        cycle.push(currV);

        const inPtU = vertices[currU];
        const inPtV = vertices[currV];
        const incomingAngle = Math.atan2(inPtU.y - inPtV.y, inPtU.x - inPtV.x);

        const neighbors = adj[currV];
        if (!neighbors || neighbors.length === 0) {
          valid = false;
          break;
        }

        let bestNext = null;
        let bestDiff = Infinity;
        for (const cand of neighbors) {
          if (neighbors.length > 1 && cand.v === currU) continue;
          let diff = cand.angle - incomingAngle;
          while (diff <= 0) diff += 2 * Math.PI;
          while (diff > 2 * Math.PI) diff -= 2 * Math.PI;
          if (diff < bestDiff) {
            bestDiff = diff;
            bestNext = cand.v;
          }
        }

        if (bestNext === null) {
          valid = false;
          break;
        }

        if (bestNext === u && currV === v) break;
        if (cycle.length > 50) {
          valid = false;
          break;
        }

        currU = currV;
        currV = bestNext;
        if (currU === u && currV === v) break;
      }

      if (valid && cycle.length >= 4) {
        const polyVertices = cycle.slice(0, -1);
        if (polyVertices[0] === polyVertices[polyVertices.length - 1]) {
          polyVertices.pop();
        }
        if (polyVertices.length >= 3) {
          const polyCoords = polyVertices.map(idx => vertices[idx]);

          // Compute signed area via Shoelace formula
          let signedArea2 = 0;
          const n = polyCoords.length;
          for (let k = 0; k < n; k++) {
            const nextK = (k + 1) % n;
            signedArea2 += polyCoords[k].x * polyCoords[nextK].y - polyCoords[nextK].x * polyCoords[k].y;
          }
          const signedArea = signedArea2 / 2;
          const absArea = Math.abs(signedArea);

          // In screen coords (Y down), left-turn counter-clockwise faces have signedArea < 0 for interior faces
          if (signedArea < 0 && absArea >= 100) {
            // Compute perimeter in meters (20px = 1m)
            let perimeterPx = 0;
            for (let k = 0; k < n; k++) {
              const nextK = (k + 1) % n;
              perimeterPx += Math.hypot(polyCoords[nextK].x - polyCoords[k].x, polyCoords[nextK].y - polyCoords[k].y);
            }
            const perimeterMeters = perimeterPx / 20;
            const areaMeters = absArea / 400; // 1m = 20px, 1m^2 = 400px^2

            // Compute centroid
            let cx2 = 0;
            let cy2 = 0;
            for (let k = 0; k < n; k++) {
              const nextK = (k + 1) % n;
              const cross = polyCoords[k].x * polyCoords[nextK].y - polyCoords[nextK].x * polyCoords[k].y;
              cx2 += (polyCoords[k].x + polyCoords[nextK].x) * cross;
              cy2 += (polyCoords[k].y + polyCoords[nextK].y) * cross;
            }
            const A6 = 6 * signedArea;
            let centroid;
            if (Math.abs(A6) > 1e-4) {
              centroid = { x: cx2 / A6, y: cy2 / A6 };
            } else {
              const sumX = polyCoords.reduce((acc, p) => acc + p.x, 0);
              const sumY = polyCoords.reduce((acc, p) => acc + p.y, 0);
              centroid = { x: sumX / n, y: sumY / n };
            }

            faces.push({
              points: polyCoords,
              areaMeters,
              perimeterMeters,
              centroid
            });
          }
        }
      }
    }
  }

  return faces;
}

// CAD Technical Centroid Badge for Closed Polygon Surface
function PolygonAreaBadge({ centroid, areaMeters, perimeterMeters, stageScale = 1 }) {
  if (!centroid || !Number.isFinite(centroid.x) || !Number.isFinite(centroid.y)) return null;

  const effectiveScale = Math.max(0.2, Math.min(stageScale, 5));
  const badgeScale = 1 / effectiveScale;
  const badgeWidth = 114;
  const badgeHeight = 36;

  return (
    <Group
      x={centroid.x}
      y={centroid.y}
      scaleX={badgeScale}
      scaleY={badgeScale}
      listening={false}
    >
      {/* Background card with Light Mode shadow and border */}
      <Rect
        x={-badgeWidth / 2}
        y={-badgeHeight / 2}
        width={badgeWidth}
        height={badgeHeight}
        cornerRadius={8}
        fill="#ffffff"
        stroke="#818cf8"
        strokeWidth={1.5}
        shadowColor="rgba(99, 102, 241, 0.2)"
        shadowBlur={8}
        shadowOffsetY={2}
      />

      {/* Top accent bar */}
      <Rect
        x={-badgeWidth / 2 + 1}
        y={-badgeHeight / 2 + 1}
        width={badgeWidth - 2}
        height={3.5}
        cornerRadius={[7, 7, 0, 0]}
        fill="#6366f1"
      />

      {/* Area Text */}
      <Text
        x={-badgeWidth / 2}
        y={-badgeHeight / 2 + 7}
        width={badgeWidth}
        text={`📐 ${areaMeters.toFixed(2)} m²`}
        fontSize={11}
        fontFamily="monospace, ui-monospace, sans-serif"
        fontStyle="bold"
        fill="#312e81"
        align="center"
      />

      {/* Perimeter Subtext */}
      <Text
        x={-badgeWidth / 2}
        y={-badgeHeight / 2 + 21}
        width={badgeWidth}
        text={`Perimeter: ${perimeterMeters.toFixed(1)}m`}
        fontSize={8.5}
        fontFamily="monospace, ui-monospace, sans-serif"
        fontStyle="bold"
        fill="#6366f1"
        align="center"
      />
    </Group>
  );
}

// CAD Technical Dimension Line with orthogonal tick marks & counter-scaled pill badge
function DimensionLineOverlay({
  x1, y1, x2, y2,
  distanceMeters,
  stageScale = 1,
  safetyClearance = 2.5,
  isSafetyAlert = false,
  isEqualSpacing = false,
  isWall = false,
  isLive = false,
  customColor = null,
  showCoordinates = false,
  isInteractive = false,
  isHovered = false,
  onHover = null,
  onDelete = null
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return null;

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  // Counter-scaled geometry for zoom independence (keeps text and ticks legible at any zoom)
  const effectiveScale = Math.max(0.2, Math.min(stageScale, 5));
  const tickLen = 6 / effectiveScale;
  const strokeW = Math.max(1, 1.5 / effectiveScale);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const badgeScale = 1 / effectiveScale;

  let strokeColor = customColor || "#4f46e5";
  let badgeBg = "#ffffff";
  let badgeBorder = "#c7d2fe";
  let badgeTextColor = "#3730a3";
  let badgeIcon = "";

  if (isHovered) {
    strokeColor = "#f43f5e";
    badgeBg = "#fff1f2";
    badgeBorder = "#fca5a5";
    badgeTextColor = "#e11d48";
  } else if (isSafetyAlert) {
    strokeColor = "#ef4444";
    badgeBg = "#fef2f2";
    badgeBorder = "#fca5a5";
    badgeTextColor = "#b91c1c";
    badgeIcon = "⚠️ ";
  } else if (isEqualSpacing) {
    strokeColor = "#10b981";
    badgeBg = "#f0fdf4";
    badgeBorder = "#a7f3d0";
    badgeTextColor = "#065f46";
    badgeIcon = "= ";
  } else if (isLive) {
    strokeColor = "#d97706";
    badgeBg = "#fffbeb";
    badgeBorder = "#fde68a";
    badgeTextColor = "#92400e";
  } else if (isWall) {
    strokeColor = "#64748b";
    badgeBg = "#f8fafc";
    badgeBorder = "#cbd5e1";
    badgeTextColor = "#334155";
  }

  const badgeText = `${badgeIcon}${distanceMeters.toFixed(2)}m${isEqualSpacing ? " =" : ""}`;
  const badgeWidth = Math.max(50, badgeText.length * 6.5 + 14);
  const badgeHeight = 18;

  const isDiagonal = Math.abs(dx) > 10 && Math.abs(dy) > 10 && showCoordinates;
  const dxMeters = (Math.abs(dx) / 20).toFixed(2);
  const dyMeters = (Math.abs(dy) / 20).toFixed(2);

  return (
    <Group listening={isInteractive}>
      {/* Invisible wide hit target for effortless hover and click detection */}
      {isInteractive && (
        <Line
          name="constructor-line-hit"
          points={[x1, y1, x2, y2]}
          stroke="transparent"
          strokeWidth={Math.max(22, 28 / effectiveScale)}
          hitStrokeWidth={Math.max(22, 28 / effectiveScale)}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "pointer";
            onHover?.(true);
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "crosshair";
            onHover?.(false);
          }}
          onClick={(e) => {
            e.cancelBubble = true;
            onDelete?.();
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onDelete?.();
          }}
        />
      )}

      {/* Main Dimension Line */}
      <Line
        points={[x1, y1, x2, y2]}
        stroke={strokeColor}
        strokeWidth={isHovered ? strokeW * 1.6 : strokeW}
        dash={isWall ? [4 / effectiveScale, 2 / effectiveScale] : (isHovered ? [6 / effectiveScale, 3 / effectiveScale] : undefined)}
        listening={false}
      />

      {/* Orthogonal tick at Point 1 */}
      <Line
        points={[
          x1 - nx * tickLen, y1 - ny * tickLen,
          x1 + nx * tickLen, y1 + ny * tickLen
        ]}
        stroke={strokeColor}
        strokeWidth={strokeW * 1.2}
        listening={false}
      />

      {/* Orthogonal tick at Point 2 */}
      <Line
        points={[
          x2 - nx * tickLen, y2 - ny * tickLen,
          x2 + nx * tickLen, y2 + ny * tickLen
        ]}
        stroke={strokeColor}
        strokeWidth={strokeW * 1.2}
        listening={false}
      />

      {/* Endpoint circles */}
      <Circle
        x={x1}
        y={y1}
        radius={(isHovered ? 3.5 : 2.5) / effectiveScale}
        fill={strokeColor}
        listening={false}
      />
      <Circle
        x={x2}
        y={y2}
        radius={(isHovered ? 3.5 : 2.5) / effectiveScale}
        fill={strokeColor}
        listening={false}
      />

      {/* Centered CAD Pill Badge */}
      <Group
        x={midX}
        y={midY}
        scaleX={badgeScale}
        scaleY={badgeScale}
        listening={isInteractive}
        onMouseEnter={(e) => {
          if (isInteractive) {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "pointer";
            onHover?.(true);
          }
        }}
        onMouseLeave={(e) => {
          if (isInteractive) {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "crosshair";
            onHover?.(false);
          }
        }}
        onClick={(e) => {
          if (isInteractive) {
            e.cancelBubble = true;
            onDelete?.();
          }
        }}
        onTap={(e) => {
          if (isInteractive) {
            e.cancelBubble = true;
            onDelete?.();
          }
        }}
      >
        <Rect
          x={-badgeWidth / 2}
          y={-badgeHeight / 2}
          width={badgeWidth}
          height={badgeHeight}
          cornerRadius={badgeHeight / 2}
          fill={badgeBg}
          stroke={badgeBorder}
          strokeWidth={isHovered ? 1.5 : 1}
          shadowColor={isHovered ? "rgba(244, 63, 94, 0.25)" : "rgba(15, 23, 42, 0.12)"}
          shadowBlur={isHovered ? 6 : 4}
          shadowOffsetY={1}
        />
        <Text
          x={-badgeWidth / 2}
          y={-badgeHeight / 2 + 3}
          width={badgeWidth}
          height={badgeHeight}
          text={badgeText}
          fontSize={10}
          fontFamily="monospace, ui-monospace, sans-serif"
          fontStyle="bold"
          fill={badgeTextColor}
          align="center"
        />

        {/* Hover Delete Pill Badge floating directly above the measurement */}
        {isInteractive && isHovered && (
          <Group
            y={-(badgeHeight + 5)}
            onClick={(e) => {
              e.cancelBubble = true;
              onDelete?.();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onDelete?.();
            }}
          >
            <Rect
              x={-34}
              y={-9}
              width={68}
              height={18}
              cornerRadius={9}
              fill="#ef4444"
              stroke="#dc2626"
              strokeWidth={1}
              shadowColor="rgba(239, 68, 68, 0.45)"
              shadowBlur={8}
              shadowOffsetY={2}
            />
            <Text
              x={-34}
              y={-6}
              width={68}
              height={18}
              text="✕ Delete"
              fontSize={10}
              fontFamily="sans-serif"
              fontStyle="bold"
              fill="#ffffff"
              align="center"
            />
          </Group>
        )}

        {isDiagonal && !isHovered && (
          <Group y={badgeHeight + 2}>
            <Rect
              x={-55}
              y={-7}
              width={110}
              height={14}
              cornerRadius={7}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={0.8}
              shadowColor="rgba(15, 23, 42, 0.08)"
              shadowBlur={3}
              shadowOffsetY={1}
            />
            <Text
              x={-55}
              y={-5}
              width={110}
              text={`ΔX: ${dxMeters}m ΔY: ${dyMeters}m`}
              fontSize={8}
              fontFamily="monospace, ui-monospace, sans-serif"
              fontStyle="bold"
              fill="#475569"
              align="center"
            />
          </Group>
        )}
      </Group>
    </Group>
  );
}

// Magnetic Snap Point Target Marker
function SnapIndicator({ x, y, type, stageScale = 1 }) {
  const effectiveScale = Math.max(0.2, Math.min(stageScale, 5));
  const size = (type === "intersection" ? 10 : 8) / effectiveScale;
  const strokeW = (type === "intersection" ? 1.5 : 1.2) / effectiveScale;
  const color = type === "grid" ? "#818cf8" : (type === "intersection" ? "#f59e0b" : "#38bdf8");
  const fill = type === "intersection" ? "rgba(245, 158, 11, 0.3)" : "rgba(56, 189, 248, 0.25)";

  return (
    <Group x={x} y={y} listening={false}>
      <Rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        rotation={45}
        stroke={color}
        strokeWidth={strokeW}
        fill={fill}
        listening={false}
      />
      <Line
        points={[-size * 1.3, 0, size * 1.3, 0]}
        stroke={color}
        strokeWidth={strokeW * 0.9}
        listening={false}
      />
      <Line
        points={[0, -size * 1.3, 0, size * 1.3]}
        stroke={color}
        strokeWidth={strokeW * 0.9}
        listening={false}
      />
    </Group>
  );
}

const FloorPlanCanvas = React.forwardRef(({
  elements,
  onUpdateLayout = () => {},
  selectedIds = [],
  onSelectId,
  blueprintUrl,
  blueprintOpacity = 0.8,
  blueprintX = 0,
  blueprintY = 0,
  blueprintWidth,
  blueprintHeight,
  blueprintRotation = 0,
  blueprintIsLocked = false,
  snapToGrid,
  showGrid = true,
  gridSize = 20,
  toolMode = "select",
  onToolModeChange,
  floorPlanFont = "Inter",
  exhibitors = [],
  attendees = [],
  canvasWidth = 2400,
  canvasHeight = 1500,
  exportFilters = null,
  previewSearchQuery = "",
  previewFilter = "all",
  selectedSeatId = null,
  onSelectSeat = () => {},
  showDimensions = false,
  isPreviewMode = false,
  previewDeviceMode = "desktop",
  safetyClearance = 2.5,
  onSafetyClearanceChange,
}, ref) => {
  const stageRef = useRef(null);
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const transformerRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // Track dragging starting positions for selected items
  const dragStartPos = useRef({});
  const activeDragId = useRef(null);
  const dragStartScreenPos = useRef(null);
  const isMarqueeDragging = useRef(false);
  const justMarqueeDragged = useRef(false);
  const zoomTimeoutRef = useRef(null);
  const requestRef = useRef(null);
  const zoomTargetRef = useRef(null);
  const lastDist = useRef(0);
  const lastCenter = useRef(null);

  const exhibitorMap = React.useMemo(() => {
    const map = new Map();
    exhibitors.forEach(ex => map.set(String(ex.id), ex));
    return map;
  }, [exhibitors]);

  const attendeeMap = React.useMemo(() => {
    const map = new Map();
    attendees.forEach(a => map.set(String(a.id), a));
    return map;
  }, [attendees]);

  // Clean up zoom timeout and animation frame on unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  React.useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    zoomToElement: (id) => {
      const el = elements.find(item => item.id === id);
      if (!el) return;

      const targetScale = 1.5;
      setStageScale(targetScale);

      const elCenterX = el.x + el.width / 2;
      const elCenterY = el.y + el.height / 2;

      setStagePos({
        x: stageWidth / 2 - elCenterX * targetScale,
        y: stageHeight / 2 - elCenterY * targetScale
      });
    },
    addElement: (type) => {
      const stage = stageRef.current;
      if (!stage) return;
      
      const scale = stage.scaleX();
      const stageX = stage.x();
      const stageY = stage.y();
      
      // Calculate active canvas viewport center
      const viewportCenterX = (stageWidth / 2 - stageX) / scale;
      const viewportCenterY = (stageHeight / 2 - stageY) / scale;
      
      const gridX = snapToGrid ? Math.round(viewportCenterX / gridSize) * gridSize : Math.round(viewportCenterX);
      const gridY = snapToGrid ? Math.round(viewportCenterY / gridSize) * gridSize : Math.round(viewportCenterY);
      
      const newElement = createElementAt(type, gridX, gridY);
      
      onUpdateLayout([...elements, newElement]);
      onSelectId(newElement.id, false);
    },
    zoomToFit: () => {
      zoomTargetRef.current = null;
      handleZoomToFit();
    },
    zoomIn: () => {
      zoomTargetRef.current = null;
      setStageScale(prev => {
        const next = Math.min(prev * 1.2, 5); // Max zoom 5x
        // Keep screen center in place
        const centerX = stageWidth / 2;
        const centerY = stageHeight / 2;
        const mousePointTo = {
          x: (centerX - stagePos.x) / prev,
          y: (centerY - stagePos.y) / prev,
        };
        setStagePos({
          x: centerX - mousePointTo.x * next,
          y: centerY - mousePointTo.y * next,
        });
        return next;
      });
    },
    zoomOut: () => {
      zoomTargetRef.current = null;
      setStageScale(prev => {
        const fitScaleX = stageWidth / canvasWidth;
        const fitScaleY = stageHeight / canvasHeight;
        const minScale = Math.max(Math.min(fitScaleX, fitScaleY) * 0.25, 0.05);
        const next = Math.max(prev / 1.2, minScale);
        // Keep screen center in place
        const centerX = stageWidth / 2;
        const centerY = stageHeight / 2;
        const mousePointTo = {
          x: (centerX - stagePos.x) / prev,
          y: (centerY - stagePos.y) / prev,
        };
        setStagePos({
          x: centerX - mousePointTo.x * next,
          y: centerY - mousePointTo.y * next,
        });
        return next;
      });
    }
  }));

  const [stageWidth, setStageWidth] = useState(800);
  const [stageHeight, setStageHeight] = useState(600);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState(null);

  // Drag performance enhancement tracking state
  const [isDraggingElement, setIsDraggingElement] = useState(false);

  // Generate a dynamic 2D canvas pattern to draw grid lines on the GPU (supports up to 2000m x 2000m canvas sizes)
  const gridPatternImage = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw grid lines on right and bottom borders
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Right border
      ctx.moveTo(gridSize - 0.5, 0);
      ctx.lineTo(gridSize - 0.5, gridSize);
      // Bottom border
      ctx.moveTo(0, gridSize - 0.5);
      ctx.lineTo(gridSize, gridSize - 0.5);
      ctx.stroke();
    }
    return canvas;
  }, [gridSize]);

  const renderSeat = (seat, parentEl) => {
    const attendeeId = seat.assigned_participant_id || seat.attendeeId;
    const attendee = attendeeId ? attendeeMap.get(String(attendeeId)) : null;
    const isCheckedIn = (seat.seat_status === "checked_in") || (attendee && (attendee.status === "checked_in" || attendee.status === "checked-in" || attendee.status === "present"));
    const isAssigned = !!attendee || (seat.seat_status === "assigned");
    
    let fill = "rgba(255, 255, 255, 0.01)"; // near invisible fill to capture clicks
    let stroke = parentEl.strokeColor || "#64748b";
    let strokeWidth = 1;

    if (isCheckedIn || isAssigned) {
      fill = "rgba(29, 158, 117, 0.4)"; // green fill (#1D9E75 at 40% opacity)
      stroke = "#1D9E75";
      strokeWidth = 1.5;
    }

    const isSeatSelected = selectedSeatId === seat.id;
    if (isSeatSelected) {
      stroke = "#6366f1";
      strokeWidth = 2;
    }

    const shape = seat.shape || parentEl.seatShape || "rectangle";
    const x = seat.x;
    const y = seat.y;
    const width = seat.width || 10;
    const height = seat.height || 10;
    const rotation = seat.rotation || 0;

    const commonSeatProps = {
      id: `seat-${seat.id}`,
      x: x,
      y: y,
      width: width,
      height: height,
      offsetX: width / 2,
      offsetY: height / 2,
      rotation: rotation,
      fill: fill,
      stroke: stroke,
      strokeWidth: strokeWidth,
      cornerRadius: 2,
      listening: toolMode === "select" || isPreviewMode,
      onClick: (e) => {
        e.cancelBubble = true;
        onSelectSeat(parentEl.id, seat.id);
      },
      onTap: (e) => {
        e.cancelBubble = true;
        onSelectSeat(parentEl.id, seat.id);
      },
      onMouseEnter: () => {
        if (stageRef.current) {
          stageRef.current.container().style.cursor = "pointer";
        }
      },
      onMouseLeave: () => {
        if (stageRef.current) {
          stageRef.current.container().style.cursor = (toolMode === "pan" || toolMode === "preview") ? "grab" : "default";
        }
      }
    };

    const hasPicture = isPreviewMode && attendee && (attendee.image || attendee.picture);

    return (
      <Group key={seat.id}>
        {hasPicture ? (
          <SeatAttendeeAvatar
            src={attendee.image || attendee.picture}
            shape={shape}
            seatProps={commonSeatProps}
            width={width}
            height={height}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        ) : shape === "circle" ? (
          <Circle 
            {...commonSeatProps} 
            radius={Math.min(width, height) / 2}
            offsetX={0}
            offsetY={0}
          />
        ) : (
          <Rect {...commonSeatProps} />
        )}
      </Group>
    );
  };

  // Precalculate overlaps to reduce render loop complexity from O(N^2) to O(1) per element
  const overlapsMap = React.useMemo(() => {
    const map = new Map();
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (isLayoutElement(el)) {
        map.set(el.id, { underCount: 0, overCount: 0, total: 0 });
        continue;
      }

      const targetMinX = el.x;
      const targetMaxX = el.x + el.width;
      const targetMinY = el.y;
      const targetMaxY = el.y + el.height;
      
      let underCount = 0;
      let overCount = 0;
      
      for (let j = 0; j < elements.length; j++) {
        if (i === j) continue;
        const other = elements[j];
        if (isLayoutElement(other)) continue;

        const elMinX = other.x;
        const elMaxX = other.x + other.width;
        const elMinY = other.y;
        const elMaxY = other.y + other.height;
        
        const overlapX = Math.max(0, Math.min(targetMaxX, elMaxX) - Math.max(targetMinX, elMinX));
        const overlapY = Math.max(0, Math.min(targetMaxY, elMaxY) - Math.max(targetMinY, elMinY));
        
        if ((overlapX * overlapY) > 0) {
          if (j < i) {
            underCount++;
          } else {
            overCount++;
          }
        }
      }
      map.set(el.id, { underCount, overCount, total: underCount + overCount });
    }
    return map;
  }, [elements]);

  const getVisibleBounds = () => {
    const padding = 400; // logical margin buffer (in pixels) to avoid blank space on zoom/pan
    const xMin = -stagePos.x / stageScale - padding;
    const yMin = -stagePos.y / stageScale - padding;
    const xMax = (-stagePos.x + stageWidth) / stageScale + padding;
    const yMax = (-stagePos.y + stageHeight) / stageScale + padding;
    return { xMin, yMin, xMax, yMax };
  };

  const isElementInViewport = (el) => {
    return true; // Render all elements to avoid blinking/popping during zoom/pan
  };

  // Text inline editing state
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState("");

  const saveTextEdit = () => {
    if (editingTextId === null) return;
    const updated = elements.map(item => {
      if (item.id === editingTextId) {
        return { ...item, label: editingTextValue };
      }
      return item;
    });
    onUpdateLayout(updated);
    setEditingTextId(null);
  };

  const cancelTextEdit = () => {
    setEditingTextId(null);
  };

  // Marquee selection state
  const [marqueeStart, setMarqueeStart] = useState(null);
  const [marqueeEnd, setMarqueeEnd] = useState(null);

  // Auto-resize stage with rAF throttling and threshold check to prevent infinite update depth
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      const roundedW = Math.floor(width);
      const roundedH = Math.floor(height);
      if (roundedW >= 10 && roundedH >= 10) {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          setStageWidth(prev => (Math.abs(prev - roundedW) >= 2 ? roundedW : prev));
          setStageHeight(prev => (Math.abs(prev - roundedH) >= 2 ? roundedH : prev));
        });
      }
    });

    resizeObserver.observe(container);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  // Load blueprint background image safely (handles CORS, R2, and fallbacks)
  const [bgImage, setBgImage] = useState(null);
  useEffect(() => {
    if (!blueprintUrl) {
      setBgImage(null);
      isInitializedRef.current = false;
      return;
    }
    isInitializedRef.current = false;
    return loadSafeCanvasImage(blueprintUrl, (img) => {
      setBgImage(img);
    });
  }, [blueprintUrl]);

  // Request redraw when bgImage finishes loading
  useEffect(() => {
    if (bgImage && stageRef.current) {
      stageRef.current.batchDraw();
    }
  }, [bgImage]);

  // Constructor Mode state (supports multi-line drawing, hover-to-delete, and closed surface calculation)
  const [constructorLines, setConstructorLines] = useState([]);
  const [hoveredLineId, setHoveredLineId] = useState(null);
  const hoveredLineIdRef = useRef(null);
  useEffect(() => {
    hoveredLineIdRef.current = hoveredLineId;
  }, [hoveredLineId]);

  const [activeMeasurement, setActiveMeasurement] = useState(null);
  const [isRulerDrawing, setIsRulerDrawing] = useState(false);
  const [rulerLive, setRulerLive] = useState({ start: null, current: null });
  const [hoveredSnapPoint, setHoveredSnapPoint] = useState(null);
  const rulerWaitingSecondClick = useRef(false);
  const rulerStartPoint = useRef(null);
  const rulerHasDragged = useRef(false);

  // Automatically detect closed polygons and calculate enclosed surface area
  const detectedPolygons = useMemo(() => {
    if (toolMode !== "constructor" || exportFilters || constructorLines.length < 3) return [];
    return detectClosedPolygons(constructorLines);
  }, [toolMode, exportFilters, constructorLines]);

  const totalClosedSurfaceArea = useMemo(() => {
    return detectedPolygons.reduce((acc, p) => acc + (p.areaMeters || 0), 0);
  }, [detectedPolygons]);

  // Handler to delete a single constructor line
  const handleDeleteConstructorLine = useCallback((lineId) => {
    setConstructorLines(prev => prev.filter(l => l.id !== lineId));
    setHoveredLineId(prev => (prev === lineId ? null : prev));
    setActiveMeasurement(prev => (prev?.id === lineId ? null : prev));
  }, []);

  // Cancel live in-progress drawing when switching away from constructor mode
  useEffect(() => {
    if (toolMode !== "constructor") {
      setIsRulerDrawing(false);
      setRulerLive({ start: null, current: null });
      setHoveredSnapPoint(null);
      setHoveredLineId(null);
      rulerWaitingSecondClick.current = false;
      rulerStartPoint.current = null;
      rulerHasDragged.current = false;
    }
  }, [toolMode]);

  // Keyboard shortcut listener: Esc cancels active drawing; Delete/Backspace removes hovered line
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (toolMode !== "constructor") return;

      if (e.key === "Escape") {
        if (isRulerDrawing || rulerWaitingSecondClick.current || rulerStartPoint.current) {
          e.preventDefault();
          e.stopPropagation();
          setIsRulerDrawing(false);
          rulerStartPoint.current = null;
          rulerWaitingSecondClick.current = false;
          rulerHasDragged.current = false;
          setRulerLive({ start: null, current: null });
        } else if (activeMeasurement) {
          setActiveMeasurement(null);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (hoveredLineIdRef.current) {
          e.preventDefault();
          e.stopPropagation();
          handleDeleteConstructorLine(hoveredLineIdRef.current);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toolMode, isRulerDrawing, activeMeasurement, handleDeleteConstructorLine]);

  // Magnetic Snapping helper
  const getSnapPoint = useCallback((rawX, rawY) => {
    const effectiveScale = Math.max(0.2, Math.min(stageScale, 5));
    const SNAP_RADIUS = 14 / effectiveScale;
    let closestPoint = null;
    let minDistance = SNAP_RADIUS;

    // Collect candidate snap points from existing constructor lines (endpoints, midpoints, intersections)
    if (constructorLines.length > 0) {
      for (const line of constructorLines) {
        const linePoints = [
          { x: line.x1, y: line.y1, type: 'corner' },
          { x: line.x2, y: line.y2, type: 'corner' },
          { x: (line.x1 + line.x2) / 2, y: (line.y1 + line.y2) / 2, type: 'midpoint' }
        ];
        for (const pt of linePoints) {
          const d = Math.hypot(pt.x - rawX, pt.y - rawY);
          if (d < minDistance) {
            minDistance = d;
            closestPoint = { ...pt, isSnapped: true };
          }
        }
      }

      // Check intersections between constructor lines
      for (let i = 0; i < constructorLines.length; i++) {
        for (let j = i + 1; j < constructorLines.length; j++) {
          const inter = getSegmentIntersection(
            { x: constructorLines[i].x1, y: constructorLines[i].y1 },
            { x: constructorLines[i].x2, y: constructorLines[i].y2 },
            { x: constructorLines[j].x1, y: constructorLines[j].y1 },
            { x: constructorLines[j].x2, y: constructorLines[j].y2 }
          );
          if (inter) {
            const d = Math.hypot(inter.x - rawX, inter.y - rawY);
            if (d < minDistance) {
              minDistance = d;
              closestPoint = { x: inter.x, y: inter.y, type: 'intersection', isSnapped: true };
            }
          }
        }
      }
    }

    // Collect candidate snap points from elements
    for (const el of elements) {
      if (isLayoutElement(el)) continue;
      const points = [
        { x: el.x, y: el.y, type: 'corner' },
        { x: el.x + el.width, y: el.y, type: 'corner' },
        { x: el.x, y: el.y + el.height, type: 'corner' },
        { x: el.x + el.width, y: el.y + el.height, type: 'corner' },
        { x: el.x + el.width / 2, y: el.y, type: 'midpoint' },
        { x: el.x + el.width / 2, y: el.y + el.height, type: 'midpoint' },
        { x: el.x, y: el.y + el.height / 2, type: 'midpoint' },
        { x: el.x + el.width, y: el.y + el.height / 2, type: 'midpoint' },
        { x: el.x + el.width / 2, y: el.y + el.height / 2, type: 'center' }
      ];

      for (const pt of points) {
        const d = Math.hypot(pt.x - rawX, pt.y - rawY);
        if (d < minDistance) {
          minDistance = d;
          closestPoint = { ...pt, isSnapped: true };
        }
      }
    }

    // Candidate snap points from blueprint background if available
    if (bgImage && Number.isFinite(blueprintWidth) && Number.isFinite(blueprintHeight)) {
      const bpX = blueprintX || 0;
      const bpY = blueprintY || 0;
      const bpW = blueprintWidth;
      const bpH = blueprintHeight;
      const bpPoints = [
        { x: bpX, y: bpY, type: 'corner' },
        { x: bpX + bpW, y: bpY, type: 'corner' },
        { x: bpX, y: bpY + bpH, type: 'corner' },
        { x: bpX + bpW, y: bpY + bpH, type: 'corner' },
        { x: bpX + bpW / 2, y: bpY, type: 'midpoint' },
        { x: bpX + bpW / 2, y: bpY + bpH, type: 'midpoint' },
        { x: bpX, y: bpY + bpH / 2, type: 'midpoint' },
        { x: bpX + bpW, y: bpY + bpH / 2, type: 'midpoint' },
      ];
      for (const pt of bpPoints) {
        const d = Math.hypot(pt.x - rawX, pt.y - rawY);
        if (d < minDistance) {
          minDistance = d;
          closestPoint = { ...pt, isSnapped: true };
        }
      }
    }

    if (closestPoint) {
      return closestPoint;
    }

    // Grid snap if enabled
    if (snapToGrid) {
      const gridX = Math.round(rawX / gridSize) * gridSize;
      const gridY = Math.round(rawY / gridSize) * gridSize;
      const gridDist = Math.hypot(gridX - rawX, gridY - rawY);
      if (gridDist <= SNAP_RADIUS) {
        return { x: gridX, y: gridY, type: 'grid', isSnapped: true };
      }
    }

    return { x: rawX, y: rawY, type: null, isSnapped: false };
  }, [elements, constructorLines, stageScale, bgImage, blueprintWidth, blueprintHeight, blueprintX, blueprintY, snapToGrid, gridSize]);

  // Dynamic Element-to-Element Distance Guides for Constructor Mode
  const dynamicConstructorGuides = useMemo(() => {
    if (toolMode !== "constructor" || exportFilters) return [];

    const selectedEl = elements.find(el => selectedIds.includes(el.id) && !isLayoutElement(el));
    const hoveredEl = elements.find(el => el.id === hoveredId && !isLayoutElement(el));

    // When an element is clicked/selected in Constructor Mode: show distances to ALL other elements and room walls!
    if (selectedEl) {
      return computeAllElementDistances(selectedEl, elements, canvasWidth, canvasHeight, safetyClearance, hoveredId);
    }

    // When no element is selected but an element is hovered: show 4-way orthogonal guides to nearest obstacles & walls
    if (hoveredEl) {
      return computeOrthogonalGuides(hoveredEl, elements, canvasWidth, canvasHeight, safetyClearance);
    }

    return [];
  }, [toolMode, exportFilters, elements, selectedIds, hoveredId, canvasWidth, canvasHeight, safetyClearance]);

  // The active reference element clicked in Constructor Mode
  const selectedConstructorElement = useMemo(() => {
    if (toolMode !== "constructor") return null;
    return elements.find(el => selectedIds.includes(el.id) && !isLayoutElement(el)) || null;
  }, [toolMode, elements, selectedIds]);

  const handleZoomToFit = React.useCallback(() => {
    if (stageWidth <= 0 || stageHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) return;
    const scaleX = stageWidth / canvasWidth;
    const scaleY = stageHeight / canvasHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 10% space on the edges
    if (scale > 0) {
      setStageScale(scale);
      setStagePos({
        x: (stageWidth - canvasWidth * scale) / 2,
        y: (stageHeight - canvasHeight * scale) / 2
      });
    }
  }, [stageWidth, stageHeight, canvasWidth, canvasHeight]);

  // Keep a ref to handleZoomToFit to avoid re-triggering dependent effects on every resize
  const zoomToFitRef = useRef(handleZoomToFit);
  zoomToFitRef.current = handleZoomToFit;

  // Zoom to fit when preview mode toggles
  const prevPreviewModeRef = useRef(isPreviewMode);
  useEffect(() => {
    if (prevPreviewModeRef.current !== isPreviewMode) {
      prevPreviewModeRef.current = isPreviewMode;
      isInitializedRef.current = false;
      zoomToFitRef.current?.();
    }
  }, [isPreviewMode]);

  // Centering the canvas area in the viewport once initially when stage dimensions are ready
  useEffect(() => {
    if (stageWidth <= 0 || stageHeight <= 0 || isInitializedRef.current) return;
    isInitializedRef.current = true;
    zoomToFitRef.current?.();
  }, [stageWidth, stageHeight]);

  // Update Konva transformer node selection
  useEffect(() => {
    if (!transformerRef.current) return;
    const transformer = transformerRef.current;
    if (selectedIds && selectedIds.length > 0 && toolMode === "select") {
      const nodes = [];
      selectedIds.forEach(id => {
        if (id === "blueprint") {
          if (!blueprintIsLocked) {
            const blueprintNode = stageRef.current?.findOne("#blueprint-node");
            if (blueprintNode) nodes.push(blueprintNode);
          }
        } else {
          const el = elements.find(item => item.id === id);
          if (el && !el.isLocked) {
            const node = stageRef.current?.findOne(`#el-${id}`);
            if (node) nodes.push(node);
          }
        }
      });
      transformer.nodes(nodes);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
    }
  }, [selectedIds, elements, toolMode, blueprintIsLocked, bgImage]);

  // Set cursor styles based on toolMode
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container();
    if (toolMode === "pan" || toolMode === "preview") {
      container.style.cursor = "grab";
    } else if (toolMode === "constructor") {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "default";
    }
  }, [toolMode]);

  // Wheel zoom and pan behavior is fully controlled by the user.

  // Zooming via mouse wheel (throttled via requestAnimationFrame for 60fps performance)
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.05;
    const oldScale = zoomTargetRef.current ? zoomTargetRef.current.scale : stage.scaleX();
    const currentX = zoomTargetRef.current ? zoomTargetRef.current.x : stage.x();
    const currentY = zoomTargetRef.current ? zoomTargetRef.current.y : stage.y();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - currentX) / oldScale,
      y: (pointer.y - currentY) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    const fitScaleX = stageWidth / canvasWidth;
    const fitScaleY = stageHeight / canvasHeight;
    const minPossibleScale = Math.min(fitScaleX, fitScaleY) * 0.9; // 10% space on the edges
    const minScaleLimit = Math.max(0.01, Math.min(0.15, minPossibleScale));

    const boundedScale = Math.max(minScaleLimit, Math.min(newScale, 8));

    const newX = pointer.x - mousePointTo.x * boundedScale;
    const newY = pointer.y - mousePointTo.y * boundedScale;

    // Store target zoom state
    zoomTargetRef.current = { scale: boundedScale, x: newX, y: newY };

    // Request animation frame to throttle redrawing to screen refresh rate
    if (!requestRef.current) {
      requestRef.current = requestAnimationFrame(() => {
        if (zoomTargetRef.current) {
          stage.scale({ x: zoomTargetRef.current.scale, y: zoomTargetRef.current.scale });
          stage.position({ x: zoomTargetRef.current.x, y: zoomTargetRef.current.y });
          stage.batchDraw();
        }
        requestRef.current = null;
      });
    }

    // Debounce React state update so expensive diff reconciliation happens only after zooming settles
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    zoomTimeoutRef.current = setTimeout(() => {
      if (zoomTargetRef.current) {
        setStageScale(zoomTargetRef.current.scale);
        setStagePos({ x: zoomTargetRef.current.x, y: zoomTargetRef.current.y });
        zoomTargetRef.current = null; // Clear target zoom state after setting React state
      }
    }, 150);
  };

  const handleTouchStart = (e) => {
    const stage = stageRef.current;
    if (!stage) return;
    const touches = e.evt.touches;
    if (touches.length === 2) {
      stage.stopDrag();
      const p1 = { x: touches[0].clientX, y: touches[0].clientY };
      const p2 = { x: touches[1].clientX, y: touches[1].clientY };
      lastDist.current = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      lastCenter.current = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
      // Clear target zoom state for start of new pinch gesture
      zoomTargetRef.current = null;
    }
  };

  const handleTouchMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;
    const touches = e.evt.touches;
    if (touches.length === 2) {
      e.evt.preventDefault();
      
      const p1 = { x: touches[0].clientX, y: touches[0].clientY };
      const p2 = { x: touches[1].clientX, y: touches[1].clientY };
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
      
      if (!lastDist.current) {
        lastDist.current = dist;
        lastCenter.current = center;
        return;
      }

      const oldScale = zoomTargetRef.current ? zoomTargetRef.current.scale : stage.scaleX();
      const currentX = zoomTargetRef.current ? zoomTargetRef.current.x : stage.x();
      const currentY = zoomTargetRef.current ? zoomTargetRef.current.y : stage.y();

      const scaleBy = dist / lastDist.current;
      let newScale = oldScale * scaleBy;
      
      const fitScaleX = stageWidth / canvasWidth;
      const fitScaleY = stageHeight / canvasHeight;
      const minPossibleScale = Math.min(fitScaleX, fitScaleY) * 0.9;
      const minScaleLimit = Math.max(0.01, Math.min(0.15, minPossibleScale));
      const boundedScale = Math.max(minScaleLimit, Math.min(newScale, 8));

      const stageBox = stage.container().getBoundingClientRect();
      const pointer = {
        x: center.x - stageBox.left,
        y: center.y - stageBox.top,
      };

      const mousePointTo = {
        x: (pointer.x - currentX) / oldScale,
        y: (pointer.y - currentY) / oldScale,
      };

      const newX = pointer.x - mousePointTo.x * boundedScale;
      const newY = pointer.y - mousePointTo.y * boundedScale;

      zoomTargetRef.current = { scale: boundedScale, x: newX, y: newY };

      if (!requestRef.current) {
        requestRef.current = requestAnimationFrame(() => {
          if (zoomTargetRef.current) {
            stage.scale({ x: zoomTargetRef.current.scale, y: zoomTargetRef.current.scale });
            stage.position({ x: zoomTargetRef.current.x, y: zoomTargetRef.current.y });
            stage.batchDraw();
          }
          requestRef.current = null;
        });
      }

      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      zoomTimeoutRef.current = setTimeout(() => {
        if (zoomTargetRef.current) {
          setStageScale(zoomTargetRef.current.scale);
          setStagePos({ x: zoomTargetRef.current.x, y: zoomTargetRef.current.y });
        }
      }, 150);

      lastDist.current = dist;
      lastCenter.current = center;
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
    lastCenter.current = null;
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = null;
    }
    if (zoomTargetRef.current) {
      setStageScale(zoomTargetRef.current.scale);
      setStagePos({ x: zoomTargetRef.current.x, y: zoomTargetRef.current.y });
      zoomTargetRef.current = null;
    }
  };

  const createElementAt = (dragType, gridX, gridY) => {
    let newElement = {
      id: `el_${Date.now()}`,
      type: dragType,
      x: gridX,
      y: gridY,
      width: 100,
      height: 80,
      rotation: 0,
      label: "",
      status: "available",
      isLocked: false,
      color: null,
      fontFamily: floorPlanFont // Seed with the current floor plan typography!
    };

    // Custom asset seed properties
    if (dragType === "booth-empty") {
      newElement.width = 80;
      newElement.height = 80;
      newElement.label = `Empty Booth A${elements.length + 1}`;
    } else if (dragType === "booth-semi") {
      newElement.width = 80;
      newElement.height = 80;
      newElement.label = `Semi-Equipped Booth B${elements.length + 1}`;
    } else if (dragType === "booth-equipped") {
      newElement.width = 100;
      newElement.height = 100;
      newElement.label = `Equipped Booth C${elements.length + 1}`;
    } else if (dragType === "corridor") {
      newElement.width = 240;
      newElement.height = 40;
      newElement.label = "Corridor";
    } else if (dragType === "stage") {
      newElement.width = 200;
      newElement.height = 100;
      newElement.label = "Main Stage";
    } else if (dragType === "screen") {
      newElement.width = 160;
      newElement.height = 20;
      newElement.label = "LED Display Screen";
    } else if (dragType === "desk") {
      newElement.width = 120;
      newElement.height = 60;
      newElement.label = "Registration Desk";
    } else if (dragType === "entrance" || dragType === "exit") {
      newElement.width = 80;
      newElement.height = 40;
      newElement.label = dragType === "entrance" ? "Entrance Gate" : "Exit Way";
    } else if (dragType === "table") {
      newElement.width = 90;
      newElement.height = 90;
      newElement.label = "Table";
    } else if (dragType === "table-chairs") {
      newElement.width = 120;
      newElement.height = 120;
      newElement.label = "Banquet Table";
      newElement.chairsCount = 6;
      newElement.assignments = {};
    } else if (dragType === "structural-pillar") {
      newElement.width = 30;
      newElement.height = 30;
      newElement.label = "Pillar";
    } else if (dragType === "structural-partition") {
      newElement.width = 80;
      newElement.height = 10;
      newElement.label = "Wall Partition";
    } else if (dragType === "structural-stairs") {
      newElement.width = 80;
      newElement.height = 120;
      newElement.label = "Stairs";
    } else if (dragType === "structural-escalator") {
      newElement.width = 80;
      newElement.height = 120;
      newElement.label = "Escalator";
    } else if (dragType === "access-security") {
      newElement.width = 50;
      newElement.height = 50;
      newElement.label = "Security Scanner";
    } else if (dragType === "access-barriers") {
      newElement.width = 120;
      newElement.height = 10;
      newElement.label = "Queue Barriers";
    } else if (dragType === "access-assembly") {
      newElement.width = 80;
      newElement.height = 80;
      newElement.label = "Emergency Assembly Point";
    } else if (dragType === "stage-panel") {
      newElement.width = 120;
      newElement.height = 40;
      newElement.label = "Speakers Panel Table";
    } else if (dragType === "stage-podium") {
      newElement.width = 120;
      newElement.height = 85;
      newElement.label = "Speaker Podium";
      newElement.chairsCount = 2;
    } else if (dragType === "tech-totem") {
      newElement.width = 30;
      newElement.height = 20;
      newElement.label = "Digital Totem";
    } else if (dragType === "tech-banner") {
      newElement.width = 40;
      newElement.height = 10;
      newElement.label = "Roll-up Banner";
    } else if (dragType === "tech-camera") {
      newElement.width = 50;
      newElement.height = 50;
      newElement.label = "Camera Broadcast";
    } else if (dragType === "tech-wifi") {
      newElement.width = 20;
      newElement.height = 20;
      newElement.label = "WiFi AP";
    } else if (dragType === "net-speakers") {
      newElement.width = 160;
      newElement.height = 120;
      newElement.label = "Speakers Lounge";
    } else if (dragType === "utility-prayer") {
      newElement.width = 120;
      newElement.height = 100;
      newElement.label = "Prayer Room";
    } else if (dragType === "utility-water") {
      newElement.width = 30;
      newElement.height = 30;
      newElement.label = "Water Station";
    } else if (dragType === "utility-trash") {
      newElement.width = 40;
      newElement.height = 20;
      newElement.label = "Trash/Recycle Bins";
    } else if (dragType === "utility-dining") {
      newElement.width = 200;
      newElement.height = 160;
      newElement.label = "Dining Area";
    } else if (dragType === "furniture-sofa") {
      newElement.width = 140;
      newElement.height = 60;
      newElement.label = "Lounge Sofa";
    } else if (dragType === "furniture-cocktail") {
      newElement.width = 60;
      newElement.height = 60;
      newElement.label = "Cocktail Stand";
    } else if (dragType === "utility-catering") {
      newElement.width = 120;
      newElement.height = 80;
      newElement.label = "Catering Table";
    } else if (dragType === "utility-wc") {
      newElement.width = 60;
      newElement.height = 60;
      newElement.label = "Restrooms";
    } else if (dragType === "utility-coffee") {
      newElement.width = 160;
      newElement.height = 120;
      newElement.label = "Coffee Lounge";
    } else if (dragType === "utility-help") {
      newElement.width = 60;
      newElement.height = 60;
      newElement.label = "Info Booth";
    } else if (dragType === "access-badging") {
      newElement.width = 60;
      newElement.height = 60;
      newElement.label = "Self-Service Badging Kiosk";
    } else if (dragType === "access-turnstile") {
      newElement.width = 80;
      newElement.height = 40;
      newElement.label = "Turnstile Access";
    } else if (dragType === "access-scan") {
      newElement.width = 60;
      newElement.height = 60;
      newElement.label = "Scan Checkpoint";
    } else if (dragType === "net-pod") {
      newElement.width = 120;
      newElement.height = 120;
      newElement.label = "B2B Meeting Pod";
    } else if (dragType === "net-vip") {
      newElement.width = 200;
      newElement.height = 150;
      newElement.label = "VIP Lounge";
    } else if (dragType === "net-press") {
      newElement.width = 160;
      newElement.height = 100;
      newElement.label = "Press / Media Zone";
    } else if (dragType === "utility-firstaid") {
      newElement.width = 100;
      newElement.height = 80;
      newElement.label = "First Aid Station";
    } else if (dragType === "utility-cloak") {
      newElement.width = 120;
      newElement.height = 80;
      newElement.label = "Cloakroom";
    } else if (dragType === "utility-power") {
      newElement.width = 40;
      newElement.height = 40;
      newElement.label = "Power Station";
    } else if (dragType === "text") {
      newElement.width = 180;
      newElement.height = 50;
      newElement.label = "Double-click to edit annotation label";
    } else if (dragType === "circle") {
      newElement.width = 80;
      newElement.height = 80;
      newElement.label = "Circle";
    } else if (dragType === "square") {
      newElement.width = 80;
      newElement.height = 80;
      newElement.label = "Square";
    } else if (dragType === "triangle") {
      newElement.width = 80;
      newElement.height = 80;
      newElement.label = "Triangle";
    } else if (dragType === "star") {
      newElement.width = 80;
      newElement.height = 80;
      newElement.label = "Star";
    } else if (dragType === "heart") {
      newElement.width = 80;
      newElement.height = 80;
      newElement.label = "Heart";
    } else if (dragType === "arrow") {
      newElement.width = 100;
      newElement.height = 60;
      newElement.label = "Arrow Route";
      newElement.points = [10, 30, 90, 30];
    } else if (dragType === "auditorium-block") {
      newElement.rows = 10;
      newElement.seatsPerRow = 15;
      newElement.rowSpacing = 1.0;
      newElement.seatSpacing = 0.6;
      newElement.curved = false;
      newElement.arcRadius = 20;
      newElement.seatWidth = 0.5;
      newElement.seatDepth = 0.5;
      newElement.children = generateAuditoriumSeats(newElement.id, 10, 15, 1.0, 0.6, false, 20, 0.5, 0.5);
      newElement.label = "Auditorium Block";
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      newElement.children.forEach(c => {
        const hw = (c.width || 10) / 2;
        const hh = (c.height || 10) / 2;
        if (c.x - hw < minX) minX = c.x - hw;
        if (c.x + hw > maxX) maxX = c.x + hw;
        if (c.y - hh < minY) minY = c.y - hh;
        if (c.y + hh > maxY) maxY = c.y + hh;
      });
      const boundsWidth = maxX - minX;
      const boundsHeight = maxY - minY;
      newElement.width = boundsWidth > 0 ? Math.round(boundsWidth) : 300;
      newElement.height = boundsHeight > 0 ? Math.round(boundsHeight + 25) : 240;
    } else if (dragType === "theater-in-the-round") {
      newElement.rings = 3;
      newElement.stageRadius = 5.0;
      newElement.ringSpacing = 1.5;
      newElement.seatSpacing = 0.8;
      newElement.seatWidth = 0.5;
      newElement.seatDepth = 0.5;
      newElement.children = generateTheaterSeats(newElement.id, 3, 5.0, 1.5, 0.8, 0.5, 0.5);
      newElement.label = "Theater in the Round";
      let maxR = 0;
      newElement.children.forEach(c => {
        const dist = Math.hypot(c.x, c.y);
        if (dist > maxR) maxR = dist;
      });
      const boundsSize = Math.round(maxR * 2 + 20);
      newElement.width = boundsSize > 0 ? boundsSize : 400;
      newElement.height = boundsSize > 0 ? boundsSize : 400;
    } else if (dragType === "classroom-rows") {
      newElement.rows = 3;
      newElement.tablesPerRow = 4;
      newElement.tableWidth = 1.8;
      newElement.tableDepth = 0.6;
      newElement.chairsPerTable = 2;
      newElement.rowSpacing = 2.0;
      newElement.tableSpacing = 1.0;
      newElement.facingDirection = "north";
      newElement.children = generateClassroomSeats(newElement.id, 3, 4, 1.8, 0.6, 2, 2.0, 1.0);
      newElement.label = "Classroom Seating";
      const tableWidth_px = (newElement.tableWidth || 1.8) * 20;
      const tableDepth_px = (newElement.tableDepth || 0.6) * 20;
      const rowSpacing_px = (newElement.rowSpacing || 2.0) * 20;
      const tableSpacing_px = (newElement.tableSpacing || 1.0) * 20;
      const facingDirection = newElement.facingDirection || "north";
      let boundsW, boundsH;
      if (facingDirection === "north" || facingDirection === "south") {
        boundsW = (newElement.tablesPerRow || 4) * tableWidth_px + ((newElement.tablesPerRow || 4) - 1) * tableSpacing_px;
        boundsH = (newElement.rows || 3) * tableDepth_px + ((newElement.rows || 3) - 1) * rowSpacing_px + 20;
      } else {
        boundsW = (newElement.rows || 3) * tableDepth_px + ((newElement.rows || 3) - 1) * rowSpacing_px + 20;
        boundsH = (newElement.tablesPerRow || 4) * tableWidth_px + ((newElement.tablesPerRow || 4) - 1) * tableSpacing_px;
      }
      newElement.width = Math.round(boundsW);
      newElement.height = Math.round(boundsH);
    } else if (dragType === "reserved-seat-block") {
      newElement.seatCount = 2;
      newElement.rows = 3;
      newElement.seatSpacing = 0.8;
      newElement.rowSpacing = 1.5;
      newElement.seatWidth = 0.5;
      newElement.seatDepth = 0.5;
      newElement.showNameLabels = true;
      newElement.children = generateReservedSeats(newElement.id, 2, "Seat", 0.8, 0.5, 0.5, 3, 1.5);
      newElement.label = "Seats";
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      newElement.children.forEach(c => {
        const hw = (c.width || 10) / 2;
        const hh = (c.height || 10) / 2;
        if (c.x - hw < minX) minX = c.x - hw;
        if (c.x + hw > maxX) maxX = c.x + hw;
        if (c.y - hh < minY) minY = c.y - hh;
        if (c.y + hh > maxY) maxY = c.y + hh;
      });
      const boundsWidth = maxX - minX;
      const boundsHeight = maxY - minY;
      newElement.width = boundsWidth > 0 ? Math.round(boundsWidth) : 40;
      newElement.height = boundsHeight > 0 ? Math.round(boundsHeight + 25) : 60;
    } else if (dragType === "runway-t") {
      newElement.width = 200;
      newElement.height = 240;
      newElement.stageWidth = 6.0;
      newElement.stageDepth = 4.0;
      newElement.runwayLength = 8.0;
      newElement.runwayWidth = 2.0;
      newElement.label = "T Runway Stage";
    } else if (dragType === "broadcast-studio") {
      newElement.width = 240;
      newElement.height = 200;
      newElement.cameraCount = 3;
      newElement.label = "Broadcast Studio";
    } else if (dragType === "lighting-rig") {
      newElement.width = 200;
      newElement.height = 20;
      newElement.trussLength = 10;
      newElement.dropCount = 4;
      newElement.label = "Truss Rig";
    } else if (dragType === "scheduled-meeting-room") {
      newElement.width = 160;
      newElement.height = 120;
      newElement.roomName = "Meeting Room";
      newElement.capacity = 10;
      newElement.timeSlots = [];
      newElement.label = "Meeting Room";
    } else if (dragType === "net-zone") {
      newElement.width = 240;
      newElement.height = 200;
      newElement.capacity = 40;
      newElement.furnitureStyle = "cocktail";
      newElement.label = "Networking Zone";
    } else if (dragType === "pitch-zone") {
      newElement.width = 280;
      newElement.height = 200;
      newElement.podCount = 6;
      newElement.podsPerRow = 3;
      newElement.podLabel = "Pod";
      newElement.label = "Pitch Pods";
    } else if (dragType === "zone-overlay") {
      newElement.width = 480;
      newElement.height = 320;
      newElement.fillColor = "#3b82f6";
      newElement.opacity = 0.2;
      newElement.borderStyle = "dashed";
      newElement.label = "Zone Area";
    } else if (dragType === "safety-extinguisher") {
      newElement.width = 20;
      newElement.height = 20;
      newElement.label = "Extinguisher";
    } else if (dragType === "safety-exit-route") {
      newElement.width = 200;
      newElement.height = 40;
      newElement.label = "Exit Route";
    } else if (dragType === "safety-accessibility-path") {
      newElement.width = 200;
      newElement.height = 40;
      newElement.label = "Accessibility Path";
    } else if (dragType === "safety-cctv") {
      newElement.width = 60;
      newElement.height = 60;
      newElement.coverageAngle = 90;
      newElement.rotation = 45;
      newElement.label = "Security CCTV";
    } else if (dragType === "parking-zone") {
      newElement.width = 400;
      newElement.height = 300;
      newElement.bayCount = 10;
      newElement.reservedCount = 2;
      newElement.label = "Parking Area";
    } else if (dragType === "shuttle-bay") {
      newElement.width = 240;
      newElement.height = 120;
      newElement.label = "Shuttle Drop-off";
    } else if (dragType === "tent-marquee") {
      newElement.width = 320;
      newElement.height = 200;
      newElement.label = "Pavilion Tent";
    } else if (dragType === "landscape-zone") {
      newElement.width = 240;
      newElement.height = 200;
      newElement.label = "Landscaping Park";
    } else if (dragType === "perimeter-barrier") {
      newElement.width = 300;
      newElement.height = 10;
      newElement.label = "Perimeter Boundary";
    } else if (dragType === "food-truck") {
      newElement.width = 160;
      newElement.height = 100;
      newElement.label = "Food Truck Bay";
    } else if (dragType === "drinks-bar") {
      newElement.width = 120;
      newElement.height = 80;
      newElement.barType = "Full Bar";
      newElement.label = "Drinks Bar";
    } else if (dragType === "buffet-line") {
      newElement.width = 200;
      newElement.height = 60;
      newElement.curved = false;
      newElement.label = "Buffet Line";
    } else if (dragType === "snack-kiosk") {
      newElement.width = 60;
      newElement.height = 60;
      newElement.label = "Snack Kiosk";
    }

    return newElement;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const dragType = e.dataTransfer.getData("dragType") || e.dataTransfer.getData("text/plain");
    if (!dragType) return;

    stage.setPointersPositions(e);
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - stageX) / scale;
    const y = (pointer.y - stageY) / scale;

    const gridX = snapToGrid ? Math.round(x / gridSize) * gridSize : Math.round(x);
    const gridY = snapToGrid ? Math.round(y / gridSize) * gridSize : Math.round(y);

    const newElement = createElementAt(dragType, gridX, gridY);

    onUpdateLayout([...elements, newElement]);
    onSelectId(newElement.id, false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Dragging logic
  const handleDragStartElement = (e, id) => {
    if (activeDragId.current && activeDragId.current !== id) return;
    activeDragId.current = id;
    setIsDraggingElement(true);

    // If the element is not currently in selectedIds, select it immediately
    let dragIds = selectedIds;
    if (!selectedIds.includes(id)) {
      dragIds = [id];
      onSelectId(id, false);
    }

    const initialPos = {};
    dragIds.forEach(selId => {
      const node = selId === "blueprint"
        ? stageRef.current.findOne("#blueprint-node")
        : stageRef.current.findOne(`#el-${selId}`);
      if (node) {
        initialPos[selId] = { x: node.x(), y: node.y() };
      }
    });
    dragStartPos.current = initialPos;
  };

  const handleDragMoveElement = (e, id) => {
    if (activeDragId.current !== id) return;

    if (dragStartPos.current[id]) {
      let dx = e.target.x() - dragStartPos.current[id].x;
      let dy = e.target.y() - dragStartPos.current[id].y;
      
      if (snapToGrid) {
        // Enforce snapping on the target node during the drag move
        const targetSnappedX = Math.round((dragStartPos.current[id].x + dx) / gridSize) * gridSize;
        const targetSnappedY = Math.round((dragStartPos.current[id].y + dy) / gridSize) * gridSize;
        
        dx = targetSnappedX - dragStartPos.current[id].x;
        dy = targetSnappedY - dragStartPos.current[id].y;
        
        e.target.x(targetSnappedX);
        e.target.y(targetSnappedY);
      }

      Object.keys(dragStartPos.current).forEach(selId => {
        if (selId === id) return;
        const node = selId === "blueprint"
          ? stageRef.current.findOne("#blueprint-node")
          : stageRef.current.findOne(`#el-${selId}`);
        const start = dragStartPos.current[selId];
        if (node && start) {
          if (snapToGrid) {
            node.x(Math.round((start.x + dx) / gridSize) * gridSize);
            node.y(Math.round((start.y + dy) / gridSize) * gridSize);
          } else {
            node.x(start.x + dx);
            node.y(start.y + dy);
          }
        }
      });
      stageRef.current.batchDraw();
    }
  };

  const handleDragEndElement = (e, id) => {
    setIsDraggingElement(false);
    if (activeDragId.current !== id) return;

    if (dragStartPos.current[id]) {
      const dx = e.target.x() - dragStartPos.current[id].x;
      const dy = e.target.y() - dragStartPos.current[id].y;
      
      let nextBlueprint = null;
      const activeIds = Object.keys(dragStartPos.current);
      
      const updated = elements.map(el => {
        if (activeIds.includes(el.id)) {
          const start = dragStartPos.current[el.id];
          if (start) {
            let newX = start.x + dx;
            let newY = start.y + dy;
            if (snapToGrid) {
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;
            }

            // Snapping exit routes and accessibility paths to doorways
            if (el.type === "safety-exit-route" || el.type === "safety-accessibility-path") {
              const doors = elements.filter(item => item.type === "entrance" || item.type === "exit");
              for (const door of doors) {
                const doorCenterX = door.x + door.width / 2;
                const doorCenterY = door.y + door.height / 2;
                
                // Snap start point
                const startDist = Math.hypot(newX - doorCenterX, newY - doorCenterY);
                if (startDist < 25) {
                  newX = doorCenterX;
                  newY = doorCenterY;
                  break;
                }
                
                // Snap end point
                const endDist = Math.hypot((newX + el.width) - doorCenterX, (newY + el.height) - doorCenterY);
                if (endDist < 25) {
                  newX = doorCenterX - el.width;
                  newY = doorCenterY - el.height;
                  break;
                }
              }
            }

            return { ...el, x: newX, y: newY };
          }
        }
        return el;
      });

      if (activeIds.includes("blueprint") && dragStartPos.current["blueprint"]) {
        const start = dragStartPos.current["blueprint"];
        nextBlueprint = {
          x: Math.round(start.x + dx),
          y: Math.round(start.y + dy),
          width: blueprintWidth,
          height: blueprintHeight,
          rotation: blueprintRotation
        };
      }

      onUpdateLayout(updated, nextBlueprint);
      dragStartPos.current = {};
    }
    activeDragId.current = null;
  };

  const handleTransformerEnd = (e) => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = transformer.nodes();
    if (nodes.length === 0) return;

    const blueprintNode = nodes.find(n => n.id() === "blueprint-node");
    if (blueprintNode) {
      const newWidth = Math.round(blueprintNode.width() * blueprintNode.scaleX());
      const newHeight = Math.round(blueprintNode.height() * blueprintNode.scaleY());
      onUpdateLayout(elements, {
        x: Math.round(blueprintNode.x()),
        y: Math.round(blueprintNode.y()),
        width: newWidth,
        height: newHeight,
        rotation: Math.round(blueprintNode.rotation())
      });
      blueprintNode.scaleX(1);
      blueprintNode.scaleY(1);
      return;
    }

    const updated = elements.map(el => {
      const node = nodes.find(n => n.id() === `el-${el.id}`);
      if (node) {
        const newWidth = Math.round(node.width() * node.scaleX());
        const newHeight = Math.round(node.height() * node.scaleY());
        const rawX = node.x();
        const rawY = node.y();
        const finalX = snapToGrid ? Math.round(rawX / gridSize) * gridSize : Math.round(rawX);
        const finalY = snapToGrid ? Math.round(rawY / gridSize) * gridSize : Math.round(rawY);

        let finalWidth = snapToGrid ? Math.round(newWidth / gridSize) * gridSize : newWidth;
        let finalHeight = snapToGrid ? Math.round(newHeight / gridSize) * gridSize : newHeight;

        if (el.type === "screen" && el.aspectRatio && el.aspectRatio !== "Custom") {
          let ratio = 16 / 9;
          if (el.aspectRatio === "4:3") ratio = 4 / 3;
          else if (el.aspectRatio === "21:9") ratio = 21 / 9;

          const dWidth = Math.abs(finalWidth - el.width);
          const dHeight = Math.abs(finalHeight - el.height);
          if (dWidth >= dHeight) {
            finalHeight = Math.max(gridSize, Math.round(finalWidth / ratio));
          } else {
            finalWidth = Math.max(gridSize, Math.round(finalHeight * ratio));
          }
        }

        node.scaleX(1);
        node.scaleY(1);

        return {
          ...el,
          x: finalX,
          y: finalY,
          width: Math.max(gridSize, finalWidth),
          height: Math.max(gridSize, finalHeight),
          rotation: Math.round(node.rotation())
        };
      }
      return el;
    });

    onUpdateLayout(updated);
  };

  const handleMouseDown = (e) => {
    // Reset marquee drag flag on any new mouse down
    justMarqueeDragged.current = false;

    // Blur any active input so keyboard shortcuts (like Ctrl+Z) work immediately
    if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
      document.activeElement.blur();
    }
    const stage = stageRef.current;
    if (!stage) return;
    const target = e.target;

    if (toolMode === "pan" || toolMode === "preview") return;

    if (toolMode === "constructor") {
      // If hovering over an existing line or delete button, do not start drawing a new line
      if (hoveredLineIdRef.current) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      
      const scale = stage.scaleX();
      const relativeX = (pointer.x - stage.x()) / scale;
      const relativeY = (pointer.y - stage.y()) / scale;
      const snap = getSnapPoint(relativeX, relativeY);

      // If waiting for second click in two-click mode:
      if (rulerWaitingSecondClick.current && rulerStartPoint.current) {
        const dist = Math.hypot(snap.x - rulerStartPoint.current.x, snap.y - rulerStartPoint.current.y);
        if (dist > 2) {
          const newLine = {
            id: `cline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            x1: rulerStartPoint.current.x,
            y1: rulerStartPoint.current.y,
            x2: snap.x,
            y2: snap.y,
            distancePx: dist,
            distanceMeters: dist / 20
          };
          setConstructorLines(prev => [...prev, newLine]);
          setActiveMeasurement(newLine);
        }
        rulerWaitingSecondClick.current = false;
        rulerStartPoint.current = null;
        setIsRulerDrawing(false);
        setRulerLive({ start: null, current: null });
        return;
      }

      // Start drag / point A
      rulerStartPoint.current = snap;
      rulerHasDragged.current = false;
      setIsRulerDrawing(true);
      setRulerLive({ start: snap, current: snap });
      return;
    }

    if (target === stage || target.name() === "grid-bg" || ((target.name() === "blueprint-image" || target.id() === "blueprint-node") && blueprintIsLocked)) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      
      const scale = stage.scaleX();
      const relativeX = (pointer.x - stage.x()) / scale;
      const relativeY = (pointer.y - stage.y()) / scale;

      isMarqueeDragging.current = true;
      justMarqueeDragged.current = false;
      dragStartScreenPos.current = pointer;

      setMarqueeStart({ x: relativeX, y: relativeY });
      setMarqueeEnd({ x: relativeX, y: relativeY });
      onSelectId([], false);
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (toolMode === "constructor") {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scale = stage.scaleX();
      const relativeX = (pointer.x - stage.x()) / scale;
      const relativeY = (pointer.y - stage.y()) / scale;

      const snap = getSnapPoint(relativeX, relativeY);
      setHoveredSnapPoint(snap.isSnapped ? snap : null);

      if (isRulerDrawing && rulerStartPoint.current) {
        let currentPt = snap;
        if (Math.hypot(snap.x - rulerStartPoint.current.x, snap.y - rulerStartPoint.current.y) > 3) {
          rulerHasDragged.current = true;
        }

        // Shift key locks angle to orthogonal or 45 degrees
        if (e.evt && e.evt.shiftKey) {
          const dx = snap.x - rulerStartPoint.current.x;
          const dy = snap.y - rulerStartPoint.current.y;
          if (Math.abs(dx) > Math.abs(dy) * 2) {
            currentPt = { ...currentPt, y: rulerStartPoint.current.y };
          } else if (Math.abs(dy) > Math.abs(dx) * 2) {
            currentPt = { ...currentPt, x: rulerStartPoint.current.x };
          } else {
            const signX = dx >= 0 ? 1 : -1;
            const signY = dy >= 0 ? 1 : -1;
            const avg = (Math.abs(dx) + Math.abs(dy)) / 2;
            currentPt = { ...currentPt, x: rulerStartPoint.current.x + signX * avg, y: rulerStartPoint.current.y + signY * avg };
          }
        }

        setRulerLive({ start: rulerStartPoint.current, current: currentPt });
      }
      return;
    }

    if (!isMarqueeDragging.current || !marqueeStart) return;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scale = stage.scaleX();
    const relativeX = (pointer.x - stage.x()) / scale;
    const relativeY = (pointer.y - stage.y()) / scale;

    setMarqueeEnd({ x: relativeX, y: relativeY });
    justMarqueeDragged.current = true;
  };

  const handleMouseUp = (e) => {
    if (toolMode === "constructor") {
      if (isRulerDrawing && rulerStartPoint.current) {
        if (rulerHasDragged.current) {
          const currentPt = rulerLive.current || rulerStartPoint.current;
          const dist = Math.hypot(currentPt.x - rulerStartPoint.current.x, currentPt.y - rulerStartPoint.current.y);
          if (dist > 3) {
            const newLine = {
              id: `cline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              x1: rulerStartPoint.current.x,
              y1: rulerStartPoint.current.y,
              x2: currentPt.x,
              y2: currentPt.y,
              distancePx: dist,
              distanceMeters: dist / 20
            };
            setConstructorLines(prev => [...prev, newLine]);
            setActiveMeasurement(newLine);
          }
          setIsRulerDrawing(false);
          rulerStartPoint.current = null;
          rulerHasDragged.current = false;
          setRulerLive({ start: null, current: null });
        } else {
          // Clicked Point A without dragging: wait for Point B
          rulerWaitingSecondClick.current = true;
        }
      }
      return;
    }

    isMarqueeDragging.current = false;
    dragStartScreenPos.current = null;

    if (marqueeStart && marqueeEnd && justMarqueeDragged.current) {
      const x1 = Math.min(marqueeStart.x, marqueeEnd.x);
      const y1 = Math.min(marqueeStart.y, marqueeEnd.y);
      const x2 = Math.max(marqueeStart.x, marqueeEnd.x);
      const y2 = Math.max(marqueeStart.y, marqueeEnd.y);

      const newlySelectedIds = [];
      elements.forEach(el => {
        const itemCenterX = el.x + el.width / 2;
        const itemCenterY = el.y + el.height / 2;
        if (itemCenterX >= x1 && itemCenterX <= x2 && itemCenterY >= y1 && itemCenterY <= y2) {
          newlySelectedIds.push(el.id);
        }
      });

      // Include blueprint if its center is inside the marquee selection box and it is unlocked
      if (bgImage && !blueprintIsLocked) {
        const bpCenterX = blueprintX + blueprintWidth / 2;
        const bpCenterY = blueprintY + blueprintHeight / 2;
        if (bpCenterX >= x1 && bpCenterX <= x2 && bpCenterY >= y1 && bpCenterY <= y2) {
          newlySelectedIds.push("blueprint");
        }
      }

      if (newlySelectedIds.length > 0) {
        onSelectId(newlySelectedIds, false);
      }
    }

    setMarqueeStart(null);
    setMarqueeEnd(null);
  };



  const renderOverlapsBadge = (el, overlaps) => {
    if (!overlaps || overlaps.total === 0) return null;
    
    const badgeX = el.type === "circle" || el.type === "table" || el.type === "furniture-cocktail" 
      ? el.width * 0.15 
      : 4;
    const badgeY = el.type === "circle" || el.type === "table" || el.type === "furniture-cocktail" 
      ? el.height * 0.15 
      : 4;

    return (
      <Group
        x={badgeX}
        y={badgeY}
        onClick={(e) => {
          e.cancelBubble = true;
          const targetIdx = elements.findIndex(item => item.id === el.id);
          const overlapping = [];
          for (let i = 0; i < elements.length; i++) {
            if (i === targetIdx) continue;
            const other = elements[i];
            if (isLayoutElement(other)) continue;
            const overlapX = Math.max(0, Math.min(el.x + el.width, other.x + other.width) - Math.max(el.x, other.x));
            const overlapY = Math.max(0, Math.min(el.y + el.height, other.y + other.height) - Math.max(el.y, other.y));
            if ((overlapX * overlapY) > 0) {
              overlapping.push(other.id);
            }
          }
          if (overlapping.length > 0) {
            const currentSelectedIdx = overlapping.indexOf(selectedIds[0]);
            const nextSelectId = overlapping[(currentSelectedIdx + 1) % overlapping.length];
            onSelectId(nextSelectId, false);
          }
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          const targetIdx = elements.findIndex(item => item.id === el.id);
          const overlapping = [];
          for (let i = 0; i < elements.length; i++) {
            if (i === targetIdx) continue;
            const other = elements[i];
            if (isLayoutElement(other)) continue;
            const overlapX = Math.max(0, Math.min(el.x + el.width, other.x + other.width) - Math.max(el.x, other.x));
            const overlapY = Math.max(0, Math.min(el.y + el.height, other.y + other.height) - Math.max(el.y, other.y));
            if ((overlapX * overlapY) > 0) {
              overlapping.push(other.id);
            }
          }
          if (overlapping.length > 0) {
            const currentSelectedIdx = overlapping.indexOf(selectedIds[0]);
            const nextSelectId = overlapping[(currentSelectedIdx + 1) % overlapping.length];
            onSelectId(nextSelectId, false);
          }
        }}
      >
        <Rect
          x={0}
          y={0}
          width={18}
          height={18}
          fill={overlaps.underCount > 0 ? "#fef3c7" : "#e0e7ff"}
          stroke={overlaps.underCount > 0 ? "#f59e0b" : "#6366f1"}
          strokeWidth={1}
          cornerRadius={4}
          shadowColor={typeof window !== "undefined" && window.innerWidth < 1025 ? undefined : "#0f172a"}
          shadowBlur={typeof window !== "undefined" && window.innerWidth < 1025 ? 0 : 2}
          shadowOpacity={typeof window !== "undefined" && window.innerWidth < 1025 ? 0 : 0.1}
          shadowOffset={typeof window !== "undefined" && window.innerWidth < 1025 ? undefined : { x: 0, y: 1 }}
        />
        <Path
          x={3}
          y={3}
          data="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke={overlaps.underCount > 0 ? "#f59e0b" : "#6366f1"}
          strokeWidth={1.5}
          fillEnabled={false}
          scaleX={0.5}
          scaleY={0.5}
        />
      </Group>
    );
  };

  // Render individual elements on Konva
  const renderElement = (el) => {
    const getElementIconPath = (type) => {
      switch (type) {
        case "utility-wc": return "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"; // Users (Restrooms)
        case "utility-coffee": return "M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 2v2 M10 2v2 M14 2v2"; // Coffee
        case "utility-catering": return "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v3c0 1.1.9 2 2 2h3zM21 12v10"; // Utensils
        case "utility-firstaid": return "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z M3.22 12h3.36l1.31-2.9 2.22 5.8 1.3-2.9h3.39"; // HeartPulse
        case "utility-cloak": return "M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z M7 7h.01"; // Tag
        case "utility-power": return "M12 22v-5M9 8V2M15 8V2M18 8H6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4z"; // Plug
        case "utility-prayer": return "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4-2"; // Compass/Clock (Prayer Room)
        case "utility-water": return "M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"; // Droplet (Water Station)
        case "utility-trash": return "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"; // Trash
        case "utility-dining": return "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v3c0 1.1.9 2 2 2h3z"; // Utensils (Dining Area)
        case "structural-pillar": return "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"; // Box (Pillar)
        case "structural-partition": return "M3 12h18"; // Line (Wall Partition)
        case "structural-stairs": return "M3 22h18 M6 22V17h5V12h5V7h5"; // Stairs
        case "access-badging": return "M2 5h20v14H2zM6 9h4v6H6zM14 9h4M14 12h4M14 15h2"; // IdCard
        case "access-turnstile": return "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4"; // Lock
        case "access-scan": return "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"; // Scan
        case "access-security": return "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"; // Shield (Security Scanner)
        case "access-barriers": return "M2 12h20M5 12V22M19 12V22"; // Barriers / Fence
        case "access-assembly": return "M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 6v6l4 2"; // Target (Assembly Point)
        case "entrance": return "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"; // LogIn
        case "exit": return "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"; // LogOut
        case "desk": return "M2 18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3H2v3zM10 2v3M10 5a5 5 0 0 0-5 5v3h10v-3a5 5 0 0 0-5-5z"; // ConciergeBell
        case "stage": return "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"; // Mic
        case "stage-panel": return "M2 3h20v14H2z M2 17l-1 4 M22 17l1 4 M12 17v4"; // Presentation Table
        case "stage-podium": return "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"; // Mic (Podium)
        case "screen": return "M2 3h20v13H2zM12 16v5M8 21h8"; // Monitor
        case "tech-totem": return "M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01"; // Smartphone (Totem)
        case "tech-banner": return "M4 2h16v18H4zM4 6h16"; // Display Board
        case "tech-camera": return "M23 7l-7 5 7 5V7z M1 5h14v14H1z"; // Video Camera
        case "tech-wifi": return "M12 20h.01 M8.5 16.5a5 5 0 0 1 7 0 M5 13a10 10 0 0 1 14 0"; // WiFi AP
        case "net-pod": return "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 6h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"; // Briefcase
        case "net-vip": return "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"; // Sparkles
        case "net-press": return "M12 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h9M12 6l7-4v20l-7-4M19 12a3 3 0 0 1 0-6"; // Megaphone
        case "net-speakers": return "M4 18v3M20 18v3M19 9v9H5V9"; // Sofa (Speakers Prep)
        case "utility-help": return "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01"; // AlertTriangle
        default: return null;
      }
    };

    const isSelected = selectedIds.includes(el.id);
    const isHovered = hoveredId === el.id;
    const overlaps = overlapsMap.get(el.id) || { underCount: 0, overCount: 0, total: 0 };
    const isEditingThis = editingTextId === el.id;
    const showLabels = isEditingThis ? false : (exportFilters ? exportFilters.showLabels : true);

    const matchElement = (el, query) => {
      if (!query) return true;
      const q = query.toLowerCase();
      if (el.label && el.label.toLowerCase().includes(q)) return true;
      if (el.type && el.type.toLowerCase().includes(q)) return true;
      if (el.exhibitorId) {
        const matchedExhibitor = exhibitorMap.get(String(el.exhibitorId));
        if (matchedExhibitor && matchedExhibitor.name.toLowerCase().includes(q)) return true;
      }
      if (el.status && el.status.toLowerCase().includes(q)) return true;
      return false;
    };

    const checkFilterMatch = (el, filter) => {
      if (!filter || filter === "all") return true;
      if (filter === "draft") return el.status === "draft" && el.type.startsWith("booth");
      if (filter === "available") return (el.status === "available" || el.status === "draft") && el.type.startsWith("booth");
      if (filter === "sold") return (el.status === "sold" || el.status === "confirmed") && el.type.startsWith("booth");
      if (filter === "reserved") return (el.status === "reserved" || el.status === "pending-payment" || el.status === "hold" || el.status === "negotiation") && el.type.startsWith("booth");
      if (filter === "confirmed") return (el.status === "confirmed" || el.status === "sold") && el.type.startsWith("booth");
      if (filter === "checked_in") return (el.status === "checked_in" || el.status === "checked-in") && el.type.startsWith("booth");
      if (filter === "empty") return el.type === "booth-empty";
      if (filter === "equipped") return el.type === "booth-equipped" || el.type === "booth-semi";
      if (filter === "tables") return el.type === "table" || el.type === "table-chairs";
      if (filter === "logistics") return el.type.startsWith("utility") || el.type.startsWith("access") || el.type === "entrance" || el.type === "exit" || el.type === "desk";
      return true;
    };

    const isSearchActive = !!previewSearchQuery || (previewFilter && previewFilter !== "all");
    const isMatch = isSearchActive 
      ? (matchElement(el, previewSearchQuery) && checkFilterMatch(el, previewFilter)) 
      : true;
    const searchOpacity = isSearchActive ? (isMatch ? 1 : 0.15) : 1;

    const commonProps = {
      id: `el-${el.id}`,
      x: el.x,
      y: el.y,
      rotation: el.rotation,
      draggable: toolMode === "select" && !el.isLocked && !isEditingThis,
      listening: (toolMode === "select" || isPreviewMode || toolMode === "constructor") && (!isDraggingElement || selectedIds.includes(el.id)),
      opacity: searchOpacity,
      onClick: (e) => {
        e.cancelBubble = true;
        if (justMarqueeDragged.current) return;
        if (toolMode === "constructor") {
          if (rulerHasDragged.current) return;
          if (rulerWaitingSecondClick.current && rulerStartPoint.current) {
            const pointer = stageRef.current?.getPointerPosition();
            if (pointer) {
              const scale = stageRef.current.scaleX();
              const rx = (pointer.x - stageRef.current.x()) / scale;
              const ry = (pointer.y - stageRef.current.y()) / scale;
              const snap = getSnapPoint(rx, ry);
              const dist = Math.hypot(snap.x - rulerStartPoint.current.x, snap.y - rulerStartPoint.current.y);
              if (dist > 2) {
                const newLine = {
                  id: `cline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  x1: rulerStartPoint.current.x,
                  y1: rulerStartPoint.current.y,
                  x2: snap.x,
                  y2: snap.y,
                  distancePx: dist,
                  distanceMeters: dist / 20
                };
                setConstructorLines(prev => [...prev, newLine]);
                setActiveMeasurement(newLine);
                rulerWaitingSecondClick.current = false;
                rulerStartPoint.current = null;
                setIsRulerDrawing(false);
                setRulerLive({ start: null, current: null });
                return;
              }
            }
          }
          // Single click on element in constructor mode selects it to show all distances
          rulerWaitingSecondClick.current = false;
          rulerStartPoint.current = null;
          setIsRulerDrawing(false);
          setRulerLive({ start: null, current: null });
          onSelectId(el.id, false);
          return;
        }
        const isMultiSelect = (toolMode === "select" || isPreviewMode) ? (e.evt.shiftKey || e.evt.ctrlKey) : false;
        onSelectId(el.id, isMultiSelect);
      },
      onTap: (e) => {
        e.cancelBubble = true;
        if (justMarqueeDragged.current) return;
        if (toolMode === "constructor") {
          if (rulerHasDragged.current) return;
          rulerWaitingSecondClick.current = false;
          rulerStartPoint.current = null;
          setIsRulerDrawing(false);
          setRulerLive({ start: null, current: null });
          onSelectId(el.id, false);
          return;
        }
        const isMultiSelect = (toolMode === "select" || isPreviewMode) ? (e.evt.shiftKey || e.evt.ctrlKey) : false;
        onSelectId(el.id, isMultiSelect);
      },
      onDblClick: (e) => {
        e.cancelBubble = true;
        if (toolMode !== "select" || el.isLocked) return;
        setEditingTextId(el.id);
        setEditingTextValue(el.label || "");
      },
      onDblTap: (e) => {
        e.cancelBubble = true;
        if (toolMode !== "select" || el.isLocked) return;
        setEditingTextId(el.id);
        setEditingTextValue(el.label || "");
      },
      onDragStart: (e) => handleDragStartElement(e, el.id),
      onDragMove: (e) => handleDragMoveElement(e, el.id),
      onDragEnd: (e) => handleDragEndElement(e, el.id),
      onMouseEnter: () => {
        setHoveredId(el.id);
        if (stageRef.current) {
          stageRef.current.container().style.cursor = toolMode === "constructor" ? "crosshair" : "pointer";
        }
      },
      onMouseLeave: () => {
        setHoveredId(null);
        if (stageRef.current) {
          stageRef.current.container().style.cursor = (toolMode === "pan" || toolMode === "preview") ? "grab" : (toolMode === "constructor" ? "crosshair" : "default");
        }
      },
    };

    const isMobile = typeof window !== "undefined" && window.innerWidth < 1025;
    const hoverShadowProps = isMobile ? {} : {
      shadowColor: "#0f172a",
      shadowBlur: isHovered ? 12 : (isSelected ? 6 : 0),
      shadowOpacity: isHovered ? 0.12 : (isSelected ? 0.08 : 0),
      shadowOffset: isHovered ? { x: 0, y: 3 } : { x: 0, y: 0 }
    };

    const renderHoverRing = () => renderOverlapsBadge(el, overlaps);

    const renderSearchHighlight = () => {
      if (!isSearchActive || !isMatch) return null;
      if (el.type === "circle" || el.type === "table") {
        return (
          <Circle
            x={el.width / 2}
            y={el.height / 2}
            radius={(Math.min(el.width, el.height) / 2) + 5}
            stroke="#eab308"
            strokeWidth={3.5}
            shadowColor={isMobile ? undefined : "#eab308"}
            shadowBlur={isMobile ? 0 : 12}
            listening={false}
          />
        );
      }
      return (
        <Rect
          x={-5}
          y={-5}
          width={el.width + 10}
          height={el.height + 10}
          stroke="#eab308"
          strokeWidth={3.5}
          shadowColor={isMobile ? undefined : "#eab308"}
          shadowBlur={isMobile ? 0 : 12}
          listening={false}
        />
      );
    };

    const renderDimensionOverlay = (el) => {
      if (!showDimensions || (!isSelected && !isHovered)) return null;
      const wMeters = (el.width / 20).toFixed(1);
      const hMeters = (el.height / 20).toFixed(1);
      const text = `${wMeters}m × ${hMeters}m`;
      const fontSize = 10;
      const textWidth = text.length * 6 + 12;
      const textHeight = 18;
      
      return (
        <Group
          x={el.width / 2}
          y={-15}
          rotation={-el.rotation}
          listening={false}
        >
          <Rect
            x={-textWidth / 2}
            y={-textHeight / 2}
            width={textWidth}
            height={textHeight}
            fill="#1e293b"
            cornerRadius={4}
            opacity={0.9}
          />
          <Text
            x={-textWidth / 2}
            y={-textHeight / 2 + 3}
            width={textWidth}
            text={text}
            fontSize={fontSize}
            fontStyle="bold"
            fill="#ffffff"
            align="center"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
        </Group>
      );
    };

    // Custom elements rendering logic
    if (el.type === "auditorium-block") {
      const scaleChildren = () => {
        if (!el.children || el.children.length === 0) return null;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        el.children.forEach(c => {
          const hw = (c.width || 10) / 2;
          const hh = (c.height || 10) / 2;
          if (c.x - hw < minX) minX = c.x - hw;
          if (c.x + hw > maxX) maxX = c.x + hw;
          if (c.y - hh < minY) minY = c.y - hh;
          if (c.y + hh > maxY) maxY = c.y + hh;
        });
        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const scaleX = boundsWidth > 0 ? el.width / boundsWidth : 1;
        const seatsGroupHeight = el.height - 25;
        const scaleY = boundsHeight > 0 ? seatsGroupHeight / boundsHeight : 1;
        return (
          <Group scaleX={scaleX} scaleY={scaleY} x={-minX * scaleX} y={25 - minY * scaleY}>
            {el.children.map(seat => renderSeat(seat, el))}
          </Group>
        );
      };

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="rgba(99, 102, 241, 0.02)"
            stroke={isSelected ? "#6366f1" : (isHovered ? "#cbd5e1" : "rgba(203, 213, 225, 0.5)")}
            strokeWidth={isSelected ? 1.5 : 1}
            dash={[4, 4]}
            {...hoverShadowProps}
          />
          {showLabels && (
            <Text
              x={2}
              y={2}
              width={el.width - 4}
              text={el.label || "Auditorium"}
              fontSize={el.fontSize || 12}
              fontStyle="bold"
              align="center"
              fill={el.textColor || "#475569"}
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
              listening={false}
            />
          )}
          {scaleChildren()}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "theater-in-the-round") {
      let maxR = 1;
      if (el.children) {
        el.children.forEach(c => {
          const dist = Math.hypot(c.x, c.y);
          if (dist > maxR) maxR = dist;
        });
      }
      const boundsWidth = maxR * 2 + 20;
      const boundsHeight = maxR * 2 + 20;
      const scale = Math.min(el.width / boundsWidth, el.height / boundsHeight) || 1;

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Circle
            x={el.width / 2}
            y={el.height / 2}
            radius={el.width / 2}
            fill="rgba(99, 102, 241, 0.02)"
            stroke={isSelected ? "#6366f1" : (isHovered ? "#cbd5e1" : "rgba(203, 213, 225, 0.5)")}
            strokeWidth={isSelected ? 1.5 : 1}
            dash={[4, 4]}
            {...hoverShadowProps}
          />
          {/* Central stage circle */}
          <Circle
            x={el.width / 2}
            y={el.height / 2}
            radius={(el.stageRadius || 5) * 20 * scale}
            fill="#faf5ff"
            stroke="#a855f7"
            strokeWidth={1.5}
          />
          <Text
            x={el.width / 2 - 40}
            y={el.height / 2 - 6}
            width={80}
            text="STAGE"
            align="center"
            fontSize={Math.max(8, 12 * scale)}
            fontStyle="bold"
            fill="#a855f7"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.children && (
            <Group scaleX={scale} scaleY={scale} x={el.width / 2} y={el.height / 2}>
              {el.children.map(seat => renderSeat(seat, el))}
            </Group>
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "classroom-rows") {
      const tableWidth_px = (el.tableWidth || 1.8) * 20;
      const tableDepth_px = (el.tableDepth || 0.6) * 20;
      const rowSpacing_px = (el.rowSpacing || 2.0) * 20;
      const tableSpacing_px = (el.tableSpacing || 1.0) * 20;
      const facingDirection = el.facingDirection || "north";

      let boundsWidth, boundsHeight;
      if (facingDirection === "north" || facingDirection === "south") {
        boundsWidth = (el.tablesPerRow || 4) * tableWidth_px + ((el.tablesPerRow || 4) - 1) * tableSpacing_px;
        boundsHeight = (el.rows || 3) * tableDepth_px + ((el.rows || 3) - 1) * rowSpacing_px + 20;
      } else {
        boundsWidth = (el.rows || 3) * tableDepth_px + ((el.rows || 3) - 1) * rowSpacing_px + 20;
        boundsHeight = (el.tablesPerRow || 4) * tableWidth_px + ((el.tablesPerRow || 4) - 1) * tableSpacing_px;
      }

      const scaleX = el.width / (boundsWidth || 1);
      const scaleY = el.height / (boundsHeight || 1);

      const renderTables = () => {
        const tables = [];
        for (let r = 0; r < (el.rows || 3); r++) {
          for (let t = 0; t < (el.tablesPerRow || 4); t++) {
            let tx, ty, tW, tH;
            if (facingDirection === "north" || facingDirection === "south") {
              tx = t * (tableWidth_px + tableSpacing_px);
              ty = r * (tableDepth_px + rowSpacing_px);
              tW = tableWidth_px;
              tH = tableDepth_px;
            } else {
              tx = r * (tableDepth_px + rowSpacing_px);
              ty = t * (tableWidth_px + tableSpacing_px);
              tW = tableDepth_px;
              tH = tableWidth_px;
            }
            tables.push(
              <Rect
                key={`table-${r}-${t}`}
                x={tx}
                y={ty}
                width={tW}
                height={tH}
                fill="#f8fafc"
                stroke="#64748b"
                strokeWidth={1}
                cornerRadius={1}
              />
            );
          }
        }
        return tables;
      };

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="rgba(99, 102, 241, 0.02)"
            stroke={isSelected ? "#6366f1" : (isHovered ? "#cbd5e1" : "rgba(203, 213, 225, 0.5)")}
            strokeWidth={isSelected ? 1.5 : 1}
            dash={[4, 4]}
            {...hoverShadowProps}
          />
          <Group scaleX={scaleX} scaleY={scaleY}>
            {renderTables()}
            {el.children && el.children.map(seat => renderSeat(seat, el))}
          </Group>
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "reserved-seat-block") {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      if (el.children && el.children.length > 0) {
        el.children.forEach(c => {
          const hw = (c.width || 10) / 2;
          const hh = (c.height || 10) / 2;
          if (c.x - hw < minX) minX = c.x - hw;
          if (c.x + hw > maxX) maxX = c.x + hw;
          if (c.y - hh < minY) minY = c.y - hh;
          if (c.y + hh > maxY) maxY = c.y + hh;
        });
      }
      const boundsWidth = maxX - minX;
      const boundsHeight = maxY - minY;
      const scaleX = boundsWidth > 0 ? el.width / boundsWidth : 1;
      const seatsGroupHeight = el.height - 25;
      const scaleY = boundsHeight > 0 ? seatsGroupHeight / boundsHeight : 1;

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="rgba(99, 102, 241, 0.02)"
            stroke={isSelected ? "#6366f1" : (isHovered ? "#cbd5e1" : "rgba(203, 213, 225, 0.5)")}
            strokeWidth={isSelected ? 1.5 : 1}
            dash={[4, 4]}
            {...hoverShadowProps}
          />
          {showLabels && (
            <Text
              x={2}
              y={2}
              width={el.width - 4}
              height={20}
              text={el.label || "Seats"}
              fontSize={el.fontSize || 11}
              fontStyle="bold"
              align="center"
              fill={el.textColor || "#1e293b"}
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.children && (
            <Group scaleX={scaleX} scaleY={scaleY} x={-minX * scaleX} y={25 - minY * scaleY}>
              {el.children.map(seat => {
                const attendeeId = seat.assigned_participant_id || seat.attendeeId;
                const attendee = attendeeId ? attendeeMap.get(String(attendeeId)) : null;
                const firstName = attendee && attendee.name ? attendee.name.split(" ")[0] : "";
                
                return (
                  <Group key={seat.id}>
                    {renderSeat(seat, el)}
                  </Group>
                );
              })}
            </Group>
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "runway-t") {
      const stageWidth_px = (el.stageWidth || 6.0) * 20;
      const stageDepth_px = (el.stageDepth || 4.0) * 20;
      const runwayLength_px = (el.runwayLength || 8.0) * 20;
      const runwayWidth_px = (el.runwayWidth || 2.0) * 20;
      
      const boundsWidth = stageWidth_px;
      const boundsHeight = stageDepth_px + runwayLength_px;
      
      const scaleX = el.width / (boundsWidth || 1);
      const scaleY = el.height / (boundsHeight || 1);

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          {/* Main Stage */}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={stageDepth_px * scaleY}
            fill="#faf5ff"
            stroke="#a855f7"
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          {/* Runway Extension */}
          <Rect
            x={(el.width - runwayWidth_px * scaleX) / 2}
            y={stageDepth_px * scaleY}
            width={runwayWidth_px * scaleX}
            height={runwayLength_px * scaleY}
            fill="#faf5ff"
            stroke="#a855f7"
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          <Text
            x={5}
            y={(stageDepth_px * scaleY) / 2 - 6}
            width={el.width - 10}
            text={showLabels ? (el.label || "T-Runway Stage") : ""}
            align="center"
            fontSize={el.fontSize || 12}
            fontStyle="bold"
            fill="#a855f7"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "broadcast-studio") {
      const cameraCount = el.cameraCount || 3;
      const cameraNodes = [];
      for (let i = 0; i < cameraCount; i++) {
        const cx = cameraCount > 1 ? 20 + i * (el.width - 40) / (cameraCount - 1) : el.width / 2;
        const cy = el.height - 20;
        cameraNodes.push(
          <Group key={i} x={cx} y={cy}>
            <Circle radius={10} fill="#0f172a" stroke="#d946ef" strokeWidth={1.5} />
            <Text x={-8} y={-5} width={16} text={`C${i+1}`} fontSize={8} fill="#ffffff" align="center" fontStyle="bold" />
          </Group>
        );
      }

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="rgba(217, 70, 239, 0.05)"
            stroke="#d946ef"
            strokeWidth={1.5}
            dash={[6, 4]}
            {...hoverShadowProps}
          />
          <Text
            x={10}
            y={el.height / 2 - 10}
            width={el.width - 20}
            text={showLabels ? (el.label || "Broadcast Studio") : ""}
            align="center"
            fontSize={el.fontSize || 14}
            fontStyle="bold"
            fill="#d946ef"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {cameraNodes}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "lighting-rig") {
      const yCenter = el.height / 2;
      const trussH = 8;
      const crossLines = [];
      for (let x = 10; x < el.width; x += 15) {
        crossLines.push(<Line key={x} points={[x, yCenter - trussH/2, x + 5, yCenter + trussH/2]} stroke="#94a3b8" strokeWidth={1} />);
      }

      const dropCount = el.dropCount || 4;
      const spotNodes = [];
      for (let i = 0; i < dropCount; i++) {
        const sx = dropCount > 1 ? 15 + i * (el.width - 30) / (dropCount - 1) : el.width / 2;
        spotNodes.push(
          <Group key={i}>
            <Rect x={sx - 5} y={yCenter - 5} width={10} height={10} fill="#eab308" stroke="#d97706" strokeWidth={1} cornerRadius={1} />
            <Line
              points={[sx, yCenter + 5, sx - 12, yCenter + 22, sx + 12, yCenter + 22]}
              closed={true}
              fill="rgba(234, 179, 8, 0.12)"
              stroke="rgba(234, 179, 8, 0.25)"
              strokeWidth={0.5}
              listening={false}
            />
          </Group>
        );
      }

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Line points={[0, yCenter - trussH/2, el.width, yCenter - trussH/2]} stroke="#64748b" strokeWidth={1.5} />
          <Line points={[0, yCenter + trussH/2, el.width, yCenter + trussH/2]} stroke="#64748b" strokeWidth={1.5} />
          {crossLines}
          {spotNodes}
          {showLabels && (
            <Text
              x={5}
              y={yCenter - 18}
              width={el.width - 10}
              text={el.label || "Lighting Truss"}
              fontSize={el.fontSize || 9}
              fontStyle="bold"
              fill="#475569"
              align="center"
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "parking-zone") {
      const bayCount = el.bayCount || 10;
      const reservedCount = el.reservedCount !== undefined ? el.reservedCount : 2;
      const bayWidth = el.width / bayCount;
      const bayLines = [];
      const bayLabels = [];
      for (let i = 0; i < bayCount; i++) {
        const bx = i * bayWidth;
        if (i > 0) {
          bayLines.push(<Line key={i} points={[bx, 0, bx, el.height]} stroke="#cbd5e1" strokeWidth={1} dash={[2, 2]} />);
        }
        const isReserved = i < reservedCount;
        bayLabels.push(
          <Text
            key={`lbl-${i}`}
            x={bx}
            y={el.height - 18}
            width={bayWidth}
            text={isReserved ? "VIP" : "P"}
            fontSize={el.fontSize ? Math.max(6, Math.round(el.fontSize * 0.6)) : 9}
            fontStyle="bold"
            fill={isReserved ? "#ea580c" : "#64748b"}
            align="center"
          />
        );
      }

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="rgba(241, 245, 249, 0.5)"
            stroke="#94a3b8"
            strokeWidth={1.5}
            dash={[4, 4]}
            {...hoverShadowProps}
          />
          {bayLines}
          {bayLabels}
          <Text
            x={10}
            y={el.height / 2 - 10}
            width={el.width - 20}
            text={showLabels ? (el.label || "Parking Area") : ""}
            align="center"
            fontSize={el.fontSize || 14}
            fontStyle="bold"
            fill="#475569"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "shuttle-bay") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="rgba(219, 234, 254, 0.6)"
            stroke="#2563eb"
            strokeWidth={1.5}
            cornerRadius={4}
            {...hoverShadowProps}
          />
          <Line points={[15, el.height/2, el.width - 15, el.height/2]} stroke="#2563eb" strokeWidth={2.5} />
          <Line points={[el.width - 25, el.height/2 - 6, el.width - 15, el.height/2, el.width - 25, el.height/2 + 6]} stroke="#2563eb" strokeWidth={2.5} />
          <Text
            x={10}
            y={12}
            width={el.width - 20}
            text={showLabels ? (el.label || "Shuttle Drop-off") : ""}
            align="center"
            fontSize={el.fontSize || 12}
            fontStyle="bold"
            fill="#2563eb"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "tent-marquee") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect x={0} y={0} width={el.width} height={el.height} fill="rgba(248, 250, 252, 0.85)" stroke="#64748b" strokeWidth={1.5} {...hoverShadowProps} />
          <Line points={[0, 0, el.width/2, el.height/2]} stroke="#94a3b8" strokeWidth={1} />
          <Line points={[el.width, 0, el.width/2, el.height/2]} stroke="#94a3b8" strokeWidth={1} />
          <Line points={[el.width, el.height, el.width/2, el.height/2]} stroke="#94a3b8" strokeWidth={1} />
          <Line points={[0, el.height, el.width/2, el.height/2]} stroke="#94a3b8" strokeWidth={1} />
          <Text
            x={10}
            y={12}
            width={el.width - 20}
            text={showLabels ? (el.label || "Tent Marquee") : ""}
            align="center"
            fontSize={el.fontSize || 12}
            fontStyle="bold"
            fill="#475569"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "landscape-zone") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#dcfce7"
            stroke="#16a34a"
            strokeWidth={1.5}
            cornerRadius={8}
            {...hoverShadowProps}
          />
          <Text
            x={10}
            y={el.height / 2 - 8}
            width={el.width - 20}
            text={showLabels ? (el.label || "Landscaping Area") : ""}
            align="center"
            fontSize={el.fontSize || 12}
            fontStyle="bold"
            fill="#15803d"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "perimeter-barrier") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Line points={[0, el.height/2, el.width, el.height/2]} stroke="#94a3b8" strokeWidth={4} dash={[8, 6]} />
          {showLabels && (
            <Text
              x={5}
              y={el.height/2 - 14}
              width={el.width - 10}
              text={el.label || "Barrier"}
              fontSize={el.fontSize || 8}
              fill="#64748b"
              align="center"
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "food-truck") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#fff5f5"
            stroke="#f87171"
            strokeWidth={1.5}
            cornerRadius={6}
            {...hoverShadowProps}
          />
          <Rect x={5} y={5} width={20} height={el.height - 10} fill="#fca5a5" cornerRadius={2} />
          <Text
            x={30}
            y={el.height / 2 - 12}
            width={el.width - 35}
            text={showLabels ? (el.label || "Food Truck") : ""}
            align="left"
            fontSize={el.fontSize || 11}
            fontStyle="bold"
            fill="#991b1b"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          <Text
            x={30}
            y={el.height / 2 + 2}
            width={el.width - 35}
            text={showLabels ? (el.cuisine || "Cuisine Stall") : ""}
            align="left"
            fontSize={el.fontSize ? Math.max(6, Math.round(el.fontSize * 0.8)) : 9}
            fill="#7f1d1d"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "drinks-bar") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#fffbeb"
            stroke="#d97706"
            strokeWidth={1.5}
            cornerRadius={4}
            {...hoverShadowProps}
          />
          <Rect x={5} y={5} width={el.width - 10} height={el.height - 15} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} />
          <Text
            x={10}
            y={el.height - 22}
            width={el.width - 20}
            text={showLabels ? (el.label || "Drinks Bar") : ""}
            align="center"
            fontSize={el.fontSize || 11}
            fontStyle="bold"
            fill="#92400e"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "buffet-line") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          {el.curved ? (
            <Path
              data={`M 10,${el.height - 10} Q ${el.width / 2},10 ${el.width - 10},${el.height - 10}`}
              stroke="#10b981"
              strokeWidth={8}
              fillEnabled={false}
              {...hoverShadowProps}
            />
          ) : (
            <Rect
              x={0}
              y={0}
              width={el.width}
              height={el.height}
              fill="#ecfdf5"
              stroke="#10b981"
              strokeWidth={1.5}
              cornerRadius={2}
              {...hoverShadowProps}
            />
          )}
          <Text
            x={5}
            y={el.height / 2 - 6}
            width={el.width - 10}
            text={showLabels ? (el.label || "Buffet Table") : ""}
            align="center"
            fontSize={el.fontSize || 11}
            fontStyle="bold"
            fill="#065f46"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "snack-kiosk") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#fff7ed"
            stroke="#f97316"
            strokeWidth={1.5}
            cornerRadius={4}
            {...hoverShadowProps}
          />
          <Circle x={el.width/2} y={el.height/2} radius={el.width/3} fill="#ffedd5" stroke="#fdba74" strokeWidth={1} />
          <Text
            x={4}
            y={el.height / 2 - 6}
            width={el.width - 8}
            text={showLabels ? (el.label || "Snacks") : ""}
            align="center"
            fontSize={el.fontSize || 10}
            fontStyle="bold"
            fill="#9a3412"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "safety-extinguisher") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Circle
            x={el.width / 2}
            y={el.height / 2}
            radius={Math.min(el.width, el.height) / 2}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          <Text
            x={2}
            y={el.height / 2 - 6}
            width={el.width - 4}
            text="F"
            align="center"
            fontSize={el.fontSize || 11}
            fontStyle="bold"
            fill="#ffffff"
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "safety-exit-route") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Line points={[0, el.height/2, el.width, el.height/2]} stroke="#22c55e" strokeWidth={3} dash={[8, 6]} />
          <Line points={[el.width - 15, el.height/2 - 6, el.width, el.height/2, el.width - 15, el.height/2 + 6]} stroke="#22c55e" strokeWidth={3} />
          {showLabels && (
            <Text
              x={5}
              y={el.height/2 - 14}
              width={el.width - 10}
              text={el.label || "EXIT ROUTE"}
              fontSize={el.fontSize || 8}
              fontStyle="bold"
              fill="#166534"
              align="center"
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "safety-accessibility-path") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Line points={[0, el.height/2, el.width, el.height/2]} stroke="#3b82f6" strokeWidth={3} dash={[8, 6]} />
          <Text x={el.width/2 - 15} y={el.height/2 - 12} text="♿" fontSize={14} fill="#3b82f6" />
          {showLabels && (
            <Text
              x={5}
              y={el.height/2 - 20}
              width={el.width - 10}
              text={el.label || "ACCESSIBILITY"}
              fontSize={el.fontSize || 8}
              fontStyle="bold"
              fill="#1e40af"
              align="center"
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "safety-cctv") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Wedge
            x={el.width/2}
            y={el.height/2}
            radius={el.width}
            angle={el.coverageAngle || 90}
            rotation={(el.rotation || 0) - (el.coverageAngle || 90)/2}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth={0.5}
            listening={false}
          />
          <Circle
            x={el.width / 2}
            y={el.height / 2}
            radius={6}
            fill="#475569"
            stroke="#334155"
            strokeWidth={1}
            {...hoverShadowProps}
          />
          {showLabels && (
            <Text
              x={5}
              y={el.height/2 + 8}
              width={el.width - 10}
              text={el.label || "CCTV"}
              fontSize={el.fontSize || 8}
              fontStyle="bold"
              fill="#475569"
              align="center"
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "zone-overlay") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill={el.fillColor || "#3b82f6"}
            opacity={el.opacity || 0.2}
            stroke={el.borderStyle === "none" ? "transparent" : (el.fillColor || "#3b82f6")}
            strokeWidth={1.5}
            dash={el.borderStyle === "dashed" ? [6, 4] : null}
            {...hoverShadowProps}
          />
          <Text
            x={10}
            y={10}
            width={el.width - 20}
            height={el.height - 20}
            text={el.label || "Zone Area"}
            fontSize={el.fontSize || Math.max(12, Math.min(32, el.width / 10))}
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            fill={el.textColor || el.fillColor || "#1e3a8a"}
            opacity={0.8}
            wrap="word"
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    if (el.type === "scheduled-meeting-room") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#ecfdf5"
            stroke="#10b981"
            strokeWidth={1.5}
            cornerRadius={6}
            {...hoverShadowProps}
          />
          <Text
            x={10}
            y={el.height / 2 - 18}
            width={el.width - 20}
            text={showLabels ? (el.roomName || el.label || "Meeting Room") : ""}
            align="center"
            fontSize={el.fontSize || 12}
            fontStyle="bold"
            fill="#065f46"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          <Text
            x={10}
            y={el.height / 2 + 4}
            width={el.width - 20}
            text={showLabels ? `Capacity: ${el.capacity || 10}` : ""}
            align="center"
            fontSize={el.fontSize ? Math.max(6, Math.round(el.fontSize * 0.83)) : 10}
            fill="#047857"
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
          />
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Registration Desk Reception Counter (with staff seats/stools and computer monitor)
    if (el.type === "desk") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={el.width * 0.05}
            y={el.height * 0.35}
            width={el.width * 0.9}
            height={el.height * 0.4}
            fill="#f8fafc"
            stroke="#475569"
            strokeWidth={1.8}
            cornerRadius={4}
            {...hoverShadowProps}
          />
          <Rect
            x={el.width * 0.1}
            y={el.height * 0.6}
            width={el.width * 0.8}
            height={el.height * 0.12}
            fill="#e2e8f0"
            cornerRadius={2}
          />
          <Circle
            x={el.width * 0.3}
            y={el.height * 0.2}
            radius={Math.min(el.width, el.height) * 0.12}
            fill="rgba(71, 85, 105, 0.1)"
            stroke="#475569"
            strokeWidth={1.2}
          />
          <Circle
            x={el.width * 0.7}
            y={el.height * 0.2}
            radius={Math.min(el.width, el.height) * 0.12}
            fill="rgba(71, 85, 105, 0.1)"
            stroke="#475569"
            strokeWidth={1.2}
          />
          <Rect
            x={el.width * 0.45}
            y={el.height * 0.38}
            width={el.width * 0.1}
            height={el.height * 0.06}
            fill="#64748b"
          />
          <Line
            points={[el.width * 0.42, el.height * 0.44, el.width * 0.58, el.height * 0.44]}
            stroke="#64748b"
            strokeWidth={1.5}
          />
          {showLabels && (
            <Text
              x={4}
              y={el.height * 0.8}
              width={el.width - 8}
              text={el.label || "Registration"}
              fontSize={el.fontSize || 10}
              fontStyle="bold"
              align="center"
              fill="#1e293b"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom First Aid Station (Rounded badge shape with a bold medical cross in the center)
    if (el.type === "utility-firstaid") {
      const radius = Math.min(el.width, el.height) / 2.2;
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={(el.width - radius * 2) / 2}
            y={(el.height - radius * 2) / 2}
            width={radius * 2}
            height={radius * 2}
            fill="#fff5f5"
            stroke="#ef4444"
            strokeWidth={2}
            cornerRadius={12}
            {...hoverShadowProps}
          />
          <Rect
            x={el.width / 2 - radius * 0.2}
            y={el.height / 2 - radius * 0.6}
            width={radius * 0.4}
            height={radius * 1.2}
            fill="#ef4444"
            cornerRadius={2}
          />
          <Rect
            x={el.width / 2 - radius * 0.6}
            y={el.height / 2 - radius * 0.2}
            width={radius * 1.2}
            height={radius * 0.4}
            fill="#ef4444"
            cornerRadius={2}
          />
          {showLabels && (
            <Text
              x={2}
              y={el.height / 2 + radius + 4}
              width={el.width - 4}
              text={el.label || "First Aid"}
              fontSize={el.fontSize || 9}
              fontStyle="bold"
              align="center"
              fill="#991b1b"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom VIP Lounge Sofa (Cushions, backrest, and armrests)
    if (el.type === "furniture-sofa") {
      const padding = 4;
      const armWidth = Math.max(6, el.width * 0.08);
      const backDepth = Math.max(8, el.height * 0.15);
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#fafaf9"
            stroke="#78716c"
            strokeWidth={1.5}
            cornerRadius={6}
            {...hoverShadowProps}
          />
          <Rect
            x={armWidth}
            y={padding}
            width={el.width - armWidth * 2}
            height={backDepth}
            fill="#f5f5f4"
            stroke="#a8a29e"
            strokeWidth={1}
            cornerRadius={2}
          />
          <Rect
            x={padding}
            y={padding}
            width={armWidth}
            height={el.height - padding * 2}
            fill="#f5f5f4"
            stroke="#a8a29e"
            strokeWidth={1}
            cornerRadius={3}
          />
          <Rect
            x={el.width - armWidth - padding}
            y={padding}
            width={armWidth}
            height={el.height - padding * 2}
            fill="#f5f5f4"
            stroke="#a8a29e"
            strokeWidth={1}
            cornerRadius={3}
          />
          <Rect
            x={armWidth + 2}
            y={backDepth + padding + 2}
            width={(el.width - armWidth * 2 - 6) / 2}
            height={el.height - backDepth - padding * 2 - 4}
            fill="#fdfbfc"
            stroke="#d6d3d1"
            strokeWidth={1}
            cornerRadius={2}
          />
          <Rect
            x={armWidth + 2 + (el.width - armWidth * 2 - 6) / 2 + 2}
            y={backDepth + padding + 2}
            width={(el.width - armWidth * 2 - 6) / 2}
            height={el.height - backDepth - padding * 2 - 4}
            fill="#fdfbfc"
            stroke="#d6d3d1"
            strokeWidth={1}
            cornerRadius={2}
          />
          {showLabels && (
            <Text
              x={armWidth + 4}
              y={el.height - 18}
              width={el.width - (armWidth + 4) * 2}
              text={el.label || "Sofa"}
              fontSize={el.fontSize || 9}
              fontStyle="bold"
              align="center"
              fill="#44403c"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Restrooms divided badge (with stylized male & female stick figure symbols)
    if (el.type === "utility-wc") {
      const hw = el.width / 2;
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#f0f9ff"
            stroke="#0284c7"
            strokeWidth={1.5}
            cornerRadius={6}
            {...hoverShadowProps}
          />
          <Rect
            x={2}
            y={2}
            width={hw - 2}
            height={el.height - 4}
            fill="#e0f2fe"
            cornerRadius={{ topLeft: 4, bottomLeft: 4 }}
          />
          <Rect
            x={hw}
            y={2}
            width={hw - 2}
            height={el.height - 4}
            fill="#ffe4e6"
            cornerRadius={{ topRight: 4, bottomRight: 4 }}
          />
          <Line
            points={[hw, 2, hw, el.height - 2]}
            stroke="#0284c7"
            strokeWidth={1.2}
            dash={[4, 3]}
          />
          <Group x={hw * 0.5} y={el.height * 0.35}>
            <Circle x={0} y={0} radius={Math.min(el.width, el.height) * 0.07} fill="#0369a1" />
            <Line points={[0, 4, 0, 16]} stroke="#0369a1" strokeWidth={2.5} lineCap="round" />
            <Line points={[-4, 8, 4, 8]} stroke="#0369a1" strokeWidth={2} lineCap="round" />
            <Line points={[0, 16, -3, 24]} stroke="#0369a1" strokeWidth={2} lineCap="round" />
            <Line points={[0, 16, 3, 24]} stroke="#0369a1" strokeWidth={2} lineCap="round" />
          </Group>
          <Group x={hw * 1.5} y={el.height * 0.35}>
            <Circle x={0} y={0} radius={Math.min(el.width, el.height) * 0.07} fill="#b91c1c" />
            <Line points={[0, 4, 0, 9]} stroke="#b91c1c" strokeWidth={2.5} lineCap="round" />
            <Line points={[-5, 17, 5, 17]} stroke="#b91c1c" strokeWidth={2} />
            <Line points={[-5, 17, 0, 9, 5, 17]} stroke="#b91c1c" strokeWidth={1.5} fill="#b91c1c" closed={true} />
            <Line points={[-2, 17, -2, 24]} stroke="#b91c1c" strokeWidth={1.8} lineCap="round" />
            <Line points={[2, 17, 2, 24]} stroke="#b91c1c" strokeWidth={1.8} lineCap="round" />
          </Group>
          {showLabels && (
            <Text
              x={2}
              y={el.height - 18}
              width={el.width - 4}
              text={el.label || "WC / Restrooms"}
              fontSize={el.fontSize || 9}
              fontStyle="bold"
              align="center"
              fill="#0f172a"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Corridor walkway (with central lanes and traffic chevrons)
    if (el.type === "corridor") {
      const isHorizontal = el.width >= el.height;
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill={el.fillColor || el.color || "#f1f5f9"}
            stroke={el.strokeColor || "#cbd5e1"}
            strokeWidth={1}
            {...hoverShadowProps}
          />
          {isHorizontal ? (
            <Line
              points={[0, el.height / 2, el.width, el.height / 2]}
              stroke="#94a3b8"
              strokeWidth={1.5}
              dash={[8, 6]}
            />
          ) : (
            <Line
              points={[el.width / 2, 0, el.width / 2, el.height]}
              stroke="#94a3b8"
              strokeWidth={1.5}
              dash={[8, 6]}
            />
          )}
          {isHorizontal ? (
            [0.25, 0.5, 0.75].map((ratio, idx) => (
              <Group key={idx} x={el.width * ratio} y={el.height / 2}>
                <Line
                  points={[-4, -3, 0, 0, -4, 3]}
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  lineCap="round"
                />
                <Line
                  points={[0, -3, 4, 0, 0, 3]}
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  lineCap="round"
                />
              </Group>
            ))
          ) : (
            [0.25, 0.5, 0.75].map((ratio, idx) => (
              <Group key={idx} x={el.width / 2} y={el.height * ratio}>
                <Line
                  points={[-3, -4, 0, 0, 3, -4]}
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  lineCap="round"
                />
                <Line
                  points={[-3, 0, 0, 4, 3, 0]}
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  lineCap="round"
                />
              </Group>
            ))
          )}
          {showLabels && (
            <Text
              x={4}
              y={isHorizontal ? el.height / 2 - 14 : el.height - 18}
              width={el.width - 8}
              text={el.label || "Walkway"}
              fontSize={el.fontSize || 8}
              fill="#64748b"
              fontStyle="bold"
              align="center"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Escalator (with conveyor belt, handrails, kinetic chevron indicators, and steps)
    if (el.type === "structural-escalator") {
      const stepsCount = Math.max(4, Math.floor(el.height / 14));
      const stepLines = [];
      for (let i = 1; i < stepsCount; i++) {
        const y = (el.height / stepsCount) * i;
        stepLines.push(y);
      }
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#f1f5f9"
            stroke="#475569"
            strokeWidth={1.8}
            {...hoverShadowProps}
          />
          <Line
            points={[2, 0, 2, el.height]}
            stroke="#0f172a"
            strokeWidth={3}
          />
          <Line
            points={[el.width - 2, 0, el.width - 2, el.height]}
            stroke="#0f172a"
            strokeWidth={3}
          />
          {stepLines.map((y, idx) => (
            <Line
              key={idx}
              points={[4, y, el.width - 4, y]}
              stroke="#94a3b8"
              strokeWidth={1}
            />
          ))}
          <Arrow
            points={[el.width / 2, el.height * 0.9, el.width / 2, el.height * 0.1]}
            pointerLength={8}
            pointerWidth={8}
            fill="#0284c7"
            stroke="#0284c7"
            strokeWidth={2}
          />
          {[0.3, 0.7].map((ratio, idx) => (
            <Line
              key={idx}
              points={[el.width / 2 - 6, el.height * ratio + 3, el.width / 2, el.height * ratio - 3, el.width / 2 + 6, el.height * ratio + 3]}
              stroke="#0284c7"
              strokeWidth={1.5}
            />
          ))}
          {showLabels && (
            <Text
              x={6}
              y={el.height - 18}
              width={el.width - 12}
              text={el.label || "ESCALATOR"}
              fontSize={el.fontSize || 9}
              fontStyle="bold"
              align="center"
              fill="#0f172a"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Staircase representation with detailed step lines and directional arrow
    if (el.type === "structural-stairs") {
      const stepsCount = Math.max(4, Math.floor(el.height / 12));
      const stepLines = [];
      for (let i = 1; i < stepsCount; i++) {
        const y = (el.height / stepsCount) * i;
        stepLines.push(y);
      }
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          {stepLines.map((y, idx) => (
            <Line
              key={idx}
              points={[0, y, el.width, y]}
              stroke="#64748b"
              strokeWidth={1.2}
            />
          ))}
          <Arrow
            points={[el.width / 2, el.height * 0.85, el.width / 2, el.height * 0.15]}
            pointerLength={6}
            pointerWidth={6}
            fill="#475569"
            stroke="#475569"
            strokeWidth={1.5}
          />
          {showLabels && (
            <Text
              x={4}
              y={el.height - 18}
              width={el.width - 8}
              text={el.label || "STAIRS"}
              fontSize={el.fontSize || 9}
              fontStyle="bold"
              align="center"
              fill="#1e293b"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom WiFi Access Point (Circular dome with radiating signal rings)
    if (el.type === "tech-wifi") {
      const radius = Math.min(el.width, el.height) / 2.5;
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Circle
            x={el.width / 2}
            y={el.height / 2}
            radius={radius * 1.6}
            stroke="rgba(56, 189, 248, 0.2)"
            strokeWidth={1.5}
            dash={[4, 4]}
          />
          <Circle
            x={el.width / 2}
            y={el.height / 2}
            radius={radius * 1.25}
            stroke="rgba(56, 189, 248, 0.45)"
            strokeWidth={1.5}
            dash={[4, 4]}
          />
          <Circle
            x={el.width / 2}
            y={el.height / 2}
            radius={radius * 0.9}
            fill="#f0f9ff"
            stroke="#38bdf8"
            strokeWidth={2}
            {...hoverShadowProps}
          />
          {(() => {
            const iconPath = getElementIconPath("tech-wifi");
            const scale = (radius * 1.0) / 12;
            const iconX = el.width / 2 - 12 * scale;
            const iconY = el.height / 2 - 12 * scale;
            return (
              <Path
                x={iconX}
                y={iconY}
                data={iconPath}
                stroke="#0284c7"
                strokeWidth={2}
                fillEnabled={false}
                scaleX={scale}
                scaleY={scale}
              />
            );
          })()}
          {showLabels && (
            <Text
              x={2}
              y={el.height / 2 + radius * 0.9 + 4}
              width={el.width - 4}
              text={el.label || "WiFi AP"}
              fontSize={el.fontSize || 9}
              fontStyle="bold"
              align="center"
              fill="#0369a1"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Digital Totem kiosk (base plate + sleek casing + glowing reflection screen)
    if (el.type === "tech-totem") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={el.width * 0.15}
            y={el.height * 0.8}
            width={el.width * 0.7}
            height={el.height * 0.12}
            fill="#334155"
            stroke="#1e293b"
            strokeWidth={1}
            cornerRadius={2}
          />
          <Rect
            x={el.width * 0.25}
            y={el.height * 0.05}
            width={el.width * 0.5}
            height={el.height * 0.75}
            fill="#0f172a"
            stroke="#334155"
            strokeWidth={1.5}
            cornerRadius={4}
            {...hoverShadowProps}
          />
          <Rect
            x={el.width * 0.3}
            y={el.height * 0.12}
            width={el.width * 0.4}
            height={el.height * 0.5}
            fill="#38bdf8"
            stroke="#0284c7"
            strokeWidth={1}
            cornerRadius={1}
            opacity={0.8}
          />
          <Line
            points={[el.width * 0.32, el.height * 0.15, el.width * 0.62, el.height * 0.55]}
            stroke="#e0f2fe"
            strokeWidth={1.2}
            opacity={0.65}
          />
          {showLabels && (
            <Text
              x={2}
              y={el.height * 0.9}
              width={el.width - 4}
              text={el.label || "Digital Totem"}
              fontSize={el.fontSize || 9}
              fontStyle="bold"
              align="center"
              fill="#334155"
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            />
          )}
          {el.qrDataUrl && <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Architectural Pillar column (filled column with cross hatching lines)
    if (el.type === "structural-pillar") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            fill="#64748b"
            stroke="#334155"
            strokeWidth={2}
            {...hoverShadowProps}
          />
          <Line
            points={[0, 0, el.width, el.height]}
            stroke="#475569"
            strokeWidth={1.2}
            listening={false}
          />
          <Line
            points={[el.width, 0, 0, el.height]}
            stroke="#475569"
            strokeWidth={1.2}
            listening={false}
          />
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Generic geometry nodes: booth-std, booth-vip, utility blocks, etc.
    if (el.type.startsWith("booth") || el.type.startsWith("utility") || el.type.startsWith("access") || el.type.startsWith("net") || ["stage", "desk", "entrance", "exit", "corridor"].includes(el.type)) {
      let style = { fill: "#f8fafc", stroke: "#cbd5e1", strokeWidth: 1.5 };
      let extraDecoration = null; // Branded styling matching primary colors
      const statusColors = getStatusColors(el.status);
      if (el.type.startsWith("booth")) {
        const hasStatus = el.status && el.status !== "none";
        style = {
          fill: (hasStatus && statusColors.fill) ? statusColors.fill : (el.fillColor || el.color || "#f8fafc"),
          stroke: (hasStatus && statusColors.stroke) ? statusColors.stroke : (el.strokeColor || "#64748b"),
          strokeWidth: (el.type === "booth-equipped" || el.type === "booth-vip" || el.boothType === "Equipped Booth") ? 1.5 : 1.2
        };
      } else if (el.type === "corridor") {
        style = {
          fill: el.fillColor || el.color || "#f1f5f9",
          stroke: el.strokeColor || "#cbd5e1",
          strokeWidth: 1
        };
      } else if (el.type === "stage") {
        style = { fill: el.fillColor || el.color || "#faf5ff", stroke: el.strokeColor || "#a855f7", strokeWidth: 1.2 };
      } else if (el.type === "screen") {
        style = { fill: el.fillColor || el.color || "#0f172a", stroke: el.strokeColor || "#38bdf8", strokeWidth: 1.2 };
      } else if (el.type === "desk") {
        style = { fill: el.fillColor || el.color || "#f8fafc", stroke: el.strokeColor || "#475569", strokeWidth: 1.0 };
      } else if (el.type === "entrance") {
        style = { fill: el.fillColor || "#ecfdf5", stroke: el.strokeColor || "#059669", strokeWidth: 1.2 };
      } else if (el.type === "exit") {
        style = { fill: el.fillColor || "#fff1f2", stroke: el.strokeColor || "#e11d48", strokeWidth: 1.2 };
      } else if (el.type === "utility-catering") {
        style = { fill: el.fillColor || el.color || "#f0fdf4", stroke: el.strokeColor || "#16a34a", strokeWidth: 1.0 };
      } else if (el.type === "utility-wc") {
        style = { fill: el.fillColor || el.color || "#f0f9ff", stroke: el.strokeColor || "#0284c7", strokeWidth: 1.0 };
      } else if (el.type === "utility-coffee") {
        style = { fill: el.fillColor || el.color || "#fffbeb", stroke: el.strokeColor || "#b45309", strokeWidth: 1.0 };
      } else if (el.type === "utility-help") {
        style = { fill: el.fillColor || el.color || "#fffbeb", stroke: el.strokeColor || "#d97706", strokeWidth: 1.0 };
      } else if (el.type === "utility-firstaid") {
        style = { fill: el.fillColor || "#fff5f5", stroke: el.strokeColor || "#f87171", strokeWidth: 1.0 };
      } else if (el.type === "utility-cloak") {
        style = { fill: el.fillColor || "#fafaf9", stroke: el.strokeColor || "#78716c", strokeWidth: 1.0 };
      } else if (el.type === "utility-power") {
        style = { fill: el.fillColor || "#fffbeb", stroke: el.strokeColor || "#fbbf24", strokeWidth: 1.0 };
      } else if (el.type === "access-badging") {
        style = { fill: el.fillColor || "#f0f9ff", stroke: el.strokeColor || "#38bdf8", strokeWidth: 1.0 };
      } else if (el.type === "access-turnstile") {
        style = { fill: el.fillColor || "#f8fafc", stroke: el.strokeColor || "#64748b", strokeWidth: 1.0 };
      } else if (el.type === "access-scan") {
        style = { fill: el.fillColor || "#ecfdf5", stroke: el.strokeColor || "#34d399", strokeWidth: 1.0 };
      } else if (el.type === "net-pod") {
        style = { fill: el.fillColor || "#fdf4ff", stroke: el.strokeColor || "#c084fc", strokeWidth: 1.2 };
      } else if (el.type === "net-vip") {
        style = { fill: el.fillColor || "#faf5ff", stroke: el.strokeColor || "#a855f7", strokeWidth: 1.5 };
      } else if (el.type === "net-press") {
        style = { fill: el.fillColor || "#f0fdfa", stroke: el.strokeColor || "#2dd4bf", strokeWidth: 1.2 };
      }

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect 
            x={0} 
            y={0} 
            width={el.width} 
            height={el.height} 
            fill={style.fill} 
            stroke={(el.type.startsWith("booth") && el.openSides && el.openSides !== "none") ? null : style.stroke} 
            strokeWidth={style.strokeWidth}
            dash={el.type === "corridor" ? [6, 4] : null}
            cornerRadius={0}
            {...hoverShadowProps}
          />
          {el.type.startsWith("booth") && el.openSides && el.openSides !== "none" && (() => {
            const sides = getSidesStatus(el.openSides);
            const strokeColor = style.stroke;
            const wallWidth = style.strokeWidth;
            const openWidth = 1;
            const openDash = [4, 4];
            return (
              <Group>
                {/* Top Side */}
                <Line
                  points={[0, 0, el.width, 0]}
                  stroke={strokeColor}
                  strokeWidth={sides.top ? wallWidth : openWidth}
                  dash={sides.top ? null : openDash}
                  opacity={sides.top ? 1 : 0.4}
                  lineCap="square"
                />
                {/* Right Side */}
                <Line
                  points={[el.width, 0, el.width, el.height]}
                  stroke={strokeColor}
                  strokeWidth={sides.right ? wallWidth : openWidth}
                  dash={sides.right ? null : openDash}
                  opacity={sides.right ? 1 : 0.4}
                  lineCap="square"
                />
                {/* Bottom Side */}
                <Line
                  points={[el.width, el.height, 0, el.height]}
                  stroke={strokeColor}
                  strokeWidth={sides.bottom ? wallWidth : openWidth}
                  dash={sides.bottom ? null : openDash}
                  opacity={sides.bottom ? 1 : 0.4}
                  lineCap="square"
                />
                {/* Left Side */}
                <Line
                  points={[0, el.height, 0, 0]}
                  stroke={strokeColor}
                  strokeWidth={sides.left ? wallWidth : openWidth}
                  dash={sides.left ? null : openDash}
                  opacity={sides.left ? 1 : 0.4}
                  lineCap="square"
                />
              </Group>
            );
          })()}
          {(el.type === "booth-semi" || el.boothType === "Semi-Equipped Booth") && (
            <Group listening={false} opacity={0.42}>
              {/* Small counter back desk */}
              <Rect 
                x={el.width * 0.15} 
                y={el.height * 0.12} 
                width={el.width * 0.7} 
                height={el.height * 0.18} 
                fill="#cbd5e1" 
                stroke="#64748b" 
                strokeWidth={1}
                cornerRadius={0}
              />
              {/* Single high stool chair */}
              <Circle 
                x={el.width * 0.5} 
                y={el.height * 0.44} 
                radius={Math.min(el.width, el.height) * 0.09} 
                fill="#f8fafc" 
                stroke="#475569" 
                strokeWidth={1}
              />
            </Group>
          )}
          {(el.type === "booth-equipped" || el.type === "booth-vip" || el.boothType === "Equipped Booth") && (
            <Group listening={false} opacity={0.42}>
              {/* Back display wall panel */}
              <Rect 
                x={el.width * 0.1} 
                y={el.height * 0.1} 
                width={el.width * 0.8} 
                height={el.height * 0.08} 
                fill="#94a3b8" 
                stroke="#475569" 
                strokeWidth={1}
                cornerRadius={0}
              />
              {/* Round meeting table */}
              <Circle 
                x={el.width * 0.5} 
                y={el.height * 0.46} 
                radius={Math.min(el.width, el.height) * 0.18} 
                fill="#f8fafc" 
                stroke="#334155" 
                strokeWidth={1.2}
              />
              {/* Two flanking chairs */}
              <Circle 
                x={el.width * 0.24} 
                y={el.height * 0.46} 
                radius={Math.min(el.width, el.height) * 0.07} 
                fill="#cbd5e1" 
                stroke="#64748b" 
                strokeWidth={1}
              />
              <Circle 
                x={el.width * 0.76} 
                y={el.height * 0.46} 
                radius={Math.min(el.width, el.height) * 0.07} 
                fill="#cbd5e1" 
                stroke="#64748b" 
                strokeWidth={1}
              />
              {/* Front info desk counter */}
              <Rect 
                x={el.width * 0.2} 
                y={el.height * 0.76} 
                width={el.width * 0.6} 
                height={el.height * 0.12} 
                fill="#e2e8f0" 
                stroke="#64748b" 
                strokeWidth={1}
                cornerRadius={0}
              />
            </Group>
          )}
          {(() => {
            const iconPath = getElementIconPath(el.type);
            if (iconPath) {
              const iconOnlyTypes = ["utility-water", "utility-trash", "tech-wifi", "structural-pillar"];
              const isIconOnly = iconOnlyTypes.includes(el.type);
              const iconSize = el.fontSize ? Math.round(el.fontSize * 1.25) : 24;
              const scale = iconSize / 24;
              const iconX = (el.width - 24 * scale) / 2;
              const iconY = isIconOnly ? (el.height - 24 * scale) / 2 : el.height * 0.12;
              const labelSize = el.fontSize || 12;
              return (
                <Group>
                  <Path
                    x={iconX}
                    y={iconY}
                    data={iconPath}
                    stroke={el.textColor || style.stroke || "#475569"}
                    strokeWidth={2}
                    fillEnabled={false}
                    scaleX={scale}
                    scaleY={scale}
                  />
                  {showLabels && !isIconOnly && (
                    <Text
                      x={6}
                      y={el.height * 0.55}
                      width={el.width - 12}
                      text={el.label || ""}
                      align="center"
                      fontSize={labelSize}
                      fontStyle="bold"
                      fill={el.textColor || "#1e293b"}
                      fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
                      wrap="word"
                      ellipsis={true}
                    />
                  )}
                </Group>
              );
            }

            // Check if there is an exhibitor company linked to this booth
            let companyText = "";
            if (el.exhibitorId) {
              const matchedExhibitor = exhibitorMap.get(String(el.exhibitorId));
              if (matchedExhibitor) {
                companyText = matchedExhibitor.name;
              }
            }

            if (el.type.startsWith("booth")) {
              const surfaceMeters = (el.width / 20) * (el.height / 20);
              const isSmallBooth = el.height <= 80 || el.width <= 80 || surfaceMeters <= 9;
              
              const topPadding = isSmallBooth ? 4 : 8;
              const bottomPadding = isSmallBooth ? 4 : 8;
              const sidePadding = isSmallBooth ? 6 : 12;
              const gap = isSmallBooth ? 2 : 4;

              const labelWidth = el.width - sidePadding * 2;
              
              const estimateTextHeight = (text, fontSize, isBold = false) => {
                if (!text) return 0;
                const charWidth = fontSize * (isBold ? 0.62 : 0.52);
                const charsPerLine = Math.max(1, Math.floor(labelWidth / charWidth));
                const lines = text.split("\n");
                let lineCount = 0;
                lines.forEach(l => {
                  lineCount += Math.max(1, Math.ceil(l.length / charsPerLine));
                });
                return lineCount * (fontSize * 1.25);
              };

              const labelFontSize = el.fontSize || 16;
              const subFontSize = surfaceMeters <= 9 ? 10 : 12;
              const statusFontSize = surfaceMeters <= 9 ? 8 : Math.max(7.5, Math.min(16, Math.round(Math.min(el.width, el.height) * 0.09)));

              const statusHeight = statusFontSize * 1.25;
              const surfaceHeight = subFontSize * 1.25;

              // Calculate available height for the name text before pushing surface out of the booth
              const nonNameHeight = surfaceHeight + statusHeight + topPadding + bottomPadding + gap * 2;
              const maxNameHeight = Math.max(labelFontSize * 1.25, el.height - nonNameHeight);

              // Cap the name height estimation at maxNameHeight
              const nameHeight = Math.min(maxNameHeight, estimateTextHeight(el.label, labelFontSize, true));

              let currentY = topPadding;
              const textNodes = [];
              
              // 1. Element Label / Name
              showLabels && textNodes.push(
                <Text
                  key="label"
                  x={sidePadding}
                  y={currentY}
                  width={labelWidth}
                  height={maxNameHeight}
                  text={el.label}
                  align="center"
                  fontSize={labelFontSize}
                  fontStyle="bold"
                  fill={el.textColor || "#1e293b"}
                  fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
                  wrap="word"
                  ellipsis={true}
                />
              );
              
              currentY += (showLabels ? nameHeight : 0) + gap;
              
              // 2. Surface Area
              showLabels && textNodes.push(
                <Text
                  key="surface"
                  x={sidePadding}
                  y={currentY}
                  width={labelWidth}
                  height={surfaceHeight}
                  text={`${surfaceMeters.toFixed(2)} m²`}
                  align="center"
                  fontSize={subFontSize}
                  fontStyle="normal"
                  fill="#64748b"
                  fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
                  wrap="word"
                  ellipsis={true}
                />
              );
              
              const maxTextGroupHeight = el.height - statusHeight - bottomPadding - gap;
 
              return (
                <Group>
                  <Group clipX={0} clipY={0} clipWidth={el.width} clipHeight={maxTextGroupHeight}>
                    {textNodes}
                  </Group>
                  {showLabels && (
                    <Text
                      key="status"
                      x={sidePadding}
                      y={el.height - statusHeight - bottomPadding}
                      width={el.width - sidePadding * 2}
                      text={el.status.toUpperCase()}
                      align="center"
                      fontSize={statusFontSize}
                      fontStyle="bold"
                      fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
                      fill={statusColors.text}
                    />
                  )}
                </Group>
              );;
            }

            const dynamicFontSize = el.type === "corridor" ? (el.fontSize || 9) : (el.fontSize || 20);
            const labelHeight = el.height - 16;

            return (
              <Text 
                x={12} 
                y={8} 
                width={el.width - 24}
                height={labelHeight}
                text={showLabels ? (el.label || (el.type === "corridor" ? "Corridor" : "")) : ""} 
                align="center"
                verticalAlign="middle"
                fontSize={dynamicFontSize} 
                fontStyle="bold" 
                fill={el.type === "corridor" ? (el.textColor || "#94a3b8") : (el.textColor || "#1e293b")} 
                fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
                wrap="word"
                ellipsis={true}
              />
            );
          })()}
          {el.isLocked && (
            <Path
              x={el.width - 15}
              y={5}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {el.qrDataUrl && (
            <CanvasQRCode qrUrl={el.qrDataUrl} x={5} y={5} size={40} />
          )}
          {!el.qrDataUrl && (el.type === "booth-equipped" || el.type === "booth-vip" || el.boothType === "Equipped Booth") && (
            <Path
              x={5}
              y={5}
              data="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.269a1 1 0 0 1-.956.712H5.81a1 1 0 0 1-.956-.712L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"
              fill="#7c3aed"
              opacity={0.75}
              scaleX={0.38}
              scaleY={0.38}
              listening={false}
            />
          )}
          {!el.qrDataUrl && (el.type === "booth-semi" || el.boothType === "Semi-Equipped Booth") && (
            <Path
              x={5}
              y={5}
              data="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
              stroke="#059669"
              strokeWidth={1.8}
              fillEnabled={false}
              opacity={0.7}
              scaleX={0.38}
              scaleY={0.38}
              listening={false}
            />
          )}
          {el.type.startsWith("booth") && el.status && (
            <Circle
              x={el.width - 10}
              y={10}
              radius={6}
              fill={
                el.status === "checked_in" || el.status === "checked-in" || el.status === "available" ? "#10b981" :
                el.status === "confirmed" || el.status === "sold" ? "#ef4444" :
                el.status === "reserved" ? "#f59e0b" :
                "#94a3b8"
              }
              stroke="#ffffff"
              strokeWidth={1.5}
              listening={false}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Text Label Annotation
    if (el.type === "text") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          {isSelected && (
            <Rect
              x={0}
              y={0}
              width={el.width}
              height={el.height}
              stroke="#6366f1"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
              name="selection-outline"
            />
          )}
          <Text
            x={0}
            y={0}
            width={el.width}
            height={el.height}
            text={isEditingThis ? "" : el.label}
            fontSize={el.fontSize || 16}
            fill={el.color || "#334155"}
            fontStyle={el.fontStyle || "bold"}
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            align={el.align || "center"}
            verticalAlign="middle"
            wrap="word"
          />
          {el.isLocked && (
            <Path
              x={el.width - 13}
              y={3}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Custom Uploaded Picture Element
    if (el.type === "image") {
      return (
        <CanvasImageElement
          key={el.id}
          el={el}
          isSelected={isSelected}
          isHovered={isHovered}
          toolMode={toolMode}
          commonProps={commonProps}
          overlaps={overlaps}
          renderOverlapsBadge={renderOverlapsBadge}
          isSearchActive={isSearchActive}
          isMatch={isMatch}
          renderDimensionOverlay={renderDimensionOverlay}
        />
      );
    }

    // Chairs (single seat node)
    if (el.type === "furniture-chair") {
      const armrestWidth = Math.max(6, Math.min(12, el.width * 0.15));
      const backHeight = Math.max(8, el.height * 0.25);
      const cushionOffset = armrestWidth + Math.max(2, Math.min(6, el.width * 0.08));
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          {/* Main frame back cushion */}
          <Rect 
            x={4} 
            y={4} 
            width={el.width - 8} 
            height={backHeight} 
            fill={el.strokeColor || "#cbd5e1"} 
            stroke={el.strokeColor || "#94a3b8"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          {/* Left cushion armrest */}
          <Rect 
            x={4} 
            y={backHeight + 4} 
            width={armrestWidth} 
            height={el.height - backHeight - 8} 
            fill={el.strokeColor || "#cbd5e1"} 
            stroke={el.strokeColor || "#94a3b8"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          {/* Right cushion armrest */}
          <Rect 
            x={el.width - 4 - armrestWidth} 
            y={backHeight + 4} 
            width={armrestWidth} 
            height={el.height - backHeight - 8} 
            fill={el.strokeColor || "#cbd5e1"} 
            stroke={el.strokeColor || "#94a3b8"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          {/* Seating cushion */}
          <Rect 
            x={4 + cushionOffset} 
            y={backHeight + 4} 
            width={el.width - 8 - (cushionOffset * 2)} 
            height={el.height - backHeight - 8} 
            fill={el.fillColor || el.color || "#f1f5f9"} 
            stroke={el.strokeColor || "#cbd5e1"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          <Text 
            x={4 + cushionOffset} 
            y={el.height * 0.5 - 5} 
            width={el.width - 8 - (cushionOffset * 2)}
            text={showLabels ? el.label : ""} 
            align="center"
            fontSize={el.fontSize || 12} 
            fontStyle="bold" 
            fill={el.textColor || "#475569"} 
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            wrap="char"
          />
          {el.isLocked && (
            <Path
              x={el.width - 15}
              y={5}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Plain Round Table
    if (el.type === "table") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Circle 
            x={el.width / 2} 
            y={el.height / 2} 
            radius={el.width / 2} 
            fill={el.fillColor || el.color || "#f8fafc"} 
            stroke={el.strokeColor || "#475569"} 
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          <Text 
            x={5} 
            y={el.height / 2 - 6} 
            width={el.width - 10}
            text={showLabels ? el.label : ""} 
            align="center"
            fontSize={el.fontSize || 20} 
            fontStyle="bold" 
            fill={el.textColor || "#475569"} 
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            wrap="char"
          />
          {el.isLocked && (
            <Path
              x={el.width * 0.75}
              y={el.height * 0.15}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Table with chairs surrounding it
    if (el.type === "table-chairs") {
      const radius = el.width / 2;
      const center = radius;
      const chairRadius = radius * 0.22;
      const chairDistance = radius * 0.8;
      const chairsCount = el.chairsCount || 6;
      const chairPoints = [];

      for (let i = 0; i < chairsCount; i++) {
        const angle = (i * 2 * Math.PI) / chairsCount;
        chairPoints.push({
          x: center + chairDistance * Math.cos(angle),
          y: center + chairDistance * Math.sin(angle)
        });
      }

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          {chairPoints.map((p, idx) => {
            const assignedAttendeeId = el.assignments ? el.assignments[idx] : null;
            const attendee = assignedAttendeeId ? attendeeMap.get(String(assignedAttendeeId)) : null;
            
            const isCheckedIn = attendee && (attendee.status === "checked_in" || attendee.status === "checked-in" || attendee.status === "present");
            const isAssigned = !!attendee;
            let chairFill = "rgba(255, 255, 255, 0.01)";
            let chairStroke = el.strokeColor || "#64748b";
            let chairStrokeWidth = 1;
            
            if (isCheckedIn || isAssigned) {
              chairFill = "rgba(29, 158, 117, 0.4)";
              chairStroke = "#1D9E75";
              chairStrokeWidth = 1.5;
            }
            
            const isChairSelected = selectedSeatId === `chair_${idx}`;
            if (isChairSelected) {
              chairStroke = "#6366f1";
              chairStrokeWidth = 2;
            }
            
            const hasPicture = isPreviewMode && attendee && (attendee.image || attendee.picture);
            
            return (
              <Group 
                key={idx}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectSeat(el.id, `chair_${idx}`);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  onSelectSeat(el.id, `chair_${idx}`);
                }}
                onMouseEnter={() => {
                  if (stageRef.current) stageRef.current.container().style.cursor = "pointer";
                }}
                onMouseLeave={() => {
                  if (stageRef.current) stageRef.current.container().style.cursor = "default";
                }}
              >
                {hasPicture ? (
                  <SeatAttendeeAvatar
                    src={attendee.image || attendee.picture}
                    shape="circle"
                    seatProps={{
                      x: p.x,
                      y: p.y,
                      width: chairRadius * 2,
                      height: chairRadius * 2,
                    }}
                    width={chairRadius * 2}
                    height={chairRadius * 2}
                    stroke={chairStroke}
                    strokeWidth={chairStrokeWidth}
                  />
                ) : (
                  <Circle 
                    x={p.x} 
                    y={p.y} 
                    radius={chairRadius} 
                    fill={chairFill} 
                    stroke={chairStroke} 
                    strokeWidth={chairStrokeWidth} 
                  />
                )}
              </Group>
            );
          })}
          <Circle 
            x={center} 
            y={center} 
            radius={radius * 0.6} 
            fill={el.fillColor || el.color || "#f8fafc"} 
            stroke={el.strokeColor || "#475569"} 
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          <Text 
            x={center - radius * 0.5} 
            y={center - 5} 
            width={radius}
            text={showLabels ? el.label : ""} 
            align="center"
            fontSize={el.fontSize || 20} 
            fontStyle="bold" 
            fill={el.textColor || "#475569"} 
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            wrap="char"
          />
          {el.isLocked && (
            <Path
              x={el.width - 15}
              y={5}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Speaker Podium with desk and chairs
    if (el.type === "stage-podium") {
      const chairsCount = el.chairsCount || 2;
      const chairRadius = 9;
      const chairY = 20;

      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          {Array.from({ length: chairsCount }).map((_, idx) => {
            let chairX;
            if (chairsCount === 1) {
              chairX = el.width / 2;
            } else {
              const padding = 22;
              chairX = padding + (idx * (el.width - 2 * padding) / (chairsCount - 1));
            }

            const assignedAttendeeId = el.assignments ? el.assignments[idx] : null;
            const attendee = assignedAttendeeId ? attendeeMap.get(String(assignedAttendeeId)) : null;
            
            const isCheckedIn = attendee && (attendee.status === "checked_in" || attendee.status === "checked-in" || attendee.status === "present");
            const isAssigned = !!attendee;
            let chairFill = "rgba(139, 92, 246, 0.05)";
            let chairStroke = el.strokeColor || "#8b5cf6";
            let chairStrokeWidth = 1.2;
            
            if (isCheckedIn || isAssigned) {
              chairFill = "rgba(139, 92, 246, 0.35)";
              chairStroke = "#8b5cf6";
              chairStrokeWidth = 1.8;
            }
            
            const isChairSelected = selectedSeatId === `chair_${idx}`;
            if (isChairSelected) {
              chairStroke = "#4f46e5";
              chairStrokeWidth = 2.2;
            }
            
            const hasPicture = isPreviewMode && attendee && (attendee.image || attendee.picture);
            
            return (
              <Group 
                key={idx}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelectSeat(el.id, `chair_${idx}`);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  onSelectSeat(el.id, `chair_${idx}`);
                }}
                onMouseEnter={() => {
                  if (stageRef.current) stageRef.current.container().style.cursor = "pointer";
                }}
                onMouseLeave={() => {
                  if (stageRef.current) stageRef.current.container().style.cursor = "default";
                }}
              >
                {hasPicture ? (
                  <SeatAttendeeAvatar
                    src={attendee.image || attendee.picture}
                    shape="circle"
                    seatProps={{
                      x: chairX,
                      y: chairY,
                      width: chairRadius * 2,
                      height: chairRadius * 2,
                    }}
                    width={chairRadius * 2}
                    height={chairRadius * 2}
                    stroke={chairStroke}
                    strokeWidth={chairStrokeWidth}
                  />
                ) : (
                  <Circle 
                    x={chairX} 
                    y={chairY} 
                    radius={chairRadius} 
                    fill={chairFill} 
                    stroke={chairStroke} 
                    strokeWidth={chairStrokeWidth} 
                  />
                )}
              </Group>
            );
          })}
          
          {/* Podium Desk */}
          <Rect 
            x={10} 
            y={44} 
            width={el.width - 20} 
            height={34} 
            fill={el.fillColor || el.color || "rgba(139, 92, 246, 0.08)"} 
            stroke={el.strokeColor || "#8b5cf6"} 
            strokeWidth={1.8}
            cornerRadius={6}
            {...hoverShadowProps}
          />
          
          {/* Microphone Icon in center of desk */}
          <Path
            x={el.width / 2 - 6}
            y={48}
            data="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v1a7 7 0 0 1-14 0v-1 M12 18v4 M8 22h8"
            stroke={el.textColor || "#8b5cf6"}
            strokeWidth={1.5}
            fillEnabled={false}
            scaleX={0.5}
            scaleY={0.5}
          />
          
          <Text 
            x={12} 
            y={64} 
            width={el.width - 24}
            text={showLabels ? el.label : ""} 
            align="center"
            fontSize={8} 
            fontStyle="bold" 
            fill={el.textColor || "#6d28d9"} 
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            wrap="char"
          />
          
          {el.isLocked && (
            <Path
              x={el.width - 15}
              y={5}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Comfortable Lounge Sofa
    if (el.type === "furniture-sofa") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          {/* Main frame back cushion */}
          <Rect 
            x={4} 
            y={4} 
            width={el.width - 8} 
            height={el.height * 0.25} 
            fill={el.strokeColor || "#cbd5e1"} 
            stroke={el.strokeColor || "#94a3b8"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          {/* Left cushion armrest */}
          <Rect 
            x={4} 
            y={el.height * 0.25 + 4} 
            width={12} 
            height={el.height * 0.75 - 8} 
            fill={el.strokeColor || "#cbd5e1"} 
            stroke={el.strokeColor || "#94a3b8"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          {/* Right cushion armrest */}
          <Rect 
            x={el.width - 16} 
            y={el.height * 0.25 + 4} 
            width={12} 
            height={el.height * 0.75 - 8} 
            fill={el.strokeColor || "#cbd5e1"} 
            stroke={el.strokeColor || "#94a3b8"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          {/* Seating cushions divided */}
          <Rect 
            x={18} 
            y={el.height * 0.25 + 4} 
            width={(el.width - 36) / 2 - 1} 
            height={el.height * 0.75 - 8} 
            fill={el.fillColor || el.color || "#f1f5f9"} 
            stroke={el.strokeColor || "#cbd5e1"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          <Rect 
            x={18 + (el.width - 36) / 2 + 1} 
            y={el.height * 0.25 + 4} 
            width={(el.width - 36) / 2 - 1} 
            height={el.height * 0.75 - 8} 
            fill={el.fillColor || el.color || "#f1f5f9"} 
            stroke={el.strokeColor || "#cbd5e1"} 
            strokeWidth={1}
            cornerRadius={0}
          />
          <Text 
            x={18} 
            y={el.height * 0.5 - 5} 
            width={el.width - 36}
            text={showLabels ? el.label : ""} 
            align="center"
            fontSize={el.fontSize || 20} 
            fontStyle="bold" 
            fill={el.textColor || "#475569"} 
            fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
            wrap="char"
          />
          {el.isLocked && (
            <Path
              x={el.width - 15}
              y={5}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Cocktail Table
    if (el.type === "furniture-cocktail") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Circle 
            x={el.width / 2} 
            y={el.height / 2} 
            radius={el.width / 2} 
            fill={el.fillColor || el.color || "#f8fafc"} 
            stroke={el.strokeColor || "#64748b"} 
            strokeWidth={2}
            {...hoverShadowProps}
          />
          <Circle 
            x={el.width / 2} 
            y={el.height / 2} 
            radius={el.width / 3.5} 
            fill={el.strokeColor || "#cbd5e1"} 
            stroke={el.strokeColor || "#94a3b8"} 
            strokeWidth={1}
          />
          <Path
            x={(el.width - 24 * 0.9) / 2}
            y={(el.height - 24 * 0.9) / 2}
            data="M18 2L12 12M6 2L12 12M12 12V22M19 2H5M16 22H8"
            stroke={el.textColor || "#64748b"}
            strokeWidth={1.5}
            fillEnabled={false}
            scaleX={0.9}
            scaleY={0.9}
          />
          {el.isLocked && (
            <Path
              x={el.width * 0.7}
              y={el.height * 0.15}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.35}
              scaleY={0.35}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Basic Circle Shape
    if (el.type === "circle") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Circle 
            x={el.width / 2} 
            y={el.height / 2} 
            radius={Math.min(el.width, el.height) / 2} 
            fill={el.fillColor || el.color || "#cbd5e1"} 
            stroke={el.strokeColor || "#64748b"} 
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          {showLabels && el.label && (
            <Text 
              x={5} 
              y={el.height / 2 - 6} 
              width={el.width - 10}
              text={el.label} 
              align="center"
              fontSize={el.fontSize || 20} 
              fontStyle="bold"
              fill={el.textColor || "#1e293b"}
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
              wrap="char"
            />
          )}
          {el.isLocked && (
            <Path
              x={el.width * 0.75}
              y={el.height * 0.15}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Basic Square Shape
    if (el.type === "square") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Rect 
            x={0} 
            y={0} 
            width={el.width} 
            height={el.height} 
            fill={el.fillColor || el.color || "#cbd5e1"} 
            stroke={el.strokeColor || "#64748b"} 
            strokeWidth={1.5}
            cornerRadius={el.cornerRadius || 0}
            {...hoverShadowProps}
          />
          {showLabels && el.label && (
            <Text 
              x={5} 
              y={el.height / 2 - 6} 
              width={el.width - 10}
              text={el.label} 
              align="center"
              fontSize={el.fontSize || 20} 
              fontStyle="bold"
              fill={el.textColor || "#1e293b"}
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
              wrap="char"
            />
          )}
          {el.isLocked && (
            <Path
              x={el.width - 15}
              y={5}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Basic Triangle Shape
    if (el.type === "triangle") {
      const sides = el.sides || 3;
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Line 
            points={
              sides === 3 
                ? [el.width / 2, 0, el.width, el.height, 0, el.height] 
                : (() => {
                    const cx = el.width / 2;
                    const cy = el.height / 2;
                    const rx = el.width / 2;
                    const ry = el.height / 2;
                    const pts = [];
                    for (let i = 0; i < sides; i++) {
                      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
                      pts.push(cx + rx * Math.cos(angle));
                      pts.push(cy + ry * Math.sin(angle));
                    }
                    return pts;
                  })()
            }
            closed={true}
            fill={el.fillColor || el.color || "#cbd5e1"} 
            stroke={el.strokeColor || "#64748b"} 
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          {showLabels && el.label && (
            <Text 
              x={5} 
              y={sides === 3 ? el.height * 0.6 : el.height / 2 - 10} 
              width={el.width - 10}
              text={el.label} 
              align="center"
              fontSize={el.fontSize || 20} 
              fontStyle="bold"
              fill={el.textColor || "#1e293b"}
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
              wrap="char"
            />
          )}
          {el.isLocked && (
            <Path
              x={el.width * 0.7}
              y={el.height * 0.7}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.35}
              scaleY={0.35}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Basic Star Shape
    if (el.type === "star") {
      const outerRadius = Math.min(el.width, el.height) / 2;
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Star 
            x={el.width / 2} 
            y={el.height / 2} 
            numPoints={5}
            innerRadius={outerRadius * 0.4}
            outerRadius={outerRadius}
            fill={el.fillColor || el.color || "#cbd5e1"} 
            stroke={el.strokeColor || "#64748b"} 
            strokeWidth={1.5}
            {...hoverShadowProps}
          />
          {showLabels && el.label && (
            <Text 
              x={5} 
              y={el.height / 2 - 6} 
              width={el.width - 10}
              text={el.label} 
              align="center"
              fontSize={el.fontSize || 20} 
              fontStyle="bold"
              fill={el.textColor || "#1e293b"}
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
              wrap="char"
            />
          )}
          {el.isLocked && (
            <Path
              x={el.width * 0.75}
              y={el.height * 0.15}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Basic Heart Shape
    if (el.type === "heart") {
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Path 
            x={0} 
            y={0} 
            data="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={el.fillColor || el.color || "#cbd5e1"} 
            stroke={el.strokeColor || "#64748b"} 
            strokeWidth={1.5}
            strokeScaleEnabled={false}
            scaleX={el.width / 24}
            scaleY={el.height / 24}
            {...hoverShadowProps}
          />
          {showLabels && el.label && (
            <Text 
              x={5} 
              y={el.height / 2 - 12} 
              width={el.width - 10}
              text={el.label} 
              align="center"
              fontSize={el.fontSize || 20} 
              fontStyle="bold"
              fill={el.textColor || "#1e293b"}
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
              wrap="char"
            />
          )}
          {el.isLocked && (
            <Path
              x={el.width - 15}
              y={5}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Basic Arrow Shape
    if (el.type === "arrow") {
      let arrowPoints = el.points || [10, 30, 90, 30];
      if (arrowPoints && !Array.isArray(arrowPoints)) {
        arrowPoints = Object.values(arrowPoints);
      }
      const strokeW = el.strokeWidth || 3;
      return (
        <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
          {renderSearchHighlight()}
          <Arrow
            points={arrowPoints}
            stroke={el.strokeColor || "#64748b"}
            fill={el.fillColor || el.color || "#cbd5e1"}
            strokeWidth={strokeW}
            pointerLength={strokeW * 4}
            pointerWidth={strokeW * 4}
            strokeScaleEnabled={false}
            {...hoverShadowProps}
          />
          {showLabels && el.label && (
            <Text
              x={5}
              y={5}
              width={el.width - 10}
              text={el.label}
              align="center"
              fontSize={el.fontSize || 12}
              fontStyle="bold"
              fill={el.textColor || "#1e293b"}
              fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
              wrap="char"
            />
          )}
          {el.isLocked && (
            <Path
              x={el.width - 15}
              y={5}
              data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="#ef4444"
              strokeWidth={2}
              fillEnabled={false}
              scaleX={0.4}
              scaleY={0.4}
            />
          )}
          
          {/* Interactive Drag Handles for Arrow points, only shown when selected */}
          {isSelected && toolMode === "select" && arrowPoints.reduce((acc, _, idx) => {
            if (idx % 2 === 0) {
              const pIdx = idx / 2;
              const px = arrowPoints[idx];
              const py = arrowPoints[idx + 1];
              acc.push(
                <Circle
                  key={`handle-${pIdx}`}
                  x={px}
                  y={py}
                  radius={7}
                  fill="#6366f1"
                  stroke="#ffffff"
                  strokeWidth={2}
                  draggable={!el.isLocked}
                  onDragStart={(e) => {
                    e.cancelBubble = true; // prevent triggering parent group dragstart
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true; // prevent dragging the group
                    const newX = e.target.x();
                    const newY = e.target.y();
                    
                    // Modify arrow coordinates dynamically on the canvas node for 60fps dragging
                    const groupNode = e.target.getParent();
                    const arrowNode = groupNode.findOne('Arrow');
                    if (arrowNode) {
                      const nextPts = Array.from(arrowNode.points());
                      
                      // Reference coordinate is the previous point (or next point if dragging the first point)
                      const refX = idx >= 2 ? nextPts[idx - 2] : nextPts[2];
                      const refY = idx >= 2 ? nextPts[idx - 1] : nextPts[3];
                      
                      const dx = newX - refX;
                      const dy = newY - refY;
                      
                      const angleRad = Math.atan2(dy, dx);
                      const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;
                      // Round to nearest 45 degrees
                      const roundedAngleDeg = Math.round(angleDeg / 45) % 8 * 45;
                      
                      let finalX = newX;
                      let finalY = newY;
                      
                      if (snapToGrid) {
                        if (roundedAngleDeg === 0 || roundedAngleDeg === 180) {
                          // Horizontal
                          finalX = Math.round(newX / gridSize) * gridSize;
                          finalY = refY;
                        } else if (roundedAngleDeg === 90 || roundedAngleDeg === 270) {
                          // Vertical
                          finalX = refX;
                          finalY = Math.round(newY / gridSize) * gridSize;
                        } else {
                          // Diagonal (45, 135, 225, 315)
                          const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
                          const snappedDelta = Math.round(maxDelta / gridSize) * gridSize;
                          const signX = roundedAngleDeg === 45 || roundedAngleDeg === 315 ? 1 : -1;
                          const signY = roundedAngleDeg === 45 || roundedAngleDeg === 135 ? 1 : -1;
                          finalX = refX + signX * snappedDelta;
                          finalY = refY + signY * snappedDelta;
                        }
                      } else {
                        const roundedAngleRad = (roundedAngleDeg * Math.PI) / 180;
                        const dist = Math.hypot(dx, dy);
                        finalX = refX + dist * Math.cos(roundedAngleRad);
                        finalY = refY + dist * Math.sin(roundedAngleRad);
                      }
                      
                      e.target.x(finalX);
                      e.target.y(finalY);
                      
                      nextPts[idx] = finalX;
                      nextPts[idx + 1] = finalY;
                      arrowNode.points(nextPts);
                    }
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true; // Prevent event bubbling to the parent group
                    setIsDraggingElement(false); // Safeguard: ensure drag state is reset
                    const groupNode = e.target.getParent();
                    const arrowNode = groupNode.findOne('Arrow');
                    if (!arrowNode) return;
                    
                    const nextPoints = Array.from(arrowNode.points());
                    
                    // Update elements array and notify parent layout update
                    const updated = elements.map(item => {
                      if (item.id === el.id) {
                        let minX = Infinity;
                        let minY = Infinity;
                        let maxX = -Infinity;
                        let maxY = -Infinity;
                        for (let i = 0; i < nextPoints.length; i += 2) {
                          if (nextPoints[i] < minX) minX = nextPoints[i];
                          if (nextPoints[i] > maxX) maxX = nextPoints[i];
                          if (nextPoints[i+1] < minY) minY = nextPoints[i+1];
                          if (nextPoints[i+1] > maxY) maxY = nextPoints[i+1];
                        }
                        const w = Math.max(el.width, maxX + 20);
                        const h = Math.max(el.height, maxY + 20);
                        return { 
                          ...item, 
                          points: nextPoints,
                          width: w,
                          height: h
                        };
                      }
                      return item;
                    });
                    onUpdateLayout(updated);
                  }}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    stage.container().style.cursor = "move";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    stage.container().style.cursor = "default";
                  }}
                />
              );
            }
            return acc;
          }, [])}
          
          {renderDimensionOverlay(el)}
          {renderHoverRing()}
        </Group>
      );
    }

    // Generic fallback shape
    return (
      <Group key={el.id} {...commonProps} width={el.width} height={el.height}>
        {renderSearchHighlight()}
        <Rect 
          x={0} 
          y={0} 
          width={el.width} 
          height={el.height} 
          fill={el.fillColor || el.color || "#e2e8f0"} 
          stroke={el.strokeColor || "#94a3b8"} 
          strokeWidth={1}
          cornerRadius={0}
          {...hoverShadowProps}
        />
        <Text 
          x={5} 
          y={el.height / 2 - 6} 
          width={el.width - 10}
          text={el.label} 
          align="center"
          fontSize={el.fontSize || 20}
          fill={el.textColor || "#1e293b"}
          fontFamily={el.fontFamily || floorPlanFont || "Inter, sans-serif"}
        />
        {el.isLocked && (
          <Path
            x={el.width - 15}
            y={5}
            data="M15 11V7a3 3 0 0 0-6 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
            stroke="#ef4444"
            strokeWidth={2}
            fillEnabled={false}
            scaleX={0.4}
            scaleY={0.4}
          />
        )}
        {renderDimensionOverlay(el)}
        {renderHoverRing()}
      </Group>
    );
  };



  const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;
  const isImageSelected = selectedElement && selectedElement.type === "image";
  const isRatioLocked = selectedElement && (
    selectedElement.type === "image" || 
    (selectedElement.type === "screen" && selectedElement.aspectRatio && selectedElement.aspectRatio !== "Custom")
  );
  const isResizeDisabled = selectedElement && (
    selectedElement.type === "reserved-seat-block" ||
    selectedElement.type === "auditorium-block" ||
    selectedElement.type === "classroom-rows" ||
    selectedElement.type === "theater-in-the-round"
  );

  const renderedElements = React.useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1025;
    return elements
      .filter(el => {
        if (!exportFilters) return true;
        if (exportFilters.availableOnly && el.type.startsWith("booth") && el.status !== "available") return false;
        if (exportFilters.hideFurniture && (el.type.startsWith("furniture") || el.type === "table" || el.type === "table-chairs" || el.type.startsWith("furniture-") || el.type === "auditorium-block" || el.type === "theater-in-the-round" || el.type === "classroom-rows" || el.type === "reserved-seat-block")) return false;
        if (exportFilters.safetyLayerOnly) {
          const isStructuralOrSafety = el.type.startsWith("structural-") || 
                                       ["entrance", "exit", "access-assembly", "safety-extinguisher", "safety-exit-route", "safety-accessibility-path", "safety-cctv"].includes(el.type);
          if (!isStructuralOrSafety) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.type === "zone-overlay" && b.type !== "zone-overlay") return -1;
        if (b.type === "zone-overlay" && a.type !== "zone-overlay") return 1;
        return 0;
      })
      .map(el => {
        return renderElement(el);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, selectedIds, hoveredId, toolMode, previewSearchQuery, previewFilter, selectedSeatId, exportFilters, isPreviewMode]);

  return (
    <div 
      ref={containerRef}
      style={{ touchAction: "none" }}
      className={`floor-plan-workspace flex-1 h-full min-h-0 bg-slate-100 outline-none relative overflow-hidden flex items-center justify-center ${
        isPreviewMode ? "border-none rounded-none" : "border border-slate-200 rounded-3xl"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {stageWidth > 0 && stageHeight > 0 && (
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          preventDefault={true}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={toolMode === "pan" || toolMode === "preview"}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={(e) => {
            if (toolMode === "preview" || toolMode === "pan") {
              const target = e.target;
              const stage = stageRef.current;
              if (target === stage || target.name() === "grid-bg" || target.name() === "blueprint-image" || target.id() === "blueprint-node") {
                onSelectId([], false);
              }
            } else if (toolMode === "constructor") {
              if (hoveredLineIdRef.current) return;
              if (!rulerHasDragged.current && !rulerWaitingSecondClick.current) {
                const target = e.target;
                const stage = stageRef.current;
                if (target === stage || target.name() === "grid-bg" || target.name() === "blueprint-image" || target.id() === "blueprint-node") {
                  setActiveMeasurement(null);
                  onSelectId([], false);
                }
              }
            }
          }}
          onTap={(e) => {
            if (toolMode === "preview" || toolMode === "pan") {
              const target = e.target;
              const stage = stageRef.current;
              if (target === stage || target.name() === "grid-bg" || target.name() === "blueprint-image" || target.id() === "blueprint-node") {
                onSelectId([], false);
              }
            } else if (toolMode === "constructor") {
              if (hoveredLineIdRef.current) return;
              if (!rulerHasDragged.current && !rulerWaitingSecondClick.current) {
                const target = e.target;
                const stage = stageRef.current;
                if (target === stage || target.name() === "grid-bg" || target.name() === "blueprint-image" || target.id() === "blueprint-node") {
                  setActiveMeasurement(null);
                  onSelectId([], false);
                }
              }
            }
          }}
          onDragStart={(e) => {
            if (e.target === stageRef.current) {
              zoomTargetRef.current = null; // Clear pending zoom state on drag start to prevent scaling jumps
              const touches = e.evt ? (e.evt.touches || []) : [];
              if (touches.length >= 2) {
                e.target.stopDrag();
                return;
              }
              if ((toolMode === "pan" || toolMode === "preview")) {
                stageRef.current.container().style.cursor = "grabbing";
              }
            }
          }}
          onDragMove={(e) => {
            if (e.target === stageRef.current) {
              const touches = e.evt ? (e.evt.touches || []) : [];
              if (touches.length >= 2) {
                e.target.stopDrag();
              }
            }
          }}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
              if (toolMode === "pan" || toolMode === "preview") {
                stageRef.current.container().style.cursor = "grab";
              }
            }
          }}
        >
          <Layer name="background-layer">
            {/* Static Locked Background Grid */}
            <Rect 
              x={0} 
              y={0} 
              width={canvasWidth} 
              height={canvasHeight} 
              fill="#ffffff" 
              name="grid-bg"
            />
            
            {/* Snap Grid Pattern */}
            {(() => {
              const shouldShowGrid = exportFilters ? exportFilters.showGrid : showGrid;
              if (shouldShowGrid && gridPatternImage) {
                return (
                  <Rect 
                    x={0} 
                    y={0} 
                    width={canvasWidth} 
                    height={canvasHeight} 
                    fillPatternImage={gridPatternImage}
                    fillPatternRepeat="repeat"
                    listening={false}
                  />
                );
              }
              return null;
            })()}

            {/* Locked Venue Blueprint Layer */}
            {bgImage && blueprintIsLocked && (
              <KonvaImage 
                id="blueprint-node"
                name="blueprint-image"
                image={bgImage} 
                x={Number.isFinite(blueprintX) ? blueprintX : 0} 
                y={Number.isFinite(blueprintY) ? blueprintY : 0} 
                width={Math.max(10, Number(blueprintWidth) || bgImage.naturalWidth || bgImage.width || 800)}
                height={Math.max(10, Number(blueprintHeight) || bgImage.naturalHeight || bgImage.height || 600)}
                rotation={Number.isFinite(blueprintRotation) ? blueprintRotation : 0}
                opacity={typeof blueprintOpacity === "number" ? blueprintOpacity : 0.8}
                listening={false}
              />
            )}
          </Layer>

          <Layer name="interactive-layer">
            {/* Unlocked Venue Blueprint Layer */}
            {bgImage && !blueprintIsLocked && (
              <KonvaImage 
                id="blueprint-node"
                name="blueprint-image"
                image={bgImage} 
                x={Number.isFinite(blueprintX) ? blueprintX : 0} 
                y={Number.isFinite(blueprintY) ? blueprintY : 0} 
                width={Math.max(10, Number(blueprintWidth) || bgImage.naturalWidth || bgImage.width || 800)}
                height={Math.max(10, Number(blueprintHeight) || bgImage.naturalHeight || bgImage.height || 600)}
                rotation={Number.isFinite(blueprintRotation) ? blueprintRotation : 0}
                opacity={typeof blueprintOpacity === "number" ? blueprintOpacity : 0.8}
                listening={toolMode === "select"}
                draggable={toolMode === "select"}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (justMarqueeDragged.current) return;
                  onSelectId("blueprint");
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  if (justMarqueeDragged.current) return;
                  onSelectId("blueprint");
                }}
                onDragStart={(e) => {
                  if (e.target.name() === "blueprint-image") {
                    handleDragStartElement(e, "blueprint");
                  }
                }}
                onDragMove={(e) => {
                  if (e.target.name() === "blueprint-image") {
                    handleDragMoveElement(e, "blueprint");
                  }
                }}
                onDragEnd={(e) => {
                  if (e.target.name() === "blueprint-image") {
                    handleDragEndElement(e, "blueprint");
                    e.target.scaleX(1);
                    e.target.scaleY(1);
                  }
                }}
              />
            )}

            {/* Render all custom geometry & decoration shapes */}
            {renderedElements}

            {/* Selectable Transformer handles */}
            {toolMode === "select" && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 10 || newBox.height < 10) return oldBox;
                  return newBox;
                }}
                onTransformEnd={handleTransformerEnd}
                keepRatio={isRatioLocked}
                resizeEnabled={!isResizeDisabled}
                enabledAnchors={
                  isResizeDisabled 
                    ? [] 
                    : (isRatioLocked ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : ['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'])
                }
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              />
            )}

            {/* Marquee outline drag overlay */}
            {marqueeStart && marqueeEnd && (
              <Rect
                x={Math.min(marqueeStart.x, marqueeEnd.x)}
                y={Math.min(marqueeStart.y, marqueeEnd.y)}
                width={Math.abs(marqueeStart.x - marqueeEnd.x)}
                height={Math.abs(marqueeStart.y - marqueeEnd.y)}
                fill="rgba(99, 102, 241, 0.08)"
                stroke="#6366f1"
                strokeWidth={1}
                dash={[3, 3]}
                listening={false}
              />
            )}
          </Layer>

          {/* Constructor Mode Overlays Layer */}
          {toolMode === "constructor" && !exportFilters && (
            <Layer name="constructor-overlay-layer">
              {/* 1. Closed Shape / Polygons with Automatic Surface Area */}
              {detectedPolygons.map((poly, pIdx) => {
                const flatPoints = poly.points.flatMap(pt => [pt.x, pt.y]);
                const effectiveScale = Math.max(0.2, Math.min(stageScale, 5));
                return (
                  <Group key={`closed-poly-${pIdx}`} listening={false}>
                    {/* Translucent Architectural Polygon Fill */}
                    <Line
                      points={flatPoints}
                      closed={true}
                      fill="rgba(99, 102, 241, 0.12)"
                      stroke="#6366f1"
                      strokeWidth={1.8 / effectiveScale}
                      dash={[6 / effectiveScale, 3 / effectiveScale]}
                      listening={false}
                    />
                    {/* Center Surface Area Badge */}
                    <PolygonAreaBadge
                      centroid={poly.centroid}
                      areaMeters={poly.areaMeters}
                      perimeterMeters={poly.perimeterMeters}
                      stageScale={stageScale}
                    />
                  </Group>
                );
              })}

              {/* Reference Element Halo in Constructor Mode */}
              {selectedConstructorElement && (
                <Group listening={false}>
                  <Rect
                    x={selectedConstructorElement.x - 4}
                    y={selectedConstructorElement.y - 4}
                    width={selectedConstructorElement.width + 8}
                    height={selectedConstructorElement.height + 8}
                    stroke="#4f46e5"
                    strokeWidth={2.5 / Math.max(0.2, Math.min(stageScale, 5))}
                    cornerRadius={6}
                    dash={[6 / Math.max(0.2, Math.min(stageScale, 5)), 3 / Math.max(0.2, Math.min(stageScale, 5))]}
                    fill="rgba(99, 102, 241, 0.08)"
                    listening={false}
                  />
                </Group>
              )}

              {/* 2. Dynamic Element-to-Element Distance Guides (shows distances to all other elements when an element is selected) */}
              {dynamicConstructorGuides.map((guide, idx) => (
                <DimensionLineOverlay
                  key={`guide-${idx}`}
                  x1={guide.x1}
                  y1={guide.y1}
                  x2={guide.x2}
                  y2={guide.y2}
                  distanceMeters={guide.distanceMeters}
                  stageScale={stageScale}
                  safetyClearance={safetyClearance}
                  isSafetyAlert={guide.isSafetyAlert}
                  isEqualSpacing={guide.isEqualSpacing}
                  isWall={guide.isWall}
                  isInteractive={false}
                  customColor={guide.customColor}
                />
              ))}

              {/* 3. Live In-Progress Ruler Line */}
              {isRulerDrawing && rulerLive.start && rulerLive.current && (
                <DimensionLineOverlay
                  x1={rulerLive.start.x}
                  y1={rulerLive.start.y}
                  x2={rulerLive.current.x}
                  y2={rulerLive.current.y}
                  distanceMeters={Math.hypot(rulerLive.current.x - rulerLive.start.x, rulerLive.current.y - rulerLive.start.y) / 20}
                  stageScale={stageScale}
                  safetyClearance={safetyClearance}
                  isSafetyAlert={false}
                  isEqualSpacing={false}
                  isLive={true}
                  showCoordinates={true}
                  isInteractive={false}
                />
              )}

              {/* 4. Committed Constructor Lines (Interactive: Hover to highlight & delete) */}
              {constructorLines.map((line) => (
                <DimensionLineOverlay
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  distanceMeters={line.distanceMeters}
                  stageScale={stageScale}
                  safetyClearance={safetyClearance}
                  isSafetyAlert={line.distanceMeters > 0 && line.distanceMeters < safetyClearance}
                  customColor={hoveredLineId === line.id ? "#f43f5e" : "#4f46e5"}
                  isInteractive={true}
                  isHovered={hoveredLineId === line.id}
                  onHover={(isHov) => setHoveredLineId(isHov ? line.id : null)}
                  onDelete={() => handleDeleteConstructorLine(line.id)}
                  showCoordinates={true}
                />
              ))}

              {/* 5. Magnetic Snap Target Marker */}
              {hoveredSnapPoint && (
                <SnapIndicator
                  x={hoveredSnapPoint.x}
                  y={hoveredSnapPoint.y}
                  type={hoveredSnapPoint.type}
                  stageScale={stageScale}
                />
              )}
            </Layer>
          )}
        </Stage>
      )}

      {/* Top Technical CAD HUD Banner for Constructor Mode (Light Mode) */}
      {toolMode === "constructor" && !exportFilters && (
        <div className="absolute top-4 right-4 z-30 flex flex-col pointer-events-auto select-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white/95 text-slate-800 rounded-2xl shadow-xl shadow-slate-200/70 backdrop-blur-md border border-slate-200/90 text-xs font-sans p-3 flex flex-col gap-2 min-w-[580px] max-w-[820px]">
            {/* Top row: Badges, Metrics, Status and Controls */}
            <div className="flex items-center justify-between gap-3">
              {/* Left group of top row: Constructor mode badge + scale + min aisle */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 bg-amber-50/90 border border-amber-250/90 text-amber-900 px-2.5 py-1 rounded-xl shadow-2xs whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-[11px] tracking-tight">
                    <Ruler size={13} className="text-amber-600" />
                    {t("floor.constructorModeActive", "Constructor Mode")}
                  </span>
                </div>

                <div className="w-px h-4 bg-slate-200"></div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 whitespace-nowrap">
                  <span className="text-slate-400 font-medium">Scale:</span>
                  <span className="font-mono font-bold text-slate-750">1 grid = {(gridSize / 20).toFixed(1)}m</span>
                  <span className="text-[10px] text-slate-400 font-mono">({gridSize}px)</span>
                </div>

                <div className="w-px h-4 bg-slate-200"></div>

                <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg text-[11px] whitespace-nowrap">
                  <span className="text-emerald-700/80 font-medium text-[10px] uppercase tracking-wider">Min Aisle</span>
                  <span className="font-bold text-emerald-700 font-mono">{safetyClearance.toFixed(2)}m</span>
                </div>
              </div>

              {/* Right group of top row: Action Buttons */}
              <div className="flex items-center gap-2">
                {constructorLines.length > 0 && (
                  <button
                    onClick={() => {
                      setConstructorLines([]);
                      setActiveMeasurement(null);
                      setHoveredLineId(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100/90 active:bg-rose-200 text-rose-700 hover:text-rose-800 border border-rose-200/90 rounded-xl text-[10px] font-bold transition cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Clear all drawn lines and surfaces"
                  >
                    <Trash2 size={11} className="text-rose-600" />
                    <span>Clear ({constructorLines.length})</span>
                  </button>
                )}

                <button
                  onClick={() => onToolModeChange("select")}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-[11px] font-bold transition cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Exit Constructor Mode (Esc)"
                >
                  <span>Done</span>
                  <kbd className="text-[9px] font-mono font-semibold bg-white border border-slate-300 text-slate-500 px-1 py-0.2 rounded shadow-2xs">Esc</kbd>
                </button>
              </div>
            </div>

            {/* Middle row: Live Dynamic Details (Reference Element, Lines, Surfaces) if any exist */}
            {(selectedConstructorElement || constructorLines.length > 0 || detectedPolygons.length > 0) && (
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 flex-wrap">
                {selectedConstructorElement && (
                  <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-xl text-indigo-900 text-[11px] shadow-2xs animate-fade-in">
                    <span className="text-indigo-600 font-medium">Selected Ref:</span>
                    <span className="font-extrabold text-indigo-900 truncate max-w-[180px]">
                      {selectedConstructorElement.label || selectedConstructorElement.name || selectedConstructorElement.boothNumber || selectedConstructorElement.id}
                    </span>
                    <span className="text-indigo-500 font-mono text-[10px]">
                      ({dynamicConstructorGuides.filter(g => !g.isWall).length} distances)
                    </span>
                    <button
                      onClick={() => onSelectId([], false)}
                      className="ml-1 p-0.5 text-indigo-400 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition cursor-pointer"
                      title="Deselect reference element"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}

                {constructorLines.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-xl text-slate-700 text-[11px]">
                    <span className="text-slate-500 font-medium">Lines:</span>
                    <span className="font-mono font-extrabold text-slate-800">{constructorLines.length}</span>
                  </div>
                )}

                {detectedPolygons.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-xl text-indigo-900 text-[11px] shadow-2xs animate-fade-in">
                    <Shapes size={12} className="text-indigo-600" />
                    <span className="text-indigo-600 font-medium">
                      {detectedPolygons.length === 1 ? "Surface:" : `${detectedPolygons.length} Surfaces:`}
                    </span>
                    <span className="font-mono font-extrabold text-indigo-700 text-xs">
                      {totalClosedSurfaceArea.toFixed(2)} m²
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom helper info row */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500/70"></span>
                Click any element to inspect clearances to all objects
              </span>
              <span className="flex items-center gap-2 text-slate-400">
                <span>Drag to measure / draw</span>
                <span>•</span>
                <span>Hover line to delete</span>
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Toolbar to toggle between Select, Move/Pan, and Constructor modes */}
      {toolMode !== "preview" && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl rounded-2xl p-1.5 flex gap-1.5 z-30">
          <button
            onClick={() => onToolModeChange("select")}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 gap-1.5 cursor-pointer ${
              toolMode === "select"
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-200"
                : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
            }`}
            title="Selection Tool (V)"
          >
            <MousePointer size={15} />
            <span className="text-[10px] font-bold">{t("floor.toolSelect", "Select (V)")}</span>
          </button>
          <button
            onClick={() => onToolModeChange("pan")}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 gap-1.5 cursor-pointer ${
              toolMode === "pan"
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-200"
                : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
            }`}
            title="Move / Pan Tool (M)"
          >
            <Hand size={15} />
            <span className="text-[10px] font-bold">{t("floor.toolMove", "Move (M)")}</span>
          </button>
          <button
            onClick={() => onToolModeChange(toolMode === "constructor" ? "select" : "constructor")}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 gap-1.5 cursor-pointer ${
              toolMode === "constructor"
                ? "bg-amber-500 text-white font-bold shadow-md shadow-amber-200"
                : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
            }`}
            title="Constructor & Ruler Mode (C / R)"
          >
            <Ruler size={15} className={toolMode === "constructor" ? "text-white" : "text-amber-600"} />
            <span className="text-[10px] font-bold">{t("floor.toolConstructor", "Constructor (C)")}</span>
          </button>
          <div className="w-px h-6 bg-slate-250 my-auto mx-0.5"></div>
          <button
            onClick={handleZoomToFit}
            className="p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 gap-1.5 cursor-pointer text-slate-650 hover:bg-slate-50 hover:text-slate-900"
            title="Fit Canvas to Screen"
          >
            <Maximize size={15} />
            <span className="text-[10px] font-bold">{t("floor.toolFitScreen", "Fit Screen")}</span>
          </button>
        </div>
      )}

      {editingTextId !== null && (() => {
        const editingElement = elements.find(el => el.id === editingTextId);
        if (!editingElement) return null;
        
        const x = editingElement.x * stageScale + stagePos.x;
        const y = editingElement.y * stageScale + stagePos.y;
        const width = editingElement.width * stageScale;
        const height = editingElement.height * stageScale;
        const rotation = editingElement.rotation || 0;
        
        const fontSize = (editingElement.fontSize || (editingElement.type.startsWith("booth") ? 16 : 20)) * stageScale;
        const fontFamily = editingElement.fontFamily || floorPlanFont || "Inter, sans-serif";
        const fontWeight = editingElement.fontStyle === "bold" || editingElement.type.startsWith("booth") ? "bold" : "normal";
        const textColor = editingElement.textColor || editingElement.color || "#1e293b";
        const textAlign = editingElement.align || "center";
        
        return (
          <textarea
            className="absolute z-50 border-2 border-indigo-500 shadow-xl rounded p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "top left",
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              fontWeight: fontWeight,
              color: textColor,
              textAlign: textAlign,
              resize: "none",
              boxSizing: "border-box",
            }}
            value={editingTextValue}
            autoFocus
            onChange={(e) => setEditingTextValue(e.target.value)}
            onBlur={saveTextEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveTextEdit();
              } else if (e.key === "Escape") {
                cancelTextEdit();
              }
            }}
          />
        );
      })()}
    </div>
  );
});
FloorPlanCanvas.displayName = "FloorPlanCanvas";

const arePropsEqual = (prevProps, nextProps) => {
  const shallowArrayEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  return (
    prevProps.elements === nextProps.elements &&
    shallowArrayEqual(prevProps.selectedIds, nextProps.selectedIds) &&
    prevProps.blueprintUrl === nextProps.blueprintUrl &&
    prevProps.blueprintOpacity === nextProps.blueprintOpacity &&
    prevProps.blueprintX === nextProps.blueprintX &&
    prevProps.blueprintY === nextProps.blueprintY &&
    prevProps.blueprintWidth === nextProps.blueprintWidth &&
    prevProps.blueprintHeight === nextProps.blueprintHeight &&
    prevProps.blueprintRotation === nextProps.blueprintRotation &&
    prevProps.blueprintIsLocked === nextProps.blueprintIsLocked &&
    prevProps.snapToGrid === nextProps.snapToGrid &&
    prevProps.showGrid === nextProps.showGrid &&
    prevProps.gridSize === nextProps.gridSize &&
    prevProps.previewDeviceMode === nextProps.previewDeviceMode &&
    prevProps.toolMode === nextProps.toolMode &&
    prevProps.floorPlanFont === nextProps.floorPlanFont &&
    prevProps.exhibitors === nextProps.exhibitors &&
    prevProps.attendees === nextProps.attendees &&
    prevProps.canvasWidth === nextProps.canvasWidth &&
    prevProps.canvasHeight === nextProps.canvasHeight &&
    prevProps.exportFilters === nextProps.exportFilters &&
    prevProps.previewSearchQuery === nextProps.previewSearchQuery &&
    prevProps.previewFilter === nextProps.previewFilter &&
    prevProps.selectedSeatId === nextProps.selectedSeatId &&
    prevProps.showDimensions === nextProps.showDimensions &&
    prevProps.isPreviewMode === nextProps.isPreviewMode &&
    prevProps.safetyClearance === nextProps.safetyClearance
  );
};

const MemoizedFloorPlanCanvas = React.memo(FloorPlanCanvas, arePropsEqual);
MemoizedFloorPlanCanvas.displayName = "FloorPlanCanvas";
export default MemoizedFloorPlanCanvas;
