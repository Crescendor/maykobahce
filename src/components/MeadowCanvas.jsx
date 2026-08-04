function clampTransform(unclamped) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Minimum scale is calculated so that GARDEN_SIZE covers/fits the viewport cleanly
  // Prevents zooming out into empty black space beyond the garden boundaries
  const minScale = Math.max(width / GARDEN_SIZE, height / GARDEN_SIZE);
  const maxScale = 2.5;

  const scale = Math.min(Math.max(unclamped.scale, minScale), maxScale);

  const worldW = GARDEN_SIZE * scale;
  const worldH = GARDEN_SIZE * scale;

  let x = unclamped.x;
  let y = unclamped.y;

  if (worldW <= width) {
    x = (width - worldW) / 2;
  } else {
    const minX = width - worldW;
    const maxX = 0;
    x = Math.min(Math.max(x, minX), maxX);
  }

  if (worldH <= height) {
    y = (height - worldH) / 2;
  } else {
    const minY = height - worldH;
    const maxY = 0;
    y = Math.min(Math.max(y, minY), maxY);
  }

  return { x, y, scale };
}

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

  const [transform, setTransform] = useState(() =>
    clampTransform({
      x: -GARDEN_SIZE / 2 + window.innerWidth / 2,
      y: -GARDEN_SIZE / 2 + window.innerHeight / 2,
      scale: 0.8
    })
  );

  const transformRef = useRef(transform);
  transformRef.current = transform;

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const clickStartPosRef = useRef({ x: 0, y: 0 });
  const touchPinchDistRef = useRef(null);

  const isDraggingFlowerRef = useRef(false);
  const draggedFlowerIdRef = useRef(null);
  const draggedFlowerOffsetRef = useRef({ x: 0, y: 0 });

  // Keep camera clamped on window resize
  useEffect(() => {
    const handleResize = () => {
      const clamped = clampTransform(transformRef.current);
      setTransform(clamped);
      if (onViewportChange) onViewportChange(clamped);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onViewportChange]);

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

      const unclamped = {
        x: startX + (targetX - startX) * easeProgress,
        y: startY + (targetY - startY) * easeProgress,
        scale: startScale + (targetScale - startScale) * easeProgress
      };
      const nextTransform = clampTransform(unclamped);

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

    // Outer background fill (prevents subpixel artifacts)
    ctx.fillStyle = '#0f2317';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(transformRef.current.x, transformRef.current.y);
    ctx.scale(transformRef.current.scale, transformRef.current.scale);

    const scale = transformRef.current.scale;

    // 1. Outer Countryside Ground Base
    ctx.fillStyle = '#1e402e';
    ctx.fillRect(0, 0, GARDEN_SIZE, GARDEN_SIZE);

    // 2. Render Outer Countryside Scenery (Trees, River, Bridge, Cottages, Windmill)
    drawOuterScenery(ctx, time);

    // 3. Render Inner Plantable Meadow Lawn Base
    ctx.fillStyle = '#2d6a4f';
    const innerSize = GARDEN_SIZE - 2 * FENCE_PADDING;
    ctx.fillRect(FENCE_PADDING, FENCE_PADDING, innerSize, innerSize);

    drawLawnDetails(ctx);

    // 4. Render Wooden Fence Outer Boundary
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
      const newScale = oldScale * zoomFactor;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - transformRef.current.x) * (newScale / oldScale);
      const newY = mouseY - (mouseY - transformRef.current.y) * (newScale / oldScale);

      const unclamped = { x: newX, y: newY, scale: newScale };
      const nextTransform = clampTransform(unclamped);

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
      const unclamped = {
        ...transformRef.current,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      };
      const nextTransform = clampTransform(unclamped);

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

        const unclamped = { x: newX, y: newY, scale: newScale };
        const nextTransform = clampTransform(unclamped);

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

