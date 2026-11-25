// warung-sari-rasa v3.0 — zones.js
export const ZONES = {

  floor: { x: 16, y: 560, w: 1248, h: 80 },

  blockers: [],

  bowls: [
    { x: 20, y: 370, w: 176, h: 29 },
    { x: 20, y: 401, w: 176, h: 29 },
    { x: 20, y: 432, w: 176, h: 29 },
    { x: 20, y: 463, w: 176, h: 29 },
    { x: 20, y: 494, w: 176, h: 29 },
    { x: 20, y: 525, w: 176, h: 29 },
  ],

  tickets: [
    { x: 200, y: 60, w: 240, h: 90 },
    { x: 520, y: 60, w: 240, h: 90 },
    { x: 840, y: 60, w: 240, h: 90 },
  ],

  customers: [
    { x: 270, y: 130, w: 100, h: 70 },
    { x: 590, y: 130, w: 100, h: 70 },
    { x: 910, y: 130, w: 100, h: 70 },
  ],

  counter: { x: 16, y: 168, w: 1248, h: 32 },

  burners: [
    { x: 90, y: 225, w: 90, h: 60 },
    { x: 210, y: 225, w: 90, h: 60 },
  ],

  plates: [
    { x: 680, y: 255, w: 64, h: 44 },
    { x: 790, y: 255, w: 64, h: 44 },
  ],

  finishers: [
    { x: 700, y: 221, w: 40, h: 48 },
    { x: 760, y: 221, w: 40, h: 48 },
    { x: 820, y: 221, w: 40, h: 48 },
  ],

  windowPlates: [
    { x: 520, y: 158, w: 90, h: 50 },
    { x: 680, y: 158, w: 90, h: 50 },
  ],

  bell: { x: 780, y: 150, w: 44, h: 36 },

  bin: { x: 1120, y: 575, w: 50, h: 65 },

  lane: { x: 16, y: 560, w: 1248, h: 80 },

  stationClick: {
    stove: { x: 40, y: 200, w: 280, h: 120 },
    chopping: { x: 360, y: 200, w: 280, h: 120 },
    plating: { x: 680, y: 200, w: 280, h: 120 },
    pass: { x: 1000, y: 200, w: 240, h: 120 },
    window: { x: 16, y: 150, w: 1248, h: 58 },
    pantry: { x: 16, y: 340, w: 184, h: 220 },
    chopPanel: { x: 220, y: 340, w: 340, h: 220 },
    platePanel: { x: 580, y: 340, w: 340, h: 220 },
  },

  stand: {
    pantry: { x: 110, y: 600 },
    stove: { x: 180, y: 600 },
    chopping: { x: 500, y: 600 },
    plating: { x: 820, y: 600 },
    window: { x: 600, y: 600 },
    bin: { x: 1150, y: 600 },
  },
};

export function inRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

export function inCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}
