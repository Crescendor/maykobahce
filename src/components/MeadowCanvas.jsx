import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GARDEN_SIZE, FENCE_PADDING, drawSmoothStroke, drawStem } from '../utils/gardenEngine';

export default function MeadowCanvas({
  flowers,
  selectedFlower,
  onSelectFlower,
  isPlantingMode,
  pendingPlantPosition,
  onPlantAtPosition,
  viewportTarget, // { x, y, scale } target coordinate to animate camera to
  onViewportChange
}) {
  const canvasRef = useRef(null);

  // Viewport transform state
  const [transform, setTransform] = useState({
    x: -GARDEN_SIZE / 2 + window.innerWidth / 2,
    y: -GARDEN_SIZE / 2 + window.innerHeight / 2,
    scale: 0.85
  });

  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Interaction tracking state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchPinchDistRef = useRef(null);
  const clickStartPosRef = useRef({ x: 0, y: 0 });

  // Camera animation frame
  const animFrameRef = useRef(null);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smoothly animate camera to viewportTarget when requested
  useEffect(() => {
    if (!viewportTarget) return;

    const startX = transformRef.current.x;
    const startY = transformRef.current.y;
    const startScale = transformRef.current.scale;

    const targetScale = viewportTarget.scale || 1.4;
    // Calculate transform to center (viewportTarget.x, viewportTarget.y) in screen center
    const targetX = window.innerWidth / 2 - viewportTarget.x * targetScale;
    const targetY = window.innerHeight / 2 - viewportTarget.y * targetScale;

    const startTime = performance.now();
    const duration = 600; // ms

    const animateCamera = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentX = startX + (targetX - startX) * ease;
      const currentY = startY + (targetY - startY) * ease;
      const currentScale = startScale + (targetScale - startScale) * ease;

      const nextTransform = { x: currentX, y: currentY, scale: currentScale };
      setTransform(nextTransform);
      if (onViewportChange) onViewportChange(nextTransform);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateCamera);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateCamera);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewportTarget]);

  // Main Canvas Render Loop
  const render = useCallback((time = Date.now() / 1000) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const { x: offsetX, y: offsetY, scale } = transformRef.current;

    // Clear Screen
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1b4332'; // Deep grass background
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 1. Render Meadow Base Grass
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, 0, GARDEN_SIZE, GARDEN_SIZE);

    // Inner Meadow Active Planting Area
    ctx.fillStyle = '#358f66';
    ctx.fillRect(
      FENCE_PADDING,
      FENCE_PADDING,
      GARDEN_SIZE - FENCE_PADDING * 2,
      GARDEN_SIZE - FENCE_PADDING * 2
    );

    // Render Soil Patches / Texture Details
    drawLawnDetails(ctx);

    // 2. Render Wooden Fence Perimeter
    drawGardenFences(ctx);

    // 3. Render Flowers (with wind sway & active animations)
    flowers.forEach((flower) => {
      const isSelected = selectedFlower && selectedFlower.id === flower.id;
      drawFlower(ctx, flower, isSelected, scale, time);
    });

    // 4. Render Pending Planting Flag Pin
    if (pendingPlantPosition) {
      drawPlantingFlag(ctx, pendingPlantPosition.x, pendingPlantPosition.y, scale);
    }

    ctx.restore();
  }, [flowers, selectedFlower, pendingPlantPosition]);

  // Continuous animation frame loop for smooth wind sway & animations
  useEffect(() => {
    let animId;
    const loop = () => {
      const time = Date.now() / 1000;
      render(time);
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [render]);

  // Handle Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const oldScale = transform.scale;
    let newScale = Math.min(Math.max(oldScale * zoomFactor, 0.35), 2.8);

    // Zoom towards mouse pointer
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const newX = mouseX - (mouseX - transform.x) * (newScale / oldScale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / oldScale);

    const nextTransform = { x: newX, y: newY, scale: newScale };
    setTransform(nextTransform);
    if (onViewportChange) onViewportChange(nextTransform);
  };

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    clickStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  // Pointer Move (Mouse or Touch Drag)
  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    const nextTransform = {
      ...transformRef.current,
      x: transformRef.current.x + dx,
      y: transformRef.current.y + dy
    };
    setTransform(nextTransform);
    if (onViewportChange) onViewportChange(nextTransform);
  };

  // Pointer Up / Tap Detection
  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    touchPinchDistRef.current = null;

    // Check if it was a quick click/tap without dragging
    const moveDist = Math.hypot(
      e.clientX - clickStartPosRef.current.x,
      e.clientY - clickStartPosRef.current.y
    );

    if (moveDist < 8) {
      // Screen to World Coordinates conversion
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const worldX = (clickX - transformRef.current.x) / transformRef.current.scale;
      const worldY = (clickY - transformRef.current.y) / transformRef.current.scale;

      // Check if tap hit any flower (within 35px radius)
      let hitFlower = null;
      for (const flower of flowers) {
        const dist = Math.hypot(flower.x - worldX, flower.y - worldY);
        if (dist < 40) {
          hitFlower = flower;
          break;
        }
      }

      if (hitFlower) {
        onSelectFlower(hitFlower);
      } else if (isPlantingMode) {
        onPlantAtPosition(worldX, worldY);
      }
    }
  };

  // Touch Gesture Handling for Mobile Pinch Zoom
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (touchPinchDistRef.current !== null) {
        const factor = dist / touchPinchDistRef.current;
        const oldScale = transformRef.current.scale;
        const newScale = Math.min(Math.max(oldScale * factor, 0.35), 2.8);

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        const newX = midX - (midX - transformRef.current.x) * (newScale / oldScale);
        const newY = midY - (midY - transformRef.current.y) * (newScale / oldScale);

        const nextTransform = { x: newX, y: newY, scale: newScale };
        setTransform(nextTransform);
        if (onViewportChange) onViewportChange(nextTransform);
      }
      touchPinchDistRef.current = dist;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={handleTouchMove}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        cursor: isPlantingMode ? 'crosshair' : 'grab',
        touchAction: 'none'
      }}
    />
  );
}

