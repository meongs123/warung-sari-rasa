// warung-sari-rasa v3.0 — main.js
import { CONFIG, ANIM, FINISHERS } from './config.js';
import { createGameState, rampThird, timeLeft, shiftOver, handsFree } from './state.js';
import { ZONES, inRect } from './zones.js';
import { createInput, consumeClick, consumePressed, hitTestClick, keyAction } from './input.js';
import { takeIngredient } from './pantry.js';
import { chopItem } from './chopping.js';
import { placeOnBurner, liftFromBurner, updateBurners, clearBurntBurner, doneBurner, freeBurner } from './stove.js';
import { placeOnPlate, addFinisher, takePlate, trashPlate, refreshPlateDone } from './plating.js';
import { serveWindowPlate, placeAtWindow } from './serving.js';
import { spawnFirstTicket, updateOrders, selectTicket } from './orders.js';
import { maybeStartEvent, eventActive, eventMultiplier } from './events.js';
import { PAK_BUDI_STORY } from './regular.js';
import { buildScene, syncScene } from './render.js';
import { findPath, simplifyPath } from './pathfind.js';
import { updateFeedback, feedback, addFloat, addShake, spawnSteam, spawnParticles } from './feedback.js';
import {
  playChop, playTake, playPlok, playDing, playCoin, playBell, playBurn,
  playJingle, playRefuse, setSizzle, setMuted, isMuted, resumeAudio,
} from './audio.js';
import { stageShot } from './shots.js';

let state = createGameState(7);
let input = null;
let view = null;
let game = null;
let acc = 0;
let frameCount = 0;
const STEP = 1 / 60;

function showToast(text, seconds = 2) {
  state.toast = { text, t: seconds };
  state.toastT = seconds;
}

function showDialogue(who, lines) {
  state.dialogue = { who, lines, until: state.time + 4 };
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
    'window-full': 'Jendela penuh! Sajikan dulu',
    'wrong-picky': 'Bukan pesanan! (cek tag merah)',
    'no-dish': 'Bukan hidangan',
  };
  showToast(messages[why] || 'Tidak bisa');
  playRefuse();
  addShake(state, 0.15);
}

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
  state.cook.anim = 'chop';
  state.cook.animT = 0;
  const c = ZONES.stationClick.chopping;
  feedback(state, 'medium', c.x + c.w / 2, c.y + c.h / 2, { colors: ['#5E9A4A', '#7AB85E', '#FFF3D6'] });
  playChop();
  advancePrompt('chop');
}

function doStove(burnerIndex = -1) {

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
  state.cook.anim = 'stir';
  state.cook.animT = 0;
  playTake();
  advancePrompt('cook');
}

function doPlate(plateIndex = -1) {

  if (state.cook.plate) return showToast('Bawa piring ke jendela saji!');
  const item = state.cook.hands.find(Boolean);
  if (item) {
    const res = placeOnPlate(state, plateIndex);
    if (!res.ok) return refuse(res.why);
    const z = ZONES.plates[res.plate];
    feedback(state, 'small', z.x + z.w / 2, z.y + z.h / 2, { colors: ['#FFF3D6', '#F5C542'] });
    playPlok();
    if (res.dish) {
      state.cook.anim = 'celebrate';
      state.cook.animT = 0;
      playDing();
      showToast('Hidangan jadi! Ambil piringnya.');
    }
    advancePrompt('plate');
    return;
  }

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
    state.cook.anim = 'celebrate';
    state.cook.animT = 0;
    playDing();
    showToast('Hidangan jadi! Ambil piringnya.');
  }
  advancePrompt('plate');
}

function doWindow() {

  if (!state.cook.plate) return showToast('Bawa piring jadi ke sini');
  const res = placeAtWindow(state);
  if (!res.ok) return refuse(res.why);
  playPlok();
  if (!state.stats.readyShown) {
    state.stats.readyShown = true;
    showDialogue('Ibu Sari', 'Piring siap! Klik BEL untuk sajikan.');
  }
  showToast('Piring siap di jendela — klik piringnya untuk sajikan!');
}

