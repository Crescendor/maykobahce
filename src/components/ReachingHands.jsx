import React from 'react';

/**
 * ReachingHands Component
 * Two hands reach from left and right sides of the screen as the user scrolls into Paragraph 3
 * ("...hem acım hem de iyileşmek istediğim tek yersin"), gently holding / clasping hands at the climax.
 * 100% scrubbable forward & backward via scrollProgress.
 */
export default function ReachingHands({ scrollProgress = 0 }) {
  // Active window around Paragraph 3 (index 3.0, range 2.15 to 3.85)
  if (scrollProgress < 2.15 || scrollProgress > 3.85) {
    return null;
  }

  // Reach progress from 0.0 (far away at edges) to 1.0 (holding hands at center)
  let reach = 0;
  let opacity = 1;

  if (scrollProgress <= 3.0) {
    // Coming together as scrolling into paragraph 3
    reach = Math.min(Math.max((scrollProgress - 2.2) / 0.75, 0), 1);
    opacity = Math.min(reach * 1.5, 1);
  } else {
    // Holding at 1.0 then gently fading as scrolling into paragraph 4
    reach = 1;
    opacity = Math.max(0, 1 - (scrollProgress - 3.1) / 0.65);
  }

  if (opacity <= 0.01) {
    return null;
  }

  // Responsive offsets:
  // At reach = 0: left hand is at -450px, right hand is at +450px
  // At reach = 1: both hands meet and clasp at the exact center (offset 0)
  const leftOffsetX = (1 - reach) * -380;
  const rightOffsetX = (1 - reach) * 380;
  const leftRot = (1 - reach) * -12;
  const rightRot = (1 - reach) * 12;

  // Clasping light glow intensity when hands meet
  const claspGlow = Math.max(0, (reach - 0.75) / 0.25) * opacity;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity
      }}
    >
      {/* Central Connection / Clasping Light Aura */}
      {claspGlow > 0.02 && (
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(220, 235, 255, 0.08) 45%, transparent 70%)',
            opacity: claspGlow,
            transform: 'scale(1.2)',
            filter: 'blur(16px)',
            transition: 'opacity 0.2s ease-out'
          }}
        />
      )}

      {/* Container for Both Hands Meeting at Center */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1100,
          height: 380,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* ========================================================
            LEFT HAND (Reaching from Left to Right)
        ======================================================== */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-100% + ${leftOffsetX}px + 62px), -50%) rotate(${leftRot}deg)`,
            transformOrigin: '0% 50%',
            willChange: 'transform',
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.45)) drop-shadow(0 0 20px rgba(180, 215, 255, 0.25))'
          }}
        >
          <svg
            width="460"
            height="220"
            viewBox="0 0 460 220"
            fill="none"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="leftArmGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="60%" stopColor="#f3f4f6" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="leftFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f1115" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1e232d" stopOpacity="0.65" />
              </linearGradient>
            </defs>

            {/* Arm & Hand Silhouette with Elegant Ethereal Fill */}
            <path
              d="M -60 70 C 40 70, 120 75, 180 82 
                 C 210 85, 240 72, 275 62 
                 C 305 52, 335 48, 365 52 
                 C 385 54, 405 60, 420 70 
                 C 426 74, 428 80, 422 85 
                 C 412 92, 395 94, 375 92 
                 C 395 96, 425 102, 435 110 
                 C 440 114, 438 120, 430 124 
                 C 415 130, 390 128, 365 125 
                 C 380 132, 410 142, 418 150 
                 C 422 154, 418 160, 408 162 
                 C 388 165, 360 156, 335 146 
                 C 305 158, 275 168, 235 162 
                 C 175 152, 100 150, -60 150 Z"
              fill="url(#leftFillGrad)"
              stroke="url(#leftArmGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Delicate Anatomical Creases / Knuckle Details */}
            <path
              d="M 270 78 C 285 88, 305 92, 325 90"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M 285 115 C 305 122, 325 124, 345 120"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M 230 120 C 245 132, 260 138, 275 135"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Thumb Line */}
            <path
              d="M 230 85 C 255 72, 280 62, 310 65"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ========================================================
            RIGHT HAND (Reaching from Right to Left)
        ======================================================== */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(0% + ${rightOffsetX}px - 62px), -50%) rotate(${rightRot}deg)`,
            transformOrigin: '100% 50%',
            willChange: 'transform',
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.45)) drop-shadow(0 0 20px rgba(180, 215, 255, 0.25))'
          }}
        >
          <svg
            width="460"
            height="220"
            viewBox="0 0 460 220"
            fill="none"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="rightArmGrad" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="60%" stopColor="#f3f4f6" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="rightFillGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f1115" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1e232d" stopOpacity="0.65" />
              </linearGradient>
            </defs>

            {/* Arm & Hand Silhouette with Mirror Clasp Curvature */}
            <path
              d="M 520 70 C 420 70, 340 75, 280 82 
                 C 250 85, 220 72, 185 62 
                 C 155 52, 125 48, 95 52 
                 C 75 54, 55 60, 40 70 
                 C 34 74, 36 80, 42 85 
                 C 52 92, 69 94, 89 92 
                 C 69 96, 39 102, 29 110 
                 C 24 114, 26 120, 34 124 
                 C 49 130, 74 128, 99 125 
                 C 84 132, 54 142, 46 150 
                 C 42 154, 46 160, 56 162 
                 C 76 165, 104 156, 129 146 
                 C 159 158, 189 168, 229 162 
                 C 289 152, 364 150, 520 150 Z"
              fill="url(#rightFillGrad)"
              stroke="url(#rightArmGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Delicate Anatomical Creases / Knuckle Details */}
            <path
              d="M 190 78 C 175 88, 155 92, 135 90"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M 175 115 C 155 122, 135 124, 115 120"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M 230 120 C 215 132, 200 138, 185 135"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Thumb Line */}
            <path
              d="M 230 85 C 205 72, 180 62, 150 65"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
