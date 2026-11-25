// serving.js — serveWindowPlate(state, slot): match, coins, tip, combo, picky
// check, expiry. Carry a finished plate to the window, place it there
// (READY), then click it to ring the bell and serve it. Auto-match: the
// active ticket first, then another open ticket; if it matches none, refuse
// with a toast and keep the plate. A served dish pays base + tip by patience
// left, and the combo multiplier grows per consecutive correct serve (cap
// x2.0). shake (no penalty). Serving the standard dish to a picky ticket is
// refused ("bukan pesanan!") and breaks the combo — the only wrong-serve in
// the game.

import { RECIPES, comboMultiplier, tipRate } from './config.js';

// Place the carried finished plate onto the serving window (READY). The
// plate sits at the window until the player clicks it to serve.
export function placeAtWindow(state, slot = -1) {
  const carried = state.cook.plate;
  if (!carried) return { ok: false, why: 'no-plate' };
  let idx = slot;
  if (idx < 0) idx = state.windowPlates.findIndex((p) => !p);
  if (idx < 0 || idx >= state.windowPlates.length) return { ok: false, why: 'window-full' };
  if (state.windowPlates[idx]) return { ok: false, why: 'window-full' };
  state.windowPlates[idx] = carried;
  state.cook.plate = null;
  state.firstAction = true;
  return { ok: true, slot: idx };
}

// Serve the finished plate sitting at the window (READY). Returns
// {ok, coins, tip, combo, ticket, why}.
export function serveWindowPlate(state, slot) {
  const carried = state.windowPlates[slot];
  if (!carried) return { ok: false, why: 'no-plate' };
  const dish = RECIPES[carried.dish];
  if (!dish) return { ok: false, why: 'no-dish' };
  // Picky check: a standard plate served to a picky ticket is refused.
  const ticket = findServeTicket(state, carried);
  if (!ticket) return { ok: false, why: 'no-match' };
  if (ticket.picky && !carried.picky) {
    return { ok: false, why: 'wrong-picky', ticket };
  }
  const patienceFrac = ticket.patience / ticket.maxPatience;
  const rate = tipRate(patienceFrac);
  const base = Math.round(dish.price * (ticket.picky ? 1.25 : 1));
  const tip = Math.round(base * rate);
  const mult = comboMultiplier(state.combo);
  const earned = Math.round((base + tip) * mult);
  state.coins += earned;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.dishesServed += 1;
  const tslot = state.tickets.indexOf(ticket);
  if (tslot >= 0) state.tickets[tslot] = null;
  if (ticket.starred) state.pakBudi.served = true;
  state.windowPlates[slot] = null;
  state.firstAction = true;
  return {
    ok: true,
    coins: earned,
    tip,
    base,
    combo: state.combo,
    mult,
    ticket,
    dish: dish.name,
    starred: ticket.starred,
  };
}

// The carried plate must have been built for this ticket's variant.
// A plate built for the standard dish does NOT satisfy a picky ticket.
function findServeTicket(state, carried) {
  const order = [];
  if (state.tickets[state.selectedTicket]) order.push(state.tickets[state.selectedTicket]);
  for (const t of state.tickets) if (t && !order.includes(t)) order.push(t);
  for (const ticket of order) {
    if (ticket.dish !== carried.dish) continue;
    if (ticket.picky) {
      if (carried.picky === ticket.picky.tag) return ticket;
      continue;
    }
    if (carried.picky) continue;
    return ticket;
  }
  return null;
}

// A ticket expires: it leaves angry, combo resets, no coins. Shift continues.
export function expireTicket(state, slot) {
  const ticket = state.tickets[slot];
  if (!ticket) return null;
  state.tickets[slot] = null;
  state.combo = 0;
  if (ticket.starred) state.pakBudi.slot = -1;
  return ticket;
}