function doServeWindowPlate(slot) {
  const plate = state.windowPlates[slot];
  if (!plate) {
    if (state.cook.plate) {
      const res = placeAtWindow(state, slot);
      if (!res.ok) return refuse(res.why);
      playPlok();
      showToast('Piring siap di jendela — klik piringnya untuk sajikan!');
      return;
    }
    return showToast('Bawa piring jadi ke sini');
  }
  const res = serveWindowPlate(state, slot);
  if (!res.ok) {
    if (res.why === 'wrong-picky') {
      state.combo = 0;
      state.cook.anim = 'sad';
      state.cook.animT = 0;
      showToast('Bukan pesanan! (cek tag merah) — kombo putus');
      playBurn();
      addShake(state, 0.3);
      return;
    }
    return refuse(res.why);
  }

  const frac = res.ticket.patience / res.ticket.maxPatience;
  state.stats.served += 1;
  state.stats.dishes[res.ticket.dish] = (state.stats.dishes[res.ticket.dish] || 0) + 1;
  state.streak += 1;
  state.stats.firstBell = true;
  if (frac > 0.5) state.stats.perfect += 1;
  if (state.stats.lastDish === res.ticket.dish) {
    state.stats.batchBonus += 25;
    state.coins += 25;
  }
  state.stats.lastDish = res.ticket.dish;

  if (res.ticket.vip === 'kumis' && state.event) {
    if (frac > 0.5) {
      state.event.cleared = true;
      state.coins += 50;
    } else {
      state.event.failed = true;
    }
  }
  const wx = ZONES.windowPlates[slot].x + 45;
  const wy = ZONES.windowPlates[slot].y;
  feedback(state, 'large', wx, wy, {
    text: `+Rp ${res.coins}`,
    sub: res.tip > 0 ? `termasuk tip Rp ${res.tip}` : '',
    colors: ['#F5C542', '#F2A541', '#FFF3D6'],
  });
  state.cook.anim = 'serve';
  state.cook.animT = 0;

  const cust = state.customers.find((c) => c && res.ticket && c.ticketId === res.ticket.id);
  if (cust) {
    cust.mood = 'happy';
    cust.leaving = true;
    cust.leaveT = 0;
  }
  playBell();
  playCoin();
  if (res.ticket.vip === 'kumis') {
    showToast(state.event && state.event.cleared ? 'SEMPURNA! Pak Kumis puas! +Rp 50' : 'Pak Kumis dilayani — tapi tidak sempurna.');
  } else {
    showToast(res.starred ? '★ Pak Budi dilayani! Terima kasih!' : `${res.dish} diantar!`);
  }
  advancePrompt('serve');
}

function doServeBell() {
  const slot = state.windowPlates.findIndex((p) => p);
  if (slot < 0) return showToast('Bawa piring jadi ke sini');
  doServeWindowPlate(slot);
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

  const idx = state.plates.findIndex((p) => p.items.length || p.finisher);
  if (idx >= 0) {
    trashPlate(state, idx);
    playTake();
    showToast('Piring dibuang');
    return;
  }

  const widx = state.windowPlates.findIndex(Boolean);
  if (widx >= 0) {
    state.windowPlates[widx] = null;
    playTake();
    showToast('Piring di jendela dibuang');
  }
}

function doTrashKey() {
  doBin();
}

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

function setWalkTarget(x, y, action) {
  const c = state.cook;

  const path = simplifyPath(findPath(c.x, c.y, x, 600));
  c.target = { x, y: 600, action: action || null };
  c.path = path && path.length > 0 ? path.map((p) => ({ x: p.x, y: 600 })) : null;
  c.walking = true;
  const dist = Math.abs(x - c.x);
  state.route = { tx: x, ty: 600, queued: !!state.routeQueue, eta: dist / 320 + 0.5 };
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
    state.routeQueue = null;
    setWalkTarget(x, 600, null);
    return;
  }
  let stand;
  let run;
  if (action.type === 'bowl') {
    stand = ZONES.stand.pantry;
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
    run = () => doServeWindowPlate(action.index);
  } else if (action.type === 'bell') {

    stand = ZONES.stand.window;
    run = () => doServeBell();
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
  if (state.cook.walking && state.cook.target) {
    state.routeQueue = { x: stand.x, y: stand.y, action: run };
    if (state.route) state.route.queued = true;
    return;
  }
  setWalkTarget(stand.x, stand.y, run);
}

