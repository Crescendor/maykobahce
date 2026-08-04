// Garden Engine Utilities
// Dimensions and constraints for the Virtual Meadow

export const GARDEN_SIZE = 2000;
export const FENCE_PADDING = 120;
export const MIN_FLOWER_DISTANCE = 45; // minimum distance between flowers in pixels
export const MAX_FLOWERS = 3000;

const LOCAL_STORAGE_KEY = 'mayko_garden_flowers_v1';
const DELETED_IDS_KEY  = 'mayko_deleted_flower_ids_v1';
const PENDING_IDS_KEY  = 'mayko_pending_flower_ids_v1'; // IDs added locally, not yet confirmed in D1

// ─── Tombstone helpers (deleted flowers never come back) ─────────
export function loadDeletedIds() {
  try {
    const s = localStorage.getItem(DELETED_IDS_KEY);
    if (s) return new Set(JSON.parse(s));
  } catch (e) {}
  return new Set();
}
export function addDeletedId(id) {
  try {
    const set = loadDeletedIds();
    set.add(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

// ─── Pending helpers (new local flowers awaiting D1 confirmation) ─
function loadPendingMap() {
  try {
    const s = localStorage.getItem(PENDING_IDS_KEY);
    if (s) return JSON.parse(s);
  } catch (e) {}
  return {};
}
export function addPendingId(id) {
  try {
    const map = loadPendingMap();
    map[id] = Date.now();
    localStorage.setItem(PENDING_IDS_KEY, JSON.stringify(map));
  } catch (e) {}
}
// Returns Set of pending IDs created locally that are still not confirmed by remote
function getActivePendingIds(remoteIds) {
  const map = loadPendingMap();
  const kept = {};
  const active = new Set();
  for (const [id, ts] of Object.entries(map)) {
    if (!remoteIds.has(id)) {
      kept[id] = ts;   // keep local flower on device until remote has it or tombstone deletes it
      active.add(id);
    }
  }
  localStorage.setItem(PENDING_IDS_KEY, JSON.stringify(kept));
  return active;
}

// 5 Distinct Stem Presets with custom leaf shapes & structures
export const STEM_TYPES = [
  { id: 'classic', name: 'Klasik Oval', icon: '🌿' },
  { id: 'curved', name: 'Sarmaşık Kalp', icon: '💚' },
  { id: 'bushy', name: 'Tırtıklı Eğrelti', icon: '🍃' },
  { id: 'thorny', name: 'Dikenli Gül', icon: '🌹' },
  { id: 'slender', name: 'Üçlü Yonca', icon: '☘️' }
];

// Stem Color Palette
export const STEM_COLORS = [
  '#52b788', // Canlı Yeşil
  '#2d6a4f', // Orman Yeşili
  '#10b981', // Zümrüt Yeşili
  '#6b705c', // Zeytin Yeşili
  '#4a154b'  // Morumsu Gece Sapı
];

// Alphanumeric characters for 6 & 8 character codes
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generate6CharPassword() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[randomIndex];
  }
  return code;
}

export function generate8CharDeleteCode() {
  let code = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[randomIndex];
  }
  return code;
}

export function formatInstagramHandle(input) {
  if (!input) return '';
  let cleaned = input.trim().replace(/^@+/, '');
  cleaned = cleaned.replace(/\s+/g, '');
  return cleaned ? `@${cleaned}` : '';
}

export function isPositionValid(x, y, existingFlowers, minDistance = MIN_FLOWER_DISTANCE) {
  const minBound = FENCE_PADDING + 15;
  const maxBound = GARDEN_SIZE - FENCE_PADDING - 15;

  if (x < minBound || x > maxBound || y < minBound || y > maxBound) {
    return { valid: false, reason: 'Çitlerin dışına çiçek dikilemez!' };
  }

  for (const rawFlower of existingFlowers) {
    let fx = Number(rawFlower.x) || 0;
    let fy = Number(rawFlower.y) || 0;
    if (fx > 2000 || fy > 2000) {
      fx = Math.round(fx * 0.5);
      fy = Math.round(fy * 0.5);
    }

    const dx = fx - x;
    const dy = fy - y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistance * minDistance) {
      return { valid: false, reason: 'Bu nokta başka bir çiçeğe çok yakın! Lütfen biraz boşluk bırakın.' };
    }
  }

  return { valid: true };
}

