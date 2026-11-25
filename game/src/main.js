// main.js — startGame(): boot, game loop (fixed timestep), screen stack,
// wires everything together. Click-to-walk is primary; E/Space interacts with
// the faced station; 1–3 tickets, Z–N bowls, Q trash, B book, P/Esc pause,
// M mute. Debug hooks: window.render_game_to_text + window.advanceTime.

import { CONFIG } from './config.js';
import { createGameState, rampThird, timeLeft, shiftOver, handsFree } from './state.js';
import { ZONES, inRect } from './zones.js';
import { createInput, consumeClick, consumePressed, hitTestClick, keyAction } from './input.js';
import { takeIngredient } from './pantry.js';
import { chopItem } from './chopping.js';
import { placeOnBurner, liftFromBurner, updateBurners, clearBurntBurner, doneBurner, freeBurner } from './stove.js';
import { placeOnPlate, addFinisher, takePlate, trashPlate, refreshPlateDone } from './plating.js';
import { servePlate } from './serving.js';
import { spawnFirstTicket, updateOrders, selectTicket } from './orders.js';
import { PAK_BUDI_STORY } from './regular.js';
import { render } from './render.js';
import { findPath, simplifyPath } from './pathfind.js';
import { updateFeedback, feedback, addFloat, addShake, spawnSteam, spawnParticles } from './feedback.js';
import {
  playChop, playTake, playPlok, playDing, playCoin, playBell, playBurn,
  playJingle, playRefuse, setSizzle, setMuted, isMuted, resumeAudio,
} from './audio.js';
import { stageShot } from './shots.js';
import { FINISHERS } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let state = createGameState(7);
let input = createInput(canvas);
let lastTime = 0;
let acc = 0;
const STEP = 1 / 60;

function showToast(text, seconds = 2) {
  state.toast = { text, t: seconds };
  state.toastT = seconds;
}

function refuse(why) {
  const messages = {
    'hands-full': 'Tangan penuh! (maks 2)',
    'carrying-plate': 'Tangan penuh piring!',
    'not-choppable': 'Tidak perlu dipotong',
    'empty-hands': 'Tangan kosong',
    'burners-full': 'Kompor penuh!',
    'no-cook': 'Bahan ini tidak dimasak',
    'nothing-done': 'Belum matang',
    'plates-full': 'Meja rakit penuh!',
    'plate-done': 'Piring sudah jadi',
    'wrong-item': 'Bukan bahan pesanan ini',
    'wrong-finisher': 'Bukan pelengkap pesanan ini',
    'already-on-plate': 'Sudah ada di piring',
    'no-plate': 'Tidak ada piring yang dirakit',
    'not-ready': 'Piring belum jadi',
    'no-match': 'Tidak ada pesanan yang cocok',
    'wrong-picky': 'Bukan pesanan! (cek tag merah)',
    'no-dish': 'Bukan hidangan',
  };
  showToast(messages[why] || 'Tidak bisa');
  playRefuse();
  addShake(state, 0.15);
}

// --- Station smart actions (what a click / E does at each station) ---

function doTakeBowl(index) {
  const res = takeIngredient(state, index);
  if (!res.ok) return refuse(res.why);
  const bowl = ZONES.bowls[index];
  feedback(state, 'small', bowl.x + bowl.w / 2, bowl.y + 20);
  playTake();
  advancePrompt('take');
}

function doChop() {
  const res = chopItem(state);
  if (!res.ok) return refuse(res.why);
  const c = ZONES.stationClick.chopping;
  feedback(state, 'medium', c.x + c.w / 2, c.y + c.h / 2, { colors: ['#5E9A4A', '#7AB85E', '#FFF3D6'] });
  playChop();
  advancePrompt('chop');
}

function doStove(burnerIndex = -1) {
  // If a burner is done, lift it; else place a cookable item; else refuse.
  const done = doneBurner(state);
  if (done >= 0 && (burnerIndex < 0 || burnerIndex === done)) {
    const res = liftFromBurner(state, done);
    if (res.ok) {
      playDing();
      feedback(state, 'medium', ZONES.burners[done].x + 55, ZONES.burners[done].y + 10, { colors: ['#F5C542', '#FFF3D6'] });
      return;
    }
    return refuse(res.why);
  }
  // If a specific burner was clicked and it is burnt, clear it.
  if (burnerIndex >= 0) {
    const b = state.burners[burnerIndex];
    if (b.item && b.burnt) {
      clearBurntBurner(state, burnerIndex);
      playTake();
      showToast('Item gosong dibuang');
      return;
    }
    if (b.item && b.done) {
      const res = liftFromBurner(state, burnerIndex);
      if (res.ok) {
        playDing();
        feedback(state, 'medium', ZONES.burners[burnerIndex].x + 55, ZONES.burners[burnerIndex].y + 10, { colors: ['#F5C542', '#FFF3D6'] });
      } else refuse(res.why);
      return;
    }
  }
  const res = placeOnBurner(state, burnerIndex);
  if (!res.ok) return refuse(res.why);
  playTake();
  advancePrompt('cook');
}

