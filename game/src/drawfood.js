// drawfood.js — drawNoodles(), drawRicePlate(), drawSatay(), drawIcedTea(),
// drawIngredient(): food art only. All canvas-drawn vector shapes (no image
// files, no copied art). Food must look worth serving: glossy highlights on
// every dish, and each ingredient reads at a glance at 1280x720 and smaller.
// sauce, steam on hot dishes, a fried-egg yolk that shines.

import { PALETTE } from './config.js';

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// A bowl (white mound / noodle swirl / tea) by ingredient kind, at (x, y), radius r.
export function drawIngredient(ctx, kind, prep, x, y, r) {
  // Bowl.
  ctx.fillStyle = '#E8DCC8';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#C9B896';
  ctx.fillRect(x - r, y - 2, r * 2, 4);
  if (kind === 'nasi') {
    ellipse(ctx, x, y - r * 0.2, r * 0.75, r * 0.45, '#FFF8E7');
    ellipse(ctx, x - r * 0.2, y - r * 0.35, r * 0.3, r * 0.18, '#FFFFFF');
  } else if (kind === 'mie') {
    ctx.strokeStyle = '#F2C14E';
    ctx.lineWidth = Math.max(2, r * 0.14);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x, y - r * 0.15, r * (0.55 - i * 0.14), Math.PI * 0.15, Math.PI * 1.15);
      ctx.stroke();
    }
  } else if (kind === 'telur') {
    if (prep === 'chopped') {
      // Cracked egg: white + shining yolk.
      ellipse(ctx, x, y - r * 0.1, r * 0.7, r * 0.4, '#FFF6E0');
      circle(ctx, x, y - r * 0.15, r * 0.32, '#F2A541');
      circle(ctx, x - r * 0.1, y - r * 0.25, r * 0.1, '#FFD98A');
    } else {
      ellipse(ctx, x, y - r * 0.1, r * 0.55, r * 0.65, '#E8B06A');
      ellipse(ctx, x - r * 0.15, y - r * 0.3, r * 0.2, r * 0.25, '#F0C48A');
    }
  } else if (kind === 'ayam') {
    if (prep === 'chopped') {
      // Chopped chicken cubes.
      ctx.fillStyle = '#E07856';
      ctx.fillRect(x - r * 0.6, y - r * 0.5, r * 0.5, r * 0.4);
      ctx.fillRect(x + r * 0.05, y - r * 0.35, r * 0.5, r * 0.4);
      ctx.fillStyle = '#F09A7A';
      ctx.fillRect(x - r * 0.55, y - r * 0.45, r * 0.2, r * 0.15);
    } else {
      // Drumstick.
      ctx.strokeStyle = '#F5E6C8';
      ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.beginPath();
      ctx.moveTo(x + r * 0.4, y - r * 0.1);
      ctx.lineTo(x + r * 0.8, y + r * 0.4);
      ctx.stroke();
      ellipse(ctx, x - r * 0.1, y - r * 0.15, r * 0.6, r * 0.5, '#E07856');
      ellipse(ctx, x - r * 0.25, y - r * 0.3, r * 0.25, r * 0.2, '#F09A7A');
    }
  } else if (kind === 'sayur') {
    if (prep === 'chopped') {
      ctx.fillStyle = '#5E9A4A';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        circle(ctx, x + Math.cos(a) * r * 0.35, y - r * 0.1 + Math.sin(a) * r * 0.2, r * 0.2, '#5E9A4A');
      }
      ctx.fillStyle = '#E07856';
      ctx.fillRect(x - r * 0.3, y - r * 0.2, r * 0.25, r * 0.12);
    } else {
      ctx.fillStyle = '#5E9A4A';
      ellipse(ctx, x - r * 0.3, y - r * 0.2, r * 0.35, r * 0.45, '#5E9A4A');
      ellipse(ctx, x + r * 0.35, y - r * 0.15, r * 0.3, r * 0.4, '#7AB85E');
      ctx.fillStyle = '#E07856';
      ctx.fillRect(x - r * 0.1, y - r * 0.35, r * 0.2, r * 0.5);
    }
  } else if (kind === 'teh') {
    ellipse(ctx, x, y - r * 0.2, r * 0.6, r * 0.35, '#8A5A2B');
    ctx.fillStyle = '#6B4423';
    for (let i = 0; i < 3; i++) {
      ellipse(ctx, x - r * 0.3 + i * r * 0.3, y - r * 0.3, r * 0.12, r * 0.2, '#6B4423');
    }
  }
  // Prep mark: chopped = knife tick, cooked = steam wisp.
  if (prep === 'chopped') {
    ctx.strokeStyle = PALETTE.leaf;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.55, y - r * 0.6);
    ctx.lineTo(x + r * 0.85, y - r * 0.9);
    ctx.stroke();
  } else if (prep === 'cooked') {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.2, y - r * 0.7);
    ctx.quadraticCurveTo(x, y - r * 1.0, x - r * 0.1, y - r * 1.2);
    ctx.stroke();
  }
}