export function hexToRgb(hex) {
  let c = (hex || '#ff4d6d').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Render any of the 5 Distinct Stem Presets cleanly on Canvas
 * Delicate, slightly shrunk height (stemHeight = 50 * scale)
 */
export function drawStem(ctx, stemType = 'classic', stemColor = '#52b788', scale = 1) {
  ctx.save();

  const primaryColor = stemColor || '#52b788';
  const outlineColor = '#0f291e';
  const stemHeight = 50 * scale;

  if (stemType === 'curved') {
    // 1. Sarmaşık Kalp Yapraklı Sap
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 6.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-10 * scale, -stemHeight * 0.35, 10 * scale, -stemHeight * 0.7, 0, -stemHeight);
    ctx.stroke();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4 * scale;
    ctx.stroke();

    drawHeartLeaf(ctx, -10 * scale, -stemHeight * 0.3, 8 * scale, -Math.PI / 4, primaryColor, outlineColor);
    drawHeartLeaf(ctx, 10 * scale, -stemHeight * 0.6, 8 * scale, Math.PI / 4, primaryColor, outlineColor);
    drawHeartLeaf(ctx, -7 * scale, -stemHeight * 0.85, 7 * scale, -Math.PI / 6, primaryColor, outlineColor);

  } else if (stemType === 'bushy') {
    // 2. Tırtıklı Eğrelti Sapı
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 6.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stemHeight);
    ctx.stroke();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4 * scale;
    ctx.stroke();

    drawSerratedLeaf(ctx, -10 * scale, -stemHeight * 0.25, 10 * scale, -Math.PI / 4, primaryColor, outlineColor);
    drawSerratedLeaf(ctx, 10 * scale, -stemHeight * 0.45, 10 * scale, Math.PI / 4, primaryColor, outlineColor);
    drawSerratedLeaf(ctx, -9 * scale, -stemHeight * 0.65, 8 * scale, -Math.PI / 5, primaryColor, outlineColor);
    drawSerratedLeaf(ctx, 9 * scale, -stemHeight * 0.85, 8 * scale, Math.PI / 5, primaryColor, outlineColor);

  } else if (stemType === 'thorny') {
    // 3. Dikenli Gül Sapı
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 6.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-5 * scale, -stemHeight * 0.5, 0, -stemHeight);
    ctx.stroke();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4 * scale;
    ctx.stroke();

    // Thorns
    ctx.fillStyle = outlineColor;
    ctx.beginPath();
    ctx.moveTo(-2 * scale, -stemHeight * 0.25);
    ctx.lineTo(-7 * scale, -stemHeight * 0.3);
    ctx.lineTo(-2 * scale, -stemHeight * 0.35);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2 * scale, -stemHeight * 0.55);
    ctx.lineTo(7 * scale, -stemHeight * 0.6);
    ctx.lineTo(2 * scale, -stemHeight * 0.65);
    ctx.fill();

    drawOvalLeaf(ctx, -11 * scale, -stemHeight * 0.4, 9 * scale, 4.5 * scale, -Math.PI / 4, primaryColor, outlineColor);
    drawOvalLeaf(ctx, 11 * scale, -stemHeight * 0.75, 9 * scale, 4.5 * scale, Math.PI / 4, primaryColor, outlineColor);

  } else if (stemType === 'slender') {
    // 4. Üçlü Yonca Sapı
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 5.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8 * scale, -stemHeight * 0.5, 0, -stemHeight);
    ctx.stroke();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3 * scale;
    ctx.stroke();

    drawCloverCluster(ctx, -8 * scale, -stemHeight * 0.45, 7 * scale, primaryColor, outlineColor);
    drawCloverCluster(ctx, 8 * scale, -stemHeight * 0.75, 7 * scale, primaryColor, outlineColor);

  } else {
    // 5. Klasik Oval Sap
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 6.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(7 * scale, -stemHeight * 0.5, 0, -stemHeight);
    ctx.stroke();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4 * scale;
    ctx.stroke();

    drawOvalLeaf(ctx, -10 * scale, -stemHeight * 0.35, 9.5 * scale, 4.5 * scale, -Math.PI / 4, primaryColor, outlineColor);
    drawOvalLeaf(ctx, 10 * scale, -stemHeight * 0.65, 9.5 * scale, 4.5 * scale, Math.PI / 4, primaryColor, outlineColor);
  }

  ctx.restore();
}

