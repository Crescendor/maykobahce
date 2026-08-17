import React from 'react';

/**
 * ReachingHands Component
 * Dynamic vector line-art animation:
 * 1. As you scroll into Paragraph 3 (reach 0.0 -> 0.75), left and right arms reach towards each other.
 * 2. At the climax (reach 0.75 -> 1.0), the hands meet, wrap around each other, and interlace fingers in a tender clasp!
 * 3. 100% vector line-art, pure white strokes, zero raster artifacts.
 * 4. 100% scrubbable backward & forward with mouse wheel.
 */
export default function ReachingHands({ scrollProgress = 0 }) {
  // Active window around Paragraph 3 (index 3.0, range 2.15 to 3.85)
  if (scrollProgress < 2.15 || scrollProgress > 3.85) {
    return null;
  }

  // Reach progress from 0.0 (far apart) to 1.0 (firmly holding hands in center)
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

  // Position offsets for reaching phase:
  const leftX = (1 - easeReach) * -360 + 96;
  const leftY = (1 - easeReach) * 90 - 18;
  const rightX = (1 - easeReach) * 360 - 96;
  const rightY = (1 - easeReach) * -90 - 72;

  // Clasp transition: from reaching into intertwined clasping (0.72 -> 1.0)
  const claspFactor = Math.min(Math.max((reach - 0.72) / 0.28, 0), 1);
  const reachingOpacity = 1 - claspFactor;
  const claspOpacity = claspFactor;

  // Ambient connection glow
  const touchGlow = Math.max(0, (reach - 0.7) / 0.3);

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
        {/* Luminous Warm Aura where hands hold each other */}
        {touchGlow > 0.02 && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '48%',
              transform: 'translate(-50%, -50%)',
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.45) 0%, rgba(220, 235, 255, 0.15) 45%, transparent 70%)',
              opacity: touchGlow,
              filter: 'blur(14px)',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* ========================================================
            PHASE 1: SEPARATE REACHING HANDS (Reaching toward center)
        ======================================================== */}
        {reachingOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: reachingOpacity,
              transition: 'opacity 0.15s ease-out'
            }}
          >
            {/* LEFT REACHING ARM */}
            <div
              style={{
                position: 'absolute',
                right: '50%',
                bottom: '10%',
                width: '52vw',
                maxWidth: 680,
                height: 300,
                transform: `translate(${leftX}px, ${leftY}px)`,
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

                {/* Thumb */}
                <path
                  d="M 385 75 C 392 58, 400 40, 410 25 C 414 18, 420 16, 426 22 C 430 28, 428 42, 425 58 C 420 80, 425 102, 442 120"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 412 24 C 416 20, 422 20, 424 25 C 425 30, 420 34, 415 32"
                  stroke="rgba(255, 255, 255, 0.75)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />

                {/* Index */}
                <path
                  d="M 442 120 C 475 110, 520 95, 570 80 C 585 76, 595 76, 598 84 C 600 90, 590 98, 575 104 C 530 120, 485 132, 445 142"
                  stroke="#ffffff"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 588 78 C 592 78, 596 82, 594 86 C 590 89, 584 88, 582 84"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />

                {/* Middle */}
                <path
                  d="M 458 138 C 495 128, 540 115, 585 102 C 595 99, 602 102, 602 108 C 602 114, 592 120, 578 125 C 535 140, 490 150, 452 158"
                  stroke="#ffffff"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Ring */}
                <path
                  d="M 452 158 C 485 150, 525 138, 565 128 C 574 125, 580 128, 578 134 C 576 139, 568 144, 555 148 C 518 160, 480 168, 446 174"
                  stroke="#ffffff"
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Pinky */}
                <path
                  d="M 446 174 C 472 168, 502 160, 532 152 C 540 150, 545 153, 544 158 C 542 162, 535 166, 525 170 C 495 180, 460 186, 428 188"
                  stroke="#ffffff"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M 375 168 C 400 158, 425 148, 448 135"
                  stroke="rgba(255, 255, 255, 0.55)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* RIGHT REACHING ARM */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '5%',
                width: '52vw',
                maxWidth: 680,
                height: 300,
                transform: `translate(${rightX}px, ${rightY}px)`,
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
                <path
                  d="M 560 88 C 500 112, 440 140, 385 172"
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />

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

                {/* Index */}
                <path
                  d="M 245 250 C 210 268, 160 288, 105 300 C 90 304, 82 298, 85 290 C 88 284, 102 278, 120 270 C 170 250, 215 232, 255 215"
                  stroke="#ffffff"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 92 298 C 88 297, 86 293, 89 289 C 94 286, 100 288, 102 292"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />

                {/* Middle */}
                <path
                  d="M 235 258 C 195 275, 145 295, 95 308 C 85 311, 78 306, 80 299 C 82 294, 95 288, 112 280 C 160 260, 205 240, 245 224"
                  stroke="#ffffff"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Ring */}
                <path
                  d="M 245 265 C 210 282, 165 300, 120 312 C 110 315, 104 311, 106 305 C 108 300, 118 295, 132 288 C 172 270, 212 252, 250 236"
                  stroke="#ffffff"
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Pinky */}
                <path
                  d="M 255 272 C 225 288, 190 302, 155 314 C 146 317, 140 314, 142 308 C 144 303, 152 298, 164 292 C 198 278, 230 262, 260 248"
                  stroke="#ffffff"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Thumb */}
                <path
                  d="M 315 195 C 295 208, 268 218, 240 224 C 230 226, 222 220, 225 212 C 228 206, 240 200, 258 194 C 285 184, 305 174, 325 162"
                  stroke="#ffffff"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* ========================================================
            PHASE 2: INTERTWINED CLASPED HANDS (Holding Hands At Peak)
            Fingers wrap around each other in an emotional, intimate hold!
        ======================================================== */}
        {claspOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              maxWidth: 1100,
              height: 340,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: claspOpacity,
              transform: `scale(${0.96 + claspOpacity * 0.04})`,
              transition: 'opacity 0.2s ease-out, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 20px rgba(200, 230, 255, 0.4))'
            }}
          >
            <svg
              viewBox="0 0 1000 320"
              fill="none"
              style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="claspLeftFade" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="25%" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="claspRightFade" x1="100%" y1="50%" x2="0%" y2="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="25%" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Left Arm Coming into Clasp */}
              <path
                d="M -50 240 C 60 235, 180 220, 290 195 C 330 185, 370 170, 405 152"
                stroke="url(#claspLeftFade)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M -50 185 C 60 180, 180 168, 280 148 C 318 140, 355 125, 388 108"
                stroke="url(#claspLeftFade)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              {/* Right Arm Coming into Clasp */}
              <path
                d="M 1050 90 C 940 105, 820 128, 710 155 C 665 166, 625 180, 585 195"
                stroke="url(#claspRightFade)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M 1050 145 C 940 160, 830 182, 730 208 C 685 220, 645 230, 600 242"
                stroke="url(#claspRightFade)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              {/* ==============================================
                  THE CLASP: INTERTWINED FINGERS & WRAPPING HANDS
              ============================================== */}

              {/* Left Thumb Wrapping over Top of Right Hand */}
              <path
                d="M 388 108 C 405 98, 428 90, 452 92 C 470 95, 482 106, 488 122 C 490 135, 480 145, 465 152 C 445 160, 420 165, 395 162"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Thumb Nail & Crease */}
              <path
                d="M 475 96 C 480 98, 484 104, 482 110 C 478 114, 472 112, 470 106"
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Right Hand Back & Wrist Flexing into Left Palm */}
              <path
                d="M 585 195 C 555 180, 520 160, 488 135 C 470 120, 450 110, 430 108"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Left Fingers (Lower Hand) Wrapping UP and OVER Right Fingers */}
              {/* Finger 1 (Index) */}
              <path
                d="M 405 152 C 430 148, 465 142, 502 140 C 516 140, 526 148, 524 158 C 520 168, 505 174, 485 178 C 455 182, 425 180, 395 174"
                stroke="#ffffff"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 512 142 C 518 144, 522 149, 520 154 C 516 158, 510 156, 508 150"
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Finger 2 (Middle) */}
              <path
                d="M 395 174 C 425 170, 460 164, 498 162 C 512 162, 522 170, 520 180 C 516 190, 500 196, 480 200 C 450 204, 420 200, 390 192"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 508 164 C 514 166, 518 171, 516 176 C 512 180, 506 178, 504 172"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Finger 3 (Ring) */}
              <path
                d="M 390 192 C 418 188, 450 184, 485 182 C 498 182, 508 190, 505 198 C 502 206, 488 212, 470 216 C 442 220, 415 216, 385 208"
                stroke="#ffffff"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Finger 4 (Pinky) */}
              <path
                d="M 385 208 C 410 204, 438 200, 468 198 C 478 198, 485 204, 482 212 C 478 218, 466 224, 450 226 C 428 228, 405 225, 380 218"
                stroke="#ffffff"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Right Hand Fingers Nestled Downward into Left Palm */}
              <path
                d="M 535 152 C 555 168, 570 188, 580 212 C 585 222, 582 230, 572 234 C 558 238, 538 232, 515 220 C 490 208, 470 192, 452 178"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 550 172 C 568 188, 580 205, 588 222 C 592 230, 588 238, 578 240 C 565 242, 545 235, 525 222"
                stroke="#ffffff"
                strokeWidth="2.0"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Palm Creases, Knuckles & Tendons Accent Lines */}
              <path
                d="M 360 170 C 380 155, 410 148, 435 145"
                stroke="rgba(255, 255, 255, 0.55)"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d="M 340 192 C 365 178, 395 170, 420 166"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M 560 195 C 585 185, 615 180, 645 175"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M 540 215 C 565 208, 595 202, 625 198"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
