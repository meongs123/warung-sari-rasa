// zones.js — exact pixel geometry for every interactive element (SIDE VIEW).
// Single source of truth: input.js hit-tests against these, the Phaser scene
// draws them. Layout per the pivot design doc §2 (1280x720 logical canvas).
// Customers stand behind a counter at the top; the kitchen floor with
// stations sits below; the cook walks the floor and up the window lane.

export const ZONES = {
  // Walkable floor bounds for the cook (x, y, w, h). The window lane
  // (x 300-380) extends the floor up to y 235 so the cook can reach the
  // customer counter; the back-wall stations block the rest of y 208-300.
  // The floor top (y 235) is the lane mouth — the cook can only go higher
  // (toward the counter) inside the lane, never through a station counter.
  floor: { x: 16, y: 235, w: 1248, h: 405 },
  // AABB blockers (counters the cook cannot walk through).
  blockers: [
    { x: 40, y: 208, w: 260, h: 92 }, // stove counter
    { x: 380, y: 208, w: 180, h: 92 }, // chopping board counter
    { x: 640, y: 208, w: 260, h: 92 }, // plating counter
    { x: 960, y: 208, w: 280, h: 92 }, // pantry shelf
    { x: 905, y: 250, w: 50, h: 50 }, // bin
    { x: 480, y: 440, w: 320, h: 60 }, // prep island (display)
  ],
  // Pantry bowls: 6 bowls on the shelf, 3x2 grid.
  // Row 0 (y 225): nasi, mie, telur. Row 1 (y 265): ayam, sayur, teh.
  bowls: [
    { x: 990, y: 225, w: 72, h: 36 },
    { x: 1075, y: 225, w: 72, h: 36 },
    { x: 1160, y: 225, w: 72, h: 36 },
    { x: 990, y: 265, w: 72, h: 36 },
    { x: 1075, y: 265, w: 72, h: 36 },
    { x: 1160, y: 265, w: 72, h: 36 },
  ],
  // Order bubbles (3) above the customers — the order board, re-expressed.
  // Centred x 320 / 640 / 960, y 60-116, w 170, h 56.
  tickets: [
    { x: 235, y: 60, w: 170, h: 56 },
    { x: 555, y: 60, w: 170, h: 56 },
    { x: 875, y: 60, w: 170, h: 56 },
  ],
  // Customers (3) behind the counter, for click-to-select.
  customers: [
    { x: 270, y: 116, w: 100, h: 92 },
    { x: 590, y: 116, w: 100, h: 92 },
    { x: 910, y: 116, w: 100, h: 92 },
  ],
  // Customer counter (the serving window is this counter itself).
  counter: { x: 16, y: 168, w: 1248, h: 40 },
  // Stove burners (2) on the stove counter.
  burners: [
    { x: 90, y: 225, w: 90, h: 60 },
    { x: 210, y: 225, w: 90, h: 60 },
  ],
  // Plating counter plate slots (2).
  plates: [
    { x: 680, y: 255, w: 64, h: 44 },
    { x: 790, y: 255, w: 64, h: 44 },
  ],
  // Finisher bottles on the plating counter (Kecap, Saus Kacang, Es Batu).
  finishers: [
    { x: 660, y: 215, w: 40, h: 48 },
    { x: 720, y: 215, w: 40, h: 48 },
    { x: 780, y: 215, w: 40, h: 48 },
  ],
  // Serving window READY plate spots (2) on the customer counter.
  windowPlates: [
    { x: 520, y: 158, w: 90, h: 50 },
    { x: 680, y: 158, w: 90, h: 50 },
  ],
  // Brass bell on the counter, right of the plate spots. Click it to serve.
  bell: { x: 780, y: 150, w: 44, h: 36 },
  // Bin (trash) next to the plating counter.
  bin: { x: 905, y: 250, w: 50, h: 50 },
  // Window lane: the walkable corridor up to the customer counter.
  lane: { x: 300, y: 208, w: 80, h: 122 },
  // Station click targets (generous, for click-to-walk).
  stationClick: {
    pantry: { x: 960, y: 208, w: 280, h: 92 },
    chopping: { x: 380, y: 208, w: 180, h: 92 },
    stove: { x: 40, y: 208, w: 260, h: 92 },
    plating: { x: 640, y: 208, w: 260, h: 92 },
    window: { x: 16, y: 150, w: 1248, h: 58 },
    prep: { x: 480, y: 440, w: 320, h: 60 },
  },
  // Stand points: where the cook stands to use each station.
  stand: {
    pantry: { x: 1120, y: 330 },
    chopping: { x: 470, y: 330 },
    stove: { x: 170, y: 330 },
    plating: { x: 770, y: 330 },
    window: { x: 340, y: 250 }, // up the window lane (x 300-380, walkable to y 235)
    bin: { x: 930, y: 330 },
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
