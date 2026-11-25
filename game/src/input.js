// warung-sari-rasa v3.0 — input.js
import { ZONES, inRect } from './zones.js';

export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

export function createInput(scene) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    clicks: [],
    pressed: [],
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
  const sc = ZONES.stationClick;
  if (inRect(x, y, sc.stove)) return { type: 'station', station: 'stove' };
  if (inRect(x, y, sc.chopping) || inRect(x, y, sc.chopPanel)) return { type: 'station', station: 'chopping' };
  if (inRect(x, y, sc.plating) || inRect(x, y, sc.platePanel)) return { type: 'station', station: 'plating' };
  if (inRect(x, y, sc.pass)) return { type: 'bell' };
  if (inRect(x, y, sc.window)) return { type: 'station', station: 'window' };
  if (inRect(x, y, sc.pantry)) return { type: 'station', station: 'pantry' };
  return { type: 'walk', x, y };
}

export function keyAction(key) {
  if (key >= '1' && key <= '6') return { type: 'bowl', index: Number(key) - 1 };
  if (key === 'k') return { type: 'book' };
  if (key === 'q') return { type: 'trash' };
  if (key === 'p' || key === 'escape') return { type: 'pause' };
  if (key === 'm') return { type: 'mute' };
  if (key === 'e' || key === ' ') return { type: 'interact' };
  if (key === 'enter') return { type: 'confirm' };
  if (key === 'r' || key === 's') return { type: 'restart' };
  return null;
}
