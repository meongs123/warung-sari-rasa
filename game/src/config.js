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
  burnGrace: 3, // seconds past done before an item burns
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

// Layout — fixed logical 1280×720. Stations in a U the cook walks.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 16, y: 80, w: 232, h: 480 },
  kitchen: { x: 264, y: 80, w: 720, h: 480 },
  window: { x: 1000, y: 80, w: 264, h: 480 },
  pantry: { x: 264, y: 576, w: 720, h: 128 },
  hintBar: { x: 0, y: 704, w: 1280, h: 16 },
  // Station stand points (where the cook stands to use them).
  stations: {
    pantry: { x: 624, y: 560, r: 90 },
    chopping: { x: 330, y: 300, r: 64 },
    stove: { x: 624, y: 210, r: 90 },
    plating: { x: 900, y: 300, r: 64 },
    window: { x: 1080, y: 300, r: 80 },
    bin: { x: 960, y: 380, r: 40 },
    prep: { x: 624, y: 360, r: 70 },
  },
};

// Tip tiers by remaining patience fraction at serve time.
export function tipRate(patienceFrac) {
  if (patienceFrac > 0.5) return 0.5;
  if (patienceFrac >= 0.25) return 0.25;
  return 0;
}

export function comboMultiplier(combo) {
  return Math.min(CONFIG.comboCap, 1 + CONFIG.comboStep * Math.max(0, combo - 1));
}
