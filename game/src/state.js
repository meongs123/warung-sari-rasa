// warung-sari-rasa v3.0 — state.js
import { CONFIG } from './config.js';
import { mulberry32 } from './random.js';

export function createGameState(seed = 7) {
  return {
    mode: 'title',
    seed,
    rng: mulberry32(seed),
    time: 0,
    shiftLength: CONFIG.shiftLength,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    dishesServed: 0,
    cook: {
      x: 624, y: 600, dir: 3,
      target: null,
      path: null,
      walking: false,
      hands: [null, null],
      plate: null,
      anim: 'idle',
      animT: 0,
      facing: 1,
    },

    customers: [null, null, null],
    camera: null,
    burners: [
      { item: null, t: 0, cookTime: 0, done: false, burnt: false },
      { item: null, t: 0, cookTime: 0, done: false, burnt: false },
    ],
    plates: [
      { items: [], finisher: null, dish: null, done: false, picky: null },
      { items: [], finisher: null, dish: null, done: false, picky: null },
    ],
    windowPlates: [null, null],
    tickets: [null, null, null],
    spawnTimer: 0,
    spawnCount: 0,
    pakBudi: { spawned: false, served: false, slot: -1 },
    selectedTicket: 0,
    firstAction: false,
    particles: [],
    floats: [],
    shake: 0,
    muted: false,
    summary: null,
    prompt: 0,
    toast: null,
    toastT: 0,
    bookOpen: false,
    bookFrom: 'playing',
    timeScale: 1,
    lives: 3,
    streak: 0,
    best: 0,
    event: null,
    dialogue: null,
    route: null,
    routeQueue: null,
    stats: { served: 0, perfect: 0, batchBonus: 0, walkouts: 0, burnt: 0,
      firstBell: false, dishes: { nasi: 0, mie: 0, sate: 0, teh: 0 } },
  };
}

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
