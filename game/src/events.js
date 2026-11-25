// warung-sari-rasa v3.0 — events.js
import { CONFIG, EVENT } from './config.js';
import { makeTicket } from './state.js';

export function eventActive(state) {
  const ev = state.event;
  return !!(ev && ev.spawned && !ev.cleared && !ev.failed);
}

export function eventMultiplier(state) {
  return eventActive(state) ? EVENT.multiplier : 1;
}

export function maybeStartEvent(state, t) {
  if (!state.event) {
    state.event = { name: 'JAM MAKAN SIANG — RUSH!', vip: EVENT.vip, spawned: false, cleared: false, failed: false };
  }
  const ev = state.event;
  if (ev.spawned || ev.failed) return false;
  if (t < EVENT.at) return false;
  if (t > EVENT.waitUntil) {
    ev.failed = true;
    return false;
  }
  const free = state.tickets.findIndex((tk) => !tk);
  if (free < 0) return false;
  const ticket = makeTicket(state, EVENT.dish, EVENT.patience, null, false);
  ticket.vip = EVENT.vip;
  ticket.perfectOnly = true;
  state.tickets[free] = ticket;
  ev.spawned = true;
  ev.slot = free;
  // F1: auto-select the Kumis ticket so serving the matching dish clears the
  // event even if the player never clicks a card (the natural play pattern).
  state.selectedTicket = free;
  return true;
}
