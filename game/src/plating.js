// warung-sari-rasa v3.0 — plating.js
import { RECIPES } from './config.js';
import { firstHandItem, removeFromHand } from './state.js';

export function requiredComponents(ticket) {
  const recipe = RECIPES[ticket.dish];
  if (!recipe) return { items: [], finisher: null };
  let items = recipe.plate.map((c) => ({ ...c }));
  let finisher = recipe.finisher;
  if (ticket.picky) {
    if (ticket.picky.skip) {
      items = items.filter(
        (c) => !(c.kind === ticket.picky.skip.kind && c.prep === ticket.picky.skip.prep),
      );
    }
    if (ticket.picky.skipFinisher) finisher = null;
  }
  return { items, finisher };
}

function hasComponent(items, comp) {
  return items.some((i) => i.kind === comp.kind && i.prep === comp.prep);
}

export function plateMatchesTicket(plate, ticket) {
  const need = requiredComponents(ticket);
  if (plate.items.length !== need.items.length) return false;
  for (const comp of need.items) {
    if (!hasComponent(plate.items, comp)) return false;
  }
  if (need.finisher) return plate.finisher === need.finisher;
  return plate.finisher === null;
}

export function refreshPlateDone(state, plateIndex) {
  const plate = state.plates[plateIndex];
  if (!plate || plate.done) return plate ? plate.dish : null;
  const order = [];
  if (state.tickets[state.selectedTicket]) order.push(state.tickets[state.selectedTicket]);
  for (const t of state.tickets) if (t && !order.includes(t)) order.push(t);
  for (const ticket of order) {
    if (plateMatchesTicket(plate, ticket)) {
      plate.done = true;
      plate.dish = ticket.dish;
      plate.picky = ticket.picky ? ticket.picky.tag : null;
      return ticket.dish;
    }
  }
  plate.done = false;
  plate.dish = null;
  plate.picky = null;
  return null;
}

export function plateTargetDish(state, plate) {
  if (!plate.items.length) return null;
  for (const t of state.tickets) {
    if (!t) continue;
    const need = requiredComponents(t);
    if (need.items.some((c) => hasComponent(plate.items, c))) return t.dish;
  }
  return null;
}

export function placeOnPlate(state, plateIndex = -1) {
  const item = firstHandItem(state);
  if (!item) return { ok: false, why: 'empty-hands' };
  if (state.cook.plate) return { ok: false, why: 'carrying-plate' };
  let idx = plateIndex;
  if (idx < 0) {
    idx = state.plates.findIndex((p) => !p.done && p.items.length < 3);
  }
  if (idx < 0) return { ok: false, why: 'plates-full' };
  const plate = state.plates[idx];
  if (plate.done) return { ok: false, why: 'plate-done' };

  const target = plateTargetDish(state, plate);
  if (target) {
    const need = requiredComponents({ dish: target, picky: platePickyFor(state, plate) });
    if (!need.items.some((c) => c.kind === item.kind && c.prep === item.prep)) {
      return { ok: false, why: 'wrong-item' };
    }
    if (hasComponent(plate.items, { kind: item.kind, prep: item.prep })) {
      return { ok: false, why: 'already-on-plate' };
    }
  } else {

    const belongs = state.tickets.some((t) => {
      if (!t) return false;
      const need = requiredComponents(t);
      return need.items.some((c) => c.kind === item.kind && c.prep === item.prep);
    });
    if (!belongs) return { ok: false, why: 'wrong-item' };
  }
  removeFromHand(state, item);
  plate.items.push({ kind: item.kind, prep: item.prep });
  state.firstAction = true;
  const dish = refreshPlateDone(state, idx);
  return { ok: true, plate: idx, dish };
}

function platePickyFor(state, plate) {
  for (const t of state.tickets) {
    if (!t) continue;
    const need = requiredComponents(t);
    if (need.items.some((c) => hasComponent(plate.items, c))) return t.picky;
  }
  return null;
}

export function addFinisher(state, finisherId, plateIndex = -1) {
  let idx = plateIndex;
  if (idx < 0) {
    idx = state.plates.findIndex((p) => !p.done && p.items.length > 0);
  }
  if (idx < 0) return { ok: false, why: 'no-plate' };
  const plate = state.plates[idx];
  if (plate.done) return { ok: false, why: 'plate-done' };
  if (plate.finisher) return { ok: false, why: 'finisher-set' };

  const target = plateTargetDish(state, plate);
  const ok = state.tickets.some((t) => {
    if (!t) return false;
    if (target && t.dish !== target) return false;
    const need = requiredComponents(t);
    return need.finisher === finisherId;
  });
  if (!ok) return { ok: false, why: 'wrong-finisher' };
  plate.finisher = finisherId;
  state.firstAction = true;
  const dish = refreshPlateDone(state, idx);
  return { ok: true, plate: idx, dish };
}

export function takePlate(state, plateIndex) {
  const plate = state.plates[plateIndex];
  if (!plate || !plate.done) return { ok: false, why: 'not-ready' };
  if (state.cook.plate) return { ok: false, why: 'carrying-plate' };
  if (state.cook.hands.some(Boolean)) return { ok: false, why: 'hands-full' };
  state.cook.plate = {
    dish: plate.dish,
    items: plate.items,
    finisher: plate.finisher,
    picky: plate.picky || null,
  };
  state.plates[plateIndex] = { items: [], finisher: null, dish: null, done: false, picky: null };
  state.firstAction = true;
  return { ok: true, dish: state.cook.plate.dish };
}

export function trashPlate(state, plateIndex) {
  const plate = state.plates[plateIndex];
  if (!plate || (!plate.items.length && !plate.finisher)) return { ok: false, why: 'empty' };
  state.plates[plateIndex] = { items: [], finisher: null, dish: null, done: false, picky: null };
  return { ok: true };
}
