import * as THREE from 'three';

export const palette = { teal: '#146466', deep: '#0b3033', cream: '#fdf8f0', gold: '#f4b740' };
export const smooth = (n) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
export const reveal = (frame, start, length = 30) => smooth((frame - start) / length);
export const lerp = (a, b, t) => a + (b - a) * t;

export function clothTexture() {
  const size = 128;
  const data = new Uint8Array(size * size);
  let seed = 130513;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const weave = Math.sin(x * Math.PI / 2) * 18 + Math.cos(y * Math.PI / 2) * 18;
      data[y * size + x] = 128 + weave + (seed / 0x100000000 - 0.5) * 55;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.needsUpdate = true;
  return texture;
}

export function roundedShape(width, height, radius) {
  const s = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  s.moveTo(x + radius, y);
  s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius);
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}

function ellipse(ctx, x, y, rx, ry, color, stroke) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 4; ctx.stroke(); }
}

// Original vector artwork only. Arabic remains in the DOM layer.
export function pageArtwork(side) {
  const canvas = globalThis.document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fdf8f0';
  ctx.fillRect(0, 0, 768, 1024);
  let seed = side === 'left' ? 1313 : 1513;
  for (let i = 0; i < 9000; i++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const x = (seed % 768);
    seed = (1664525 * seed + 1013904223) >>> 0;
    const y = (seed % 1024);
    ctx.fillStyle = 'rgba(101,83,48,0.035)';
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.strokeStyle = '#d9c299';
  ctx.lineWidth = 2;
  ctx.strokeRect(47, 56, 674, 912);
  ctx.fillStyle = '#d9e4cd';
  ctx.beginPath();
  ctx.moveTo(60, 780);
  ctx.bezierCurveTo(190, 560, 390, 850, 710, 630);
  ctx.lineTo(710, 960); ctx.lineTo(60, 960); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b5cdbb';
  ctx.beginPath();
  ctx.moveTo(60, 875); ctx.bezierCurveTo(290, 690, 450, 960, 710, 780);
  ctx.lineTo(710, 960); ctx.lineTo(60, 960); ctx.closePath(); ctx.fill();
  if (side === 'left') {
    ctx.save();
    ctx.translate(365, 420);
    ctx.rotate(-0.07);
    ellipse(ctx, -125, 120, 39, 91, '#79a599', '#3b7773');
    ellipse(ctx, 125, 120, 39, 91, '#79a599', '#3b7773');
    ellipse(ctx, -65, 292, 64, 38, '#628b82', '#3b7773');
    ellipse(ctx, 65, 292, 64, 38, '#628b82', '#3b7773');
    ellipse(ctx, 0, 155, 139, 162, '#6c9b90', '#3b7773');
    ellipse(ctx, 0, 175, 86, 119, '#e9e1c9');
    ellipse(ctx, -92, -101, 42, 78, '#83afa2', '#3b7773');
    ellipse(ctx, 92, -101, 42, 78, '#83afa2', '#3b7773');
    ellipse(ctx, 0, -12, 140, 126, '#83afa2', '#3b7773');
    ctx.strokeStyle = '#153e3f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-60, -30); ctx.lineTo(-30, 0); ctx.moveTo(-30, -30); ctx.lineTo(-60, 0); ctx.stroke();
    ellipse(ctx, 46, -15, 8, 12, '#153e3f');
    ellipse(ctx, 0, 32, 16, 8, '#153e3f');
    ctx.beginPath(); ctx.moveTo(-23, 54); ctx.quadraticCurveTo(0, 71, 23, 54); ctx.lineWidth = 4; ctx.stroke();
    ctx.setLineDash([9, 9]); ctx.strokeStyle = '#bd9f63'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 175, 76, 109, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = '#f0c96e'; ctx.lineWidth = 39; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(380, 935); ctx.bezierCurveTo(190, 800, 540, 730, 365, 594); ctx.stroke();
    ctx.fillStyle = '#a2c1b3';
    ctx.beginPath(); ctx.moveTo(185, 590); ctx.lineTo(294, 393); ctx.lineTo(420, 590); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d4dfc7';
    ctx.beginPath(); ctx.moveTo(320, 590); ctx.lineTo(460, 331); ctx.lineTo(603, 590); ctx.closePath(); ctx.fill();
    ellipse(ctx, 250, 247, 49, 49, '#edce86');
    ctx.strokeStyle = '#5f958d'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(462, 219); ctx.quadraticCurveTo(481, 190, 500, 219); ctx.quadraticCurveTo(519, 190, 538, 219); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
