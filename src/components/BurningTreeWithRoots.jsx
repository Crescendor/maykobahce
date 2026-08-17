import React from 'react';

/**
 * BurningTreeWithRoots Component
 * High-detail classical vector line-art tree for Paragraph 4:
 * ("...ağacımızın dalları kırıldı belki; ama kökleri hâlen o toprağın derinliklerinde seni bekliyor...")
 * - Tree appears, burns/withers with rising embers.
 * - A severed branch breaks and tumbles downward.
 * - Meanwhile, intricate deep roots continuously grow, branch out, and delve deep into the ground.
 * - 100% scrubbable forward & backward via mouse wheel.
 */
export default function BurningTreeWithRoots({ scrollProgress = 0 }) {
  // Active window around Paragraph 4 (index 4.0, range 3.15 to 4.85)
  if (scrollProgress < 3.15 || scrollProgress > 4.85) {
    return null;
  }

  // Tree evolution progress from 0.0 to 1.0
  let treeP = 0;
  let opacity = 1;

  if (scrollProgress <= 4.0) {
    treeP = Math.min(Math.max((scrollProgress - 3.2) / 0.75, 0), 1);
    opacity = Math.min(treeP * 1.6, 1);
  } else {
    treeP = 1;
    // Fade out gently as scrolling into paragraph 5
    opacity = Math.max(0, 1 - (scrollProgress - 4.1) / 0.65);
  }

  if (opacity <= 0.01) {
    return null;
  }

  // 1. Root Growth Progress (roots progressively spread and delve deeper as treeP increases)
  const rootGrowth = Math.min(Math.max((treeP - 0.1) / 0.88, 0), 1);
  const rootDashOffset = (1 - rootGrowth) * 100;

  // 2. Fire Embers & Burning Glow (peaks around treeP 0.4 -> 0.8)
  const burnIntensity = Math.min(Math.max((treeP - 0.25) / 0.45, 0), 1) * (1 - Math.max(0, (treeP - 0.85) / 0.15));

  // 3. Falling Broken Branch (snaps at treeP = 0.45 and tumbles down until treeP = 0.95)
  const fallProgress = Math.min(Math.max((treeP - 0.45) / 0.5, 0), 1);
  const fallEase = Math.pow(fallProgress, 1.4);
  const branchFallY = fallEase * 140;
  const branchFallX = fallEase * 28;
  const branchRot = fallEase * 65;
  const branchOpacity = Math.max(0, 1 - Math.max(0, (fallProgress - 0.75) / 0.25));

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
      {/* Centered Canvas for Tree (Positioned gracefully in upper-middle area above text) */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          maxWidth: 1100,
          height: 440,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Burning Ember Aura Glow around canopy */}
        {burnIntensity > 0.02 && (
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 320,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255, 200, 120, 0.25) 0%, rgba(255, 120, 50, 0.1) 45%, transparent 70%)',
              opacity: burnIntensity,
              filter: 'blur(16px)',
              pointerEvents: 'none'
            }}
          />
        )}

        <svg
          viewBox="0 0 800 480"
          fill="none"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            overflow: 'visible',
            filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 15px rgba(220, 235, 255, 0.25))'
          }}
        >
          <defs>
            {/* Root Deepening Fade Gradient */}
            <linearGradient id="rootFade" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>

            {/* Ember Fire Spark Gradient */}
            <radialGradient id="sparkGrad">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffd8a8" />
              <stop offset="100%" stopColor="#ff922b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ========================================================
              1. MAIN TREE TRUNK & GNARLED BARK
          ======================================================== */}
          <g stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
            {/* Left Trunk Contour */}
            <path
              d="M 378 280 C 375 250, 370 215, 362 180 C 355 150, 340 120, 320 95 C 300 72, 275 55, 240 40"
              strokeWidth="2.4"
            />
            {/* Right Trunk Contour */}
            <path
              d="M 422 280 C 425 250, 430 215, 438 180 C 445 150, 460 120, 480 95 C 500 72, 525 55, 560 40"
              strokeWidth="2.4"
            />

            {/* Internal Trunk Wood Grain / Gnarled Creases */}
            <path
              d="M 390 275 C 388 245, 385 210, 382 175 C 380 148, 370 122, 355 98"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.3"
            />
            <path
              d="M 410 275 C 412 245, 415 210, 418 175 C 420 148, 430 122, 445 98"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.3"
            />
            <path
              d="M 400 240 C 398 215, 402 185, 400 155"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
            />

            {/* Central Canopy Branch Fork */}
            <path
              d="M 395 160 C 395 130, 398 100, 400 68 C 400 50, 395 32, 388 15"
              strokeWidth="2.0"
            />
            <path
              d="M 405 160 C 405 130, 402 100, 400 68 C 400 50, 405 32, 412 15"
              strokeWidth="2.0"
            />
          </g>

          {/* ========================================================
              2. WITHERED CANOPY BRANCHES
          ======================================================== */}
          <g stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
            {/* Left Main Branch Sub-branches */}
            <path
              d="M 320 95 C 295 110, 260 125, 220 135 C 190 142, 160 145, 130 142"
              strokeWidth="1.8"
            />
            <path
              d="M 275 55 C 255 70, 225 82, 190 88 C 160 92, 135 90, 110 82"
              strokeWidth="1.6"
            />
            <path
              d="M 240 40 C 215 35, 185 30, 155 30 C 130 30, 110 35, 90 45"
              strokeWidth="1.5"
            />
            {/* Twigs on Left */}
            <path
              d="M 190 88 C 175 75, 155 68, 135 65"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.2"
            />
            <path
              d="M 220 135 C 205 150, 185 162, 160 168"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.2"
            />

            {/* Right Main Branch Sub-branches (Static Left Half) */}
            <path
              d="M 480 95 C 505 110, 540 125, 580 135 C 610 142, 640 145, 670 142"
              strokeWidth="1.8"
            />
            <path
              d="M 525 55 C 545 70, 575 82, 610 88 C 640 92, 665 90, 690 82"
              strokeWidth="1.6"
            />
            <path
              d="M 560 40 C 585 35, 615 30, 645 30 C 670 30, 690 35, 710 45"
              strokeWidth="1.5"
            />

            {/* Broken Branch Stump on Right Canopy */}
            {fallProgress > 0.1 && (
              <path
                d="M 505 110 L 518 115 L 512 122 L 522 126 L 515 132"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="square"
              />
            )}
          </g>

          {/* ========================================================
              3. FALLING SEVERED BRANCH (Snaps & Tumbles Down)
          ======================================================== */}
          {fallProgress < 0.99 && (
            <g
              transform={`translate(${branchFallX}, ${branchFallY}) rotate(${branchRot}, 540, 125)`}
              opacity={branchOpacity}
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Broken Splinter Origin */}
              <path
                d="M 518 115 L 528 118 L 522 124 L 535 128 L 540 125"
                strokeWidth="1.8"
              />
              {/* Falling Main Branch Stem */}
              <path
                d="M 540 125 C 570 132, 605 138, 638 136 C 660 135, 680 130, 700 120"
                strokeWidth="1.8"
              />
              {/* Falling Sub-twigs */}
              <path
                d="M 580 133 C 595 145, 615 155, 635 158"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="1.3"
              />
              <path
                d="M 620 136 C 632 125, 648 118, 665 115"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="1.2"
              />
            </g>
          )}

          {/* ========================================================
              4. BURNING FIRE FLAMES & RISING EMBER SPARKS
          ======================================================== */}
          {burnIntensity > 0.05 && (
            <g opacity={burnIntensity}>
              {/* Flickering Vector Flame Lines along Canopy */}
              <path
                d="M 310 90 Q 305 65 315 50 Q 325 65 320 85"
                stroke="#ffc078"
                strokeWidth="1.5"
                fill="rgba(255, 180, 80, 0.15)"
              />
              <path
                d="M 390 60 Q 385 35 395 20 Q 405 35 400 55"
                stroke="#ffd43b"
                strokeWidth="1.6"
                fill="rgba(255, 210, 50, 0.2)"
              />
              <path
                d="M 480 85 Q 490 60 480 45 Q 470 60 475 80"
                stroke="#ffc078"
                strokeWidth="1.5"
                fill="rgba(255, 180, 80, 0.15)"
              />
              <path
                d="M 260 50 Q 255 30 262 18 Q 270 30 266 45"
                stroke="#ffa94d"
                strokeWidth="1.4"
              />
              <path
                d="M 535 50 Q 542 30 535 18 Q 528 30 532 45"
                stroke="#ffa94d"
                strokeWidth="1.4"
              />

              {/* Rising Glowing Spark Embers */}
              <circle cx="330" cy="40" r="2.5" fill="url(#sparkGrad)" />
              <circle cx="280" cy="25" r="2.0" fill="url(#sparkGrad)" />
              <circle cx="395" cy="10" r="2.8" fill="url(#sparkGrad)" />
              <circle cx="440" cy="30" r="2.2" fill="url(#sparkGrad)" />
              <circle cx="510" cy="18" r="2.5" fill="url(#sparkGrad)" />
              <circle cx="580" cy="28" r="2.0" fill="url(#sparkGrad)" />
              <circle cx="360" cy="15" r="1.8" fill="url(#sparkGrad)" />
              <circle cx="420" cy="5" r="2.2" fill="url(#sparkGrad)" />
            </g>
          )}

          {/* ========================================================
              5. DEEP GROWING ROOTS (Spreading, branching, delving deep)
              Controlled by rootDashOffset as scrollProgress advances!
          ======================================================== */}
          <g stroke="url(#rootFade)" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Main Central Tap Root */}
            <path
              d="M 400 280 C 400 310, 395 340, 400 375 C 405 410, 398 440, 402 475"
              strokeWidth="2.4"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={rootDashOffset}
            />
            {/* Sub-tap Fork */}
            <path
              d="M 400 375 C 410 405, 425 435, 435 468"
              strokeWidth="1.7"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.15)}
              opacity="0.85"
            />
            <path
              d="M 400 340 C 388 375, 375 410, 365 448"
              strokeWidth="1.6"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.2)}
              opacity="0.82"
            />

            {/* Left Primary Deep Root Network */}
            <path
              d="M 378 280 C 355 305, 320 325, 280 342 C 240 360, 195 375, 150 385 C 110 395, 70 398, 30 395"
              strokeWidth="2.2"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={rootDashOffset}
            />
            {/* Left Root Sub-branch A */}
            <path
              d="M 280 342 C 265 370, 245 400, 220 428 C 195 455, 165 472, 135 478"
              strokeWidth="1.8"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.12)}
              opacity="0.88"
            />
            {/* Left Root Sub-branch B */}
            <path
              d="M 195 375 C 180 405, 160 432, 135 455 C 110 472, 85 478, 60 475"
              strokeWidth="1.5"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.25)}
              opacity="0.8"
            />
            {/* Left Fine Rootlets */}
            <path
              d="M 320 325 C 310 350, 298 378, 285 405"
              strokeWidth="1.3"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.35)}
              opacity="0.7"
            />
            <path
              d="M 150 385 C 138 412, 122 438, 105 460"
              strokeWidth="1.3"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.3)}
              opacity="0.75"
            />

            {/* Right Primary Deep Root Network */}
            <path
              d="M 422 280 C 445 305, 480 325, 520 342 C 560 360, 605 375, 650 385 C 690 395, 730 398, 770 395"
              strokeWidth="2.2"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={rootDashOffset}
            />
            {/* Right Root Sub-branch A */}
            <path
              d="M 520 342 C 535 370, 555 400, 580 428 C 605 455, 635 472, 665 478"
              strokeWidth="1.8"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.12)}
              opacity="0.88"
            />
            {/* Right Root Sub-branch B */}
            <path
              d="M 605 375 C 620 405, 640 432, 665 455 C 690 472, 715 478, 740 475"
              strokeWidth="1.5"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.25)}
              opacity="0.8"
            />
            {/* Right Fine Rootlets */}
            <path
              d="M 480 325 C 490 350, 502 378, 515 405"
              strokeWidth="1.3"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.35)}
              opacity="0.7"
            />
            <path
              d="M 650 385 C 662 412, 678 438, 695 460"
              strokeWidth="1.3"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.3)}
              opacity="0.75"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
