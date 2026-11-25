// shots.js — stageCover(), stageChop(), stageServe(), stageSecondAngle().
// Deterministic staged states for screenshots: real renders of the game's own
// code (same state constructors, same render), timers frozen at the values
// shown. Staging only sets state — it never draws anything itself, so a shot
// is exactly what a player would see in that situation.
// below. Re-shootable after any fix. Capture at 1280×720 via ?shot=<name>.

import { CONFIG } from './config.js';
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
}

// 1-cover.jpg — mid-shift, 01:47 left, coins Rp 380, combo ×1.5.
// 3 tickets: Nasi Goreng amber ~50%, Sate Ayam red ~20% (selected, pulsing),
// Es Teh Melati ★ Pak Budi green ~80%. Plating plate 1: Nasi Goreng 2/3 built
// (cooked Nasi + chopped Telur, Kecap not yet added). Cook mid-walk between
// stove and plating counter. Serving window: finished Mie Goreng READY with
// bell + "+Rp 110" coin pop. No day badge, no goal (Revision 1).
export function stageCover(state) {
  baseStaged(state, 73, 380, 3); // 180 - 73 = 107 s left = 01:47
  const nasi = makeTicket(state, 'nasi', 45, null, false);
  nasi.patience = 22.5; // ~50% amber
  const sate = makeTicket(state, 'sate', 36, null, false);
  sate.patience = 7.2; // ~20% red, pulsing
  const teh = makeTicket(state, 'teh', 60, null, true);
  teh.patience = 48; // ~80% green, Pak Budi
  state.tickets = [nasi, sate, teh];
  state.selectedTicket = 1; // Sate (red) is the active ticket
  // Plating plate 1: Nasi Goreng 2/3 (cooked Nasi + chopped Telur).
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
  // Window: finished Mie Goreng READY (bell + READY tag + green glow).
  // This is a real gameplay state now: placeAtWindow() puts a carried
  // finished plate here, and clicking it serves it (serveWindowPlate).
  state.windowPlates[0] = { dish: 'mie', items: [], finisher: 'kecap', picky: null };
  // Coin pop sits BELOW the READY plate, clear of the customers and the
  // READY tag (the old x=1132 overlapped the middle customer's face).
  state.floats.push({
    x: 1075, y: 440, text: '+Rp 110', sub: 'termasuk tip Rp 25', color: '#F5C542', t: 0.3, life: 1.1,
  });
  // Cook mid-walk between stove and plating counter, hands empty (walking to
  // click the Kecap bottle for the 2/3 plate).
  state.cook.x = 760;
  state.cook.y = 300;
  state.cook.dir = 3;
  state.cook.walking = true;
  // A burner is cooking (steam) so the kitchen feels alive.
  state.burners[0] = { item: { kind: 'mie', prep: 'raw' }, t: 1.5, cookTime: 3, done: false, burnt: false };
  return state;
}

// 2-chop.jpg — early shift, cook at the chopping board, knife mid-swing over
// Sayur; leaf particles frozen mid-air; 3 tickets (Mie Goreng green, Nasi
// Goreng amber, Sate Ayam green) — full board, no blank slots;
// shift timer 02:31; hint "Potong Sayur untuk Mie Goreng".
export function stageChop(state) {
  baseStaged(state, 29, 0, 0); // 180 - 29 = 151 s left = 02:31
  const mie = makeTicket(state, 'mie', 45, null, false);
  mie.patience = 40; // green ~89%
  const nasi = makeTicket(state, 'nasi', 45, null, false);
  nasi.patience = 22.5; // amber ~50%
  const sate = makeTicket(state, 'sate', 36, null, false);
  sate.patience = 25; // green ~70%
  state.tickets = [mie, nasi, sate];
  state.selectedTicket = 0;
  state.cook.x = 360;
  state.cook.y = 380;
  state.cook.dir = 1; // facing the board (up)
  state.cook.hands = [{ kind: 'sayur', prep: 'raw' }, null];
  state.toast = { text: 'Potong Sayur untuk Mie Goreng', t: 1 };
  state.toastT = 1;
  // Leaf particles frozen mid-air above the board.
  state.particles = [
    { x: 340, y: 270, vx: 0, vy: 0, t: 0.2, life: 1, size: 5, color: '#5E9A4A', shape: 'leaf' },
    { x: 360, y: 260, vx: 0, vy: 0, t: 0.25, life: 1, size: 4, color: '#7AB85E', shape: 'leaf' },
    { x: 380, y: 272, vx: 0, vy: 0, t: 0.15, life: 1, size: 5, color: '#5E9A4A', shape: 'leaf' },
    { x: 350, y: 250, vx: 0, vy: 0, t: 0.3, life: 1, size: 4, color: '#E07856', shape: 'circle' },
    { x: 372, y: 255, vx: 0, vy: 0, t: 0.2, life: 1, size: 4, color: '#5E9A4A', shape: 'leaf' },
  ];
  return state;
}

