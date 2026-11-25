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
  state.windowPlates[0] = { dish: 'mie', items: [], finisher: 'kecap', picky: null };
  state.floats.push({
    x: 1132, y: 290, text: '+Rp 110', sub: 'termasuk tip Rp 25', color: '#F5C542', t: 0.3, life: 1.1,
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
// Sayur; leaf particles frozen mid-air; 1 ticket (Mie Goreng, green);
// shift timer 02:31; hint "Potong Sayur untuk Mie Goreng".
export function stageChop(state) {
  baseStaged(state, 29, 0, 0); // 180 - 29 = 151 s left = 02:31
  const mie = makeTicket(state, 'mie', 45, null, false);
  mie.patience = 40; // green ~89%
  state.tickets = [mie, null, null];
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

// 3-serve.jpg — mid-shift, cook at the serving window handing over a finished
// Sate Ayam; coin pop "+Rp 175" floating; combo ×1.5; order board shows the
// Sate slot just cleared (empty with check) + 2 remaining tickets;
// shift timer 01:12.
export function stageServe(state) {
  baseStaged(state, 68, 175, 3); // 180 - 68 = 112 s left = 01:52 (timer shows 01:12 via timeLeft override below)
  state.time = 108; // 180 - 108 = 72 s left = 01:12
  const nasi = makeTicket(state, 'nasi', 45, null, false);
  nasi.patience = 30;
  const mie = makeTicket(state, 'mie', 45, null, false);
  mie.patience = 18;
  state.tickets = [null, nasi, mie]; // slot 0 cleared (Sate just served)
  state.selectedTicket = 1;
  state.cook.x = 950;
  state.cook.y = 380; // window stand point (left of the window wall, below the plating counter)
  state.cook.dir = 3; // facing the window (right)
  state.cook.plate = { dish: 'sate', items: [], finisher: 'saus', picky: null };
  state.floats.push({
    x: 1132, y: 280, text: '+Rp 175', sub: 'termasuk tip Rp 35', color: '#F5C542', t: 0.3, life: 1.1,
  });
  return state;
}

// 4-angle.jpg — second live-kitchen angle (Revision 1): stove/grill timers
// running with two amber tickets and a different dish mid-assembly.
// Sate Ayam on the grill (timer ~60%) + Mie Goreng mid-assembly on the plate.
export function stageSecondAngle(state) {
  baseStaged(state, 100, 260, 2); // 180 - 100 = 80 s left = 01:20
  const mie = makeTicket(state, 'mie', 40, null, false);
  mie.patience = 16; // amber ~40%
  const nasi = makeTicket(state, 'nasi', 40, null, false);
  nasi.patience = 14; // amber ~35%
  state.tickets = [mie, nasi, null];
  state.selectedTicket = 0;
  // Sate Ayam grilling on burner 1 (~60% through its 5 s cook).
  state.burners[0] = { item: { kind: 'ayam', prep: 'chopped' }, t: 3, cookTime: 5, done: false, burnt: false };
  // Mie Goreng mid-assembly on plate 1 (cooked Mie + chopped Sayur, 2/3).
  state.plates[0] = {
    items: [
      { kind: 'mie', prep: 'cooked' },
      { kind: 'sayur', prep: 'chopped' },
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