function doPlate(plateIndex = -1) {
  // If carrying a finished plate, this click is a mistake — go to the window.
  if (state.cook.plate) return showToast('Bawa piring ke jendela saji!');
  const item = state.cook.hands.find(Boolean);
  if (item) {
    const res = placeOnPlate(state, plateIndex);
    if (!res.ok) return refuse(res.why);
    const z = ZONES.plates[res.plate];
    feedback(state, 'small', z.x + z.w / 2, z.y + z.h / 2, { colors: ['#FFF3D6', '#F5C542'] });
    playPlok();
    if (res.dish) {
      playDing();
      showToast('Hidangan jadi! Ambil piringnya.');
    }
    advancePrompt('plate');
    return;
  }
  // Hands empty: pick up a finished plate.
  let idx = plateIndex;
  if (idx < 0) idx = state.plates.findIndex((p) => p.done);
  if (idx < 0) return showToast('Tidak ada piring jadi — rakit dulu');
  const res = takePlate(state, idx);
  if (!res.ok) return refuse(res.why);
  playTake();
  showToast('Bawa ke jendela saji!');
}

function doFinisher(finisherIndex) {
  const fin = FINISHERS[finisherIndex];
  if (!fin) return;
  const res = addFinisher(state, fin.id);
  if (!res.ok) return refuse(res.why);
  const z = ZONES.finishers[finisherIndex];
  feedback(state, 'small', z.x + z.w / 2, z.y + z.h / 2, { colors: ['#FFF3D6', '#F5C542'] });
  playPlok();
  if (res.dish) {
    playDing();
    showToast('Hidangan jadi! Ambil piringnya.');
  }
  advancePrompt('plate');
}

function doWindow() {
  if (!state.cook.plate) return showToast('Bawa piring jadi ke sini');
  const res = servePlate(state);
  if (!res.ok) {
    if (res.why === 'wrong-picky') {
      state.combo = 0;
      showToast('Bukan pesanan! (cek tag merah) — kombo putus');
      playBurn();
      addShake(state, 0.3);
      return;
    }
    return refuse(res.why);
  }
  const wx = ZONES.windowPlates[0].x + 45;
  const wy = ZONES.windowPlates[0].y;
  feedback(state, 'large', wx, wy, {
    text: `+Rp ${res.coins}`,
    sub: res.tip > 0 ? `termasuk tip Rp ${res.tip}` : '',
    colors: ['#F5C542', '#F2A541', '#FFF3D6'],
  });
  playBell();
  playCoin();
  showToast(res.starred ? '★ Pak Budi dilayani! Terima kasih!' : `${res.dish} diantar!`);
  advancePrompt('serve');
}

function doBin() {
  const item = state.cook.hands.find(Boolean);
  if (item) {
    for (let i = 0; i < state.cook.hands.length; i++) {
      if (state.cook.hands[i]) { state.cook.hands[i] = null; break; }
    }
    playTake();
    showToast('Dibuang ke tempat sampah');
    return;
  }
  if (state.cook.plate) {
    state.cook.plate = null;
    playTake();
    showToast('Piring dibuang');
    return;
  }
  // Trash the first non-empty plate on the plating counter.
  const idx = state.plates.findIndex((p) => p.items.length || p.finisher);
  if (idx >= 0) {
    trashPlate(state, idx);
    playTake();
    showToast('Piring dibuang');
  }
}

function doTrashKey() {
  doBin();
}

// The nearest station the cook is facing / standing at (for E/Space).
function nearestStation() {
  const c = state.cook;
  const stations = [
    { name: 'stove', x: ZONES.stand.stove.x, y: ZONES.stand.stove.y },
    { name: 'chopping', x: ZONES.stand.chopping.x, y: ZONES.stand.chopping.y },
    { name: 'plating', x: ZONES.stand.plating.x, y: ZONES.stand.plating.y },
    { name: 'window', x: ZONES.stand.window.x, y: ZONES.stand.window.y },
    { name: 'pantry', x: ZONES.stand.pantry.x, y: ZONES.stand.pantry.y },
    { name: 'bin', x: ZONES.stand.bin.x, y: ZONES.stand.bin.y },
  ];
  let best = null;
  let bestD = Infinity;
  for (const s of stations) {
    const dx = c.x - s.x;
    const dy = c.y - s.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = s; }
  }
  if (bestD > 120 * 120) return null;
  return best.name;
}

