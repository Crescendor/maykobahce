import React, { useRef, useEffect, useState } from 'react';

/**
 * FountainPenWriter Component
 * Renders Paragraph 5 in Google Font 'Oooh Baby' with real-time fountain pen script writing.
 * As the user scrolls with the mouse wheel, a hand holding a fountain pen moves across
 * and writes the text character-by-character.
 * 100% scrubbable backward & forward with mouse wheel.
 */
export default function FountainPenWriter({
  text = 'sen neredesin, nasılsın bilmiyorum ama ben hâlâ kaldığım o son cümlede, seni içimde taşımaya devam ediyorum.',
  scrollProgress = 0
}) {
  const containerRef = useRef(null);
  const cursorRef = useRef(null);
  const [penPos, setPenPos] = useState({ x: 0, y: 0, visible: false });

  // Paragraph 5 active writing range (between 4.2 and 5.0)
  const writeProgress = Math.min(Math.max((scrollProgress - 4.22) / 0.75, 0), 1);

  // Character slice calculation
  const charCount = Math.floor(writeProgress * text.length);
  const visibleText = text.slice(0, charCount);
  const hiddenText = text.slice(charCount);

  // Update live pen nib tip position to follow the writing cursor
  useEffect(() => {
    if (!cursorRef.current || !containerRef.current || writeProgress <= 0.01) {
      setPenPos((prev) => ({ ...prev, visible: false }));
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const cursorRect = cursorRef.current.getBoundingClientRect();

    const x = cursorRect.left - containerRect.left;
    const y = cursorRect.top - containerRect.top + cursorRect.height * 0.85;

    setPenPos({ x, y, visible: true });
  }, [charCount, writeProgress]);

  // Overall section opacity as approaching stage 5
  const sectionOpacity = Math.min(Math.max((scrollProgress - 4.15) / 0.4, 0), 1);

  // Pen lift angle when writing is fully complete
  const isFinished = writeProgress >= 0.99;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 760,
        margin: '0 auto',
        padding: '20px 10px',
        opacity: sectionOpacity
      }}
    >
      {/* Cursive Handwritten Text (Oooh Baby) */}
      <p
        style={{
          fontFamily: "'Oooh Baby', cursive, sans-serif",
          fontSize: 'clamp(1.75rem, 3.4vw, 2.35rem)',
          fontWeight: 400,
          fontStyle: 'normal',
          color: '#f3f4f8',
          textAlign: 'left',
          lineHeight: 1.95,
          letterSpacing: '0.025em',
          margin: 0,
          padding: 0,
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          userSelect: 'none',
          wordBreak: 'break-word'
        }}
      >
        <span>{visibleText}</span>
        {/* Dynamic Cursor anchor where pen nib touches */}
        <span
          ref={cursorRef}
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            verticalAlign: 'middle',
            visibility: 'hidden'
          }}
        />
        <span style={{ opacity: 0 }}>{hiddenText}</span>
      </p>

      {/* Hand Holding Vintage Fountain Pen (Dolma Kalem) */}
      {penPos.visible && (
        <div
          style={{
            position: 'absolute',
            left: penPos.x,
            top: penPos.y,
            transform: `translate(-14px, -170px) rotate(${isFinished ? -8 : 0}deg)`,
            transformOrigin: '14px 170px',
            transition: 'transform 0.15s ease-out',
            pointerEvents: 'none',
            zIndex: 60,
            willChange: 'left, top, transform',
            filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8)) drop-shadow(0 4px 14px rgba(0, 0, 0, 0.7))'
          }}
        >
          <svg
            width="220"
            height="210"
            viewBox="0 0 220 210"
            fill="none"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="penBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="nibGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#ffd8a8" />
                <stop offset="100%" stopColor="#f59f00" />
              </linearGradient>
            </defs>

            {/* ========================================================
                1. FOUNTAIN PEN NIB & BARREL (Dolma Kalem)
                Nib Tip touches exactly at coordinate (14, 170)
            ======================================================== */}
            {/* Fine Fountain Pen Nib (Metal Uç) */}
            <path
              d="M 14 170 L 10 152 L 8 138 L 20 138 L 18 152 Z"
              fill="url(#nibGold)"
              stroke="#ffffff"
              strokeWidth="1.4"
            />
            {/* Nib Slit & Breathing Hole */}
            <line x1="14" y1="170" x2="14" y2="145" stroke="#1e293b" strokeWidth="0.9" />
            <circle cx="14" cy="145" r="1.4" fill="#1e293b" />

            {/* Pen Grip Section */}
            <path
              d="M 8 138 L 5 110 L 23 110 L 20 138 Z"
              fill="#334155"
              stroke="#ffffff"
              strokeWidth="1.3"
            />
            {/* Pen Gold Ring Accent */}
            <rect x="5" y="107" width="18" height="3" fill="url(#nibGold)" stroke="#ffffff" strokeWidth="0.8" />

            {/* Pen Slender Barrel Body */}
            <path
              d="M 5 107 L 20 20 L 36 20 L 23 107 Z"
              fill="url(#penBodyGrad)"
              stroke="#ffffff"
              strokeWidth="1.4"
            />
            {/* Pen End Finial */}
            <path d="M 20 20 C 22 14, 34 14, 36 20 Z" fill="url(#nibGold)" stroke="#ffffff" strokeWidth="1.1" />

            {/* ========================================================
                2. HAND HOLDING THE PEN (Elegantly gripping barrel)
            ======================================================== */}
            {/* Index Finger (Resting on top/side of grip) */}
            <path
              d="M 16 116 
                 C 25 112, 38 108, 52 108 
                 C 68 108, 85 118, 102 125 
                 C 118 132, 138 135, 155 130"
              stroke="#ffffff"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            {/* Index Finger Knuckle & Nail */}
            <path
              d="M 18 116 C 22 110, 32 110, 35 115"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 68 114 C 74 122, 82 124, 90 120"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Thumb (Supporting the underside of the grip) */}
            <path
              d="M 4 124 
                 C -2 128, -6 136, -4 144 
                 C 0 152, 10 158, 24 158 
                 C 40 158, 58 152, 75 146"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Thumb Nail Detail */}
            <path
              d="M -3 135 C -5 140, -2 145, 3 146"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            {/* Middle Finger (Supporting the pen underneath) */}
            <path
              d="M 22 136 
                 C 32 135, 45 138, 58 144 
                 C 74 150, 92 155, 110 152 
                 C 126 150, 142 142, 158 138"
              stroke="#ffffff"
              strokeWidth="2.0"
              strokeLinecap="round"
            />

            {/* Ring & Pinky Fingers Gently Curled */}
            <path
              d="M 75 146 C 88 155, 105 162, 122 160 C 138 158, 152 150, 166 145"
              stroke="#ffffff"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M 110 162 C 122 170, 138 172, 150 168 C 162 164, 172 156, 182 152"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Back of Hand & Wrist Contour Extending to Right */}
            <path
              d="M 155 130 C 172 125, 192 124, 212 126"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M 182 152 C 196 148, 208 144, 218 142"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Wrist Tendon Accent */}
            <path
              d="M 160 138 C 175 135, 190 134, 205 135"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