function handleKeyAction(action) {

  if (
    action.type === 'ticket' ||
    action.type === 'bowl' ||
    action.type === 'trash' ||
    action.type === 'interact'
  ) {
    if (state.mode !== 'playing') return;
  }
  if (action.type === 'ticket') {
    if (selectTicket(state, action.slot)) playTake();
    return;
  }
  if (action.type === 'bowl') {
    setWalkTarget(ZONES.stand.pantry.x, ZONES.stand.pantry.y, () => doTakeBowl(action.index));
    return;
  }
  if (action.type === 'trash') { doTrashKey(); return; }
  if (action.type === 'book') { toggleBook(); return; }
  if (action.type === 'pause') {

    if (state.mode === 'summary') {
      state = createGameState(state.seed);
      state.mode = 'title';
      return;
    }
    togglePause();
    return;
  }
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

  else if (state.mode === 'book') state.mode = state.bookFrom || 'playing';
}

function toggleBook() {
  if (state.mode === 'playing' || state.mode === 'paused') {
    state.bookFrom = state.mode;
    state.mode = 'book';
  } else if (state.mode === 'book') {
    state.mode = state.bookFrom || 'playing';
  }
}

function startShift() {
  state = createGameState(state.seed);
  state.mode = 'playing';
  spawnFirstTicket(state);
  showToast('Shift dimulai! Ambil Nasi dulu.');
  showDialogue('Mbak Rina', 'Selamat datang di Warung Sari Rasa! Ambil NASI dulu, masak di KOMPOR, lalu sajikan ke pelanggan.');
}

function restartShift() {
  startShift();
}

function endShift() {
  state.mode = 'summary';
  const prevBest = state.best;
  const record = prevBest > 0 ? state.coins > prevBest : state.coins >= 1000;
  state.best = Math.max(state.best, state.coins);
  const ev = state.event;
  state.summary = {
    coins: state.coins,
    dishes: state.dishesServed,
    bestCombo: state.bestCombo,
    pakBudi: state.pakBudi.served,
    story: PAK_BUDI_STORY,
    best: state.best,
    record,
    stats: state.stats,
    event: ev ? { cleared: ev.cleared, failed: ev.failed } : null,
    lives: state.lives,
  };
  playJingle();
}

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

function moveCook(dt) {
  const c = state.cook;
  const target = c.target;
  if (!target) { c.walking = false; c.path = null; return; }

  let dest = target;
  if (c.path && c.path.length > 0) dest = c.path[0];
  const dx = dest.x - c.x;
  const dy = dest.y - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) {
    if (c.path && c.path.length > 0) {
      c.path.shift();

      if (c.path.length > 0) { c.walking = true; return; }
    }
    c.target = null;
    c.path = null;
    c.walking = false;
    state.route = null;
    if (target.action) target.action();
    if (state.routeQueue) {
      const q = state.routeQueue;
      state.routeQueue = null;
      setWalkTarget(q.x, q.y, q.action);
    }
    return;
  }
  const speed = CONFIG.walkSpeed;
  const step = Math.min(dist, speed * dt);
  const nx = c.x + (dx / dist) * step;
  const ny = c.y + (dy / dist) * step;

  const r = 14;
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

  qx = Math.max(ZONES.floor.x, Math.min(ZONES.floor.x + ZONES.floor.w, qx));
  qy = Math.max(ZONES.floor.y, Math.min(ZONES.floor.y + ZONES.floor.h, qy));
  c.x = qx;
  c.y = qy;
  c.walking = true;
  if (Math.abs(dx) > Math.abs(dy)) c.dir = dx > 0 ? 3 : 2;
  else c.dir = dy > 0 ? 0 : 1;
}

