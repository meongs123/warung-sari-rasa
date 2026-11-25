// warung-sari-rasa v3.0 — drawfood.js
import { PALETTE } from './config.js';
import { gCircle, gEllipse, gRect, gLine, gArc, gCircleStroke } from './gfx.js';

export function drawIngredient(g, kind, prep, x, y, r) {

  gCircle(g, x, y, r, '#E8DCC8');
  gRect(g, x - r, y - 2, r * 2, 4, '#C9B896');
  if (kind === 'nasi') {
    gEllipse(g, x, y - r * 0.2, r * 0.75, r * 0.45, '#FFF8E7');
    gEllipse(g, x - r * 0.2, y - r * 0.35, r * 0.3, r * 0.18, '#FFFFFF');

    gEllipse(g, x + r * 0.25, y - r * 0.3, r * 0.14, r * 0.08, '#EFE6CE');
    gEllipse(g, x - r * 0.05, y - r * 0.15, r * 0.14, r * 0.08, '#EFE6CE');
    gEllipse(g, x + r * 0.4, y - r * 0.1, r * 0.12, r * 0.07, '#EFE6CE');
  } else if (kind === 'mie') {
    for (let i = 0; i < 3; i++) {
      gArc(g, x, y - r * 0.15, r * (0.55 - i * 0.14), Math.PI * (0.1 + i * 0.3), Math.PI * (1.6 + i * 0.3), '#F2C14E', Math.max(2, r * 0.14));
    }
    gLine(g, x - r * 0.55, y - r * 0.5, x - r * 0.85, y - r * 0.7, '#F2C14E', Math.max(2, r * 0.12));
    gLine(g, x + r * 0.5, y - r * 0.55, x + r * 0.8, y - r * 0.75, '#E8A93A', Math.max(2, r * 0.12));
  } else if (kind === 'telur') {
    if (prep === 'chopped') {
      gEllipse(g, x, y - r * 0.1, r * 0.7, r * 0.4, '#FFF6E0');
      gCircle(g, x, y - r * 0.15, r * 0.32, '#F2A541');
      gCircle(g, x - r * 0.1, y - r * 0.25, r * 0.1, '#FFD98A');
    } else {

      gEllipse(g, x, y - r * 0.1, r * 0.55, r * 0.65, '#E8B06A');
      gEllipse(g, x - r * 0.15, y - r * 0.3, r * 0.2, r * 0.25, '#F0C48A');
      gCircle(g, x + r * 0.2, y + r * 0.1, r * 0.07, '#B98A4A');
      gCircle(g, x - r * 0.25, y + r * 0.15, r * 0.06, '#B98A4A');
      gCircle(g, x + r * 0.05, y - r * 0.45, r * 0.06, '#B98A4A');
    }
  } else if (kind === 'ayam') {
    if (prep === 'chopped') {

      gRect(g, x - r * 0.6, y - r * 0.5, r * 0.5, r * 0.4, '#E07856');
      gRect(g, x + r * 0.05, y - r * 0.35, r * 0.5, r * 0.4, '#E07856');
      gRect(g, x - r * 0.55, y - r * 0.45, r * 0.2, r * 0.15, '#F09A7A');
      gRect(g, x - r * 0.25, y + r * 0.05, r * 0.45, r * 0.35, '#C65A3A');
      gLine(g, x - r * 0.2, y + r * 0.1, x + r * 0.15, y + r * 0.1, '#8A3A22', 2);
      gLine(g, x - r * 0.2, y + r * 0.28, x + r * 0.15, y + r * 0.28, '#8A3A22', 2);
    } else {
      // L4: bigger meat + dark grill marks + BROWN bone (was near-white on
      // light beige, invisible at larder size and read as a tomato).
      gEllipse(g, x - r * 0.15, y - r * 0.2, r * 0.62, r * 0.5, '#E07856');
      gEllipse(g, x - r * 0.3, y - r * 0.35, r * 0.24, r * 0.2, '#F09A7A');
      gLine(g, x - r * 0.35, y - r * 0.1, x + r * 0.05, y - r * 0.3, '#8A3A22', 2);
      gLine(g, x - r * 0.3, y + r * 0.1, x + r * 0.1, y - r * 0.1, '#8A3A22', 2);
      gLine(g, x + r * 0.35, y - r * 0.1, x + r * 0.95, y + r * 0.45, '#8A5A2B', Math.max(3, r * 0.3));
      gCircle(g, x + r * 0.98, y + r * 0.48, r * 0.22, '#FFF8E7');
      gCircle(g, x + r * 0.8, y + r * 0.3, r * 0.18, '#FFF8E7');
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
      gLine(g, x - r * 0.4, y + r * 0.3, x + r * 0.4, y - r * 0.4, '#E07856', Math.max(3, r * 0.24));
    }
  } else if (kind === 'teh') {
    if (prep === 'cooked') {

      gEllipse(g, x, y - r * 0.2, r * 0.6, r * 0.35, '#C68A3C');
      gEllipse(g, x - r * 0.15, y - r * 0.3, r * 0.2, r * 0.12, '#E0AA5E');
      gCircle(g, x + r * 0.3, y - r * 0.35, r * 0.1, '#FFFFFF');
    } else {

      gEllipse(g, x, y - r * 0.2, r * 0.6, r * 0.35, '#C68A3C');
      for (let i = 0; i < 3; i++) {
        gEllipse(g, x - r * 0.3 + i * r * 0.3, y - r * 0.3, r * 0.13, r * 0.22, '#5E9A4A');
      }
      gLine(g, x + r * 0.5, y - r * 0.5, x + r * 0.75, y - r * 0.85, '#FFF8E7', 3);
      gRect(g, x + r * 0.62, y - r * 1.05, r * 0.3, r * 0.22, '#FFF8E7');
    }
  }

  if (prep === 'chopped') {
    gLine(g, x + r * 0.55, y - r * 0.6, x + r * 0.85, y - r * 0.9, PALETTE.leaf, 2);
  } else if (prep === 'cooked') {
    gArc(g, x - r * 0.1, y - r * 0.9, r * 0.25, Math.PI * 1.1, Math.PI * 1.9, 'rgba(255,255,255,0.8)', 2);
  }
}

