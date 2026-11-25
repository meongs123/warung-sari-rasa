// warung-sari-rasa v3.0 — chopping.js
import { INGREDIENTS } from './config.js';
import { firstHandItem, removeFromHand, takeIntoHand } from './state.js';

export function choppableKind(kind) {
  const ing = INGREDIENTS.find((b) => b.id === kind);
  return ing ? ing.chops : false;
}

export function choppedName(kind) {
  if (kind === 'sayur') return 'Sayur Potong';
  if (kind === 'ayam') return 'Ayam Potong';
  if (kind === 'telur') return 'Telur Kocok';
  return kind;
}

export function chopItem(state) {
  // M2: chop the first choppable RAW item, not the first hand item — a player
  // who lifts a cooked item first (a natural move) must still be able to chop
  // the raw item in the other hand.
  const item = nextChoppable(state);
  if (!item) {
    const first = firstHandItem(state);
    if (!first) return { ok: false, why: 'empty-hands' };
    if (first.prep !== 'raw') return { ok: false, why: 'already-prepped' };
    return { ok: false, why: 'not-choppable' };
  }
  removeFromHand(state, item);
  const chopped = { kind: item.kind, prep: 'chopped' };
  takeIntoHand(state, chopped);
  state.firstAction = true;
  return { ok: true, item: chopped };
}

export function nextChoppable(state) {
  return state.cook.hands.find((i) => i && i.prep === 'raw' && choppableKind(i.kind)) || null;
}