function doInteract() {
  const station = nearestStation();
  if (!station) return;
  if (station === 'stove') doStove();
  else if (station === 'chopping') doChop();
  else if (station === 'plating') doPlate();
  else if (station === 'window') doWindow();
  else if (station === 'bin') doBin();
  else if (station === 'pantry') {
    // Interact at pantry takes the first bowl the player needs (first open ticket's first missing raw).
    const ticket = state.tickets[state.selectedTicket];
    if (ticket) {
      const ingIndex = [0, 1, 2, 3, 4, 5].find((i) => {
        const ing = ['nasi', 'mie', 'telur', 'ayam', 'sayur', 'teh'][i];
        return ticket.dish === ing || (ticket.dish === 'nasi' && ing === 'telur') || (ticket.dish === 'mie' && ing === 'sayur');
      });
      if (ingIndex !== undefined) doTakeBowl(ingIndex);
    }
  }
}

// --- Click handling: set a walk target + an action on arrival ---

// Set a walk destination. The pathfinder routes around the counters
// (straight lines cross the prep-counter island and stall on a corner),
// so the cook follows a waypoint list and runs `action` on arrival.
// When no path exists (should not happen on this floor), fall back to a
// straight walk so the cook still tries.
function setWalkTarget(x, y, action) {
  const c = state.cook;
  const path = simplifyPath(findPath(c.x, c.y, x, y));
  c.target = { x, y, action: action || null };
  c.path = path && path.length > 0 ? path : null;
  c.walking = true;
}

function handleClickAction(action) {
  if (action.type === 'ticket') {
    if (selectTicket(state, action.slot)) {
      playTake();
    }
    return;
  }
  if (action.type === 'walk') {
    const x = Math.max(ZONES.floor.x, Math.min(ZONES.floor.x + ZONES.floor.w, action.x));
    const y = Math.max(ZONES.floor.y, Math.min(ZONES.floor.y + ZONES.floor.h, action.y));
    setWalkTarget(x, y, null);
    return;
  }
  let stand;
  let run;
  if (action.type === 'bowl') {
    const bowl = ZONES.bowls[action.index];
    stand = { x: bowl.x + bowl.w / 2, y: ZONES.stand.pantry.y };
    run = () => doTakeBowl(action.index);
  } else if (action.type === 'finisher') {
    stand = ZONES.stand.plating;
    run = () => doFinisher(action.index);
  } else if (action.type === 'plate') {
    stand = ZONES.stand.plating;
    run = () => doPlate(action.index);
  } else if (action.type === 'burner') {
    stand = ZONES.stand.stove;
    run = () => doStove(action.index);
  } else if (action.type === 'bin') {
    stand = ZONES.stand.bin;
    run = () => doBin();
  } else if (action.type === 'windowPlate') {
    stand = ZONES.stand.window;
    run = () => doWindow();
  } else if (action.type === 'station') {
    const s = action.station;
    if (s === 'stove') { stand = ZONES.stand.stove; run = () => doStove(); }
    else if (s === 'chopping') { stand = ZONES.stand.chopping; run = () => doChop(); }
    else if (s === 'plating') { stand = ZONES.stand.plating; run = () => doPlate(); }
    else if (s === 'window') { stand = ZONES.stand.window; run = () => doWindow(); }
    else if (s === 'pantry') { stand = ZONES.stand.pantry; run = () => doInteract(); }
    else return;
  } else {
    return;
  }
  setWalkTarget(stand.x, stand.y, run);
}

function handleKeyAction(action) {
  if (action.type === 'ticket') {
    if (selectTicket(state, action.slot)) playTake();
    return;
  }
  if (action.type === 'bowl') {
    const bowl = ZONES.bowls[action.index];
    setWalkTarget(bowl.x + bowl.w / 2, ZONES.stand.pantry.y, () => doTakeBowl(action.index));
    return;
  }
  if (action.type === 'trash') { doTrashKey(); return; }
  if (action.type === 'book') { toggleBook(); return; }
  if (action.type === 'pause') { togglePause(); return; }
  if (action.type === 'mute') {
    setMuted(!isMuted());
    state.muted = isMuted();
    showToast(isMuted() ? 'Suara mati' : 'Suara hidup');
    return;
  }
  if (action.type === 'interact') { doInteract(); return; }
  if (action.type === 'confirm') {
    if (state.mode === 'title') startShift();
    else if (state.mode === 'summary') restartShift();
    return;
  }
  if (action.type === 'restart') {
    if (state.mode === 'summary') restartShift();
  }
}