/**
 * Draw Cozy Countryside Scenery Outside the Flower Garden Fences
 * (Trees, River with Ripples, Stone Bridges, Wooden Cottages, Smoking Chimney, Windmill, Cobblestone Paths)
 */
function drawOuterScenery(ctx, time = 0) {
  const p = FENCE_PADDING;
  const size = GARDEN_SIZE;

  // 1. Winding Blue River & Stone Bridge along the right outer margin
  ctx.save();
  // River Bank / Dirt Bed
  ctx.strokeStyle = '#343a40';
  ctx.lineWidth = 64;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(size - 75, 0);
  ctx.bezierCurveTo(size - 160, 700, size - 30, 1500, size - 85, size);
  ctx.stroke();

  // Water Stream
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 46;
  ctx.beginPath();
  ctx.moveTo(size - 75, 0);
  ctx.bezierCurveTo(size - 160, 700, size - 30, 1500, size - 85, size);
  ctx.stroke();

  // Animated Water Ripples
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  for (let y = 120; y < size; y += 220) {
    const waveX = (size - 85) + Math.sin(time * 3 + y * 0.02) * 22;
    const waveY = y + (Math.cos(time * 2 + y * 0.01) * 10);
    ctx.beginPath();
    ctx.arc(waveX, waveY, 14, 0, Math.PI);
    ctx.stroke();
  }

  // Stone Bridge over the river at (size - 100, 1200)
  const brX = size - 95;
  const brY = 1200;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(brX - 35, brY - 15, 70, 30);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(brX - 35, brY - 15, 70, 30);
  // Bridge Wooden Railings
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(brX - 35, brY - 20, 70, 5);
  ctx.fillRect(brX - 35, brY + 15, 70, 5);
  ctx.restore();

  // 2. Cozy Country Cottage with Smoking Chimney (Top-Left Outer Corner)
  drawCottage(ctx, 110, 110, time);

  // 3. Traditional Wooden Windmill with Rotating Blades (Bottom-Left Outer Corner)
  drawWindmill(ctx, 110, size - 110, time);

  // 4. Gardener's Shed & Flower Cart (Top-Right Outer Corner)
  drawGardenerShed(ctx, size - 110, 110);

  // 5. Cobblestone Pathways connecting houses to garden fences
  drawCobblestonePaths(ctx);

  // 6. Lush Outer Forest Trees (Pine, Oak, Sakura, Autumn Orange)
  drawOuterTrees(ctx, time);
}

function drawCottage(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);

  // Ground Shadow
  ctx.fillStyle = 'rgba(10, 25, 18, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 35, 45, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // House Body
  ctx.fillStyle = '#fef3c7';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.fillRect(-35, -20, 70, 50);
  ctx.strokeRect(-35, -20, 70, 50);

  // Red Tiled Roof
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(-45, -20);
  ctx.lineTo(0, -55);
  ctx.lineTo(45, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Chimney & Animated Smoke
  ctx.fillStyle = '#451a03';
  ctx.fillRect(18, -48, 12, 22);

  // Smoke Puffs
  for (let i = 0; i < 3; i++) {
    const cycle = (time * 1.5 + i * 0.8) % 2.5;
    const smY = -52 - cycle * 22;
    const smX = 24 + Math.sin(time * 2 + i) * 8;
    const smAlpha = 1 - cycle / 2.5;
    const smSize = 6 + cycle * 5;

    ctx.save();
    ctx.globalAlpha = Math.max(0, smAlpha * 0.7);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(smX, smY, smSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Wooden Door
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-10, 10, 20, 20);

  // Glowing Yellow Window
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-28, -5, 14, 14);
  ctx.fillRect(14, -5, 14, 14);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-28, -5, 14, 14);
  ctx.strokeRect(14, -5, 14, 14);

  ctx.restore();
}

