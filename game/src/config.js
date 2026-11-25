// warung-sari-rasa v3.0 — config.js
export const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 720,
  shiftLength: 180,
  walkSpeed: 320,
  handCapacity: 2,
  burnerCount: 2,
  plateSlots: 2,
  windowPlates: 2,
  burnGrace: 8,

  comboCap: 2.0,
  comboStep: 0.25,

  ramp: [
    { spawnEvery: 14, patience: 45 },
    { spawnEvery: 11, patience: 40 },
    { spawnEvery: 9, patience: 36 },
  ],
  maxTickets: 3,
  firstTicketPatience: 60,
  pakBudiAt: 45,
  pakBudiPatience: 60,
  pickyFrom: 90,
  pickyBonus: 0.25,
  maxPickyOpen: 1,
};

export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', color: '#FFF8E7', cooks: 4, chops: false },
  { id: 'mie', name: 'Mie', key: '2', color: '#F2C14E', cooks: 3, chops: false },
  { id: 'telur', name: 'Telur', key: '3', color: '#E8B06A', cooks: 0, chops: 'kocok' },
  { id: 'ayam', name: 'Ayam', key: '4', color: '#E07856', cooks: 5, chops: 'potong' },
  { id: 'sayur', name: 'Sayur', key: '5', color: '#5E9A4A', cooks: 0, chops: 'potong' },
  { id: 'teh', name: 'Teh', key: '6', color: '#8A5A2B', cooks: 3, chops: false },
];

export const FINISHERS = [
  { id: 'kecap', name: 'Kecap', color: '#3B2416' },
  { id: 'saus', name: 'Saus Kacang', color: '#C68A3C' },
  { id: 'es', name: 'Es Batu', color: '#BFE3F0' },
];

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

export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  hintBar: { x: 0, y: 704, w: 1280, h: 16 },
};

export const ANIM = {
  walkCycle: 0.5,
  chopLoop: 0.5,
  stirLoop: 0.6,
  serveTime: 0.7,
  celebrateTime: 0.8,
  sadTime: 1.0,
  arriveTime: 0.4,
  leaveTime: 0.5,
  happyTime: 1.2,
};

export const CUSTOMER_KINDS = [
  { id: 'sari', name: 'Ibu Sari', skin: '#E8B88A', hair: '#2E1F14', shirt: '#E0789A', kind: 'bun' },
  { id: 'andi', name: 'Mas Andi', skin: '#D9A066', hair: '#1A1A1A', shirt: '#4A7AB5', kind: 'cap' },
  { id: 'rina', name: 'Mbak Rina', skin: '#F0C8A0', hair: '#3B2416', shirt: '#F2C14E', kind: 'ponytail' },
  { id: 'budi', name: 'Pak Budi', skin: '#D9A066', hair: '#9A9A9A', shirt: '#8A5A33', kind: 'vip' },
  { id: 'kumis', name: 'Pak Kumis', skin: '#C89B6A', hair: '#5A5A5A', shirt: '#6B4A8A', kind: 'kumis' },
];

export const EVENT = {
  at: 90,
  waitUntil: 120,
  until: 150,
  vip: 'kumis',
  dish: 'nasi',
  patience: 60,
  multiplier: 2,
  perfectBonus: 50,
};

export const RANKS = [
  { min: 1200, letter: 'S', title: 'JURAGAN DAPUR' },
  { min: 900, letter: 'A', title: 'KOKI ANDALAN' },
  { min: 600, letter: 'B', title: 'KOKI WARUNG' },
  { min: 0, letter: 'C', title: 'PELAJAR MASAK' },
];

export const DIALOGUE_TIME = 4;
export const BATCH_BONUS = 25;

export const BUBBLE = { w: 240, h: 90 };

export const CAMERA_ZOOM = 1.35;

export function tipRate(patienceFrac) {
  if (patienceFrac > 0.5) return 0.5;
  if (patienceFrac >= 0.25) return 0.25;
  return 0;
}

export function comboMultiplier(combo) {
  return Math.min(CONFIG.comboCap, 1 + CONFIG.comboStep * Math.max(0, combo - 1));
}