// Auxiliary Canvas Drawing Helpers

/**
 * Draw realistic grass tufts, clovers, and textured lawn details across the meadow
 */
function drawLawnDetails(ctx) {
  // 1. Organic Grass Blade Tufts
  const grassColors = ['#52b788', '#74c69d', '#38b000', '#95d5b2', '#2d6a4f'];
  
  ctx.lineCap = 'round';
  
  for (let x = 180; x < GARDEN_SIZE - 180; x += 120) {
    for (let y = 180; y < GARDEN_SIZE - 180; y += 120) {
      const offsetX = (Math.sin(x * 0.05 + y * 0.03) * 40);
      const offsetY = (Math.cos(x * 0.03 - y * 0.05) * 40);
      const gx = x + offsetX;
      const gy = y + offsetY;
      
      const color = grassColors[(x + y) % grassColors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      // Cluster of 3-4 natural grass blades
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx - 6, gy - 12, gx - 10, gy - 18);
      
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx - 2, gy - 16, gx - 3, gy - 22);

      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + 5, gy - 14, gx + 8, gy - 19);

      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + 10, gy - 10, gx + 14, gy - 14);
      ctx.stroke();

      // Occasional Tiny White Clover Accents
      if ((x + y) % 7 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx + 12, gy - 8, 2.5, 0, Math.PI * 2);
        ctx.arc(gx + 16, gy - 11, 2.5, 0, Math.PI * 2);
        ctx.arc(gx + 15, gy - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(gx + 14, gy - 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Draw Wooden Fence boundary around the meadow perimeter
 */
function drawGardenFences(ctx) {
  const p = FENCE_PADDING;
  const size = GARDEN_SIZE - p * 2;

  ctx.strokeStyle = '#5c3d2e';
  ctx.lineWidth = 14;
  ctx.strokeRect(p, p, size, size);

  ctx.strokeStyle = '#8b5a2b';
  ctx.lineWidth = 8;
  ctx.strokeRect(p, p, size, size);

  // Fence Posts at corners and along edges
  ctx.fillStyle = '#3d261a';
  const postStep = 180;
  
  // Top & Bottom fence posts
  for (let x = p; x <= p + size; x += postStep) {
    ctx.fillRect(x - 8, p - 12, 16, 24);
    ctx.fillRect(x - 8, p + size - 12, 16, 24);
  }
  // Left & Right fence posts
  for (let y = p; y <= p + size; y += postStep) {
    ctx.fillRect(p - 12, y - 8, 24, 16);
    ctx.fillRect(p + size - 12, y - 8, 24, 16);
  }
}

/**
 * Render a Single Flower (Vivid Visible Stem + Leaves + Custom Petals + Wind Sway & Animations)
 */
function drawFlower(ctx, flower, isSelected, zoomScale, time = 0) {
  const { x, y, strokes, scale = 1, stemAngle = 0 } = flower;

  // Unapproved flowers (approved === 0) render at reduced opacity
  const isPending = flower.approved === 0;
  const alpha = isPending ? 0.35 : 1;

  // Gentle wind sway calculation based on coordinates & time
  const windSway = Math.sin(time * 2 + x * 0.04 + y * 0.03) * 0.07;
  const currentAngle = stemAngle + windSway;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  // Render Glowing Aura Animation if animation === 'glow'
  if (flower.animation === 'glow') {
    ctx.save();
    const color = flower.animationColor || '#10b981';
    const pulse = 0.5 + 0.5 * Math.sin(time * 4 + x);
    const radius = (40 + pulse * 22) * scale;
    const grad = ctx.createRadialGradient(0, -50 * scale, 5 * scale, 0, -50 * scale, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(0.6, color + '77');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -50 * scale, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Render Highlight Ring if selected
  if (isSelected) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -25, 48 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
    ctx.restore();
  }

  // 1. Root Soil Base Shadow (Makes root location vivid)
  ctx.fillStyle = 'rgba(27, 42, 30, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3d261a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pending indicator: small clock/hourglass badge above flower
  if (isPending) {
    ctx.save();
    ctx.font = `${Math.max(12, 14 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.85;
    ctx.fillText('⏳', 0, -55 * scale - 18);
    ctx.globalAlpha = alpha;
    ctx.restore();
  }

  // 2. Draw High-Contrast Vivid Stem & Leaves (with wind sway)
  ctx.save();
  ctx.rotate(currentAngle);
  drawStem(ctx, flower.stemType || 'classic', flower.stemColor || '#52b788', scale);
  ctx.restore();

  // 3. Draw Petal Top (Sways together with stem tip at y = -50 * scale)
  ctx.save();
  ctx.translate(0, -50 * scale);
  ctx.rotate(windSway * 0.5); // extra subtle petal tip tilt
  ctx.scale(scale * 0.20, scale * 0.20);
  ctx.translate(-150, -240);

  if (strokes && strokes.length > 0) {
    strokes.forEach((stroke) => {
      drawSmoothStroke(ctx, stroke);
    });
  } else {
    // Fallback default bloom if no stroke path
    ctx.beginPath();
    ctx.arc(150, 150, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4d6d';
    ctx.fill();
  }

  ctx.restore();

  // Floating Hearts Animation (animation === 'heart')
  if (flower.animation === 'heart') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const phase = (time * 1.6 + i * 1.1 + (x % 5)) % 3; // 0 to 3s cycle
      const heartY = -50 * scale - phase * 24 * scale;
      const heartX = Math.sin(time * 3 + i * 2) * 14 * scale;
      const heartAlpha = phase < 0.4 ? phase / 0.4 : phase > 2.2 ? (3 - phase) / 0.8 : 1;
      const heartSize = Math.max(12, (16 + Math.sin(time * 4 + i) * 3) * scale);

      ctx.save();
      ctx.globalAlpha = alpha * Math.max(0, Math.min(1, heartAlpha));
      ctx.translate(heartX, heartY);
      ctx.font = `${heartSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('💜', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // Twinkling Orbiting Stars Animation (animation === 'star')
  if (flower.animation === 'star') {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const orbitAngle = time * 2.2 + (i * Math.PI) / 2;
      const orbitR = (28 + Math.sin(time * 3 + i) * 6) * scale;
      const starX = Math.cos(orbitAngle) * orbitR;
      const starY = -50 * scale + Math.sin(orbitAngle) * orbitR * 0.5;
      const starSize = Math.max(12, (15 + Math.sin(time * 6 + i * 2) * 4) * scale);

      ctx.save();
      ctx.translate(starX, starY);
      ctx.font = `${starSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('⭐', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Render Simple Flat Red Flag Pin on target coordinate (İkonsuz Düz Kırmızı Bayrak)
 */
function drawPlantingFlag(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Soil Ground Base Shadow
  ctx.fillStyle = 'rgba(15, 41, 30, 0.6)';
  ctx.beginPath();
  ctx.ellipse(0, 3, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3d261a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Target Ring
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 12, 0, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ef4444';
  ctx.stroke();

  // 2. Simple Flag Pole
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -75);
  ctx.stroke();

  // 3. Simple Flat Red Flag Banner (Düz Kırmızı Bayrak, İkonsuz)
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -75);
  ctx.lineTo(42, -57);
  ctx.lineTo(0, -39);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
