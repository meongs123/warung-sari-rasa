// warung-sari-rasa v3.0 — shots.js
import { CONFIG, ANIM } from './config.js';
import { makeTicket } from './state.js';

function baseStaged(state, time, coins, combo) {
  state.mode = 'playing';
  state.frozen = true;
  state.time = time;
  state.coins = coins;
  state.combo = combo;
  state.bestCombo = Math.max(state.bestCombo, combo);
  state.tickets = [null, null, null];
  state.plates = [
    { items: [], finisher: null, dish: null, done: false, picky: null },
    { items: [], finisher: null, dish: null, done: false, picky: null },
  ];
  state.windowPlates = [null, null];
  state.burners = [
    { item: null, t: 0, cookTime: 0, done: false, burnt: false },
    { item: null, t: 0, cookTime: 0, done: false, burnt: false },
  ];
  state.particles = [];
  state.floats = [];
  state.shake = 0;
  state.toast = null;
  state.selectedTicket = 0;
  state.firstAction = true;
  state.cook.hands = [null, null];
  state.cook.plate = null;
  state.cook.anim = 'idle';
  state.cook.animT = 0;
  state.cook.facing = 1;
  state.cook.walking = false;
  state.cook.target = null;
  state.cook.path = null;
  state.customers = [null, null, null];
  state.camera = null;
}

function stageCustomers(state) {
  const kinds = ['sari', 'andi', 'rina'];
  for (let i = 0; i < 3; i++) {
    const ticket = state.tickets[i];
    if (!ticket) continue;
    const frac = ticket.patience / ticket.maxPatience;
    state.customers[i] = {
      kind: ticket.vip === 'kumis' ? 'kumis' : ticket.starred ? 'budi' : kinds[i],
      mood: frac > 0.5 ? 'neutral' : frac >= 0.25 ? 'impatient' : 'angry',
      enterT: ANIM.arriveTime,
      leaveT: 0,
      leaving: false,
      ticketId: ticket.id,
    };
  }
}

export function stageCover(state) {
  baseStaged(state, 73, 380, 3);
  const nasi = makeTicket(state, 'nasi', 45, null, false);
  nasi.patience = 22.5;
  const sate = makeTicket(state, 'sate', 36, null, false);
  sate.patience = 7.2;
  const teh = makeTicket(state, 'teh', 60, null, true);
  teh.patience = 48;
  state.tickets = [nasi, sate, teh];
  state.selectedTicket = 1;

  state.plates[0] = {
    items: [
      { kind: 'nasi', prep: 'cooked' },
      { kind: 'telur', prep: 'chopped' },
    ],
    finisher: null,
    dish: null,
    done: false,
    picky: null,
  };

  // H1b: the window dish MUST match an open ticket (sate = ticket 1) so the
  // "RING THE BELL!" callout fires on that ticket's card in the cover.
  state.windowPlates[0] = { dish: 'sate', items: [], finisher: 'saus', picky: null };

  // Float sits clear of the SAMPAH bin (x 1120) — its wide sub-text used to
  // overlap the bin at x 1075.
  state.floats.push({
    x: 980, y: 590, text: '+Rp 175', sub: 'termasuk tip Rp 35', color: '#F5C542', t: 0.3, life: 1.1,
  });

  state.cook.x = 760;
  state.cook.y = 600;
  state.cook.dir = 3;
  state.cook.facing = 1;
  state.cook.walking = true;
  state.cook.anim = 'walk';
  state.cook.animT = 0.35;

  state.burners[0] = { item: { kind: 'mie', prep: 'raw' }, t: 1.5, cookTime: 3, done: false, burnt: false };
  return state;
}

