// input.js — Input via Phaser: pointerdown / pointermove / keyboard.
// Click-a-station is PRIMARY (click station/bowl/ticket/plate = walk there +
// auto-interact on arrival). WASD/arrows are dropped (Revision 1); cheap
// shortcuts stay (1-3 tickets, Z-N bowls, E/Space, Q, K, P/Esc, M).
// The queues (clicks[] / pressed[]) and the consumption functions are the
// same shape as the DOM version — main.js's update() consumes them exactly
// as before, so the fixed mode-gating behaviour (input in ALL modes) is
// preserved. Phaser pointer.x/y are already logical 1280x720 coords
// (the Scale Manager handles the CSS letterbox), so no conversion is needed.

import { ZONES, inRect } from './zones.js';

// Logical canvas size.
export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

export function createInput(scene) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    clicks: [], // queued {x, y} in logical coords
    pressed: [], // queued key strings (consumed once)
  };

  scene.input.on('pointerdown', (pointer) => {
    input.mouse.down = true;
    input.mouse.x = pointer.x;
    input.mouse.y = pointer.y;
    input.clicks.push({ x: pointer.x, y: pointer.y });
  });
  scene.input.on('pointerup', () => {
    input.mouse.down = false;
  });
  scene.input.on('pointermove', (pointer) => {
    input.mouse.x = pointer.x;
    input.mouse.y = pointer.y;
  });
  scene.input.keyboard.on('keydown', (e) => {
    const key = e.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
    }
    if (!input.keys.has(key)) input.pressed.push(key);
    input.keys.add(key);
  });
  scene.input.keyboard.on('keyup', (e) => {
    input.keys.delete(e.key.toLowerCase());
  });
  return input;
}

export function consumeClick(input) {
  return input.clicks.shift() || null;
}

export function consumePressed(input) {
  return input.pressed.shift() || null;
}

// What did the player click? Returns an action descriptor, or null.
// Priority (side view): bubbles → customers → bowls → finishers → plates →
// burners → bin → bell → windowPlates → stations → window lane → walk.
// Hit-test priority (first match wins): bubbles, customers, bowls,
// finishers, plates, burners, bin, bell, window plates, stations, lane,
// then open floor (walk). The order matters — a bubble sits above a
// customer, a burner sits on its station, and the window plates sit on
// the counter — so the smaller, more specific target is tested first.
export function hitTestClick(x, y) {
  for (let i = 0; i < ZONES.tickets.length; i++) {
    if (inRect(x, y, ZONES.tickets[i])) return { type: 'ticket', slot: i };
  }
  for (let i = 0; i < ZONES.customers.length; i++) {
    if (inRect(x, y, ZONES.customers[i])) return { type: 'ticket', slot: i };
  }
  for (let i = 0; i < ZONES.bowls.length; i++) {
    if (inRect(x, y, ZONES.bowls[i])) return { type: 'bowl', index: i };
  }
  for (let i = 0; i < ZONES.finishers.length; i++) {
    if (inRect(x, y, ZONES.finishers[i])) return { type: 'finisher', index: i };
  }
  for (let i = 0; i < ZONES.plates.length; i++) {
    if (inRect(x, y, ZONES.plates[i])) return { type: 'plate', index: i };
  }
  for (let i = 0; i < ZONES.burners.length; i++) {
    if (inRect(x, y, ZONES.burners[i])) return { type: 'burner', index: i };
  }
  if (inRect(x, y, ZONES.bin)) return { type: 'bin' };
  if (inRect(x, y, ZONES.bell)) return { type: 'bell' };
  if (inRect(x, y, ZONES.windowPlates[0])) return { type: 'windowPlate', index: 0 };
  if (inRect(x, y, ZONES.windowPlates[1])) return { type: 'windowPlate', index: 1 };
  if (inRect(x, y, ZONES.stationClick.stove)) return { type: 'station', station: 'stove' };
  if (inRect(x, y, ZONES.stationClick.chopping)) return { type: 'station', station: 'chopping' };
  if (inRect(x, y, ZONES.stationClick.plating)) return { type: 'station', station: 'plating' };
  if (inRect(x, y, ZONES.stationClick.window)) return { type: 'station', station: 'window' };
  if (inRect(x, y, ZONES.stationClick.pantry)) return { type: 'station', station: 'pantry' };
  if (inRect(x, y, ZONES.lane)) return { type: 'station', station: 'window' };
  return { type: 'walk', x, y };
}

// Map a pressed key to an action descriptor, or null.
// Book is 'k' (not 'b': 'b' is the Sayur bowl key — bowlKeys is checked
// first, so a book on 'b' would be dead code).
export function keyAction(key) {
  if (key === '1' || key === '2' || key === '3') {
    return { type: 'ticket', slot: Number(key) - 1 };
  }
  if (key === 'k') return { type: 'book' };
  const bowlKeys = ['z', 'x', 'c', 'v', 'b', 'n'];
  const bi = bowlKeys.indexOf(key);
  if (bi >= 0) return { type: 'bowl', index: bi };
  if (key === 'q') return { type: 'trash' };
  if (key === 'p' || key === 'escape') return { type: 'pause' };
  if (key === 'm') return { type: 'mute' };
  if (key === 'e' || key === ' ') return { type: 'interact' };
  if (key === 'enter') return { type: 'confirm' };
  if (key === 'r') return { type: 'restart' };
  return null;
}