function moveWASD(dt) {
  if (!input || state.mode !== 'playing' || state.frozen) return false;
  const keys = input.keys;
  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');
  if (left === right) return false;
  const c = state.cook;
  c.target = null;
  c.path = null;
  state.route = null;
  state.routeQueue = null;
  const dir = left ? -1 : 1;
  c.x = Math.max(ZONES.floor.x, Math.min(ZONES.floor.x + ZONES.floor.w, c.x + dir * CONFIG.walkSpeed * dt));
  c.y = 600;
  c.walking = true;
  c.dir = left ? 2 : 3;
  return true;
}

function update(dt) {

  if (!state.frozen) {
    let click;
    while ((click = consumeClick(input))) {
      if (state.mode === 'playing') {
        const action = hitTestClick(click.x, click.y);
        handleClickAction(action);
        state.dialogue = null;
      } else if (state.mode === 'title') {

        if (click.x >= 540 && click.x <= 740 && click.y >= 400 && click.y <= 456) {
          resumeAudio();
          startShift();
        }
      } else if (state.mode === 'summary') {

        if (click.x >= 540 && click.x <= 740 && click.y >= 630 && click.y <= 686) {
          restartShift();
        } else if (click.x >= 770 && click.x <= 930 && click.y >= 630 && click.y <= 686) {
          state = createGameState(state.seed);
          state.mode = 'title';
        }
      }

    }
    let key;
    while ((key = consumePressed(input))) {
      const action = keyAction(key);
      if (action) handleKeyAction(action);
      if (state.mode === 'playing') state.dialogue = null;
    }
  }
  if (state.mode !== 'playing' || state.frozen) return;

  if (state.dialogue && state.time > state.dialogue.until) state.dialogue = null;

  if (maybeStartEvent(state, state.time)) {
    showDialogue('Mbak Rina', 'Pak Kumis datang! Kritikus makanan. Nasi Goreng-nya harus SEMPURNA — sajikan sebelum sabarnya habis!');
    showToast('JAM MAKAN SIANG — RUSH! Pak Kumis minta sempurna!');
  }

  if (state.toastT > 0) {
    state.toastT -= dt;
    if (state.toastT <= 0) state.toast = null;
  }

  state.time += dt;
  const expired = updateOrders(state, dt);
  for (const t of expired) {
    const cust = state.customers.find((c) => c && c.ticketId === t.id);
    if (cust) {
      cust.mood = 'angry';
      cust.leaving = true;
      cust.leaveT = 0;
    }
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
      state.stats.burnt += 1;
      if (state.stats.burnt === 1) showDialogue('Mas Joko', 'Aduh, gosong! Angkat sebelum bar merah penuh.');
      state.cook.anim = 'sad';
      state.cook.animT = 0;
      showToast('Gosong! Buang ke tempat sampah — kombo putus');
      playBurn();
      addShake(state, 0.3);
      const b = ZONES.burners[ev.burner];
      spawnParticles(state, b.x + b.w / 2, b.y, 8, ['#1A1A1A', '#5A5A5A'], 100);
    }
  }

  const activeBurners = state.burners.filter((b) => b.item && !b.burnt).length;
  setSizzle(activeBurners);

  for (let i = 0; i < state.burners.length; i++) {
    const b = state.burners[i];
    if (b.item && b.done && !b.burnt && Math.random() < dt * 4) {
      spawnSteam(state, ZONES.burners[i].x + 55, ZONES.burners[i].y, 1);
    }
  }

  if (!moveWASD(dt)) moveCook(dt);
  updateFeedback(state, dt);

  if (state.prompt < 5 && !state.toast) {
    const pt = promptText();
    if (pt) {
      state.toast = { text: pt, t: 1 };
      state.toastT = 1;
    }
  }

  if (shiftOver(state)) {
    setSizzle(0);
    endShift();
  }
}