function drawWindmill(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);

  // Ground Shadow
  ctx.fillStyle = 'rgba(10, 25, 18, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 35, 40, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tower Base (Trapezoid)
  ctx.fillStyle = '#d97706';
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-25, 30);
  ctx.lineTo(-15, -45);
  ctx.lineTo(15, -45);
  ctx.lineTo(25, 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cap Roof
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(0, -45, 16, Math.PI, 0);
  ctx.fill();

  // Rotating Blades
  ctx.save();
  ctx.translate(0, -45);
  ctx.rotate(time * 0.8);

  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';

  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillRect(0, -4, 42, 8);
    ctx.strokeRect(0, -4, 42, 8);
  }
  ctx.restore();

  ctx.restore();
}

function drawGardenerShed(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(10, 25, 18, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 25, 35, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wooden Shed
  ctx.fillStyle = '#854d0e';
  ctx.strokeStyle = '#365314';
  ctx.lineWidth = 3;
  ctx.fillRect(-28, -15, 56, 40);
  ctx.strokeRect(-28, -15, 56, 40);

  // Roof
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(-35, -15);
  ctx.lineTo(0, -40);
  ctx.lineTo(35, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flower Cart next to shed
  ctx.fillStyle = '#b45309';
  ctx.fillRect(32, 5, 24, 14);
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath();
  ctx.arc(38, 2, 5, 0, Math.PI * 2);
  ctx.arc(48, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCobblestonePaths(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';

  const stones = [
    { x: 130, y: 170 }, { x: 145, y: 195 }, { x: 160, y: 220 },
    { x: 175, y: 240 }, { x: 200, y: 240 }, { x: 225, y: 240 },
    { x: 1400, y: 2600 }, { x: 1400, y: 2630 }, { x: 1400, y: 2660 }
  ];

  stones.forEach((st) => {
    ctx.beginPath();
    ctx.ellipse(st.x, st.y, 7, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawOuterTrees(ctx, time) {
  ctx.save();
  const p = FENCE_PADDING;
  const size = GARDEN_SIZE;

  const treePositions = [];

  // Top Border
  for (let x = 60; x < size; x += 110) {
    if (x < p - 30 || x > size - p + 30) treePositions.push({ x, y: 60, type: x % 3 });
    treePositions.push({ x, y: p / 2, type: (x + 1) % 3 });
  }
  // Bottom Border
  for (let x = 60; x < size; x += 110) {
    if (x < p - 30 || x > size - p + 30) treePositions.push({ x, y: size - 60, type: (x + 2) % 3 });
    treePositions.push({ x, y: size - p / 2, type: x % 3 });
  }
  // Left Border
  for (let y = 60; y < size; y += 110) {
    treePositions.push({ x: 60, y, type: y % 3 });
    treePositions.push({ x: p / 2, y, type: (y + 1) % 3 });
  }
  // Right Border
  for (let y = 60; y < size; y += 110) {
    if (y < 1000 || y > 1400) {
      treePositions.push({ x: size - 60, y, type: (y + 2) % 3 });
    }
  }

  treePositions.forEach((tp) => {
    const sway = Math.sin(time * 1.8 + tp.x * 0.02 + tp.y * 0.01) * 0.05;
    ctx.save();
    ctx.translate(tp.x, tp.y);
    ctx.rotate(sway);

    if (tp.type === 0) {
      // Pine Tree 🌲
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-4, 0, 8, 16);
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(-20, -18);
      ctx.lineTo(20, -18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(-24, 0);
      ctx.lineTo(24, 0);
      ctx.closePath();
      ctx.fill();
    } else if (tp.type === 1) {
      // Oak Tree 🌳
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-5, 0, 10, 18);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, -18, 22, 0, Math.PI * 2);
      ctx.arc(-10, -10, 16, 0, Math.PI * 2);
      ctx.arc(10, -10, 16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sakura / Autumn Tree 🌸
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, 0, 8, 16);
      ctx.fillStyle = tp.x % 2 === 0 ? '#f472b6' : '#f97316';
      ctx.beginPath();
      ctx.arc(0, -16, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });

  ctx.restore();
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
