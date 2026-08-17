import React from 'react';

/**
 * ReachingHands Component
 * Photorealistic Black & White Male and Female Arms reaching from the screen edges
 * and holding hands in the upper portion of the screen (above the paragraph text).
 * 100% scrubbable forward & backward via scrollProgress during Paragraph 3.
 */
export default function ReachingHands({ scrollProgress = 0 }) {
  // Active window around Paragraph 3 (index 3.0, range 2.15 to 3.85)
  if (scrollProgress < 2.15 || scrollProgress > 3.85) {
    return null;
  }

  // Reach progress from 0.0 (far edges) to 1.0 (holding hands at center)
  let reach = 0;
  let opacity = 1;

  if (scrollProgress <= 3.0) {
    reach = Math.min(Math.max((scrollProgress - 2.2) / 0.75, 0), 1);
    opacity = Math.min(reach * 1.6, 1);
  } else {
    reach = 1;
    // Fade out as scrolling towards paragraph 4
    opacity = Math.max(0, 1 - (scrollProgress - 3.1) / 0.65);
  }

  if (opacity <= 0.01) {
    return null;
  }

  // Smooth easing for organic human movement
  const easeReach = Math.pow(reach, 1.25);

  // Position offsets:
  // Arms start tucked off the left/right edges and smoothly glide inwards to meet at the center
  const leftOffsetX = (1 - easeReach) * -360;
  const rightOffsetX = (1 - easeReach) * 360;
  const leftRot = (1 - easeReach) * -6;
  const rightRot = (1 - easeReach) * 6;

  // Clasp transition crossfade (at peak reach, seamless clasped hands layer softly blends in)
  const claspBlend = Math.max(0, (reach - 0.78) / 0.22);

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
          top: '19%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          maxWidth: 1300,
          height: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Subtle Ethereal Ambient Glow where hands meet */}
        <div
          style={{
            position: 'absolute',
            width: 320,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.18) 0%, rgba(200, 220, 240, 0.05) 50%, transparent 75%)',
            opacity: Math.min(1, reach * 1.3),
            filter: 'blur(20px)',
            transform: 'scale(1.3)',
            transition: 'opacity 0.2s ease-out'
          }}
        />

        {/* ========================================================
            LEFT ARM (Masculine / Male Arm - Reaching from Left)
        ======================================================== */}
        <div
          style={{
            position: 'absolute',
            right: '50%',
            width: '46vw',
            maxWidth: 580,
            height: 260,
            transform: `translateX(${leftOffsetX + 45}px) rotate(${leftRot}deg)`,
            transformOrigin: '0% 50%',
            willChange: 'transform',
            opacity: 1 - claspBlend * 0.45,
            filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.8))'
          }}
        >
          <img
            src="/male_arm.png"
            alt="Male reaching arm"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'right center',
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, black 40%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, black 40%, black 100%)',
              mixBlendMode: 'screen',
              filter: 'grayscale(100%) contrast(118%) brightness(108%)'
            }}
          />
        </div>

        {/* ========================================================
            RIGHT ARM (Feminine / Female Arm - Reaching from Right)
        ======================================================== */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            width: '46vw',
            maxWidth: 580,
            height: 260,
            transform: `translateX(${rightOffsetX - 45}px) rotate(${rightRot}deg)`,
            transformOrigin: '100% 50%',
            willChange: 'transform',
            opacity: 1 - claspBlend * 0.45,
            filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.8))'
          }}
        >
          <img
            src="/female_arm.png"
            alt="Female reaching arm"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'left center',
              maskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.4) 15%, black 40%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.4) 15%, black 40%, black 100%)',
              mixBlendMode: 'screen',
              filter: 'grayscale(100%) contrast(118%) brightness(108%)'
            }}
          />
        </div>

        {/* ========================================================
            CENTER CLASPED HANDS (Intertwining / Holding at peak)
        ======================================================== */}
        {claspBlend > 0.01 && (
          <div
            style={{
              position: 'absolute',
              width: 440,
              height: 260,
              opacity: claspBlend,
              transform: `scale(${0.92 + claspBlend * 0.08})`,
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform, opacity',
              filter: 'drop-shadow(0 18px 35px rgba(0, 0, 0, 0.9))'
            }}
          >
            <img
              src="/hands_clasped.png"
              alt="Hands holding"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                maskImage: 'radial-gradient(ellipse at center, black 48%, rgba(0,0,0,0.8) 65%, transparent 92%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 48%, rgba(0,0,0,0.8) 65%, transparent 92%)',
                mixBlendMode: 'screen',
                filter: 'grayscale(100%) contrast(120%) brightness(108%)'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