/**
 * Leaf Drawing Helper Functions
 */
function drawOvalLeaf(ctx, x, y, rx, ry, rot, fillC, outlineC) {
  ctx.fillStyle = outlineC;
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 1.2, ry + 1.2, rot, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fillC;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = outlineC;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - rx * Math.cos(rot), y - rx * Math.sin(rot));
  ctx.lineTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
  ctx.stroke();
}

function drawHeartLeaf(ctx, x, y, size, rot, fillC, outlineC) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  ctx.fillStyle = outlineC;
  ctx.beginPath();
  ctx.arc(-size * 0.3, -size * 0.3, size * 0.4, 0, Math.PI * 2);
  ctx.arc(size * 0.3, -size * 0.3, size * 0.4, 0, Math.PI * 2);
  ctx.moveTo(-size * 0.6, -size * 0.1);
  ctx.lineTo(0, size * 0.7);
  ctx.lineTo(size * 0.6, -size * 0.1);
  ctx.fill();

  ctx.fillStyle = fillC;
  ctx.beginPath();
  ctx.arc(-size * 0.3, -size * 0.3, size * 0.32, 0, Math.PI * 2);
  ctx.arc(size * 0.3, -size * 0.3, size * 0.32, 0, Math.PI * 2);
  ctx.moveTo(-size * 0.5, -size * 0.1);
  ctx.lineTo(0, size * 0.6);
  ctx.lineTo(size * 0.5, -size * 0.1);
  ctx.fill();

  ctx.restore();
}

