// regular.js — PakBudi: the single cozy anchor (Revision 1).
// One starred Nasi Goreng ticket per shift, spawns ~45 s in, patience 60 s.
// Serving him = standard price + one story line on the shift summary.
// He is the only named character; there is no multi-day streak or arc.
// No multi-day streak, no badge, no 3-day story arc.

export const PAK_BUDI_STORY = "Pak Budi: 'Nasgornya pas, Nak. Besok saya mampir lagi.'";

export function pakBudiTicket(state) {
  return state.tickets.find((t) => t && t.starred) || null;
}

export function pakBudiServed(state) {
  return state.pakBudi.served;
}
