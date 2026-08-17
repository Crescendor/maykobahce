import React from 'react';

/**
 * ReachingHands Component
 * Pure vector line art of elegant male (left) and female (right) hands & arms.
 * As the user scrolls into Paragraph 3, they glide in from the left and right edges
 * and meet / touch fingers gracefully above the paragraph text.
 * No photo backgrounds, 100% transparent, crisp white vector strokes.
 */
export default function ReachingHands({ scrollProgress = 0 }) {
  // Active window around Paragraph 3 (index 3.0, range 2.15 to 3.85)
  if (scrollProgress < 2.15 || scrollProgress > 3.85) {
    return null;
  }

  // Reach progress from 0.0 (far edges) to 1.0 (meeting in center)
  let reach = 0;
  let opacity = 1;

  if (scrollProgress <= 3.0) {
    reach = Math.min(Math.max((scrollProgress - 2.2) / 0.75, 0), 1);
    opacity = Math.min(reach * 1.5, 1);
  } else {
    reach = 1;
    // Fade out as scrolling towards paragraph 4
    opacity = Math.max(0, 1 - (scrollProgress - 3.1) / 0.65);
  }

  if (opacity <= 0.01) {
    return null;
  }

  // Smooth easing for natural movement
  const easeReach = Math.pow(reach, 1.2);

  // Position offsets:
  // Starts tucked off the screen edges and glides into the center
  const leftOffsetX = (1 - easeReach) * -380;
  const rightOffsetX = (1 - easeReach) * 380;
  const leftRot = (1 - easeReach) * -8;
  const rightRot = (1 - easeReach) * 8;

  // Gentle pulse / touch spark when fingers meet
  const touchGlow = Math.max(0, (reach - 0.8) / 0.2);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 35,
        overflow: 'hidden',
        opacity
      }}
    >
      {/* Upper Stage for Hands & Arms (Positioned gracefully above the center paragraph text) */}
      <div
        style={{
          position: 'absolute',
          top: '16%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          maxWidth: 1200,
          height: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Subtle luminous spark at the exact point of touch */}
        {touchGlow > 0.02 && (
          <div
            style={{
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 70%)',
              opacity: touchGlow,
              filter: 'blur(10px)',
              transform: 'scale(1.2)',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* ========================================================
            LEFT HAND & ARM (Male Line-Art - Reaching from Left)
        ======================================================== */}
        <div
          style={{
            position: 'absolute',
            right: '50%',
            width: '48vw',
            maxWidth: 620,
            height: 260,
            transform: `translateX(${leftOffsetX + 55}px) rotate(${leftRot}deg)`,
            transformOrigin: '0% 50%',
            willChange: 'transform',
            filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 15px rgba(220, 235, 255, 0.25))'
          }}
        >
          <svg
            viewBox="0 0 600 240"
            fill="none"
            style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          >
            <defs>
              {/* Fade out arm stroke at the far left edge */}
              <linearGradient id="maleArmStroke" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Arm & Hand Outer Contour */}
            <path
              d="M -50 75 
                 C 100 78, 220 85, 310 92 
                 C 345 95, 380 82, 420 72 
                 C 455 62, 485 58, 515 62 
                 C 532 64, 546 72, 542 80 
                 C 534 86, 515 88, 495 86 
                 C 515 90, 545 95, 558 104 
                 C 564 109, 560 116, 548 120 
                 C 532 125, 505 124, 480 120 
                 C 498 127, 528 137, 538 145 
                 C 542 149, 538 156, 525 158 
                 C 502 161, 475 152, 448 142 
                 C 418 154, 388 164, 348 158 
                 C 258 148, 120 145, -50 145"
              stroke="url(#maleArmStroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner Details / Knuckles / Wrist Tendons */}
            {/* Index Finger Knuckle & Tendon */}
            <path
              d="M 370 98 C 400 95, 435 92, 470 90"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Middle Finger Knuckle Line */}
            <path
              d="M 385 118 C 415 120, 445 118, 480 114"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {/* Palm Crease & Muscle Line */}
            <path
              d="M 345 115 C 365 130, 395 138, 425 132"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            {/* Thumb Contour */}
            <path
              d="M 340 102 C 370 88, 405 76, 445 80"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Forearm Muscle Definition */}
            <path
              d="M 120 108 C 170 112, 230 116, 280 120"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ========================================================
            RIGHT HAND & ARM (Female Line-Art - Reaching from Right)
        ======================================================== */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            width: '48vw',
            maxWidth: 620,
            height: 260,
            transform: `translateX(${rightOffsetX - 55}px) rotate(${rightRot}deg)`,
            transformOrigin: '100% 50%',
            willChange: 'transform',
            filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 15px rgba(220, 235, 255, 0.25))'
          }}
        >
          <svg
            viewBox="0 0 600 240"
            fill="none"
            style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          >
            <defs>
              {/* Fade out arm stroke at the far right edge */}
              <linearGradient id="femaleArmStroke" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Slender Feminine Arm & Hand Outer Contour */}
            <path
              d="M 650 78 
                 C 500 78, 380 84, 290 92 
                 C 255 95, 220 82, 180 72 
                 C 145 62, 115 58, 85 62 
                 C 68 64, 54 72, 58 80 
                 C 66 86, 85 88, 105 86 
                 C 85 90, 55 95, 42 104 
                 C 36 109, 40 116, 52 120 
                 C 68 125, 95 124, 120 120 
                 C 102 127, 72 137, 62 145 
                 C 58 149, 62 156, 75 158 
                 C 98 161, 125 152, 152 142 
                 C 182 154, 212 164, 252 158 
                 C 342 148, 480 145, 650 145"
              stroke="url(#femaleArmStroke)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Delicate Feminine Knuckles & Tendons */}
            {/* Index Finger Line */}
            <path
              d="M 230 98 C 200 95, 165 92, 130 90"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {/* Middle Finger Line */}
            <path
              d="M 215 118 C 185 120, 155 118, 120 114"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            {/* Palm Soft Curve */}
            <path
              d="M 255 115 C 235 130, 205 138, 175 132"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Graceful Thumb Contour */}
            <path
              d="M 260 102 C 230 88, 195 76, 155 80"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Slender Forearm Line */}
            <path
              d="M 480 108 C 430 112, 370 116, 320 120"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
