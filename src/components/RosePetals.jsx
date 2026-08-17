import React, { useState, useEffect, useMemo, useRef } from 'react';

/**
 * RosePetals Component
 * Continuous swirling crimson red rose petals drifting in 3D across all Ayşenur letter sections.
 * Automatically flows in real time even when the mouse is stationary!
 * Mouse scrolling adds extra dynamic velocity to the natural breeze.
 */
export default function RosePetals({ scrollProgress = 0, startProgress = 6.5 }) {
  // Continuous real-time ambient time ticker (flows automatically without mouse movement!)
  const [autoTime, setAutoTime] = useState(0);
  const reqRef = useRef(null);
  const prevTimeRef = useRef(null);

  useEffect(() => {
    const tick = (now) => {
      if (prevTimeRef.current != null) {
        const delta = (now - prevTimeRef.current) / 1000;
        // Natural gentle drift speed
        setAutoTime((prev) => prev + delta * 0.12);
      }
      prevTimeRef.current = now;
      reqRef.current = requestAnimationFrame(tick);
    };

    reqRef.current = requestAnimationFrame(tick);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  // Only active after Ayşenur stage is unlocked and reached
  if (scrollProgress < startProgress) {
    return null;
  }

  // Combine automatic ambient time with scroll progress
  const progress = autoTime + (scrollProgress - startProgress) * 0.45;
  const overallOpacity = Math.min(Math.max((scrollProgress - startProgress) / 0.4, 0), 1);

  // Generate a deterministic constellation of 36 rich 3D velvet rose petals
  const petals = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 36; i++) {
      const seed = Math.sin(i * 997.13 + 43.17) * 10000;
      const rand1 = seed - Math.floor(seed);
      const seed2 = Math.cos(i * 733.81 + 19.42) * 10000;
      const rand2 = seed2 - Math.floor(seed2);
      const seed3 = Math.sin(i * 389.27 + 61.19) * 10000;
      const rand3 = seed3 - Math.floor(seed3);

      arr.push({
        id: i,
        // Base starting coordinates across viewport (percentage 0-100)
        startX: (i * 2.8 + rand1 * 26) % 100,
        startY: -15 + (i * 4.2 + rand2 * 35) % 130,
        size: 17 + rand3 * 23,
        speedX: (rand1 - 0.48) * 150,
        rotSpeedX: 160 + rand3 * 340,
        rotSpeedY: 200 + rand1 * 380,
        rotSpeedZ: 130 + rand2 * 260,
        swayAmp: 26 + rand1 * 42,
        swayFreq: 1.6 + rand2 * 2.1,
        colorType: i % 4, // different rich rose petal gradients
        scaleZ: 0.75 + rand3 * 0.5
      });
    }
    return arr;
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 25,
        overflow: 'hidden',
        perspective: 900,
        opacity: overallOpacity
      }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Deep Velvet Crimson Rose Gradient */}
          <linearGradient id="roseVelvet1" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#ff4d6d" />
            <stop offset="35%" stopColor="#e11d48" />
            <stop offset="75%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>

          {/* Deep Ruby Rose Gradient */}
          <linearGradient id="roseVelvet2" x1="0%" y1="20%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="40%" stopColor="#f43f5e" />
            <stop offset="80%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>

          {/* Dark Burgundy Petal Gradient */}
          <linearGradient id="roseVelvet3" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#be123c" />
            <stop offset="85%" stopColor="#881337" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>

          {/* Glowing Silk Rose Gradient */}
          <linearGradient id="roseVelvet4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="35%" stopColor="#e11d48" />
            <stop offset="70%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#700d2b" />
          </linearGradient>
        </defs>
      </svg>

      {petals.map((petal) => {
        // Automatic continuous vertical loop
        const cycleProgress = (progress * 0.4 + petal.id * 0.072) % 1;
        const currentY = ((petal.startY + cycleProgress * 150) % 140) - 20; // -20vh to 120vh
        const currentX =
          petal.startX +
          Math.sin(progress * petal.swayFreq + petal.id) * (petal.swayAmp / 15) +
          (cycleProgress * petal.speedX) / 10;

        const rotX = (progress * petal.rotSpeedX + petal.id * 73) % 360;
        const rotY = (progress * petal.rotSpeedY + petal.id * 119) % 360;
        const rotZ = (progress * petal.rotSpeedZ + petal.id * 47) % 360;

        const gradIds = ['roseVelvet1', 'roseVelvet2', 'roseVelvet3', 'roseVelvet4'];
        const fillId = gradIds[petal.colorType];

        return (
          <div
            key={petal.id}
            style={{
              position: 'absolute',
              left: `${currentX}%`,
              top: `${currentY}%`,
              width: petal.size,
              height: petal.size * 1.25,
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${petal.scaleZ})`,
              transformStyle: 'preserve-3d',
              willChange: 'transform, left, top',
              filter: 'drop-shadow(0 3px 6px rgba(136, 19, 55, 0.45)) drop-shadow(0 0 10px rgba(225, 29, 72, 0.25))'
            }}
          >
            <svg
              viewBox="0 0 40 50"
              fill="none"
              style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
            >
              {/* Organic Rose Petal Path */}
              <path
                d="M 20 4 C 28 4, 38 12, 38 25 C 38 38, 28 48, 20 48 C 12 48, 2 38, 2 25 C 2 12, 12 4, 20 4 Z"
                fill={`url(#${fillId})`}
                opacity="0.94"
              />
              {/* Subtle Petal Center Ridge / Vein Highlight */}
              <path
                d="M 20 8 Q 21 26 20 44"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
              <path
                d="M 20 18 Q 14 26 8 32"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="0.6"
                strokeLinecap="round"
              />
              <path
                d="M 20 22 Q 26 28 32 34"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="0.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