// 3-serve.jpg — mid-shift, cook at the serving window carrying a finished
// Sate Ayam toward the window (place it, then click to serve); coin pop
// "+Rp 175" floating from an earlier serve; combo ×1.5; order board full
// (fresh Es Teh just arrived in slot 0 + 2 remaining tickets);
// shift timer 01:12.
export function stageServe(state) {
  baseStaged(state, 108, 175, 3); // 180 - 108 = 72 s left = 01:12
  const teh = makeTicket(state, 'teh', 60, null, false);
  teh.patience = 55; // green ~92%, just arrived
  const nasi = makeTicket(state, 'nasi', 45, null, false);
  nasi.patience = 30;
  const mie = makeTicket(state, 'mie', 45, null, false);
  mie.patience = 18;
  state.tickets = [teh, nasi, mie]; // full board: fresh ticket in slot 0
  state.selectedTicket = 1;
  state.cook.x = 950;
  state.cook.y = 380; // window stand point (left of the window wall, below the plating counter)
  state.cook.dir = 3; // facing the window (right)
  state.cook.plate = { dish: 'sate', items: [], finisher: 'saus', picky: null };
  // Coin pop below the window plates, clear of the customers (the old
  // x=1132 overlapped the middle customer's head).
  state.floats.push({
    x: 1075, y: 440, text: '+Rp 175', sub: 'termasuk tip Rp 35', color: '#F5C542', t: 0.3, life: 1.1,
  });
  return state;
}

// 4-angle.jpg — second live-kitchen angle (Revision 1): Sate Ayam selected
// (red ~20%, pulsing) on a full 3-ticket board; Sate Ayam grilling on the
// stove (~60%) with a second burner cooking Mie so the grill looks full;
// Sate Ayam mid-assembly on the plate (grilled Ayam, saus not yet added).
// Reads differently from shots 1–3 at thumbnail size: different dish,
// different ticket, both burners lit.
export function stageSecondAngle(state) {
  baseStaged(state, 100, 260, 2); // 180 - 100 = 80 s left = 01:20
  const sate = makeTicket(state, 'sate', 36, null, false);
  sate.patience = 7.2; // red ~20%, pulsing — the rush
  const mie = makeTicket(state, 'mie', 40, null, false);
  mie.patience = 16; // amber ~40%
  const nasi = makeTicket(state, 'nasi', 40, null, false);
  nasi.patience = 28; // green ~70%
  state.tickets = [sate, mie, nasi];
  state.selectedTicket = 0; // Sate is the active ticket
  // Sate Ayam grilling on burner 0 (~60% through its 5 s cook) + Mie
  // cooking on burner 1 so the stove looks full.
  state.burners[0] = { item: { kind: 'ayam', prep: 'chopped' }, t: 3, cookTime: 5, done: false, burnt: false };
  state.burners[1] = { item: { kind: 'mie', prep: 'raw' }, t: 1.5, cookTime: 3, done: false, burnt: false };
  // Sate Ayam mid-assembly on plate 1 (grilled Ayam, saus not yet added).
  state.plates[0] = {
    items: [
      { kind: 'ayam', prep: 'cooked' },
    ],
    finisher: null,
    dish: null,
    done: false,
    picky: null,
  };
  // Cook at the stove, about to lift.
  state.cook.x = 624;
  state.cook.y = 210;
  state.cook.dir = 1;
  state.cook.hands = [null, null];
  return state;
}

export function stageShot(state, name) {
  if (name === 'cover') return stageCover(state);
  if (name === 'chop') return stageChop(state);
  if (name === 'serve') return stageServe(state);
  if (name === 'angle') return stageSecondAngle(state);
  return state;
}
