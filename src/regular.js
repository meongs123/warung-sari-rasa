// warung-sari-rasa v3.0 — regular.js
export const PAK_BUDI_STORY = "Pak Budi: 'Nasgornya pas, Nak. Besok saya mampir lagi.'";

export function pakBudiTicket(state) {
  return state.tickets.find((t) => t && t.starred) || null;
}

export function pakBudiServed(state) {
  return state.pakBudi.served;
}
