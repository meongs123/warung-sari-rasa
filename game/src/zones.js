// zones.js — exact pixel geometry for every interactive element.
// Single source of truth: input.js hit-tests against these, render.js draws them.

export const ZONES = {
  // Walkable floor bounds for the cook (x, y, w, h).
  floor: { x: 280, y: 100, w: 690, h: 465 },
  // AABB blockers (counters the cook cannot walk through).
  blockers: [
    { x: 470, y: 95, w: 310, h: 80 }, // stove counter
    { x: 295, y: 255, w: 130, h: 90 }, // chopping board counter
    { x: 825, y: 255, w: 140, h: 90 }, // plating counter
    { x: 495, y: 275, w: 260, h: 110 }, // prep counter island (display)
    { x: 264, y: 576, w: 720, h: 128 }, // pantry counter
    { x: 1000, y: 80, w: 264, h: 480 }, // serving window wall
  ],
  // Pantry bowls: 6 bowls along the bottom counter.
  bowls: [
    { x: 280, y: 596, w: 100, h: 84 },
    { x: 398, y: 596, w: 100, h: 84 },
    { x: 516, y: 596, w: 100, h: 84 },
    { x: 634, y: 596, w: 100, h: 84 },
    { x: 752, y: 596, w: 100, h: 84 },
    { x: 870, y: 596, w: 100, h: 84 },
  ],
  // Order board ticket slots (3).
  tickets: [
    { x: 28, y: 96, w: 208, h: 148 },
    { x: 28, y: 256, w: 208, h: 148 },
    { x: 28, y: 416, w: 208, h: 148 },
  ],
  // Stove burners (2) on the stove counter.
  burners: [
    { x: 500, y: 110, w: 110, h: 55 },
    { x: 640, y: 110, w: 110, h: 55 },
  ],
  // Plating counter plate slots (2).
  plates: [
    { x: 838, y: 268, w: 56, h: 56 },
    { x: 900, y: 268, w: 56, h: 56 },
  ],
  // Finisher bottles on the plating counter (Kecap, Saus Kacang, Es Batu).
  finishers: [
    { x: 838, y: 200, w: 40, h: 48 },
    { x: 884, y: 200, w: 40, h: 48 },
    { x: 930, y: 200, w: 40, h: 48 },
  ],
  // Serving window READY plate spots (2).
  windowPlates: [
    { x: 1030, y: 320, w: 90, h: 70 },
    { x: 1150, y: 320, w: 90, h: 70 },
  ],
  // Bin (trash) next to the plating counter.
  bin: { x: 968, y: 380, w: 44, h: 52 },
  // Station click targets (generous, for click-to-walk).
  stationClick: {
    pantry: { x: 264, y: 576, w: 720, h: 128 },
    chopping: { x: 295, y: 255, w: 130, h: 90 },
    stove: { x: 470, y: 95, w: 310, h: 80 },
    plating: { x: 825, y: 255, w: 140, h: 90 },
    window: { x: 1000, y: 240, w: 264, h: 200 },
    prep: { x: 495, y: 275, w: 260, h: 110 },
  },
  // Stand points: where the cook stands to use each station.
  stand: {
    pantry: { x: 624, y: 560 },
    chopping: { x: 360, y: 380 },
    stove: { x: 624, y: 210 },
    plating: { x: 895, y: 380 },
    window: { x: 950, y: 380 }, // left of the window wall, below the plating counter (the old (960,300) sat inside the plating counter blocker)
    bin: { x: 960, y: 420 },
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
