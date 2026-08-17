import React from 'react';

/**
 * ScreenCracks Component
 * Renders dynamic, glowing white glass fractures originating from screen corners/edges.
 * Controlled 100% by mouse wheel scrollProgress around Paragraph 2 ("cam kırıkları...").
 * Grows/extends forward on scroll down, shrinks/rewinds backward on scroll up.
 */
export default function ScreenCracks({ scrollProgress = 0 }) {
  // Active window around Paragraph 2 (index 2.0, range 1.15 to 2.85)
  if (scrollProgress < 1.15 || scrollProgress > 2.85) {
    return null;
  }

  // Growth phase (1.2 -> 2.0): cracks crawl outward and expand from 0 to 1
  // Hold & Fade phase (2.0 -> 2.8): cracks stay fully grown and fade out gently
  let growth = 0;
  let opacity = 1;

  if (scrollProgress <= 2.0) {
    growth = Math.min(Math.max((scrollProgress - 1.2) / 0.75, 0), 1);
    opacity = Math.min(growth * 1.4, 1);
  } else {
    growth = 1;
    // Fade out as moving towards paragraph 3
    opacity = Math.max(0, 1 - (scrollProgress - 2.1) / 0.7);
  }

  if (growth <= 0.01 || opacity <= 0.01) {
    return null;
  }

  // Dashoffset calculation: 100 is fully hidden, 0 is fully drawn
  const dashOffset = (1 - growth) * 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 40,
        overflow: 'hidden',
        opacity
      }}
    >
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 14px rgba(210, 235, 255, 0.45))'
        }}
      >
        <defs>
          <linearGradient id="crackGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#f0f4f8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d9e2ec" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* ========================================================
            1. TOP-LEFT CORNER CRACK NETWORK
        ======================================================== */}
        <g stroke="url(#crackGlow)" strokeLinecap="round" strokeLinejoin="miter" fill="none">
          {/* Main Stem */}
          <path
            d="M 0 0 L 85 95 L 140 120 L 220 210 L 310 260 L 420 380 L 510 420 L 630 520"
            strokeWidth="2.4"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
          />
          {/* Sub Fork A */}
          <path
            d="M 140 120 L 195 90 L 290 110 L 380 95 L 480 135"
            strokeWidth="1.6"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.25)}
            opacity="0.88"
          />
          {/* Sub Fork B */}
          <path
            d="M 310 260 L 360 210 L 480 230 L 560 190"
            strokeWidth="1.4"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.35)}
            opacity="0.82"
          />
          {/* Sub Fork C */}
          <path
            d="M 420 380 L 400 470 L 470 560 L 440 650"
            strokeWidth="1.3"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.45)}
            opacity="0.75"
          />
          {/* Hairline Fracture */}
          <path
            d="M 220 210 L 250 290 L 230 360"
            strokeWidth="0.9"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.55)}
            opacity="0.65"
          />
        </g>

        {/* ========================================================
            2. BOTTOM-LEFT CORNER CRACK NETWORK
        ======================================================== */}
        <g stroke="url(#crackGlow)" strokeLinecap="round" strokeLinejoin="miter" fill="none">
          {/* Main Stem */}
          <path
            d="M 0 1080 L 90 990 L 170 940 L 240 850 L 360 810 L 460 700 L 590 650"
            strokeWidth="2.3"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
          />
          {/* Sub Fork A */}
          <path
            d="M 170 940 L 260 970 L 350 960 L 440 1015"
            strokeWidth="1.5"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.2)}
            opacity="0.85"
          />
          {/* Sub Fork B */}
          <path
            d="M 360 810 L 390 890 L 500 920 L 580 960"
            strokeWidth="1.3"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.35)}
            opacity="0.8"
          />
          {/* Sub Fork C */}
          <path
            d="M 460 700 L 430 610 L 500 530"
            strokeWidth="1.2"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.4)}
            opacity="0.72"
          />
        </g>

        {/* ========================================================
            3. TOP-RIGHT CORNER CRACK NETWORK
        ======================================================== */}
        <g stroke="url(#crackGlow)" strokeLinecap="round" strokeLinejoin="miter" fill="none">
          {/* Main Stem */}
          <path
            d="M 1920 0 L 1830 105 L 1755 140 L 1660 235 L 1550 285 L 1430 405 L 1310 460"
            strokeWidth="2.4"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
          />
          {/* Sub Fork A */}
          <path
            d="M 1755 140 L 1685 110 L 1585 120 L 1490 75"
            strokeWidth="1.5"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.22)}
            opacity="0.85"
          />
          {/* Sub Fork B */}
          <path
            d="M 1550 285 L 1500 230 L 1390 240 L 1310 200"
            strokeWidth="1.3"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.38)}
            opacity="0.8"
          />
          {/* Sub Fork C */}
          <path
            d="M 1430 405 L 1455 505 L 1380 600"
            strokeWidth="1.3"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.42)}
            opacity="0.75"
          />
        </g>

        {/* ========================================================
            4. BOTTOM-RIGHT CORNER CRACK NETWORK
        ======================================================== */}
        <g stroke="url(#crackGlow)" strokeLinecap="round" strokeLinejoin="miter" fill="none">
          {/* Main Stem */}
          <path
            d="M 1920 1080 L 1825 975 L 1740 925 L 1645 815 L 1515 775 L 1400 655 L 1280 610"
            strokeWidth="2.3"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
          />
          {/* Sub Fork A */}
          <path
            d="M 1740 925 L 1655 960 L 1565 945 L 1470 1000"
            strokeWidth="1.5"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.25)}
            opacity="0.85"
          />
          {/* Sub Fork B */}
          <path
            d="M 1515 775 L 1490 870 L 1395 915"
            strokeWidth="1.3"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.35)}
            opacity="0.78"
          />
          {/* Sub Fork C */}
          <path
            d="M 1400 655 L 1370 560 L 1440 480"
            strokeWidth="1.2"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.45)}
            opacity="0.72"
          />
        </g>

        {/* ========================================================
            5. MID-LEFT EDGE CRACK NETWORK
        ======================================================== */}
        <g stroke="url(#crackGlow)" strokeLinecap="round" strokeLinejoin="miter" fill="none">
          <path
            d="M 0 520 L 75 540 L 160 485 L 245 530 L 355 475 L 460 510 L 560 460"
            strokeWidth="1.8"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
            opacity="0.9"
          />
          <path
            d="M 160 485 L 205 405 L 290 375"
            strokeWidth="1.2"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.3)}
            opacity="0.75"
          />
          <path
            d="M 355 475 L 390 560 L 480 585"
            strokeWidth="1.1"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.4)}
            opacity="0.7"
          />
        </g>

        {/* ========================================================
            6. MID-RIGHT EDGE CRACK NETWORK
        ======================================================== */}
        <g stroke="url(#crackGlow)" strokeLinecap="round" strokeLinejoin="miter" fill="none">
          <path
            d="M 1920 550 L 1835 525 L 1750 575 L 1655 530 L 1545 575 L 1440 530 L 1340 580"
            strokeWidth="1.8"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
            opacity="0.9"
          />
          <path
            d="M 1750 575 L 1710 660 L 1620 690"
            strokeWidth="1.2"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.3)}
            opacity="0.75"
          />
          <path
            d="M 1545 575 L 1515 485 L 1420 460"
            strokeWidth="1.1"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={Math.min(100, dashOffset * 1.4)}
            opacity="0.7"
          />
        </g>

        {/* Shimmering glass shards at key junction vertices */}
        <polygon
          points="85,95 95,90 90,105"
          fill="rgba(255,255,255,0.75)"
          opacity={growth > 0.3 ? 0.8 : 0}
        />
        <polygon
          points="220,210 235,200 228,220"
          fill="rgba(255,255,255,0.85)"
          opacity={growth > 0.5 ? 0.9 : 0}
        />
        <polygon
          points="1830,105 1820,95 1825,115"
          fill="rgba(255,255,255,0.75)"
          opacity={growth > 0.3 ? 0.8 : 0}
        />
        <polygon
          points="1660,235 1645,225 1650,245"
          fill="rgba(255,255,255,0.85)"
          opacity={growth > 0.5 ? 0.9 : 0}
        />
        <polygon
          points="240,850 255,840 248,860"
          fill="rgba(255,255,255,0.85)"
          opacity={growth > 0.4 ? 0.85 : 0}
        />
        <polygon
          points="1645,815 1630,805 1635,825"
          fill="rgba(255,255,255,0.85)"
          opacity={growth > 0.4 ? 0.85 : 0}
        />
      </svg>
    </div>
  );
}
