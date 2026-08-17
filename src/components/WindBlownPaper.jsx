import React from 'react';

/**
 * WindBlownPaper Component
 * Renders a 3D white letter/paper sheet that flutters across the screen with the wind
 * when scrolling into the first paragraph ("...rüzgârda kaybolacak").
 * 100% scrubbable forward & backward via scrollProgress.
 */
export default function WindBlownPaper({ scrollProgress = 0 }) {
  // Active during transition into and around paragraph 1 (between 0.05 and 1.85)
  if (scrollProgress < 0.05 || scrollProgress > 1.85) {
    return null;
  }

  // Normalized progress t from 0.0 to 1.0
  const t = Math.min(Math.max((scrollProgress - 0.1) / 1.55, 0), 1);

  // Opacity: smooth fade in at entry, smooth fade out at exit
  let opacity = 1;
  if (t < 0.12) {
    opacity = t / 0.12;
  } else if (t > 0.88) {
    opacity = (1 - t) / 0.12;
  }

  // Screen dimensions fallback
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Main Paper 3D Wind Physics Coordinates
  // Starts lower-left (-160px), swoops upward and across to top-right (vw + 200px)
  const mainX = -180 + t * (vw + 380);
  const mainY = (vh * 0.78) - t * (vh * 0.9) + Math.sin(t * Math.PI * 3.4) * 115 + Math.sin(t * Math.PI * 1.6) * 70;
  
  const rotX = t * 620 + Math.sin(t * 11) * 35;
  const rotY = t * 780 + Math.cos(t * 9) * 45;
  const rotZ = -38 + t * 130 + Math.sin(t * 13) * 22;
  const scale = 0.72 + Math.sin(t * Math.PI) * 0.42;

  // Companion Fragment 1 (Slightly trailing behind)
  const t1 = Math.max(0, t - 0.08);
  const frag1X = -140 + t1 * (vw + 340);
  const frag1Y = (vh * 0.88) - t1 * (vh * 0.95) + Math.sin(t1 * Math.PI * 3.8 + 1) * 90;
  const frag1RotX = t1 * 820;
  const frag1RotY = t1 * 950;
  const frag1RotZ = t1 * 190;
  const frag1Scale = 0.4 + Math.sin(t1 * Math.PI) * 0.25;

  // Companion Fragment 2 (Smaller scrap drifting above)
  const t2 = Math.min(1, t + 0.05);
  const frag2X = -120 + t2 * (vw + 300);
  const frag2Y = (vh * 0.65) - t2 * (vh * 0.85) + Math.cos(t2 * Math.PI * 4.2) * 80;
  const frag2RotX = t2 * 940;
  const frag2RotY = t2 * 680;
  const frag2RotZ = -20 + t2 * 240;
  const frag2Scale = 0.3 + Math.sin(t2 * Math.PI) * 0.2;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
        perspective: 1200,
        opacity
      }}
    >
      {/* Companion Paper Fragment 1 */}
      <div
        style={{
          position: 'absolute',
          left: frag1X,
          top: frag1Y,
          width: 48,
          height: 64,
          background: 'linear-gradient(135deg, #fbfaf8 0%, #e6dfd5 100%)',
          borderRadius: '2px 6px 1px 3px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.45)',
          transform: `rotateX(${frag1RotX}deg) rotateY(${frag1RotY}deg) rotateZ(${frag1RotZ}deg) scale(${frag1Scale})`,
          transformStyle: 'preserve-3d',
          willChange: 'transform, left, top',
          opacity: 0.7
        }}
      />

      {/* Companion Paper Fragment 2 */}
      <div
        style={{
          position: 'absolute',
          left: frag2X,
          top: frag2Y,
          width: 32,
          height: 44,
          background: 'linear-gradient(135deg, #ffffff 0%, #ede6db 100%)',
          borderRadius: '1px 4px 1px 2px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35)',
          transform: `rotateX(${frag2RotX}deg) rotateY(${frag2RotY}deg) rotateZ(${frag2RotZ}deg) scale(${frag2Scale})`,
          transformStyle: 'preserve-3d',
          willChange: 'transform, left, top',
          opacity: 0.6
        }}
      />

      {/* Main Wind-Blown Letter Sheet */}
      <div
        style={{
          position: 'absolute',
          left: mainX,
          top: mainY,
          width: 140,
          height: 195,
          background: 'linear-gradient(140deg, #ffffff 0%, #f7f4ee 45%, #ece5da 100%)',
          borderRadius: '3px 14px 2px 5px',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.35), inset 0 0 15px rgba(255, 255, 255, 0.6)',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`,
          transformStyle: 'preserve-3d',
          willChange: 'transform, left, top',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Crease / Fold Gradient Reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(108deg, transparent 42%, rgba(0, 0, 0, 0.07) 48%, rgba(255, 255, 255, 0.2) 52%, transparent 58%)',
            pointerEvents: 'none'
          }}
        />

        {/* Faint Ruled Lines on Paper */}
        <div
          style={{
            position: 'absolute',
            inset: '24px 18px 18px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
            opacity: 0.32
          }}
        >
          <div style={{ height: 1, width: '45%', background: '#78716c' }} />
          <div style={{ height: 1, width: '85%', background: '#a8a29e' }} />
          <div style={{ height: 1, width: '92%', background: '#a8a29e' }} />
          <div style={{ height: 1, width: '88%', background: '#a8a29e' }} />
          <div style={{ height: 1, width: '90%', background: '#a8a29e' }} />
          <div style={{ height: 1, width: '75%', background: '#a8a29e' }} />
          <div style={{ height: 1, width: '82%', background: '#a8a29e' }} />
          <div style={{ height: 1, width: '60%', background: '#a8a29e' }} />
        </div>
      </div>
    </div>
  );
}
