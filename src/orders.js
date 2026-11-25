// orders.js — spawnTicket(), updatePatience(dt), expireTicket().
// In-shift ramp: spawn interval and patience tighten by shift third.
// Picky orders (skip-one-step only) appear in the last 90 s, max 1 open.

import { CONFIG, RECIPE_ORDER, RECIPES } from './config.js';
import { makeTicket, shiftOver, rampThird } from './state.js';
import { expireTicket } from './serving.js';
import { pickWeighted } from './random.js';

const DISH_WEIGHTS = [
  ['nasi', 3],
  ['mie', 3],
  ['sate', 2],
  ['teh', 2],
];

function pickyOpen(state) {
  return state.tickets.some((t) => t && t.picky);
}

function choosePicky(state, dishId) {
  const recipe = RECIPES[dishId];
  if (!recipe || !recipe.picky.length) return null;
  if (state.time < CONFIG.pickyFrom) return null;
  if (pickyOpen(state)) return null;
  if (state.rng() > 0.4) return null;
  return recipe.picky[0];
}

function chooseDish(state) {
  // Es Teh is the breather: never offer more than one at a time.
  const openTeh = state.tickets.some((t) => t && t.dish === 'teh');
  const pool = DISH_WEIGHTS.filter(([id]) => !(id === 'teh' && openTeh));
  return pickWeighted(state.rng, pool);
}

export function spawnTicket(state) {
  const free = state.tickets.findIndex((t) => !t);
  if (free < 0) return null;
  const third = rampThird(state);
  const dishId = chooseDish(state);
  const patience = CONFIG.ramp[third].patience;
  const picky = choosePicky(state, dishId);
  const ticket = makeTicket(state, dishId, patience, picky, false);
  state.tickets[free] = ticket;
  return ticket;
}

// The opening ticket: always Nasi Goreng, patience 60 s, and the spawn clock
// does not start until the player's first action (first success guaranteed).
export function spawnFirstTicket(state) {
  const ticket = makeTicket(state, 'nasi', CONFIG.firstTicketPatience, null, false);
  state.tickets[0] = ticket;
  state.selectedTicket = 0;
  return ticket;
}

// Advance the ticket clock. Returns expired tickets (for feedback).
export function updateOrders(state, dt) {
  if (shiftOver(state)) return [];
  if (!state.firstAction) return [];
  const third = rampThird(state);
  state.spawnTimer += dt;
  const interval = CONFIG.ramp[third].spawnEvery;
  if (state.spawnTimer >= interval) {
    state.spawnTimer = 0;
    spawnTicket(state);
  }
  // Pak Budi's starred ticket spawns once, ~45 s in.
  if (!state.pakBudi.spawned && state.time >= CONFIG.pakBudiAt) {
    state.pakBudi.spawned = true;
    const free = state.tickets.findIndex((t) => !t);
    if (free >= 0) {
      const ticket = makeTicket(state, 'nasi', CONFIG.pakBudiPatience, null, true);
      state.tickets[free] = ticket;
      state.pakBudi.slot = free;
    }
  }
  // Patience drains; expired tickets leave angry and reset the combo.
  const expired = [];
  for (let i = 0; i < state.tickets.length; i++) {
    const t = state.tickets[i];
    if (!t) continue;
    t.patience -= dt;
    if (t.patience <= 0) {
      const gone = expireTicket(state, i);
      if (gone) expired.push(gone);
    }
  }
  return expired;
}

export function openTickets(state) {
  return state.tickets.filter(Boolean);
}

export function selectTicket(state, slot) {
  if (slot < 0 || slot >= state.tickets.length) return false;
  if (!state.tickets[slot]) return false;
  state.selectedTicket = slot;
  return true;
}
