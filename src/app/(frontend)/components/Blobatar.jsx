"use client";

import { useMemo, useState, useEffect, useRef, useSyncExternalStore } from "react";

// R-03 / H-03: Before — palettes, shapes, hash logic, and eye variants were mixed inside Blobatar.jsx.
// After — PALETTES, BLOB_SHAPES, EYE_VARIANTS_COUNT, and hashString are imported from the constants module created for this purpose.

import {
  PALETTES,
  BLOB_SHAPES,
  EYE_VARIANTS_COUNT,
  hashString,
} from "../constants/blobatar.constants";

export default function Blobatar({
  seed = "racoode-guest",
  size = 48,
  interactive = false,
  onClick,
  className = "",
}) {
  const svgRef = useRef(null);
  const [blink, setBlink] = useState(false);
  const [squish, setSquish] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const activeSeed = mounted ? String(seed || "racoode") : "racoode";

  const avatar = useMemo(() => {
    const h = hashString(activeSeed);
    const palette = PALETTES[h % PALETTES.length];
    const shapeObj = BLOB_SHAPES[(h >>> 4) % BLOB_SHAPES.length] || BLOB_SHAPES[0];
    const eyeStyle = (h >>> 8) % EYE_VARIANTS_COUNT;
    const tilt = ((h >>> 12) % 13) - 6;

    return {
      palette,
      shape: shapeObj.d,
      eyeY: shapeObj.eyeY,
      eyeStyle,
      tilt,
    };
  }, [activeSeed]);

  useEffect(() => {
    let timeoutId;
    const scheduleBlink = () => {
      const nextDelay = 2400 + Math.random() * 3400;
      timeoutId = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        scheduleBlink();
      }, nextDelay);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.min(2.8, Math.hypot(dx, dy) / 35);

      setPupilOffset({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  const handleClick = (e) => {
    setSquish(true);
    setTimeout(() => setSquish(false), 260);
    if (onClick) onClick(e);
  };

  const { palette, shape, eyeY, eyeStyle, tilt } = avatar;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={handleClick}
      style={{
        transform: squish
          ? `rotate(${tilt}deg) scale(1.14, 0.86)`
          : `rotate(${tilt}deg) scale(1, 1)`,
        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      className={`shrink-0 select-none ${
        interactive || onClick ? "cursor-pointer hover:scale-105" : ""
      } ${className}`}
      aria-label={`Avatar de ${activeSeed}`}
    >
      <path
        d={shape}
        fill={palette.bg}
        stroke={palette.stroke}
        strokeOpacity="0.25"
        strokeWidth="2"
      />

      <g transform={`translate(0, ${eyeY})`}>
        {blink ? (
          <g stroke={palette.eye} strokeWidth="4.2" strokeLinecap="round">
            <line x1="34" y1="52" x2="43" y2="52" />
            <line x1="57" y1="52" x2="66" y2="52" />
          </g>
        ) : (
          <g
            stroke={palette.eye}
            fill={palette.eye}
            strokeLinecap="round"
            style={{
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transition: "transform 0.08s ease-out",
            }}
          >
            {eyeStyle === 0 && (
              <g strokeWidth="5.4" fill="none">
                <line x1="39" y1="45" x2="39" y2="58" />
                <line x1="61" y1="45" x2="61" y2="58" />
              </g>
            )}
            {eyeStyle === 1 && (
              <g strokeWidth="4.8" fill="none">
                <line x1="35" y1="48" x2="43" y2="54" />
                <line x1="65" y1="48" x2="57" y2="54" />
              </g>
            )}
            {eyeStyle === 2 && (
              <g strokeWidth="5.2" fill="none">
                <line x1="39" y1="45" x2="39" y2="57" />
                <line x1="56" y1="52" x2="65" y2="52" />
              </g>
            )}
            {eyeStyle === 3 && (
              <g stroke="none">
                <circle cx="38" cy="52" r="3.8" />
                <circle cx="62" cy="52" r="3.8" />
              </g>
            )}
            {eyeStyle === 4 && (
              <g strokeWidth="5" fill="none">
                <line x1="41" y1="45" x2="36" y2="58" />
                <line x1="59" y1="45" x2="64" y2="58" />
              </g>
            )}
            {eyeStyle === 5 && (
              <g strokeWidth="5" fill="none">
                <line x1="34" y1="52" x2="43" y2="52" />
                <line x1="57" y1="52" x2="66" y2="52" />
              </g>
            )}
            {eyeStyle === 6 && (
              <g stroke="none">
                <ellipse cx="38" cy="51" rx="4.4" ry="6.2" />
                <circle cx="61" cy="52" r="3.6" />
              </g>
            )}
          </g>
        )}
      </g>
    </svg>
  );
}