function driveAnim(dt) {
  if (state.frozen) return;
  const c = state.cook;

  if (c.dir === 2) c.facing = -1;
  else if (c.dir === 3) c.facing = 1;
  if (c.walking) {
    c.anim = c.plate ? 'carry' : 'walk';
    c.animT += dt;
    return;
  }
  if (c.plate) {
    c.anim = 'carry';
    c.animT += dt;
    return;
  }
  if (c.anim === 'chop' || c.anim === 'stir' || c.anim === 'serve' || c.anim === 'celebrate' || c.anim === 'sad') {
    c.animT += dt;
    const dur = c.anim === 'chop' ? ANIM.chopLoop
      : c.anim === 'stir' ? ANIM.stirLoop
      : c.anim === 'serve' ? ANIM.serveTime
      : c.anim === 'celebrate' ? ANIM.celebrateTime
      : ANIM.sadTime;
    if (c.animT >= dur) { c.anim = 'idle'; c.animT = 0; }
    return;
  }
  c.anim = 'idle';
  c.animT += dt;
}

const SLOT_KINDS = ['sari', 'andi', 'rina'];

function syncCustomersView(dt) {
  for (let i = 0; i < 3; i++) {
    const ticket = state.tickets[i];
    let cs = state.customers[i];
    if (ticket) {
      if (!cs || cs.ticketId !== ticket.id) {
        cs = {
          kind: ticket.vip === 'kumis' ? 'kumis' : ticket.starred ? 'budi' : SLOT_KINDS[i],
          mood: 'neutral',
          enterT: 0,
          leaveT: 0,
          leaving: false,
          ticketId: ticket.id,
        };
        state.customers[i] = cs;
      }
      if (!cs.leaving) {
        const frac = ticket.patience / ticket.maxPatience;
        cs.mood = frac > 0.5 ? 'neutral' : frac >= 0.25 ? 'impatient' : 'angry';
      }
      if (!state.frozen && cs.enterT < ANIM.arriveTime) cs.enterT += dt;
    } else if (cs) {
      if (!cs.leaving) { cs.leaving = true; cs.leaveT = 0; cs.mood = 'angry'; }
      if (!state.frozen) cs.leaveT += dt;
      if (cs.leaveT >= ANIM.leaveTime) state.customers[i] = null;
    }
  }
}

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
    lives: state.lives,
    streak: state.streak,
    event: state.event ? { vip: state.event.vip, cleared: state.event.cleared, failed: state.event.failed } : null,
  };
  return JSON.stringify(payload);
};

window.advanceTime = function advanceTime(ms) {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(1 / 60);
  driveAnim(ms / 1000);
  syncCustomersView(ms / 1000);
  if (view) syncScene(view, state, ms / 1000);

  if (game) game.step(performance.now(), 0);
};

let shotMode = false;

function createScene() {

  input = createInput(this);
  view = buildScene(this, state);

  if (typeof window.fit === 'function') window.fit();
  window.__phaserReady = true;
}

function updateScene(time, delta) {
  const dt = Math.min(0.25, delta / 1000);
  frameCount += 1;

  if (!window.__pauseLoop) {
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 5) {
      update(STEP);
      acc -= STEP;
      guard += 1;
    }
  }
  driveAnim(dt);
  syncCustomersView(dt);
  if (view) syncScene(view, state, dt);

  if (shotMode && frameCount >= 2 && !window.__shotReady) window.__shotReady = true;
}

export function startGame() {

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || 7);
  state = createGameState(seed);
  shotMode = !!shot;
  if (shot) {
    stageShot(state, shot);
  }

  state.mode = shot ? state.mode : 'title';
  game = new Phaser.Game({
    type: Phaser.CANVAS,
    canvas: document.getElementById('game'),
    width: 1280,
    height: 720,
    backgroundColor: '#F7E8C8',
    banner: false,
    disableContextMenu: true,
    fps: { target: 60 },
    scene: { create: createScene, update: updateScene },
  });
  window.__game = game;

  Object.defineProperty(window, '__state', { get: () => state, configurable: true });
}

startGame();
