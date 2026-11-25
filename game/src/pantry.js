// warung-sari-rasa v3.0 — pantry.js
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

export function finisherById(id) {
  return { kecap: 'Kecap', saus: 'Saus Kacang', es: 'Es Batu' }[id] || id;
}
