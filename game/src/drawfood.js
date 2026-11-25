// drawfood.js — drawNoodles(), drawRicePlate(), drawSatay(), drawIcedTea(),
// drawIngredient(): food art only, drawn into a Phaser Graphics object `g`
// (absolute coords, the Graphics sits at 0,0). All procedural vector shapes
// (no image files, no copied art). Food must look worth serving: glossy
// highlights on every dish, and each ingredient reads at a glance at
// 1280x720 and smaller. Plates are ellipses seen from a slight top angle.

import { PALETTE } from './config.js';
import { gCircle, gEllipse, gRect, gLine, gArc, gCircleStroke } from './gfx.js';

// A bowl (white mound / noodle swirl / tea) by ingredient kind, at (x, y), radius r.
export function drawIngredient(g, kind, prep, x, y, r) {
  // Bowl.
  gCircle(g, x, y, r, '#E8DCC8');
  gRect(g, x - r, y - 2, r * 2, 4, '#C9B896');
  if (kind === 'nasi') {
    gEllipse(g, x, y - r * 0.2, r * 0.75, r * 0.45, '#FFF8E7');
    gEllipse(g, x - r * 0.2, y - r * 0.35, r * 0.3, r * 0.18, '#FFFFFF');
  } else if (kind === 'mie') {
    for (let i = 0; i < 3; i++) {
      gArc(g, x, y - r * 0.15, r * (0.55 - i * 0.14), Math.PI * 0.15, Math.PI * 1.15, '#F2C14E', Math.max(2, r * 0.14));
    }
  } else if (kind === 'telur') {
    if (prep === 'chopped') {
      gEllipse(g, x, y - r * 0.1, r * 0.7, r * 0.4, '#FFF6E0');
      gCircle(g, x, y - r * 0.15, r * 0.32, '#F2A541');
      gCircle(g, x - r * 0.1, y - r * 0.25, r * 0.1, '#FFD98A');
    } else {
      gEllipse(g, x, y - r * 0.1, r * 0.55, r * 0.65, '#E8B06A');
      gEllipse(g, x - r * 0.15, y - r * 0.3, r * 0.2, r * 0.25, '#F0C48A');
    }
  } else if (kind === 'ayam') {
    if (prep === 'chopped') {
      gRect(g, x - r * 0.6, y - r * 0.5, r * 0.5, r * 0.4, '#E07856');
      gRect(g, x + r * 0.05, y - r * 0.35, r * 0.5, r * 0.4, '#E07856');
      gRect(g, x - r * 0.55, y - r * 0.45, r * 0.2, r * 0.15, '#F09A7A');
    } else {
      gLine(g, x + r * 0.4, y - r * 0.1, x + r * 0.8, y + r * 0.4, '#F5E6C8', Math.max(2, r * 0.16));
      gEllipse(g, x - r * 0.1, y - r * 0.15, r * 0.6, r * 0.5, '#E07856');
      gEllipse(g, x - r * 0.25, y - r * 0.3, r * 0.25, r * 0.2, '#F09A7A');
    }
  } else if (kind === 'sayur') {
    if (prep === 'chopped') {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        gCircle(g, x + Math.cos(a) * r * 0.35, y - r * 0.1 + Math.sin(a) * r * 0.2, r * 0.2, '#5E9A4A');
      }
      gRect(g, x - r * 0.3, y - r * 0.2, r * 0.25, r * 0.12, '#E07856');
    } else {
      gEllipse(g, x - r * 0.3, y - r * 0.2, r * 0.35, r * 0.45, '#5E9A4A');
      gEllipse(g, x + r * 0.35, y - r * 0.15, r * 0.3, r * 0.4, '#7AB85E');
      gRect(g, x - r * 0.1, y - r * 0.35, r * 0.2, r * 0.5, '#E07856');
    }
  } else if (kind === 'teh') {
    gEllipse(g, x, y - r * 0.2, r * 0.6, r * 0.35, '#8A5A2B');
    for (let i = 0; i < 3; i++) {
      gEllipse(g, x - r * 0.3 + i * r * 0.3, y - r * 0.3, r * 0.12, r * 0.2, '#6B4423');
    }
  }
  // Prep mark: chopped = knife tick, cooked = steam wisp.
  if (prep === 'chopped') {
    gLine(g, x + r * 0.55, y - r * 0.6, x + r * 0.85, y - r * 0.9, PALETTE.leaf, 2);
  } else if (prep === 'cooked') {
    gArc(g, x - r * 0.1, y - r * 0.9, r * 0.25, Math.PI * 1.1, Math.PI * 1.9, 'rgba(255,255,255,0.8)', 2);
  }
}

