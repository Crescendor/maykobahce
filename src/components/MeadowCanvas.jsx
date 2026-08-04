import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GARDEN_SIZE, FENCE_PADDING, drawSmoothStroke, drawStem } from '../utils/gardenEngine';

export default function MeadowCanvas({
  flowers,
  selectedFlower,
  onSelectFlower,
  isPlantingMode,
  pendingPlantPosition,
  onPlantAtPosition,
  viewportTarget,
  onViewportChange,
  isAdminAuthenticated,
  adminTool,
  onUpdateFlowerLocalPos,
  onUpdateFlowerPosition,
  onDeleteFlower
}) {
  const canvasRef = useRef(null);

  const [transform, setTransform] = useState({
    x: -GARDEN_SIZE / 2 + window.innerWidth / 2,
    y: -GARDEN_SIZE / 2 + window.innerHeight / 2,
    scale: 0.75
  });

  const transformRef = useRef(transform);
  transformRef.current = transform;

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const clickStartPosRef = useRef({ x: 0, y: 0 });
  const touchPinchDistRef = useRef(null);

  const isDraggingFlowerRef = useRef(false);
  const draggedFlowerIdRef = useRef(null);
  const draggedFlowerOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!viewportTarget) return;

    const startX = transformRef.current.x;
    const startY = transformRef.current.y;
    const startScale = transformRef.current.scale;

    const targetScale = viewportTarget.scale || startScale;
    const targetX = -viewportTarget.x * targetScale + window.innerWidth / 2;
    const targetY = -viewportTarget.y * targetScale + window.innerHeight / 2;

    const startTime = performance.now();
    const duration = 650;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const nextTransform = {
        x: startX + (targetX - startX) * easeProgress,
        y: startY + (targetY - startY) * easeProgress,
        scale: startScale + (targetScale - startScale) * easeProgress
      };

      setTransform(nextTransform);
      if (onViewportChange) onViewportChange(nextTransform);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [viewportTarget]);

  const render = useCallback((time = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(transformRef.current.x, transformRef.current.y);
    ctx.scale(transformRef.current.scale, transformRef.current.scale);

    const scale = transformRef.current.scale;

    // 1. Render Meadow Lawn Base
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(0, 0, GARDEN_SIZE, GARDEN_SIZE);

    drawLawnDetails(ctx);

    // 2. Render Wooden Fence Outer Boundary
    drawGardenFences(ctx);

    if (flowers && flowers.length > 0) {
      flowers.forEach((flower) => {
        const isSelected = selectedFlower && selectedFlower.id === flower.id;
        drawFlower(ctx, flower, isSelected, scale, time);
      });
    }

    if (pendingPlantPosition) {
      drawPlantingFlag(ctx, pendingPlantPosition.x, pendingPlantPosition.y, scale);
    }

    ctx.restore();
  }, [flowers, selectedFlower, pendingPlantPosition]);

  useEffect(() => {
    const loop = (time) => {
      render(time / 1000);
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [render]);

  // Non-passive wheel event listener for smooth zoom without Chrome console warnings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const oldScale = transformRef.current.scale;
      const newScale = Math.min(Math.max(oldScale * zoomFactor, 0.3), 2.5);

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - transformRef.current.x) * (newScale / oldScale);
      const newY = mouseY - (mouseY - transformRef.current.y) * (newScale / oldScale);

      const nextTransform = { x: newX, y: newY, scale: newScale };

      setTransform(nextTransform);
      if (onViewportChange) onViewportChange(nextTransform);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [onViewportChange]);

  const handlePointerDown = (e) => {
    clickStartPosRef.current = { x: e.clientX, y: e.clientY };
    const rect = canvasRef.current.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.scale;
    const worldY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.scale;

    let hitFlower = null;
    for (const flower of flowers) {
      const dist = Math.hypot(flower.x - worldX, flower.y - worldY);
      if (dist < 45) {
        hitFlower = flower;
        break;
      }
    }

    if (isAdminAuthenticated && adminTool === 'move_flower' && hitFlower) {
      isDraggingFlowerRef.current = true;
      draggedFlowerIdRef.current = hitFlower.id;
      draggedFlowerOffsetRef.current = {
        x: hitFlower.x - worldX,
        y: hitFlower.y - worldY
      };
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - transformRef.current.x,
      y: e.clientY - transformRef.current.y
    };
  };

  const handlePointerMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.scale;
    const worldY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.scale;

    if (isDraggingFlowerRef.current && draggedFlowerIdRef.current) {
      const newX = Math.round(worldX + draggedFlowerOffsetRef.current.x);
      const newY = Math.round(worldY + draggedFlowerOffsetRef.current.y);
      if (onUpdateFlowerLocalPos) {
        onUpdateFlowerLocalPos(draggedFlowerIdRef.current, newX, newY);
      }
      return;
    }

    if (isDraggingRef.current) {
      const nextTransform = {
        ...transformRef.current,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      };

      setTransform(nextTransform);
      if (onViewportChange) onViewportChange(nextTransform);
    }
  };

  const handlePointerUp = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const worldX = (clickX - transformRef.current.x) / transformRef.current.scale;
    const worldY = (clickY - transformRef.current.y) / transformRef.current.scale;

    if (isDraggingFlowerRef.current && draggedFlowerIdRef.current) {
      isDraggingFlowerRef.current = false;
      const finalX = Math.round(worldX + draggedFlowerOffsetRef.current.x);
      const finalY = Math.round(worldY + draggedFlowerOffsetRef.current.y);
      if (onUpdateFlowerPosition) {
        onUpdateFlowerPosition(draggedFlowerIdRef.current, finalX, finalY);
      }
      draggedFlowerIdRef.current = null;
      return;
    }

    isDraggingRef.current = false;
    touchPinchDistRef.current = null;

    const moveDist = Math.hypot(
      e.clientX - clickStartPosRef.current.x,
      e.clientY - clickStartPosRef.current.y
    );

    if (moveDist < 8) {
      let hitFlower = null;
      for (const flower of flowers) {
        const dist = Math.hypot(flower.x - worldX, flower.y - worldY);
        if (dist < 45) {
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

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (touchPinchDistRef.current !== null) {
        const factor = dist / touchPinchDistRef.current;
        const oldScale = transformRef.current.scale;
        const newScale = oldScale * factor;

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

  const getCanvasCursor = () => {
    if (isPlantingMode) return 'crosshair';
    if (isAdminAuthenticated && adminTool === 'move_flower') return 'move';
    return 'grab';
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={handleTouchMove}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        cursor: getCanvasCursor(),
        touchAction: 'none'
      }}
    />
  );
}

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

  // 1. Floating Hearts Animation (animation === 'heart')
  if (flower.animation === 'heart') {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const cycle = (time * 1.5 + i * 0.8 + (x % 7)) % 2.5;
      const hY = -50 * scale - cycle * 28 * scale;
      const hX = Math.sin(time * 3 + i * 1.8) * 16 * scale;
      const hAlpha = cycle < 0.4 ? cycle / 0.4 : cycle > 2.0 ? (2.5 - cycle) / 0.5 : 1;
      const hSize = Math.max(12, (16 + Math.sin(time * 4 + i) * 3) * scale);
      ctx.save();
      ctx.globalAlpha = alpha * Math.max(0, Math.min(1, hAlpha));
      ctx.translate(hX, hY);
      ctx.font = `${hSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(i % 2 === 0 ? '💜' : '💖', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // 2. Twinkling Orbiting Stars Animation (animation === 'star')
  if (flower.animation === 'star') {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const angle = time * 2.2 + (i * Math.PI * 2) / 5;
      const r = (30 + Math.sin(time * 3 + i) * 8) * scale;
      const sX = Math.cos(angle) * r;
      const sY = -50 * scale + Math.sin(angle) * r * 0.5;
      const sSize = Math.max(12, (15 + Math.sin(time * 6 + i * 2) * 4) * scale);
      ctx.save();
      ctx.translate(sX, sY);
      ctx.font = `${sSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(i % 2 === 0 ? '⭐' : '✨', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // 3. Custom Color Mystical Smoke Animation (animation === 'smoke')
  if (flower.animation === 'smoke') {
    ctx.save();
    const smokeColor = flower.animationColor || '#a855f7';
    for (let i = 0; i < 5; i++) {
      const cycle = (time * 1.2 + i * 0.6) % 3;
      const smY = -50 * scale - cycle * 30 * scale;
      const smX = Math.sin(time * 2 + i * 1.5) * (12 + cycle * 8) * scale;
      const smRadius = (16 + cycle * 22) * scale;
      const smAlpha = (1 - cycle / 3) * 0.45;

      const grad = ctx.createRadialGradient(smX, smY, 2 * scale, smX, smY, smRadius);
      grad.addColorStop(0, smokeColor);
      grad.addColorStop(0.5, smokeColor + '88');
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.globalAlpha = alpha * Math.max(0, smAlpha);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(smX, smY, smRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // 4. Dark Gothic Fluttering Bats Animation (animation === 'bats')
  if (flower.animation === 'bats') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const orbitAngle = time * 2.5 + (i * Math.PI * 2) / 3;
      const rX = (34 + Math.sin(time * 3 + i) * 10) * scale;
      const rY = (18 + Math.cos(time * 4 + i) * 6) * scale;
      const batX = Math.cos(orbitAngle) * rX;
      const batY = -50 * scale + Math.sin(orbitAngle) * rY;
      const batSize = Math.max(14, (18 + Math.sin(time * 5 + i) * 3) * scale);

      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.translate(batX, batY);
      ctx.font = `${batSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🦇', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // 5. Floating Glowing Fireflies Animation (animation === 'fireflies')
  if (flower.animation === 'fireflies') {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const flyX = Math.sin(time * 1.8 + i * 2.4) * 36 * scale;
      const flyY = -50 * scale + Math.cos(time * 1.4 + i * 1.9) * 26 * scale;
      const glowPulse = 0.4 + 0.6 * Math.abs(Math.sin(time * 5 + i * 3));

      ctx.save();
      ctx.globalAlpha = alpha * glowPulse * 0.6;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(flyX, flyY, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha * glowPulse;
      ctx.translate(flyX, flyY);
      ctx.font = `${Math.max(10, 12 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('✨', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // 6. Fluttering Butterflies Animation (animation === 'butterflies')
  if (flower.animation === 'butterflies') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const angle = time * 1.8 + (i * Math.PI * 2) / 3;
      const bR = (32 + Math.sin(time * 2.5 + i) * 8) * scale;
      const bX = Math.cos(angle) * bR;
      const bY = -50 * scale + Math.sin(angle) * bR * 0.6;
      const bSize = Math.max(14, (17 + Math.sin(time * 4 + i) * 2) * scale);

      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.translate(bX, bY);
      ctx.font = `${bSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🦋', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // 7. Spinning Rainbow Ring Animation (animation === 'rainbow_ring')
  if (flower.animation === 'rainbow_ring') {
    ctx.save();
    const ringAngle = time * 1.5;
    const ringR = (42 + Math.sin(time * 3) * 6) * scale;
    ctx.translate(0, -50 * scale);
    ctx.rotate(ringAngle);

    const ringGrad = ctx.createConicGradient(0, 0, 0);
    ringGrad.addColorStop(0, '#ff4d6d');
    ringGrad.addColorStop(0.2, '#ffb703');
    ringGrad.addColorStop(0.4, '#06d6a0');
    ringGrad.addColorStop(0.6, '#4cc9f0');
    ringGrad.addColorStop(0.8, '#7209b7');
    ringGrad.addColorStop(1, '#ff4d6d');

    ctx.globalAlpha = alpha * 0.55;
    ctx.lineWidth = 4 * scale;
    ctx.strokeStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 8. Falling Sakura Petals Animation (animation === 'sakura_petals')
  if (flower.animation === 'sakura_petals') {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const cycle = (time * 1.3 + i * 0.7) % 2.8;
      const sakY = -70 * scale + cycle * 30 * scale;
      const sakX = Math.sin(time * 2.5 + i * 1.8) * 22 * scale;
      const sakAlpha = cycle < 0.4 ? cycle / 0.4 : cycle > 2.2 ? (2.8 - cycle) / 0.6 : 1;
      const sakSize = Math.max(12, (15 + Math.sin(time * 3 + i) * 2) * scale);

      ctx.save();
      ctx.globalAlpha = alpha * Math.max(0, Math.min(1, sakAlpha));
      ctx.translate(sakX, sakY);
      ctx.font = `${sakSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🌸', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // 9. Golden Sparkles Fountain Animation (animation === 'sparkles_gold')
  if (flower.animation === 'sparkles_gold') {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const cycle = (time * 2.0 + i * 0.5) % 2;
      const spY = -50 * scale - Math.sin(cycle * (Math.PI / 2)) * 32 * scale;
      const spX = (i - 2) * 12 * scale + Math.sin(time * 4 + i) * 6 * scale;
      const spAlpha = 1 - cycle / 2;
      const spSize = Math.max(12, (16 + Math.sin(time * 5 + i) * 3) * scale);

      ctx.save();
      ctx.globalAlpha = alpha * Math.max(0, spAlpha);
      ctx.translate(spX, spY);
      ctx.font = `${spSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(i % 2 === 0 ? '💫' : '✨', 0, 0);
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
