// state.js — createGameState(): tickets, hands, plates, burners, coins, combo,
// shift timer and ramp thirds. One 180 s shift, no day, no goals (Revision 1).

import { CONFIG } from './config.js';
import { mulberry32 } from './random.js';

export function createGameState(seed = 7) {
  return {
    mode: 'title', // title | playing | paused | book | summary
    seed,
    rng: mulberry32(seed),
    time: 0, // elapsed shift seconds
    shiftLength: CONFIG.shiftLength,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    dishesServed: 0,
    cook: {
      x: 624, y: 380, dir: 0, // 0 down, 1 up, 2 left, 3 right
      target: null, // {x, y, action} — walk there, then run action
      path: null, // waypoint list from the pathfinder (or null) — follow in order
      walking: false,
      hands: [null, null], // up to 2 items {kind, prep}
      plate: null, // one finished plate carried, or null
      anim: 'idle', // idle | walk | chop | stir | carry | serve | celebrate | sad
      animT: 0, // seconds in the current animation state
      facing: 1, // 1 = right, -1 = left (side view is always profile)
    },
    // Customers behind the counter (presentation only — never a mechanic).
    // 3 slots, one per ticket slot: {kind, mood, enterT, leaveT, leaving, ticketId}.
    customers: [null, null, null],
    camera: null, // null, or {x, y, zoom} for the staged shot-4 close-up
    burners: [
      { item: null, t: 0, cookTime: 0, done: false, burnt: false },
      { item: null, t: 0, cookTime: 0, done: false, burnt: false },
    ],
    plates: [
      { items: [], finisher: null, dish: null, done: false, picky: null },
      { items: [], finisher: null, dish: null, done: false, picky: null },
    ],
    windowPlates: [null, null], // finished plates sitting at the window (READY)
    tickets: [null, null, null], // order board slots
    spawnTimer: 0,
    spawnCount: 0,
    pakBudi: { spawned: false, served: false, slot: -1 },
    selectedTicket: 0, // active order (index into tickets)
    firstAction: false, // spawn clock starts after the first player action
    particles: [],
    floats: [], // floating texts {x, y, text, sub, color, t, life}
    shake: 0, // trauma 0..1, camera-offset only
    muted: false,
    summary: null, // {coins, dishes, bestCombo, pakBudi, story}
    prompt: 0, // onboarding step 0..5 (0 = show first prompt)
    toast: null, // {text, t} one-line message
    toastT: 0,
    bookOpen: false,
    bookFrom: 'playing', // mode to return to when the recipe book closes
    timeScale: 1,
  };
}

// Which ramp third the shift is in (0, 1, 2) by elapsed seconds.
export function rampThird(state) {
  const third = state.shiftLength / 3;
  if (state.time < third) return 0;
  if (state.time < third * 2) return 1;
  return 2;
}

export function timeLeft(state) {
  return Math.max(0, state.shiftLength - state.time);
}

export function shiftOver(state) {
  return state.time >= state.shiftLength;
}

// Hands helpers.
export function handsFree(state) {
  return state.cook.hands.filter(Boolean).length;
}

export function handsFull(state) {
  return handsFree(state) >= CONFIG.handCapacity;
}

export function firstHandItem(state) {
  return state.cook.hands.find(Boolean) || null;
}

export function takeIntoHand(state, item) {
  for (let i = 0; i < state.cook.hands.length; i++) {
    if (!state.cook.hands[i]) {
      state.cook.hands[i] = item;
      return true;
    }
  }
  return false;
}

export function removeFromHand(state, item) {
  for (let i = 0; i < state.cook.hands.length; i++) {
    if (state.cook.hands[i] === item) {
      state.cook.hands[i] = null;
      return true;
    }
  }
  return false;
}

// A ticket: {dish, picky (null | {tag, skip, skipFinisher}), patience, maxPatience,
// starred (Pak Budi), id, bornAt}. Patience counts down while playing.
export function makeTicket(state, dishId, patience, picky = null, starred = false) {
  return {
    id: state.spawnCount++,
    dish: dishId,
    picky,
    patience,
    maxPatience: patience,
    starred,
    bornAt: state.time,
  };
}