export function stageChop(state) {
  baseStaged(state, 29, 0, 0);
  const mie = makeTicket(state, 'mie', 45, null, false);
  mie.patience = 40;
  const nasi = makeTicket(state, 'nasi', 45, null, false);
  nasi.patience = 22.5;
  const sate = makeTicket(state, 'sate', 36, null, false);
  sate.patience = 25;
  state.tickets = [mie, nasi, sate];
  state.selectedTicket = 0;

  state.cook.x = 500;
  state.cook.y = 600;
  state.cook.dir = 3;
  state.cook.facing = 1;
  state.cook.anim = 'chop';
  state.cook.animT = 0.25;
  state.cook.hands = [{ kind: 'sayur', prep: 'raw' }, null];
  state.toast = { text: 'Potong Sayur untuk Mie Goreng', t: 1 };
  state.toastT = 1;

  state.particles = [
    { x: 440, y: 290, vx: 0, vy: 0, t: 0.2, life: 1, size: 5, color: '#5E9A4A', shape: 'leaf' },
    { x: 470, y: 280, vx: 0, vy: 0, t: 0.25, life: 1, size: 4, color: '#7AB85E', shape: 'leaf' },
    { x: 500, y: 292, vx: 0, vy: 0, t: 0.15, life: 1, size: 5, color: '#5E9A4A', shape: 'leaf' },
    { x: 455, y: 270, vx: 0, vy: 0, t: 0.3, life: 1, size: 4, color: '#E07856', shape: 'circle' },
    { x: 490, y: 275, vx: 0, vy: 0, t: 0.2, life: 1, size: 4, color: '#5E9A4A', shape: 'leaf' },
  ];
  return state;
}

export function stageServe(state) {
  baseStaged(state, 108, 175, 3);
  const teh = makeTicket(state, 'teh', 60, null, false);
  teh.patience = 55;
  const nasi = makeTicket(state, 'nasi', 45, null, false);
  nasi.patience = 30;
  const mie = makeTicket(state, 'mie', 45, null, false);
  mie.patience = 18;
  state.tickets = [teh, nasi, mie];
  state.selectedTicket = 1;

  state.cook.x = 420;
  state.cook.y = 600;
  state.cook.dir = 2;
  state.cook.facing = -1;
  state.cook.walking = true;
  state.cook.anim = 'carry';
  state.cook.animT = 0.35;
  state.cook.plate = { dish: 'sate', items: [], finisher: 'saus', picky: null };

  // Same bin-clear position as the cover float (x 980, not 1075).
  state.floats.push({
    x: 980, y: 590, text: '+Rp 175', sub: 'termasuk tip Rp 35', color: '#F5C542', t: 0.3, life: 1.1,
  });
  return state;
}

export function stageSecondAngle(state) {
  baseStaged(state, 100, 260, 2);
  const sate = makeTicket(state, 'sate', 36, null, false);
  sate.patience = 7.2;
  const mie = makeTicket(state, 'mie', 40, null, false);
  mie.patience = 16;
  const nasi = makeTicket(state, 'nasi', 40, null, false);
  nasi.patience = 28;
  state.tickets = [sate, mie, nasi];
  state.selectedTicket = 0;

  state.burners[0] = { item: { kind: 'ayam', prep: 'chopped' }, t: 3, cookTime: 5, done: false, burnt: false };
  state.burners[1] = { item: { kind: 'mie', prep: 'raw' }, t: 1.5, cookTime: 3, done: false, burnt: false };

  state.plates[0] = {
    items: [
      { kind: 'ayam', prep: 'cooked' },
    ],
    finisher: null,
    dish: null,
    done: false,
    picky: null,
  };

  state.cook.x = 180;
  state.cook.y = 600;
  state.cook.dir = 3;
  state.cook.facing = 1;
  state.cook.anim = 'stir';
  state.cook.animT = 0.3;
  state.cook.hands = [null, null];

  // F5 (revised): zoom 1.05x + centre (618,343) — the HUD top/bottom bars
  // cover ~53px of the zoomed world at each edge, so a higher zoom cannot
  // show the order cards (y 60) AND the cook's feet (y 630) at once
  // (needs zoom < 1.074). At 1.05x the cards, menu names + prices, pantry
  // and cook are all whole; the framing is a slight zoom + shift.
  state.camera = { x: 618, y: 343, zoom: 1.05 };
  return state;
}

export function stageShot(state, name) {
  if (name === 'cover') stageCover(state);
  else if (name === 'chop') stageChop(state);
  else if (name === 'serve') stageServe(state);
  else if (name === 'angle') stageSecondAngle(state);
  else return state;
  stageCustomers(state);
  return state;
}