function drawSerratedLeaf(ctx, x, y, length, rot, fillC, outlineC) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  ctx.fillStyle = outlineC;
  ctx.beginPath();
  ctx.moveTo(0, -length * 0.6);
  ctx.lineTo(-5, -length * 0.3);
  ctx.lineTo(-2.5, -length * 0.1);
  ctx.lineTo(-6.5, 0);
  ctx.lineTo(0, length * 0.4);
  ctx.lineTo(6.5, 0);
  ctx.lineTo(2.5, -length * 0.1);
  ctx.lineTo(5, -length * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = fillC;
  ctx.beginPath();
  ctx.moveTo(0, -length * 0.5);
  ctx.lineTo(-3.8, -length * 0.25);
  ctx.lineTo(-1.8, -length * 0.08);
  ctx.lineTo(-5, 0);
  ctx.lineTo(0, length * 0.32);
  ctx.lineTo(5, 0);
  ctx.lineTo(1.8, -length * 0.08);
  ctx.lineTo(3.8, -length * 0.25);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCloverCluster(ctx, x, y, r, fillC, outlineC) {
  ctx.save();
  ctx.translate(x, y);

  for (let a = 0; a < 3; a++) {
    const angle = (a * Math.PI * 2) / 3;
    const cx = Math.cos(angle) * (r * 0.7);
    const cy = Math.sin(angle) * (r * 0.7);

    ctx.fillStyle = outlineC;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fillC;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawSmoothStroke(ctx, stroke) {
  if (stroke.type === 'fill') {
    performFloodFill(ctx, stroke.x, stroke.y, stroke.color, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  const points = stroke.points;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = stroke.color || '#ff4d6d';
  ctx.fillStyle = stroke.fillColor || stroke.color || '#ff4d6d';
  ctx.lineWidth = stroke.size || 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 1;

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  const p1 = points[0];
  const p2 = points[points.length - 1];

  // Straight Line Tool
  if (stroke.tool === 'line') {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Circle / Ellipse Tool
  if (stroke.tool === 'circle') {
    const rx = Math.abs(p2.x - p1.x) / 2;
    const ry = Math.abs(p2.y - p1.y) / 2;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    if (stroke.isFilled) {
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Square / Rectangle Tool
  if (stroke.tool === 'rect') {
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    ctx.beginPath();
    ctx.rect(minX, minY, w, h);
    if (stroke.isFilled) {
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Freehand Brush
  ctx.beginPath();

  if (points.length === 1) {
    ctx.arc(points[0].x, points[0].y, (stroke.size || 8) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (points.length === 2) {
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  const lastIndex = points.length - 1;
  ctx.lineTo(points[lastIndex].x, points[lastIndex].y);

  if (stroke.isClosed) {
    ctx.closePath();
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

export function performFloodFill(ctx, startX, startY, fillColorHex, width = 300, height = 300) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const targetRgb = hexToRgb(fillColorHex);

  const startXInt = Math.floor(startX);
  const startYInt = Math.floor(startY);

  if (startXInt < 0 || startXInt >= width || startYInt < 0 || startYInt >= height) return;

  const startPos = (startYInt * width + startXInt) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  if (startR === targetRgb.r && startG === targetRgb.g && startB === targetRgb.b && startA === 255) {
    return;
  }

  const queue = [[startXInt, startYInt]];
  const visited = new Uint8Array(width * height);

  const colorMatch = (pos) => {
    return Math.abs(data[pos] - startR) < 35 &&
           Math.abs(data[pos + 1] - startG) < 35 &&
           Math.abs(data[pos + 2] - startB) < 35 &&
           Math.abs(data[pos + 3] - startA) < 35;
  };

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const pos = idx * 4;
    if (!colorMatch(pos)) continue;

    data[pos] = targetRgb.r;
    data[pos + 1] = targetRgb.g;
    data[pos + 2] = targetRgb.b;
    data[pos + 3] = 255;

    if (x > 0) queue.push([x - 1, y]);
    if (x < width - 1) queue.push([x + 1, y]);
    if (y > 0) queue.push([x, y - 1]);
    if (y < height - 1) queue.push([x, y + 1]);
  }

  ctx.putImageData(imgData, 0, 0);
}

export function findRandomValidPosition(existingFlowers) {
  const minX = FENCE_PADDING + 60;
  const maxX = GARDEN_SIZE - FENCE_PADDING - 60;
  const minY = FENCE_PADDING + 60;
  const maxY = GARDEN_SIZE - FENCE_PADDING - 60;

  for (let attempt = 0; attempt < 200; attempt++) {
    const rx = Math.floor(minX + Math.random() * (maxX - minX));
    const ry = Math.floor(minY + Math.random() * (maxY - minY));
    if (isPositionValid(rx, ry, existingFlowers).valid) {
      return { x: rx, y: ry };
    }
  }

  for (let x = minX; x <= maxX; x += MIN_FLOWER_DISTANCE) {
    for (let y = minY; y <= maxY; y += MIN_FLOWER_DISTANCE) {
      if (isPositionValid(x, y, existingFlowers).valid) {
        return { x, y };
      }
    }
  }
  return null;
}

const SEED_PETAL_STYLES = [
  { type: 'daisy', color: '#FFD1DC', centerColor: '#FFCC00', petalCount: 8, radius: 22 },
  { type: 'rose', color: '#FF4D6D', centerColor: '#800F2F', petalCount: 12, radius: 24 },
  { type: 'sunflower', color: '#FFB703', centerColor: '#6B4226', petalCount: 14, radius: 26 },
  { type: 'lavender', color: '#9D4EDD', centerColor: '#E0AAFF', petalCount: 6, radius: 20 },
  { type: 'tulip', color: '#FF758F', centerColor: '#FFF0F5', petalCount: 5, radius: 22 },
  { type: 'cyan_bloom', color: '#4CC9F0', centerColor: '#F72585', petalCount: 9, radius: 23 },
  { type: 'orange_zest', color: '#FB8500', centerColor: '#FFB703', petalCount: 10, radius: 25 },
  { type: 'cherry_blossom', color: '#FFB3C6', centerColor: '#FF4D6D', petalCount: 5, radius: 21 },
];

const TURKISH_NAMES = [
  'Ayşe Yılmaz', 'Elif Demir', 'Zeynep Kaya', 'Ahmet Öztürk', 'Burak Celik',
  'Merve Arslan', 'Caner Şahin', 'Selin Aydın', 'Emre Yıldız', 'Gamze Kılıç',
  'Deniz Erdem', 'Bora Özkan', 'Gizem Doğan', 'Kaan Çakır', 'Duru Aksoy',
  'Oğuzhan Polat', 'Melisa Bulut', 'Efe Güneş', 'İrem Koç', 'Yusuf Tekin',
  'Ceren Aslan', 'Batu Çetin', 'Ece Kurt', 'Tarık Özdemir', 'Sena Kaplan'
];

const SEED_NOTES = [
  'Bahçeye ilk neşeli çiçeğimi bırakıyorum! 🌸',
  'Güzellikler paylaştıkça çoğalır. Sevgilerle!',
  'Baharın tüm renkleri bu bahçede toplansın ✨',
  'Tüm sevdiklerime armağan olsun 🌿',
  'Hayallerinizin peşinden koşmayı unutmayın!',
  'Dünyaya küçük bir gülücük bırak 🌻',
  'Sevgi ve barış dolu bir gün dileğiyle...',
  'Her çiçek kendi zamanında açar ❤️',
  'Gülümse, hayat yaşamaya değer! 😊',
  'Gözlerini kapat ve dilek tut ✨'
];

export function generateSeedFlowers(count = 140) {
  const seedFlowers = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const pos = findRandomValidPosition(seedFlowers);
    if (!pos) break;

    const style = SEED_PETAL_STYLES[i % SEED_PETAL_STYLES.length];
    const name = TURKISH_NAMES[i % TURKISH_NAMES.length];
    const isAnon = i % 5 === 0;
    const isPrivate = i % 8 === 0;
    const password = isPrivate ? generate6CharPassword() : null;
    const igHandle = !isAnon ? `@${name.toLowerCase().replace(/[^a-z]/g, '')}_${(i * 13) % 99}` : '';
    
    const strokes = generateProceduralPetalStrokes(style);
    const timeOffset = Math.floor(Math.random() * 15 * 86400 * 1000);
    const createdAt = new Date(now - timeOffset).toISOString();

    const stemTypes = ['classic', 'curved', 'bushy', 'thorny', 'slender'];

    seedFlowers.push({
      id: `flower-seed-${i + 1}`,
      x: pos.x,
      y: pos.y,
      name: isAnon ? 'Anonim' : name,
      instagram: igHandle,
      note: SEED_NOTES[i % SEED_NOTES.length],
      isAnonymous: isAnon,
      isPrivate: isPrivate,
      password: password,
      createdAt: createdAt,
      style: style,
      strokes: strokes,
      scale: 0.85 + Math.random() * 0.3,
      stemAngle: (Math.random() - 0.5) * 0.15,
      stemType: stemTypes[i % stemTypes.length],
      stemColor: STEM_COLORS[i % STEM_COLORS.length]
    });
  }

  return seedFlowers;
}

function generateProceduralPetalStrokes(style) {
  const strokes = [];
  const center = { x: 150, y: 150 };
  const numPetals = style.petalCount;
  const radius = style.radius * 2.8;

  for (let p = 0; p < numPetals; p++) {
    const angle = (p * (2 * Math.PI)) / numPetals;
    const pX = center.x + Math.cos(angle) * radius;
    const pY = center.y + Math.sin(angle) * radius;
    
    const cp1X = center.x + Math.cos(angle - 0.4) * (radius * 0.7);
    const cp1Y = center.y + Math.sin(angle - 0.4) * (radius * 0.7);
    const cp2X = center.x + Math.cos(angle + 0.4) * (radius * 0.7);
    const cp2Y = center.y + Math.sin(angle + 0.4) * (radius * 0.7);

    strokes.push({
      color: style.color,
      size: 14,
      points: [
        { x: center.x, y: center.y },
        { x: cp1X, y: cp1Y },
        { x: pX, y: pY },
        { x: cp2X, y: cp2Y },
        { x: center.x, y: center.y }
      ],
      isClosed: true,
      fillColor: style.color
    });
  }

  strokes.push({
    color: style.centerColor,
    size: 20,
    points: [
      { x: center.x - 5, y: center.y },
      { x: center.x + 5, y: center.y }
    ],
    fillColor: style.centerColor
  });

  return strokes;
}

export function loadGardenFlowers() {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading flowers from localStorage:', e);
  }

  // Garden starts completely clean and empty for user drawings
  return [];
}

export function saveGardenFlowers(flowers) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(flowers));
  } catch (e) {
    console.error('Error saving flowers to localStorage:', e);
  }
}

/**
 * Cloudflare Pages Functions API Sync Methods
 */

export async function fetchFlowersFromApi(isAdmin = false) {
  const local = loadGardenFlowers();
  const deleted = loadDeletedIds();
  try {
    const adminToken = localStorage.getItem('mayko_admin_token') || '';
    const apiUrl = (isAdmin && adminToken)
      ? `/api/flowers?adminPassword=${encodeURIComponent(adminToken)}`
      : '/api/flowers';
    const res = await fetch(apiUrl);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const remote = await res.json();
      if (Array.isArray(remote)) {
        const remoteIds = new Set(remote.map((f) => f.id));

        // Pending = locally added flowers not yet confirmed in D1 (< 3 min old)
        const pendingIds = getActivePendingIds(remoteIds);

        // Remote is THE source of truth. Only exception: pending local flowers on creator's device.
        const map = new Map(
          remote.filter((f) => !deleted.has(f.id)).map((f) => [f.id, f])
        );
        // Re-attach pending flowers from local state (only on flower creator's device)
        local.forEach((f) => {
          if (pendingIds.has(f.id) && !deleted.has(f.id)) map.set(f.id, f);
        });

        const result = Array.from(map.values());
        saveGardenFlowers(result);
        return result;
      }
    }
  } catch (e) {
    console.warn('Cloudflare API fetch offline, using localStorage fallback');
  }
  // Offline: return local minus tombstoned
  return local.filter((f) => !deleted.has(f.id));
}

export async function postFlowerToApi(newFlower) {
  try {
    const res = await fetch('/api/flowers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFlower)
    });
    if (res.ok) {
      return await res.json().catch(() => null);
    }
  } catch (e) {
    console.warn('Cloudflare API post offline, saved locally');
  }
  return null;
}

export async function deleteFlowerFromApi(flowerId, deleteCode = '', adminPassword = '') {
  try {
    const res = await fetch(`/api/flower/${flowerId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteCode, adminPassword })
    });
    if (res.ok) {
      return await res.json().catch(() => null);
    }
  } catch (e) {
    console.warn('Cloudflare API delete offline, deleted locally');
  }
  return null;
}

export async function patchFlowerToApi(flowerId, updates, adminPassword = '') {
  try {
    const res = await fetch(`/api/flower/${flowerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, adminPassword })
    });
    if (res.ok) {
      return await res.json().catch(() => null);
    }
  } catch (e) {
    console.warn('Cloudflare API patch offline, patched locally');
  }
  return null;
}

export async function fetchMeadowObjectsFromApi() {
  try {
    const res = await fetch('/api/meadow-objects');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('API fetch meadow objects error:', e);
  }
  return null;
}

export async function publishMeadowObjectsToApi(objects, adminPassword = '') {
  try {
    const res = await fetch('/api/meadow-objects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objects, adminPassword })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('API publish meadow objects error:', e);
  }
  return null;
}

export async function fetchCustomBgFromApi() {
  try {
    const res = await fetch('/api/custom-bg');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('API fetch custom bg error:', e);
  }
  return null;
}

export async function publishCustomBgToApi(customBg, adminPassword = '') {
  try {
    const res = await fetch('/api/custom-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customBg, adminPassword })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('API publish custom bg error:', e);
  }
  return null;
}