function togglePause() {
  if (state.mode === 'playing') state.mode = 'paused';
  else if (state.mode === 'paused') state.mode = 'playing';
}

function toggleBook() {
  if (state.mode === 'playing') state.mode = 'book';
  else if (state.mode === 'book') state.mode = 'playing';
}

function startShift() {
  state = createGameState(state.seed);
  state.mode = 'playing';
  spawnFirstTicket(state);
  showToast('Shift dimulai! Ambil Nasi dulu.');
}

function restartShift() {
  startShift();
}

function endShift() {
  state.mode = 'summary';
  state.summary = {
    coins: state.coins,
    dishes: state.dishesServed,
    bestCombo: state.bestCombo,
    pakBudi: state.pakBudi.served,
    story: PAK_BUDI_STORY,
  };
  playJingle();
}

// Onboarding prompts (first 30 s): one line at a time, each clears on its step.
function advancePrompt(event) {
  const p = state.prompt;
  if (p === 0 && event === 'take') state.prompt = 1;
  else if (p === 1 && event === 'cook') state.prompt = 2;
  else if (p === 2 && event === 'chop') state.prompt = 3;
  else if (p === 3 && event === 'plate') state.prompt = 4;
  else if (p === 4 && event === 'serve') state.prompt = 5;
}

function promptText() {
  switch (state.prompt) {
    case 0: return '1. Ambil Nasi (klik mangkuk)';
    case 1: return '2. Masak di wok (klik kompor)';
    case 2: return '3. Potong Telur di talenan';
    case 3: return '4. Rakit di meja + Kecap';
    case 4: return '5. Antar ke jendela!';
    default: return null;
  }
}

// --- Movement + collision ---
// The cook follows the pathfinder's waypoint list (c.path) in order; when
// the list is exhausted the cook is at the target and the target's action
// runs. Each step moves toward the next waypoint. The blockers are still
// checked per step (a safety net if a waypoint grazes a counter edge), but
// the path itself already routes around them, so the cook never stalls on
// a corner.

function moveCook(dt) {
  const c = state.cook;
  const target = c.target;
  if (!target) { c.walking = false; c.path = null; return; }
  // Next waypoint, or the target itself when the path is done.
  let dest = target;
  if (c.path && c.path.length > 0) dest = c.path[0];
  const dx = dest.x - c.x;
  const dy = dest.y - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) {
    if (c.path && c.path.length > 0) {
      c.path.shift();
      // Arrived at a waypoint — keep walking to the next one.
      if (c.path.length > 0) { c.walking = true; return; }
    }
    c.target = null;
    c.path = null;
    c.walking = false;
    if (target.action) target.action();
    return;
  }
  const speed = CONFIG.walkSpeed;
  const step = Math.min(dist, speed * dt);
  const nx = c.x + (dx / dist) * step;
  const ny = c.y + (dy / dist) * step;
  // Axis-separated movement with AABB blockers (slide along counters).
  const r = 14; // cook radius
  let px = nx;
  let py = c.y;
  for (const b of ZONES.blockers) {
    if (px + r > b.x && px - r < b.x + b.w && py + r > b.y && py - r < b.y + b.h) {
      px = dx > 0 ? b.x - r : b.x + b.w + r;
      if (Math.abs(dx) < 0.01) px = c.x;
    }
  }
  let qx = px;
  let qy = ny;
  for (const b of ZONES.blockers) {
    if (qx + r > b.x && qx - r < b.x + b.w && qy + r > b.y && qy - r < b.y + b.h) {
      qy = dy > 0 ? b.y - r : b.y + b.h + r;
      if (Math.abs(dy) < 0.01) qy = c.y;
    }
  }
  // Clamp to the floor.
  qx = Math.max(ZONES.floor.x, Math.min(ZONES.floor.x + ZONES.floor.w, qx));
  qy = Math.max(ZONES.floor.y, Math.min(ZONES.floor.y + ZONES.floor.h, qy));
  c.x = qx;
  c.y = qy;
  c.walking = true;
  if (Math.abs(dx) > Math.abs(dy)) c.dir = dx > 0 ? 3 : 2;
  else c.dir = dy > 0 ? 0 : 1;
}

// --- Update ---

