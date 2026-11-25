// pantry.js — takeIngredient(state, bowl): take one pantry ingredient into hand.
// Hands hold max 2 items; a third take is refused with a shake + toast.
// The take is instant — the walk to the pantry is the cost, not the take.

import { INGREDIENTS } from './config.js';
import { handsFull, takeIntoHand } from './state.js';

export function pantryBowlAt(state, index) {
  return INGREDIENTS[index] || null;
}

export function takeIngredient(state, index) {
  const bowl = INGREDIENTS[index];
  if (!bowl) return { ok: false, why: 'no-bowl' };
  if (state.cook.plate) return { ok: false, why: 'carrying-plate' };
  if (handsFull(state)) return { ok: false, why: 'hands-full' };
  const item = { kind: bowl.id, prep: 'raw' };
  if (!takeIntoHand(state, item)) return { ok: false, why: 'hands-full' };
  state.firstAction = true;
  return { ok: true, item, bowl };
}

// Finisher bottles live on the plating counter (one click, unlimited, no hand slot).
export function finisherById(id) {
  return { kecap: 'Kecap', saus: 'Saus Kacang', es: 'Es Batu' }[id] || id;
}