export function drawDish(g, dishId, x, y, r) {

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
  gCircle(g, x + r * 0.25, y - r * 0.18, r * 0.22, '#F2A541');
  gCircle(g, x + r * 0.18, y - r * 0.25, r * 0.07, '#FFD98A');
  gLine(g, x - r * 0.5, y + r * 0.15, x + r * 0.5, y + r * 0.12, '#3B2416', 2);
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
  gCircle(g, x + r * 0.55, y + r * 0.45, r * 0.22, '#C68A3C');
  gCircle(g, x + r * 0.5, y + r * 0.4, r * 0.08, '#E0AA5E');
}

export function drawIcedTea(g, x, y, r) {
  gRect(g, x - r * 0.35, y - r * 0.6, r * 0.7, r * 1.1, 'rgba(200,230,240,0.85)');
  gRect(g, x - r * 0.3, y - r * 0.45, r * 0.6, r * 0.85, '#C68A3C');
  gRect(g, x - r * 0.22, y - r * 0.35, r * 0.18, r * 0.18, 'rgba(255,255,255,0.75)');
  gRect(g, x + r * 0.05, y - r * 0.1, r * 0.18, r * 0.18, 'rgba(255,255,255,0.75)');
  gRect(g, x + r * 0.1, y - r * 0.65, r * 0.3, r * 0.1, '#2E7D32');
}

export function drawFinisher(g, finId, x, y, w, h) {
  const colors = { kecap: '#3B2416', saus: '#C68A3C', es: '#BFE3F0' };
  g.fillStyle(parseInt((colors[finId] || '#888888').slice(1), 16), 1);
  g.fillRoundedRect(x, y, w, h, 6);
  g.lineStyle(1, 0xffffff, 1);
  g.strokeRoundedRect(x, y, w, h, 6);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(x + 4, y + 4, 4, h - 8);
}
