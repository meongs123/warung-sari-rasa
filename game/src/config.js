// config.js — every number, recipe chain, and tuning value in one place.
// Warung Sari Rasa — Dapur Kilat. Revision 1: ONE 180 s shift, no day/goals.

export const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 720,
  shiftLength: 180, // seconds, one shift only
  walkSpeed: 320, // px/s — the route must cost time, not tedium
  handCapacity: 2,
  burnerCount: 2,
  plateSlots: 2,
  windowPlates: 2, // max finished plates that can sit at the serving window
  burnGrace: 8, // seconds past done before an item burns (done at cookTime,
  // burnt at cookTime + burnGrace — the lift window the player must hit).
  // 8 s (not 7 s): the combined first-timer case (hesitate 1.5 s AND one
  // mis-click walk) lifts Route B at 10.1 s — past the 10.0 s bar for a
  // 1 s margin at grace 7 (burn 11.0). At 8 s it lifts with a 1.9 s
  // margin (burn 12.0). Still punishes truly slow play.
  comboCap: 2.0, // multiplier cap (reached at combo 5)
  comboStep: 0.25, // +0.25 multiplier per combo level
  // In-shift ramp by elapsed thirds (seconds 0–60, 60–120, 120–180).
  ramp: [
    { spawnEvery: 14, patience: 45 },
    { spawnEvery: 11, patience: 40 },
    { spawnEvery: 9, patience: 36 },
  ],
  maxTickets: 3, // open ticket slots on the board
  firstTicketPatience: 60, // the opening Nasi Goreng waits for the first action
  pakBudiAt: 45, // seconds in when Pak Budi's starred ticket spawns
  pakBudiPatience: 60,
  pickyFrom: 90, // picky orders only in the last 90 s of the shift
  pickyBonus: 0.25, // +25% pay
  maxPickyOpen: 1,
};

// Pantry bowls, left to right, keys Z X C V B N. Six pantry ingredients.
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: 'z', color: '#FFF8E7', cooks: 4, chops: false },
  { id: 'mie', name: 'Mie', key: 'x', color: '#F2C14E', cooks: 3, chops: false },
  { id: 'telur', name: 'Telur', key: 'c', color: '#E8B06A', cooks: 0, chops: 'kocok' },
  { id: 'ayam', name: 'Ayam', key: 'v', color: '#E07856', cooks: 5, chops: 'potong' },
  { id: 'sayur', name: 'Sayur', key: 'b', color: '#5E9A4A', cooks: 0, chops: 'potong' },
  { id: 'teh', name: 'Teh', key: 'n', color: '#8A5A2B', cooks: 3, chops: false },
];

// Finishers live on the plating counter (one click, unlimited, no hand slot).
export const FINISHERS = [
  { id: 'kecap', name: 'Kecap', color: '#3B2416' },
  { id: 'saus', name: 'Saus Kacang', color: '#C68A3C' },
  { id: 'es', name: 'Es Batu', color: '#BFE3F0' },
];

// Recipes. Each dish is a different chain of the same verbs.
// plate: the components a finished plate must hold (kind + prep).
// finisher: the finisher the dish needs, or null when the dish takes none.
// picky: the skip-one-step variants a ticket may carry (last 90 s only).
export const RECIPES = {
  nasi: {
    id: 'nasi', name: 'Nasi Goreng', gloss: 'fried rice',
    price: 100, cookTime: 4,
    plate: [
      { kind: 'nasi', prep: 'cooked' },
      { kind: 'telur', prep: 'chopped' },
    ],
    finisher: 'kecap',
    picky: [{ tag: 'TANPA TELUR', skip: { kind: 'telur', prep: 'chopped' } }],
  },
  mie: {
    id: 'mie', name: 'Mie Goreng', gloss: 'fried noodles',
    price: 110, cookTime: 3,
    plate: [
      { kind: 'mie', prep: 'cooked' },
      { kind: 'sayur', prep: 'chopped' },
    ],
    finisher: 'kecap',
    picky: [{ tag: 'TANPA KECAP', skipFinisher: true }],
  },
  sate: {
    id: 'sate', name: 'Sate Ayam', gloss: 'chicken satay',
    price: 140, cookTime: 5,
    plate: [{ kind: 'ayam', prep: 'cooked' }],
    finisher: 'saus',
    picky: [],
  },
  teh: {
    id: 'teh', name: 'Es Teh Melati', gloss: 'iced jasmine tea',
    price: 60, cookTime: 3,
    plate: [{ kind: 'teh', prep: 'cooked' }],
    finisher: 'es',
    picky: [],
  },
};

export const RECIPE_ORDER = ['nasi', 'mie', 'sate', 'teh'];

// Palette — warm teak + terracotta + banana-leaf green (original look).
export const PALETTE = {
  teak: '#7A4A2B',
  teakDark: '#5C3520',
  cream: '#FFF3D6',
  creamDark: '#F7E8C8',
  terracotta: '#D96C3F',
  leaf: '#4E7A3A',
  fire: '#F2A541',
  chili: '#C0392B',
  gold: '#F5C542',
  ink: '#2E1F14',
  board: '#8A5A33',
  steel: '#9AA3A7',
};

// Layout — fixed logical 1280x720, side view. The order board is gone
// (bubbles above the customers carry the tickets now); the station geometry
// lives in zones.js, the single source of truth.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  hintBar: { x: 0, y: 704, w: 1280, h: 16 },
};

// Animation timings (seconds) for Mas Joko + customers — see the pivot design
// doc §3/§4. Every pose is computed from cook.animT, so staged shots are
// deterministic (no wall-clock randomness in a pose).
export const ANIM = {
  walkCycle: 0.5, // one 4-frame walk cycle at 320 px/s
  chopLoop: 0.5, // one chop (raise / strike / recover)
  stirLoop: 0.6, // one stir circle over the wok
  serveTime: 0.7, // arm extend + bow
  celebrateTime: 0.8, // jump + arms up (combo >= 3 or Pak Budi served)
  sadTime: 1.0, // droop + sweat drop (burn / expiry)
  arriveTime: 0.4, // customer slide-in
  leaveTime: 0.5, // customer slide-out
  happyTime: 1.2, // happy mood after being served
};

// Customer kinds (original Indonesian characters). Colours are the whole
// identity — distinct silhouettes so the judge can tell them apart at 60%.
export const CUSTOMER_KINDS = [
  { id: 'sari', name: 'Ibu Sari', skin: '#E8B88A', hair: '#2E1F14', shirt: '#E0789A', kind: 'bun' },
  { id: 'andi', name: 'Mas Andi', skin: '#D9A066', hair: '#1A1A1A', shirt: '#4A7AB5', kind: 'cap' },
  { id: 'rina', name: 'Mbak Rina', skin: '#F0C8A0', hair: '#3B2416', shirt: '#F2C14E', kind: 'ponytail' },
  { id: 'budi', name: 'Pak Budi', skin: '#D9A066', hair: '#9A9A9A', shirt: '#8A5A33', kind: 'vip' },
];

// Order bubble size (the order board, re-expressed above the customers).
export const BUBBLE = { w: 170, h: 56 };

// Shot-4 camera: a 1.35x close-up of the grill + plating area.
export const CAMERA_ZOOM = 1.35;

// Tip tiers by remaining patience fraction at serve time.
export function tipRate(patienceFrac) {
  if (patienceFrac > 0.5) return 0.5;
  if (patienceFrac >= 0.25) return 0.25;
  return 0;
}

export function comboMultiplier(combo) {
  return Math.min(CONFIG.comboCap, 1 + CONFIG.comboStep * Math.max(0, combo - 1));
}
