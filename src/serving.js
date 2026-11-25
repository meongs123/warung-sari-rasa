// warung-sari-rasa v3.0 — serving.js
import { RECIPES, comboMultiplier, tipRate } from './config.js';
import { eventActive } from './events.js';

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

export function serveWindowPlate(state, slot) {
  const carried = state.windowPlates[slot];
  if (!carried) return { ok: false, why: 'no-plate' };
  const dish = RECIPES[carried.dish];
  if (!dish) return { ok: false, why: 'no-dish' };

  const ticket = findServeTicket(state, carried);
  if (!ticket) return { ok: false, why: 'no-match' };
  if (ticket.picky && !carried.picky) {
    return { ok: false, why: 'wrong-picky', ticket };
  }
  const patienceFrac = ticket.patience / ticket.maxPatience;
  const rate = tipRate(patienceFrac);
  const base = Math.round(dish.price * (ticket.picky ? 1.25 : 1));
  const tip = state.lives <= 0 ? 0 : Math.round(base * rate);
  const mult = state.lives <= 0 ? 1 : comboMultiplier(state.combo);
  const evMult = eventActive(state) ? 2 : 1;
  const earned = Math.round((base + tip) * mult * evMult);
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

export function expireTicket(state, slot) {
  const ticket = state.tickets[slot];
  if (!ticket) return null;
  state.tickets[slot] = null;
  state.combo = 0;
  state.streak = 0;
  state.lives = Math.max(0, state.lives - 1);
  state.stats.walkouts += 1;
  if (ticket.vip === 'kumis' && state.event) state.event.failed = true;
  if (ticket.starred) state.pakBudi.slot = -1;
  return ticket;
}