// A finished dish on a plate, by dish id. (x, y) is the plate centre, r the plate radius.
export function drawDish(ctx, dishId, x, y, r) {
  // Plate.
  circle(ctx, x, y, r, '#FFFFFF');
  ctx.strokeStyle = '#D8CDB8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  if (dishId === 'nasi') drawRicePlate(ctx, x, y, r);
  else if (dishId === 'mie') drawNoodles(ctx, x, y, r);
  else if (dishId === 'sate') drawSatay(ctx, x, y, r);
  else if (dishId === 'teh') drawIcedTea(ctx, x, y, r);
}

export function drawRicePlate(ctx, x, y, r) {
  // Fried rice mound + egg + kecap drizzle.
  ellipse(ctx, x, y, r * 0.62, r * 0.42, '#F2D492');
  ellipse(ctx, x - r * 0.15, y - r * 0.12, r * 0.3, r * 0.2, '#F7E3AC');
  circle(ctx, x + r * 0.25, y - r * 0.18, r * 0.22, '#F2A541'); // yolk
  circle(ctx, x + r * 0.18, y - r * 0.25, r * 0.07, '#FFD98A');
  ctx.strokeStyle = '#3B2416'; // kecap drizzle
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y + r * 0.15);
  ctx.quadraticCurveTo(x, y - r * 0.05, x + r * 0.5, y + r * 0.12);
  ctx.stroke();
  ctx.fillStyle = '#5E9A4A';
  ctx.fillRect(x - r * 0.45, y + r * 0.2, r * 0.16, r * 0.1);
}

export function drawNoodles(ctx, x, y, r) {
  // Noodle swirl + chopped veg + kecap.
  ctx.strokeStyle = '#F2C14E';
  ctx.lineWidth = Math.max(2, r * 0.13);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x, y, r * (0.6 - i * 0.12), Math.PI * 0.1 + i * 0.4, Math.PI * 1.3 + i * 0.4);
    ctx.stroke();
  }
  ctx.fillStyle = '#5E9A4A';
  circle(ctx, x - r * 0.3, y - r * 0.25, r * 0.12, '#5E9A4A');
  circle(ctx, x + r * 0.35, y + r * 0.1, r * 0.12, '#5E9A4A');
  ctx.strokeStyle = '#3B2416';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.4, y + r * 0.3);
  ctx.lineTo(x + r * 0.4, y - r * 0.3);
  ctx.stroke();
}

export function drawSatay(ctx, x, y, r) {
  // Two skewers + peanut sauce.
  for (const off of [-0.18, 0.18]) {
    ctx.strokeStyle = '#D8B98A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y + off * r);
    ctx.lineTo(x + r * 0.7, y + off * r);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const cx = x - r * 0.4 + i * r * 0.4;
      ctx.fillStyle = i % 2 ? '#B85C38' : '#D97B4A';
      ctx.fillRect(cx - r * 0.14, y + off * r - r * 0.16, r * 0.28, r * 0.32);
    }
  }
  circle(ctx, x + r * 0.55, y + r * 0.45, r * 0.22, '#C68A3C'); // peanut sauce
  circle(ctx, x + r * 0.5, y + r * 0.4, r * 0.08, '#E0AA5E');
}

export function drawIcedTea(ctx, x, y, r) {
  // Tall glass, amber tea, ice cubes.
  ctx.fillStyle = 'rgba(200,230,240,0.85)';
  ctx.fillRect(x - r * 0.35, y - r * 0.6, r * 0.7, r * 1.1);
  ctx.fillStyle = '#C68A3C';
  ctx.fillRect(x - r * 0.3, y - r * 0.45, r * 0.6, r * 0.85);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(x - r * 0.22, y - r * 0.35, r * 0.18, r * 0.18);
  ctx.fillRect(x + r * 0.05, y - r * 0.1, r * 0.18, r * 0.18);
  ctx.fillStyle = '#2E7D32';
  ctx.fillRect(x + r * 0.1, y - r * 0.65, r * 0.3, r * 0.1); // mint leaf
}
