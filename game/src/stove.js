// stove.js — placeOnBurner(), liftFromBurner(), updateBurners(dt).
// Two burners = the only parallelism. Cook timers, green zone, burnt.
// Leaving an item past the green zone + grace burns it: it cannot be plated,
// must be trashed, and the burn breaks the combo the moment it burns.
// A burnt burner must be cleared (click it) before it can be used again.
// must be trashed, and the burn breaks the combo the moment it burns.

import { CONFIG } from './config.js';
import { INGREDIENTS } from './config.js';
import { firstHandItem, removeFromHand, takeIntoHand } from './state.js';

export function cookableKind(kind) {
  const ing = INGREDIENTS.find((b) => b.id === kind);
  return ing ? ing.cooks : 0;
}

export function freeBurner(state) {
  return state.burners.findIndex((b) => !b.item);
}

export function doneBurner(state) {
  return state.burners.findIndex((b) => b.item && b.done && !b.burnt);
}

// Place a cookable item from hand onto a free burner.
export function placeOnBurner(state, burnerIndex = -1) {
  const item = firstHandItem(state);
  if (!item) return { ok: false, why: 'empty-hands' };
  if (item.prep === 'cooked') return { ok: false, why: 'already-cooked' };
  if (item.prep === 'chopped' && item.kind !== 'ayam') return { ok: false, why: 'no-cook' };
  const cookTime = cookableKind(item.kind);
  if (!cookTime) return { ok: false, why: 'no-cook' };
  let idx = burnerIndex;
  if (idx < 0 || state.burners[idx].item) idx = freeBurner(state);
  if (idx < 0) return { ok: false, why: 'burners-full' };
  removeFromHand(state, item);
  state.burners[idx] = { item, t: 0, cookTime, done: false, burnt: false };
  state.firstAction = true;
  return { ok: true, burner: idx };
}

// Lift a done item off a burner into hand.
export function liftFromBurner(state, burnerIndex = -1) {
  let idx = burnerIndex;
  if (idx < 0) idx = doneBurner(state);
  if (idx < 0) return { ok: false, why: 'nothing-done' };
  const burner = state.burners[idx];
  if (!burner.item || !burner.done || burner.burnt) return { ok: false, why: 'not-ready' };
  if (state.cook.plate) return { ok: false, why: 'carrying-plate' };
  const cooked = { kind: burner.item.kind, prep: 'cooked' };
  if (!takeIntoHand(state, cooked)) return { ok: false, why: 'hands-full' };
  state.burners[idx] = { item: null, t: 0, cookTime: 0, done: false, burnt: false };
  state.firstAction = true;
  return { ok: true, item: cooked, burner: idx };
}

// Clear a burnt burner (trash). Returns the burnt item kind, or null.
export function clearBurntBurner(state, burnerIndex) {
  const burner = state.burners[burnerIndex];
  if (!burner || !burner.item || !burner.burnt) return null;
  const kind = burner.item.kind;
  state.burners[burnerIndex] = { item: null, t: 0, cookTime: 0, done: false, burnt: false };
  return kind;
}

// Advance burner timers. Returns a list of events: [{type:'done'|'burnt', burner, kind}].
export function updateBurners(state, dt) {
  const events = [];
  for (let i = 0; i < state.burners.length; i++) {
    const b = state.burners[i];
    if (!b.item || b.burnt) continue;
    b.t += dt;
    if (!b.done && b.t >= b.cookTime) {
      b.done = true;
      events.push({ type: 'done', burner: i, kind: b.item.kind });
    } else if (b.done && b.t >= b.cookTime + CONFIG.burnGrace) {
      b.burnt = true;
      events.push({ type: 'burnt', burner: i, kind: b.item.kind });
    }
  }
  return events;
}

export function burnerProgress(burner) {
  if (!burner.item) return 0;
  return Math.min(1, burner.t / burner.cookTime);
}