// A finished dish on an ellipse plate, by dish id. (x, y) is the plate
// centre, r the plate radius (horizontal).
// drawDish: the finished dish as a plated icon (ellipse plate + the dish's
// own art). Used for the window READY plates, the carried plate, and the
// recipe-book entries — one function so a dish always looks the same
// wherever it appears.
export function drawDish(g, dishId, x, y, r) {
  // Ellipse plate (wider than tall — side-view top angle) + gold rim.
  gEllipse(g, x, y, r, r * 0.62, '#FFFFFF');
  gCircleStroke(g, x, y, r * 0.82, '#D8CDB8', 2);
  if (dishId === 'nasi') drawRicePlate(g, x, y, r);
  else if (dishId === 'mie') drawNoodles(g, x, y, r);
  else if (dishId === 'sate') drawSatay(g, x, y, r);
  else if (dishId === 'teh') drawIcedTea(g, x, y, r);
}

export function drawRicePlate(g, x, y, r) {
  gEllipse(g, x, y, r * 0.62, r * 0.42, '#F2D492');
  gEllipse(g, x - r * 0.15, y - r * 0.12, r * 0.3, r * 0.2, '#F7E3AC');
  gCircle(g, x + r * 0.25, y - r * 0.18, r * 0.22, '#F2A541'); // yolk
  gCircle(g, x + r * 0.18, y - r * 0.25, r * 0.07, '#FFD98A'); // yolk gloss
  gLine(g, x - r * 0.5, y + r * 0.15, x + r * 0.5, y + r * 0.12, '#3B2416', 2); // kecap drizzle
  gRect(g, x - r * 0.45, y + r * 0.2, r * 0.16, r * 0.1, '#5E9A4A');
}

export function drawNoodles(g, x, y, r) {
  for (let i = 0; i < 4; i++) {
    gArc(g, x, y, r * (0.6 - i * 0.12), Math.PI * 0.1 + i * 0.4, Math.PI * 1.3 + i * 0.4, '#F2C14E', Math.max(2, r * 0.13));
  }
  gCircle(g, x - r * 0.3, y - r * 0.25, r * 0.12, '#5E9A4A');
  gCircle(g, x + r * 0.35, y + r * 0.1, r * 0.12, '#5E9A4A');
  gLine(g, x - r * 0.4, y + r * 0.3, x + r * 0.4, y - r * 0.3, '#3B2416', 2);
}

export function drawSatay(g, x, y, r) {
  for (const off of [-0.18, 0.18]) {
    gLine(g, x - r * 0.7, y + off * r, x + r * 0.7, y + off * r, '#D8B98A', 3);
    for (let i = 0; i < 3; i++) {
      const cx = x - r * 0.4 + i * r * 0.4;
      gRect(g, cx - r * 0.14, y + off * r - r * 0.16, r * 0.28, r * 0.32, i % 2 ? '#B85C38' : '#D97B4A');
    }
  }
  gCircle(g, x + r * 0.55, y + r * 0.45, r * 0.22, '#C68A3C'); // peanut sauce
  gCircle(g, x + r * 0.5, y + r * 0.4, r * 0.08, '#E0AA5E');
}

export function drawIcedTea(g, x, y, r) {
  gRect(g, x - r * 0.35, y - r * 0.6, r * 0.7, r * 1.1, 'rgba(200,230,240,0.85)');
  gRect(g, x - r * 0.3, y - r * 0.45, r * 0.6, r * 0.85, '#C68A3C');
  gRect(g, x - r * 0.22, y - r * 0.35, r * 0.18, r * 0.18, 'rgba(255,255,255,0.75)');
  gRect(g, x + r * 0.05, y - r * 0.1, r * 0.18, r * 0.18, 'rgba(255,255,255,0.75)');
  gRect(g, x + r * 0.1, y - r * 0.65, r * 0.3, r * 0.1, '#2E7D32'); // mint leaf
}

// A finisher bottle (Kecap / Saus Kacang / Es Batu) at (x, y), w x h.
export function drawFinisher(g, finId, x, y, w, h) {
  const colors = { kecap: '#3B2416', saus: '#C68A3C', es: '#BFE3F0' };
  g.fillStyle(parseInt((colors[finId] || '#888888').slice(1), 16), 1);
  g.fillRoundedRect(x, y, w, h, 6);
  g.lineStyle(1, 0xffffff, 1);
  g.strokeRoundedRect(x, y, w, h, 6);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(x + 4, y + 4, 4, h - 8); // gloss stripe
}
