// chopping.js — chopItem(state): raw → chopped, what is choppable.
// Sayur→Sayur Potong, Ayam→Ayam Potong, Telur→Telur Kocok. One click = one chop,
// instant. Chopping a non-choppable item is refused (no time lost beyond the walk).
// The board holds one item at a time; the chop replaces it in the same hand slot.

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

// Chop the first choppable raw item in hand. Returns {ok, item, why}.
export function chopItem(state) {
  const item = firstHandItem(state);
  if (!item) return { ok: false, why: 'empty-hands' };
  if (item.prep !== 'raw') return { ok: false, why: 'already-prepped' };
  if (!choppableKind(item.kind)) return { ok: false, why: 'not-choppable' };
  removeFromHand(state, item);
  const chopped = { kind: item.kind, prep: 'chopped' };
  takeIntoHand(state, chopped);
  state.firstAction = true;
  return { ok: true, item: chopped };
}

// The first choppable raw item in hand, if any (for UI hints).
export function nextChoppable(state) {
  return state.cook.hands.find((i) => i && i.prep === 'raw' && choppableKind(i.kind)) || null;
}
