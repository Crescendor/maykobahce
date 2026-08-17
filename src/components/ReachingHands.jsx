import React from 'react';

/**
 * ReachingHands Component
 * High-detail classical anatomical vector line-art based directly on the Creation of Adam reference.
 * - Left Arm & Hand (Reaching upward-right, 5 distinct fingers, open receptive palm).
 * - Right Arm & Hand (Reaching downward-left, 5 distinct fingers, graceful bent wrist).
 * - 100% vector SVG, zero raster artifacts, pure white glowing strokes.
 * - Moves dynamically with mouse wheel scrollProgress during Paragraph 3.
 */
export default function ReachingHands({ scrollProgress = 0 }) {
  // Active window around Paragraph 3 (index 3.0, range 2.15 to 3.85)
  if (scrollProgress < 2.15 || scrollProgress > 3.85) {
    return null;
  }

  // Reach progress from 0.0 (far apart) to 1.0 (fingertips meeting in center)
  let reach = 0;
  let opacity = 1;

  if (scrollProgress <= 3.0) {
    reach = Math.min(Math.max((scrollProgress - 2.2) / 0.75, 0), 1);
    opacity = Math.min(reach * 1.5, 1);
  } else {
    reach = 1;
    // Fade out gently as scrolling into paragraph 4
    opacity = Math.max(0, 1 - (scrollProgress - 3.1) / 0.65);
  }

  if (opacity <= 0.01) {
    return null;
  }

  // Smooth easing
  const easeReach = Math.pow(reach, 1.15);

  // Position offsets:
  // Left arm glides in from bottom-left; Right arm glides in from top-right
  const leftX = (1 - easeReach) * -340;
  const leftY = (1 - easeReach) * 90;
  const rightX = (1 - easeReach) * 340;
  const rightY = (1 - easeReach) * -90;

  // Touch glow intensity when fingertips meet at center
  const touchGlow = Math.max(0, (reach - 0.75) / 0.25);

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
      {/* Upper Canvas for Reaching Hands (Positioned in upper portion above paragraph text) */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          maxWidth: 1280,
          height: 380,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Subtle ethereal spark at fingertip connection */}
        {touchGlow > 0.02 && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '52%',
              transform: 'translate(-50%, -50%)',
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.45) 0%, rgba(220, 235, 255, 0.12) 40%, transparent 70%)',
              opacity: touchGlow,
              filter: 'blur(12px)',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* ========================================================
            LEFT ARM & HAND (Creation of Adam - Left Upward Reach)
            Features full 5 fingers: Thumb up, Index, Middle, Ring, Pinky
        ======================================================== */}
        <div
          style={{
            position: 'absolute',
            right: '50%',
            bottom: '10%',
            width: '52vw',
            maxWidth: 680,
            height: 300,
            transform: `translate(${leftX + 45}px, ${leftY}px)`,
            willChange: 'transform',
            filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.75)) drop-shadow(0 0 16px rgba(210, 235, 255, 0.3))'
          }}
        >
          <svg
            viewBox="0 0 680 300"
            fill="none"
            style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="leftArmFade" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="20%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Forearm Contours */}
            <path
              d="M -60 250 C 40 245, 140 238, 230 225 C 275 218, 320 205, 360 188"
              stroke="url(#leftArmFade)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M -60 195 C 40 190, 140 182, 230 168 C 268 162, 305 150, 335 132"
              stroke="url(#leftArmFade)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Forearm Muscle & Tendon Lines */}
            <path
              d="M 120 215 C 180 208, 245 198, 305 185"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 180 185 C 230 178, 280 168, 330 152"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            {/* Wrist & Palm Contours */}
            <path
              d="M 360 188 C 390 178, 420 165, 450 152"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M 335 132 C 352 118, 370 98, 385 75"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* 1. THUMB (Reaching upward) */}
            <path
              d="M 385 75 C 392 58, 400 40, 410 25 C 414 18, 420 16, 426 22 C 430 28, 428 42, 425 58 C 420 80, 425 102, 442 120"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Thumb Nail & Joint Details */}
            <path
              d="M 412 24 C 416 20, 422 20, 424 25 C 425 30, 420 34, 415 32"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 395 55 C 402 52, 412 50, 420 54"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* 2. INDEX FINGER (Reaching furthest forward to right) */}
            <path
              d="M 442 120 C 475 110, 520 95, 570 80 C 585 76, 595 76, 598 84 C 600 90, 590 98, 575 104 C 530 120, 485 132, 445 142"
              stroke="#ffffff"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Index Fingernail & Knuckle Creases */}
            <path
              d="M 588 78 C 592 78, 596 82, 594 86 C 590 89, 584 88, 582 84"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 495 105 C 500 102, 508 100, 515 104"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M 545 92 C 550 89, 556 88, 562 91"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* 3. MIDDLE FINGER */}
            <path
              d="M 458 138 C 495 128, 540 115, 585 102 C 595 99, 602 102, 602 108 C 602 114, 592 120, 578 125 C 535 140, 490 150, 452 158"
              stroke="#ffffff"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Middle Nail & Knuckles */}
            <path
              d="M 592 101 C 596 102, 599 105, 597 109 C 594 112, 588 111, 586 107"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 510 122 C 516 119, 524 118, 530 121"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* 4. RING FINGER */}
            <path
              d="M 452 158 C 485 150, 525 138, 565 128 C 574 125, 580 128, 578 134 C 576 139, 568 144, 555 148 C 518 160, 480 168, 446 174"
              stroke="#ffffff"
              strokeWidth="2.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Ring Nail & Knuckles */}
            <path
              d="M 570 127 C 574 128, 576 131, 574 135 C 570 137, 565 136, 564 132"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M 505 145 C 510 142, 516 141, 522 144"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            {/* 5. PINKY FINGER */}
            <path
              d="M 446 174 C 472 168, 502 160, 532 152 C 540 150, 545 153, 544 158 C 542 162, 535 166, 525 170 C 495 180, 460 186, 428 188"
              stroke="#ffffff"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pinky Nail */}
            <path
              d="M 536 151 C 540 152, 542 155, 540 158 C 536 160, 532 159, 531 156"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="1.0"
              strokeLinecap="round"
            />

            {/* Palm & Wrist Creases */}
            <path
              d="M 375 168 C 400 158, 425 148, 448 135"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M 390 142 C 410 135, 430 128, 450 118"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M 348 182 C 358 168, 368 152, 375 138"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ========================================================
            RIGHT ARM & HAND (Creation of Adam - Right Downward Reach)
            Features full 5 fingers: Index reaching down, Middle, Ring, Pinky, Thumb
        ======================================================== */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '5%',
            width: '52vw',
            maxWidth: 680,
            height: 300,
            transform: `translate(${rightX - 45}px, ${rightY}px)`,
            willChange: 'transform',
            filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.75)) drop-shadow(0 0 16px rgba(210, 235, 255, 0.3))'
          }}
        >
          <svg
            viewBox="0 0 680 300"
            fill="none"
            style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="rightArmFade" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="20%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Forearm Upper & Lower Contours */}
            <path
              d="M 740 25 C 640 45, 540 75, 450 115 C 405 135, 365 160, 325 192"
              stroke="url(#rightArmFade)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M 740 85 C 640 105, 550 132, 470 168 C 430 185, 395 205, 365 230"
              stroke="url(#rightArmFade)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Forearm Muscle & Tendon Lines */}
            <path
              d="M 560 88 C 500 112, 440 140, 385 172"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 500 120 C 450 142, 400 168, 355 198"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            {/* Wrist Flexion Curve */}
            <path
              d="M 325 192 C 300 212, 275 232, 245 250"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M 365 230 C 342 245, 315 258, 285 268"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* 1. INDEX FINGER (Reaching down & forward toward left index) */}
            <path
              d="M 245 250 C 210 268, 160 288, 105 300 C 90 304, 82 298, 85 290 C 88 284, 102 278, 120 270 C 170 250, 215 232, 255 215"
              stroke="#ffffff"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Index Nail & Knuckle Lines */}
            <path
              d="M 92 298 C 88 297, 86 293, 89 289 C 94 286, 100 288, 102 292"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 175 262 C 170 265, 162 268, 155 265"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M 130 278 C 124 281, 118 283, 112 280"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* 2. MIDDLE FINGER */}
            <path
              d="M 235 258 C 195 275, 145 295, 95 308 C 85 311, 78 306, 80 299 C 82 294, 95 288, 112 280 C 160 260, 205 240, 245 224"
              stroke="#ffffff"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Middle Nail & Knuckles */}
            <path
              d="M 88 307 C 84 306, 82 302, 85 298 C 90 295, 96 297, 98 301"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 160 278 C 154 281, 146 283, 140 280"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* 3. RING FINGER */}
            <path
              d="M 245 265 C 210 282, 165 300, 120 312 C 110 315, 104 311, 106 305 C 108 300, 118 295, 132 288 C 172 270, 212 252, 250 236"
              stroke="#ffffff"
              strokeWidth="2.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Ring Nail */}
            <path
              d="M 112 312 C 108 311, 106 307, 109 303 C 114 301, 119 303, 121 306"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M 170 290 C 165 293, 158 295, 152 292"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            {/* 4. PINKY FINGER */}
            <path
              d="M 255 272 C 225 288, 190 302, 155 314 C 146 317, 140 314, 142 308 C 144 303, 152 298, 164 292 C 198 278, 230 262, 260 248"
              stroke="#ffffff"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pinky Nail */}
            <path
              d="M 148 314 C 144 313, 142 309, 145 306 C 149 304, 154 306, 156 309"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="1.0"
              strokeLinecap="round"
            />

            {/* 5. THUMB (Curling gently from above) */}
            <path
              d="M 315 195 C 295 208, 268 218, 240 224 C 230 226, 222 220, 225 212 C 228 206, 240 200, 258 194 C 285 184, 305 174, 325 162"
              stroke="#ffffff"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Thumb Nail & Knuckles */}
            <path
              d="M 230 223 C 226 222, 224 218, 227 214 C 231 211, 237 213, 239 216"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Back of Hand & Wrist Tendons */}
            <path
              d="M 310 215 C 285 230, 258 245, 232 258"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M 330 228 C 305 242, 278 258, 250 270"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M 345 200 C 335 215, 322 230, 310 245"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
