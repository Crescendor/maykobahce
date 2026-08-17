import React from 'react';

/**
 * BurningTreeWithRoots Component
 * High-detail classical vector line-art tree for Paragraph 4:
 * ("...ağacımızın dalları kırıldı belki; ama kökleri hâlen o toprağın derinliklerinde seni bekliyor...")
 * - Tree rises up from the bottom of the page (ground).
 * - Extended, longer pacing across mouse wheel scrolling.
 * - Canopy burns with embers, severed branch snaps & falls.
 * - Deep roots continuously crawl, branch, and delve deep into the soil at the base.
 * - 100% scrubbable forward & backward via mouse wheel.
 */
export default function BurningTreeWithRoots({ scrollProgress = 0 }) {
  // Extended active window around Paragraph 4 (range 2.85 to 4.95)
  if (scrollProgress < 2.85 || scrollProgress > 4.95) {
    return null;
  }

  // Tree evolution progress from 0.0 to 1.0 (longer, more gradual timeline)
  let treeP = 0;
  let opacity = 1;

  if (scrollProgress <= 4.0) {
    treeP = Math.min(Math.max((scrollProgress - 2.85) / 1.15, 0), 1);
    opacity = Math.min(treeP * 1.5, 1);
  } else {
    treeP = 1;
    // Fade out gently as scrolling into paragraph 5
    opacity = Math.max(0, 1 - (scrollProgress - 4.1) / 0.75);
  }

  if (opacity <= 0.01) {
    return null;
  }

  // Smooth easing for tree rising up from below
  const easeTreeRise = Math.pow(treeP, 0.75);
  // Tree rises up from the bottom of the screen
  const treeRiseY = (1 - easeTreeRise) * 240;

  // 1. Root Growth Progress (roots progressively spread and delve deeper)
  const rootGrowth = Math.min(Math.max((treeP - 0.08) / 0.9, 0), 1);
  const rootDashOffset = (1 - rootGrowth) * 100;

  // 2. Fire Embers & Burning Glow (broad burning timeline from treeP 0.25 -> 0.85)
  const burnIntensity = Math.min(Math.max((treeP - 0.22) / 0.45, 0), 1) * (1 - Math.max(0, (treeP - 0.88) / 0.12));

  // 3. Falling Broken Branch (snaps at treeP = 0.42 and tumbles down gradually until treeP = 0.95)
  const fallProgress = Math.min(Math.max((treeP - 0.42) / 0.52, 0), 1);
  const fallEase = Math.pow(fallProgress, 1.35);
  const branchFallY = fallEase * 180;
  const branchFallX = fallEase * 38;
  const branchRot = fallEase * 80;
  const branchOpacity = Math.max(0, 1 - Math.max(0, (fallProgress - 0.78) / 0.22));

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
      {/* Anchored to the bottom of the viewport so tree rises up from ground */}
      <div
        style={{
          position: 'absolute',
          bottom: '2%',
          left: '50%',
          transform: `translateX(-50%) translateY(${treeRiseY}px)`,
          width: '100vw',
          maxWidth: 1200,
          height: '68vh',
          maxHeight: 640,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          willChange: 'transform'
        }}
      >
        {/* Burning Ember Aura Glow around canopy */}
        {burnIntensity > 0.02 && (
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 380,
              height: 260,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255, 200, 120, 0.28) 0%, rgba(255, 120, 50, 0.12) 45%, transparent 70%)',
              opacity: burnIntensity,
              filter: 'blur(20px)',
              pointerEvents: 'none'
            }}
          />
        )}

        <svg
          viewBox="0 0 800 560"
          fill="none"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            overflow: 'visible',
            filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.75)) drop-shadow(0 0 16px rgba(220, 235, 255, 0.25))'
          }}
        >
          <defs>
            {/* Root Deepening Fade Gradient */}
            <linearGradient id="rootFade" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
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
              d="M 378 350 C 375 310, 370 265, 362 220 C 355 180, 340 145, 320 115 C 300 88, 275 68, 240 50"
              strokeWidth="2.5"
            />
            {/* Right Trunk Contour */}
            <path
              d="M 422 350 C 425 310, 430 265, 438 220 C 445 180, 460 145, 480 115 C 500 88, 525 68, 560 50"
              strokeWidth="2.5"
            />

            {/* Internal Trunk Wood Grain / Gnarled Creases */}
            <path
              d="M 390 345 C 388 305, 385 260, 382 215 C 380 180, 370 148, 355 118"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.3"
            />
            <path
              d="M 410 345 C 412 305, 415 260, 418 215 C 420 180, 430 148, 445 118"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.3"
            />
            <path
              d="M 400 300 C 398 268, 402 230, 400 195"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
            />

            {/* Central Canopy Branch Fork */}
            <path
              d="M 395 200 C 395 160, 398 120, 400 80 C 400 58, 395 38, 388 20"
              strokeWidth="2.0"
            />
            <path
              d="M 405 200 C 405 160, 402 120, 400 80 C 400 58, 405 38, 412 20"
              strokeWidth="2.0"
            />
          </g>

          {/* ========================================================
              2. WITHERED CANOPY BRANCHES
          ======================================================== */}
          <g stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
            {/* Left Main Branch Sub-branches */}
            <path
              d="M 320 115 C 295 132, 260 150, 220 162 C 190 170, 160 174, 130 170"
              strokeWidth="1.8"
            />
            <path
              d="M 275 68 C 255 85, 225 98, 190 106 C 160 110, 135 108, 110 98"
              strokeWidth="1.6"
            />
            <path
              d="M 240 50 C 215 44, 185 38, 155 38 C 130 38, 110 44, 90 55"
              strokeWidth="1.5"
            />
            {/* Twigs on Left */}
            <path
              d="M 190 106 C 175 90, 155 82, 135 78"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.2"
            />
            <path
              d="M 220 162 C 205 180, 185 194, 160 202"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.2"
            />

            {/* Right Main Branch Sub-branches (Static Left Half) */}
            <path
              d="M 480 115 C 505 132, 540 150, 580 162 C 610 170, 640 174, 670 170"
              strokeWidth="1.8"
            />
            <path
              d="M 525 68 C 545 85, 575 98, 610 106 C 640 110, 665 108, 690 98"
              strokeWidth="1.6"
            />
            <path
              d="M 560 50 C 585 44, 615 38, 645 38 C 670 38, 690 44, 710 55"
              strokeWidth="1.5"
            />

            {/* Broken Branch Stump on Right Canopy */}
            {fallProgress > 0.1 && (
              <path
                d="M 505 132 L 518 138 L 512 146 L 522 150 L 515 158"
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
              transform={`translate(${branchFallX}, ${branchFallY}) rotate(${branchRot}, 540, 150)`}
              opacity={branchOpacity}
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Broken Splinter Origin */}
              <path
                d="M 518 138 L 528 142 L 522 148 L 535 152 L 540 150"
                strokeWidth="1.8"
              />
              {/* Falling Main Branch Stem */}
              <path
                d="M 540 150 C 570 158, 605 165, 638 162 C 660 160, 680 155, 700 142"
                strokeWidth="1.8"
              />
              {/* Falling Sub-twigs */}
              <path
                d="M 580 160 C 595 174, 615 186, 635 190"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="1.3"
              />
              <path
                d="M 620 162 C 632 150, 648 142, 665 138"
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
                d="M 310 110 Q 305 80 315 62 Q 325 80 320 105"
                stroke="#ffc078"
                strokeWidth="1.6"
                fill="rgba(255, 180, 80, 0.15)"
              />
              <path
                d="M 390 75 Q 385 45 395 28 Q 405 45 400 70"
                stroke="#ffd43b"
                strokeWidth="1.7"
                fill="rgba(255, 210, 50, 0.2)"
              />
              <path
                d="M 480 105 Q 490 75 480 58 Q 470 75 475 100"
                stroke="#ffc078"
                strokeWidth="1.6"
                fill="rgba(255, 180, 80, 0.15)"
              />
              <path
                d="M 260 62 Q 255 38 262 24 Q 270 38 266 58"
                stroke="#ffa94d"
                strokeWidth="1.4"
              />
              <path
                d="M 535 62 Q 542 38 535 24 Q 528 38 532 58"
                stroke="#ffa94d"
                strokeWidth="1.4"
              />

              {/* Rising Glowing Spark Embers */}
              <circle cx="330" cy="50" r="2.6" fill="url(#sparkGrad)" />
              <circle cx="280" cy="32" r="2.0" fill="url(#sparkGrad)" />
              <circle cx="395" cy="15" r="3.0" fill="url(#sparkGrad)" />
              <circle cx="440" cy="38" r="2.3" fill="url(#sparkGrad)" />
              <circle cx="510" cy="22" r="2.6" fill="url(#sparkGrad)" />
              <circle cx="580" cy="35" r="2.0" fill="url(#sparkGrad)" />
              <circle cx="360" cy="20" r="1.8" fill="url(#sparkGrad)" />
              <circle cx="420" cy="8" r="2.4" fill="url(#sparkGrad)" />
            </g>
          )}

          {/* ========================================================
              5. DEEP GROWING ROOTS (Spreading, branching, delving deep)
              Controlled by rootDashOffset as scrollProgress advances!
          ======================================================== */}
          <g stroke="url(#rootFade)" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Main Central Tap Root */}
            <path
              d="M 400 350 C 400 388, 395 425, 400 468 C 405 508, 398 538, 402 555"
              strokeWidth="2.5"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={rootDashOffset}
            />
            {/* Sub-tap Fork */}
            <path
              d="M 400 468 C 410 500, 425 532, 435 555"
              strokeWidth="1.8"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.15)}
              opacity="0.85"
            />
            <path
              d="M 400 425 C 388 465, 375 505, 365 545"
              strokeWidth="1.7"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.2)}
              opacity="0.82"
            />

            {/* Left Primary Deep Root Network */}
            <path
              d="M 378 350 C 355 380, 320 405, 280 425 C 240 445, 195 462, 150 475 C 110 485, 70 488, 30 485"
              strokeWidth="2.3"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={rootDashOffset}
            />
            {/* Left Root Sub-branch A */}
            <path
              d="M 280 425 C 265 458, 245 492, 220 522 C 195 548, 165 558, 135 558"
              strokeWidth="1.9"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.12)}
              opacity="0.88"
            />
            {/* Left Root Sub-branch B */}
            <path
              d="M 195 462 C 180 495, 160 525, 135 548 C 110 558, 85 558, 60 555"
              strokeWidth="1.6"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.25)}
              opacity="0.8"
            />
            {/* Left Fine Rootlets */}
            <path
              d="M 320 405 C 310 435, 298 468, 285 498"
              strokeWidth="1.4"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.35)}
              opacity="0.7"
            />
            <path
              d="M 150 475 C 138 505, 122 532, 105 552"
              strokeWidth="1.3"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.3)}
              opacity="0.75"
            />

            {/* Right Primary Deep Root Network */}
            <path
              d="M 422 350 C 445 380, 480 405, 520 425 C 560 445, 605 462, 650 475 C 690 485, 730 488, 770 485"
              strokeWidth="2.3"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={rootDashOffset}
            />
            {/* Right Root Sub-branch A */}
            <path
              d="M 520 425 C 535 458, 555 492, 580 522 C 605 548, 635 558, 665 558"
              strokeWidth="1.9"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.12)}
              opacity="0.88"
            />
            {/* Right Root Sub-branch B */}
            <path
              d="M 605 462 C 620 495, 640 525, 665 548 C 690 558, 715 558, 740 555"
              strokeWidth="1.6"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.25)}
              opacity="0.8"
            />
            {/* Right Fine Rootlets */}
            <path
              d="M 480 405 C 490 435, 502 468, 515 498"
              strokeWidth="1.4"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.min(100, rootDashOffset * 1.35)}
              opacity="0.7"
            />
            <path
              d="M 650 475 C 662 505, 678 532, 695 552"
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