function update(dt) {
  if (state.mode !== 'playing' || state.frozen) return;
  // Input: clicks + keys.
  let click;
  while ((click = consumeClick(input))) {
    const action = hitTestClick(click.x, click.y);
    handleClickAction(action);
  }
  let key;
  while ((key = consumePressed(input))) {
    const action = keyAction(key);
    if (action) handleKeyAction(action);
  }
  // Toast countdown.
  if (state.toastT > 0) {
    state.toastT -= dt;
    if (state.toastT <= 0) state.toast = null;
  }
  // Shift timer + orders + burners.
  state.time += dt;
  const expired = updateOrders(state, dt);
  for (const t of expired) {
    showToast(`Pesanan ${t.dish} hangus — kombo putus!`);
    playBurn();
    addShake(state, 0.25);
  }
  const burnerEvents = updateBurners(state, dt);
  for (const ev of burnerEvents) {
    if (ev.type === 'done') {
      playDing();
      const b = ZONES.burners[ev.burner];
      spawnSteam(state, b.x + b.w / 2, b.y, 4);
    } else if (ev.type === 'burnt') {
      state.combo = 0;
      showToast('Gosong! Buang ke tempat sampah — kombo putus');
      playBurn();
      addShake(state, 0.3);
      const b = ZONES.burners[ev.burner];
      spawnParticles(state, b.x + b.w / 2, b.y, 8, ['#1A1A1A', '#5A5A5A'], 100);
    }
  }
  // Sizzle while a burner is active.
  const activeBurners = state.burners.filter((b) => b.item && !b.burnt).length;
  setSizzle(activeBurners);
  // Steam from done burners.
  for (let i = 0; i < state.burners.length; i++) {
    const b = state.burners[i];
    if (b.item && b.done && !b.burnt && Math.random() < dt * 4) {
      spawnSteam(state, ZONES.burners[i].x + 55, ZONES.burners[i].y, 1);
    }
  }
  moveCook(dt);
  updateFeedback(state, dt);
  // Onboarding prompt into the toast slot.
  if (state.prompt < 5 && !state.toast) {
    const pt = promptText();
    if (pt) {
      state.toast = { text: pt, t: 1 };
      state.toastT = 1;
    }
  }
  // Shift end.
  if (shiftOver(state)) {
    setSizzle(0);
    endShift();
  }
}

function frame(t) {
  const now = t / 1000;
  let dt = lastTime ? now - lastTime : STEP;
  lastTime = now;
  if (dt > 0.25) dt = 0.25;
  acc += dt;
  let guard = 0;
  while (acc >= STEP && guard < 5) {
    update(STEP);
    acc -= STEP;
    guard++;
  }
  render(ctx, state);
  requestAnimationFrame(frame);
}

// --- Debug hooks (develop-web-game skill) ---

window.render_game_to_text = function renderGameToText() {
  const payload = {
    mode: state.mode,
    timeLeft: Math.round(timeLeft(state)),
    coins: state.coins,
    combo: state.combo,
    cook: {
      x: Math.round(state.cook.x),
      y: Math.round(state.cook.y),
      hands: state.cook.hands.map((i) => (i ? `${i.kind}:${i.prep}` : null)),
      plate: state.cook.plate ? state.cook.plate.dish : null,
      walking: state.cook.walking,
    },
    tickets: state.tickets.map((t) =>
      t ? { dish: t.dish, patience: Math.round(t.patience), picky: t.picky ? t.picky.tag : null, starred: t.starred } : null,
    ),
    burners: state.burners.map((b) =>
      b.item ? { kind: b.item.kind, t: Math.round(b.t * 10) / 10, done: b.done, burnt: b.burnt } : null,
    ),
    plates: state.plates.map((p) => ({
      items: p.items.map((i) => `${i.kind}:${i.prep}`),
      finisher: p.finisher,
      dish: p.dish,
      done: p.done,
    })),
    dishesServed: state.dishesServed,
    bestCombo: state.bestCombo,
    prompt: state.prompt,
  };
  return JSON.stringify(payload);
};

window.advanceTime = function advanceTime(ms) {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(1 / 60);
  render(ctx, state);
};

// --- Boot ---

export function startGame() {
  // Shot mode: ?shot=cover|chop|serve|angle&seed=N — deterministic staged state, frozen.
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || 7);
  state = createGameState(seed);
  if (shot) {
    stageShot(state, shot);
    render(ctx, state);
    requestAnimationFrame(frame);
    return;
  }
  // Title screen over the kitchen: stage a quiet kitchen behind it.
  state.mode = 'title';
  render(ctx, state);
  requestAnimationFrame(frame);
  // Title: click MULAI MASAK (or Enter) to start.
  canvas.addEventListener('click', () => {
    if (state.mode === 'title') {
      const m = input.mouse;
      if (m.x >= 540 && m.x <= 740 && m.y >= 400 && m.y <= 456) {
        resumeAudio();
        startShift();
      }
    }
  });
}

startGame();
