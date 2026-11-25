// render.js — the Phaser scene: buildScene() creates every GameObject once,
// syncScene() updates them from state every frame. The world (kitchen,
// stations, cook, customers, particles, floats) lives in a `world` Container
// so the shot-4 close-up can zoom it without touching the HUD/overlays.
// Per-frame work is property sets only (x / y / scale / alpha / visible);
// the dynamic Graphics (dynG) is redrawn only when its contents change
// (tracked by a dirty check — no per-frame strings or arrays).
// Static art is drawn ONCE into bgG and never touched again.

import { CONFIG, PALETTE, RECIPES, INGREDIENTS, FINISHERS, LAYOUT, comboMultiplier } from './config.js';
import { ZONES } from './zones.js';
import { drawDish, drawIngredient, drawFinisher } from './drawfood.js';
import { createCook, syncCook, createCustomers, syncCustomers } from './drawcharacter.js';
import { buildHUD, syncHUD } from './hud.js';
import { recipeBookEntries } from './recipebook.js';
import { burnerProgress } from './stove.js';
import { requiredComponents } from './plating.js';
import { gCircle, gEllipse, gRect, gRoundRect, gTriangle, gLine, gArc, gCircleStroke } from './gfx.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

// --- Static background (drawn once) ----------------------------------------

function drawBackground(g) {
  // Customer-strip wall + big window (sky / street / sun).
  gRect(g, 0, 56, 1280, 152, PALETTE.creamDark);
  gRect(g, 400, 64, 480, 86, '#9FD3E8'); // sky
  gCircle(g, 820, 84, 16, '#FFF3D6'); // sun glow
  gRect(g, 400, 128, 480, 22, '#7AB85E'); // green street / trees
  gTriangle(g, 430, 150, 460, 118, 490, 150, '#5E9A4A');
  gTriangle(g, 700, 150, 730, 116, 760, 150, '#5E9A4A');
  // Batik-trim awning along the top edge of the customer strip.
  gRect(g, 0, 56, 1280, 20, PALETTE.terracotta);
  for (let x = 0; x < 1280; x += 36) {
    gTriangle(g, x, 76, x + 18, 56, x + 36, 76, PALETTE.cream);
  }
  // Hanging lamps (warm glow).
  for (const lx of [200, 1080]) {
    gLine(g, lx, 56, lx, 84, PALETTE.teakDark, 3);
    gCircle(g, lx, 92, 12, PALETTE.fire);
    gCircle(g, lx, 92, 26, 'rgba(242,165,65,0.25)');
  }
  // Beams + chalk menu board (right wall, decoration only).
  gRect(g, 0, 56, 1280, 6, PALETTE.teakDark);
  gRect(g, 0, 208, 1280, 6, PALETTE.teakDark);
  gRect(g, 1150, 70, 90, 70, '#3A2A1A');
  gRect(g, 1158, 82, 60, 3, '#FFF3D6');
  gRect(g, 1158, 94, 44, 3, '#FFF3D6');
  gRect(g, 1158, 106, 52, 3, '#FFF3D6');
  gCircle(g, 1225, 128, 5, PALETTE.chili);
  // Customer counter (teak) + top highlight + plank lines.
  gRect(g, 16, 168, 1248, 40, PALETTE.teak);
  gRect(g, 16, 168, 1248, 4, '#A06A3F');
  for (let x = 136; x < 1264; x += 120) gRect(g, x, 172, 2, 36, 'rgba(0,0,0,0.15)');
  // Kitchen floor (terracotta tiles) + woven mat.
  gRect(g, 16, 300, 1248, 340, '#C98A5A');
  g.lineStyle(2, 0x7a4a2b, 0.35);
  for (let x = 16; x <= 1264; x += 64) { g.beginPath(); g.moveTo(x, 300); g.lineTo(x, 640); g.strokePath(); }
  for (let y = 300; y <= 640; y += 64) { g.beginPath(); g.moveTo(16, y); g.lineTo(1264, y); g.strokePath(); }
  gRect(g, 0, 640, 1280, 64, '#D9B380');
  for (let x = 0; x < 1280; x += 64) {
    gTriangle(g, x, 672, x + 32, 640, x + 64, 672, '#C9A86A');
    gTriangle(g, x, 672, x + 32, 704, x + 64, 672, '#C9A86A');
  }
  // Station shells (back-wall row, y 208-300).
  // Stove.
  gRoundRect(g, 40, 208, 260, 92, 8, PALETTE.teak);
  gRect(g, 50, 218, 240, 14, '#3A2A1A');
  // Chopping board.
  gRoundRect(g, 380, 208, 180, 92, 8, '#D9B380');
  gLine(g, 420, 250, 475, 250, '#C0C8CC', 12); // knife blade
  gRect(g, 408, 246, 14, 8, PALETTE.teakDark); // knife handle
  // Plating counter (steel).
  gRoundRect(g, 640, 208, 260, 92, 8, PALETTE.teak);
  gRect(g, 650, 218, 240, 10, '#C8C8C8');
  // Pantry shelf.
  gRoundRect(g, 960, 208, 280, 92, 8, PALETTE.teak);
  // Prep island.
  gRoundRect(g, 480, 440, 320, 60, 8, '#A9713F');
  // Bin.
  gRoundRect(g, 905, 250, 50, 50, 6, '#5A5A5A');
  gRect(g, 909, 246, 42, 6, '#8A8A8A');
}

// --- Build ------------------------------------------------------------------

export function buildScene(scene, state) {
  const world = scene.add.container(0, 0);
  world.setDepth(0);
  // Static background.
  const bgG = scene.add.graphics();
  drawBackground(bgG);
  world.add(bgG);
  // Finisher bottles (static) on the plating counter.
  const finG = scene.add.graphics();
  FINISHERS.forEach((f, i) => {
    const z = ZONES.finishers[i];
    drawFinisher(finG, f.id, z.x, z.y, z.w, z.h);
  });
  world.add(finG);
  // Pantry bowls (static) + their labels.
  const pantryG = scene.add.graphics();
  INGREDIENTS.forEach((ing, i) => {
    const z = ZONES.bowls[i];
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    gRoundRect(pantryG, z.x, z.y, z.w, z.h, 8, '#8A5A33');
    drawIngredient(pantryG, ing.id, 'raw', cx, cy - 4, 20);
  });
  world.add(pantryG);
  const labels = [];
  const addLabel = (txt, x, y, size, color, bold = true) => {
    const t = scene.add.text(x, y, txt, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: bold ? 'bold' : 'normal', color });
    t.setOrigin(0.5, 0.5);
    labels.push(t);
    return t;
  };
  addLabel('KOMPOR', 170, 225, 11, PALETTE.cream);
  addLabel('TALENAN', 470, 225, 11, PALETTE.teakDark);
  addLabel('RAKIT', 860, 288, 11, PALETTE.cream);
  addLabel('RAK BAHAN', 1100, 218, 12, PALETTE.cream);
  addLabel('MEJA SIAP', 640, 447, 11, PALETTE.cream);
  addLabel('SAMPAH', 930, 312, 10, PALETTE.ink);
  addLabel('BEL', 802, 192, 10, PALETTE.teakDark);
  INGREDIENTS.forEach((ing, i) => {
    const z = ZONES.bowls[i];
    const cx = z.x + z.w / 2;
    addLabel(ing.name, cx, z.y + z.h - 6, 11, PALETTE.cream);
    addLabel(ing.key.toUpperCase(), cx, z.y + 4, 10, PALETTE.gold);
  });
  labels.forEach((t) => world.add(t));
  // Bell (brass, on the counter).
  const bellG = scene.add.graphics();
  gCircle(bellG, 802, 168, 14, PALETTE.gold);
  gRect(bellG, 788, 168, 28, 4, PALETTE.gold);
  gCircle(bellG, 802, 158, 4, '#B8860B');
  world.add(bellG);
  // Dynamic layer (burner pots, plates, window plates, prep display).
  const dynG = scene.add.graphics();
  dynG.setDepth(5);
  world.add(dynG);
  // Burner progress bars (2 Rectangles + 2 status Texts).
  const burnerBars = [];
  for (let i = 0; i < 2; i++) {
    const b = ZONES.burners[i];
    const bg = scene.add.rectangle(b.x + 8, b.y - 10, b.w - 16, 9, 0x3a2a1a);
    bg.setOrigin(0, 0.5);
    const fill = scene.add.rectangle(b.x + 8, b.y - 10, b.w - 16, 9, 0xf2a541);
    fill.setOrigin(0, 0.5);
    const status = scene.add.text(b.x + b.w / 2, b.y - 24, '', { fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#4E7A3A' });
    status.setOrigin(0.5, 0.5);
    world.add(bg);
    world.add(fill);
    world.add(status);
    burnerBars.push({ bg, fill, status });
  }
  // Cook + customers.
  const cook = createCook(scene);
  world.add(cook.container);
  world.add(cook.shadow);
  const customers = createCustomers(scene);
  customers.forEach((c) => world.add(c.container));
  // Particle pool (32 circles + 8 leaf rects) and float pool (8 text pairs).
  const particlePool = [];
  for (let i = 0; i < 32; i++) {
    const p = scene.add.circle(0, 0, 4, 0xffffff, 0);
    p.setVisible(false);
    world.add(p);
    particlePool.push(p);
  }
  for (let i = 0; i < 8; i++) {
    const p = scene.add.rectangle(0, 0, 6, 3, 0x5e9a4a, 0);
    p.setVisible(false);
    world.add(p);
    particlePool.push(p);
  }
  const floatPool = [];
  for (let i = 0; i < 8; i++) {
    const main = scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#F5C542' });
    main.setOrigin(0.5, 0.5);
    main.setVisible(false);
    const sub = scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: '13px', color: '#FFF3D6' });
    sub.setOrigin(0.5, 0.5);
    sub.setVisible(false);
    world.add(main);
    world.add(sub);
    floatPool.push({ main, sub });
  }
  // HUD + overlays (scene-level, never zoomed).
  const hud = buildHUD(scene);
  const overlays = buildOverlays(scene);
  return {
    world, bgG, dynG, burnerBars, cook, customers, particlePool, floatPool,
    hud, overlays, labels,
    lastDyn: {
      ticketIds: [-1, -1, -1], burnerItems: [false, false],
      plateItemsLen: [0, 0], plateDone: [false, false],
      plateFinisher: [null, null], windowDishes: [null, null],
      selected: -1,
    },
    lastDynRedraw: -10,
  };
}

// --- Overlays (title / paused / book / summary) -----------------------------

function buildOverlays(scene) {
  const mk = (depth) => {
    const c = scene.add.container(0, 0);
    c.setDepth(depth);
    c.setVisible(false);
    const dim = scene.add.rectangle(640, 360, 1280, 720, 0x2e1f14, 0.72);
    c.add(dim);
    return c;
  };
  const txt = (parent, x, y, str, size, color, style = 'bold') => {
    const t = scene.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: style, color });
    t.setOrigin(0.5, 0.5);
    parent.add(t);
    return t;
  };
  // Title.
  const title = mk(40);
  txt(title, 640, 220, 'WARUNG SARI RASA', 64, PALETTE.cream);
  txt(title, 640, 280, '— Dapur Kilat —', 28, PALETTE.fire, 'italic bold');
  txt(title, 640, 330, 'Masak cepat, antar tepat. Satu shift, tiga menit, pesanan tak berhenti.', 20, '#FFF3D6', 'normal');
  txt(title, 640, 362, 'Klik stasiun untuk jalan & masak • 1–3 pilih pesanan • K buku resep', 16, '#D8CDB8', 'normal');
  const playBtn = scene.add.graphics();
  playBtn.fillStyle(0xd96c3f, 1);
  playBtn.fillRoundedRect(540, 400, 200, 56, 12);
  title.add(playBtn);
  txt(title, 640, 428, 'MULAI MASAK', 24, '#FFFFFF');
  txt(title, 640, 478, 'Enter / klik tombol', 14, '#D8CDB8', 'normal');
  txt(title, 640, 530, 'Nasi Goreng • Mie Goreng • Sate Ayam • Es Teh Melati', 15, PALETTE.gold, 'normal');
  // Paused.
  const paused = mk(40);
  txt(paused, 640, 320, 'JEDA', 56, PALETTE.cream);
  txt(paused, 640, 380, 'P / Esc untuk lanjut • K buku resep • M suara', 18, '#FFF3D6', 'normal');
  // Recipe book (static content, drawn once).
  const book = mk(40);
  const bookG = scene.add.graphics();
  bookG.fillStyle(0xfff8e7, 1);
  bookG.fillRoundedRect(340, 90, 600, 540, 14);
  bookG.lineStyle(3, 0x5c3520, 1);
  bookG.strokeRoundedRect(340, 90, 600, 540, 14);
  book.add(bookG);
  txt(book, 640, 124, 'BUKU RESEP', 26, PALETTE.teakDark);
  const entries = recipeBookEntries();
  const bookIcons = scene.add.graphics();
  book.add(bookIcons);
  entries.forEach((e, i) => {
    const y = 170 + i * 112;
    drawDish(bookIcons, e.id, 400, y + 30, 34);
    txt(book, 450, y + 12, `${e.name} — ${e.gloss}`, 19, PALETTE.ink).setOrigin(0, 0.5);
    txt(book, 450, y + 36, `Rp ${e.price}`, 15, '#7A6A55', 'normal').setOrigin(0, 0.5);
    txt(book, 450, y + 62, e.steps.join(' → '), 14, PALETTE.teakDark, 'normal').setOrigin(0, 0.5);
    if (e.finisher) txt(book, 450, y + 84, `+ ${e.finisher}`, 13, '#7A6A55', 'normal').setOrigin(0, 0.5);
  });
  txt(book, 640, 606, 'K / Esc untuk tutup — timer dijeda', 14, '#7A6A55', 'normal');
  // Summary (texts updated on shift end).
  const summary = mk(40);
  txt(summary, 640, 180, 'SHIFT SELESAI!', 52, PALETTE.cream);
  const sumCoins = txt(summary, 640, 250, '', 28, PALETTE.gold);
  const sumDishes = txt(summary, 640, 300, '', 20, '#FFF3D6', 'normal');
  const sumBudi = txt(summary, 640, 350, '', 22, PALETTE.gold);
  const sumStory = txt(summary, 640, 386, '', 18, '#FFF3D6', 'italic');
  const againBtn = scene.add.graphics();
  againBtn.fillStyle(0xd96c3f, 1);
  againBtn.fillRoundedRect(540, 430, 200, 56, 12);
  summary.add(againBtn);
  txt(summary, 640, 458, 'MAIN LAGI (R)', 22, '#FFFFFF');
  txt(summary, 640, 530, 'Terima kasih sudah masak di Warung Sari Rasa!', 15, '#D8CDB8', 'normal');
  return { title, paused, book, summary, sumCoins, sumDishes, sumBudi, sumStory, lastSummaryKey: '' };
}

// --- Dynamic layer (redrawn only when its contents change) ------------------

function redrawDynamic(view, state) {
  const g = view.dynG;
  g.clear();
  // Burner pots + items + static flames.
  state.burners.forEach((b, i) => {
    if (!b || !b.item) return;
    const z = ZONES.burners[i];
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2 + 8;
    gTriangle(g, cx - 18, cy + 14, cx - 8, cy - 4, cx + 2, cy + 14, PALETTE.fire);
    gTriangle(g, cx - 2, cy + 14, cx + 8, cy - 4, cx + 18, cy + 14, PALETTE.chili);
    gEllipse(g, cx, cy, 46, 34, '#3A3A3A');
    gEllipse(g, cx, cy - 4, 38, 26, '#5A5A5A');
    drawIngredient(g, b.item.kind, b.item.prep, cx, cy - 6, 16);
  });
  // Plating counter plates (mid-assembly items or the finished dish).
  state.plates.forEach((plate, i) => {
    if (!plate) return;
    const z = ZONES.plates[i];
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    if (plate.done && plate.dish) {
      drawDish(g, plate.dish, cx, cy, 26);
    } else if (plate.items.length || plate.finisher) {
      gEllipse(g, cx, cy, 30, 20, '#FFFFFF');
      gEllipse(g, cx, cy, 24, 15, '#E8E0D0');
      plate.items.forEach((c, j) => {
        const ox = (j - (plate.items.length - 1) / 2) * 20;
        drawIngredient(g, c.kind, c.prep, cx + ox, cy - 4, 10);
      });
      if (plate.finisher) {
        gCircle(g, cx + 22, cy - 12, 5, plate.finisher === 'kecap' ? '#3A1F10' : plate.finisher === 'sambal' ? '#C0392B' : '#7A5A2B');
      }
    }
  });
  // Window plates (READY) + a gold diamond marker above each.
  state.windowPlates.forEach((wp, i) => {
    if (!wp) return;
    const z = ZONES.windowPlates[i];
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    drawDish(g, wp.dish, cx, cy + 4, 26);
    gTriangle(g, cx - 8, cy - 24, cx, cy - 34, cx + 8, cy - 24, PALETTE.gold);
    gTriangle(g, cx - 8, cy - 24, cx, cy - 14, cx + 8, cy - 24, PALETTE.gold);
  });
  // Prep island: the selected ticket's required components as a checklist
  // (already-on-a-plate components are drawn dimmed with a green check).
  const sel = state.selectedTicket;
  if (sel !== null && state.tickets[sel]) {
    const need = requiredComponents(state.tickets[sel]);
    const z = ZONES.stationClick.prep;
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    need.items.forEach((c, j) => {
      const ox = (j - (need.items.length - 1) / 2) * 34;
      const onPlate = state.plates.some((p) => p.items.some((i) => i.kind === c.kind && i.prep === c.prep));
      drawIngredient(g, c.kind, c.prep, cx + ox, cy, 16);
      if (onPlate) {
        gCircle(g, cx + ox + 12, cy - 12, 7, '#4E7A3A');
        gLine(g, cx + ox + 8, cy - 12, cx + ox + 11, cy - 9, '#FFFFFF', 2);
        gLine(g, cx + ox + 11, cy - 9, cx + ox + 17, cy - 16, '#FFFFFF', 2);
      }
    });
  }
}

// Parse a '#RRGGBB' or 'rgba(r,g,b,a)' color string into {color, alpha}.
function parseFill(str) {
  if (typeof str === 'number') return { color: str, alpha: 1 };
  if (typeof str === 'string' && str.startsWith('#')) {
    return { color: parseInt(str.slice(1), 16), alpha: 1 };
  }
  const m = typeof str === 'string' ? str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/) : null;
  if (m) {
    return { color: (parseInt(m[1], 10) << 16) | (parseInt(m[2], 10) << 8) | parseInt(m[3], 10), alpha: m[4] === undefined ? 1 : parseFloat(m[4]) };
  }
  return { color: 0xffffff, alpha: 1 };
}

// --- Sync (called every frame from the scene update) ------------------------

export function syncScene(view, state, dt) {
  // Camera (world zoom for shot 4) + shake offset (trauma, property only).
  const sh = state.shake * state.shake * 8;
  const shX = sh > 0.01 ? (Math.random() - 0.5) * sh : 0;
  const shY = sh > 0.01 ? (Math.random() - 0.5) * sh : 0;
  if (state.camera) {
    const { x, y, zoom } = state.camera;
    view.world.setScale(zoom);
    view.world.setPosition(640 - x * zoom + shX, 360 - y * zoom + shY);
  } else {
    view.world.setScale(1);
    view.world.setPosition(shX, shY);
  }
  // Dynamic layer: redraw when its contents changed (or 1 s safety net).
  const ld = view.lastDyn;
  let dirty = state.time - view.lastDynRedraw > 1;
  for (let i = 0; i < 3; i++) {
    const id = state.tickets[i] ? state.tickets[i].id : -1;
    if (id !== ld.ticketIds[i]) { ld.ticketIds[i] = id; dirty = true; }
  }
  for (let i = 0; i < 2; i++) {
    const hasItem = !!(state.burners[i] && state.burners[i].item);
    if (hasItem !== ld.burnerItems[i]) { ld.burnerItems[i] = hasItem; dirty = true; }
    const p = state.plates[i];
    const len = p ? p.items.length : 0;
    if (len !== ld.plateItemsLen[i]) { ld.plateItemsLen[i] = len; dirty = true; }
    const done = !!(p && p.done);
    if (done !== ld.plateDone[i]) { ld.plateDone[i] = done; dirty = true; }
    const fin = p ? p.finisher : null;
    if (fin !== ld.plateFinisher[i]) { ld.plateFinisher[i] = fin; dirty = true; }
    const wd = state.windowPlates[i] ? state.windowPlates[i].dish : null;
    if (wd !== ld.windowDishes[i]) { ld.windowDishes[i] = wd; dirty = true; }
  }
  if (state.selectedTicket !== ld.selected) { ld.selected = state.selectedTicket; dirty = true; }
  if (dirty) {
    redrawDynamic(view, state);
    view.lastDynRedraw = state.time;
  }
  // Burner progress bars + status (property sets only).
  state.burners.forEach((b, i) => {
    const bar = view.burnerBars[i];
    if (!b || !b.item) {
      bar.fill.setScale(0.001, 1);
      bar.status.setText('');
      return;
    }
    const frac = burnerProgress(b);
    bar.fill.setScale(Math.max(0.001, frac), 1);
    bar.fill.setFillStyle(b.burnt ? 0xc0392b : b.done ? 0x4e7a3a : 0xf2a541, 1);
    if (b.burnt) {
      bar.status.setText('GOSONG!');
      bar.status.setColor('#C0392B');
    } else if (b.done) {
      bar.status.setText('SIAP!');
      bar.status.setColor('#4E7A3A');
    } else {
      bar.status.setText('');
    }
  });
  // Cook + customers (pose math lives in drawcharacter.js).
  syncCook(view.cook, state, state.time);
  syncCustomers(view.customers, state, state.time);
  // Particles (fixed pool — circles for circle/steam, rects for leaf).
  // Two counters keep each particle on the right kind of pool object.
  const parts = state.particles;
  let circleIdx = 0;
  let leafIdx = 0;
  for (let i = 0; i < view.particlePool.length; i++) {
    view.particlePool[i].setVisible(false);
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const fade = Math.max(0, 1 - p.t / p.life);
    const col = parseFill(p.color);
    if (p.shape === 'leaf') {
      if (leafIdx >= 8) continue;
      const obj = view.particlePool[32 + leafIdx];
      leafIdx += 1;
      obj.setVisible(true);
      obj.setPosition(p.x, p.y);
      obj.setFillStyle(col.color, col.alpha * fade);
      obj.setSize(p.size * 2, p.size);
      obj.setRotation(p.t * 6);
    } else {
      if (circleIdx >= 32) continue;
      const obj = view.particlePool[circleIdx];
      circleIdx += 1;
      const size = p.shape === 'steam' ? p.size * (1 + p.t) : p.size;
      obj.setVisible(true);
      obj.setPosition(p.x, p.y);
      obj.setFillStyle(col.color, col.alpha * fade);
      obj.setRadius(Math.max(0.5, size));
    }
  }
  // Floats (fixed pool of text pairs).
  const floats = state.floats;
  for (let i = 0; i < view.floatPool.length; i++) {
    const f = view.floatPool[i];
    if (i < floats.length) {
      const fl = floats[i];
      const alpha = Math.max(0, 1 - fl.t / fl.life);
      const fy = fl.y - fl.t * 40;
      f.main.setVisible(true);
      f.main.setPosition(fl.x, fy);
      f.main.setText(fl.text);
      f.main.setColor(fl.color);
      f.main.setAlpha(alpha);
      if (fl.sub) {
        f.sub.setVisible(true);
        f.sub.setPosition(fl.x, fy + 20);
        f.sub.setText(fl.sub);
        f.sub.setAlpha(alpha);
      } else {
        f.sub.setVisible(false);
      }
    } else {
      f.main.setVisible(false);
      f.sub.setVisible(false);
    }
  }
  // HUD + overlays.
  syncHUD(view.hud, state);
  const ov = view.overlays;
  ov.title.setVisible(state.mode === 'title');
  ov.paused.setVisible(state.mode === 'paused');
  ov.book.setVisible(state.mode === 'book');
  ov.summary.setVisible(state.mode === 'summary');
  if (state.mode === 'summary' && state.summary) {
    const s = state.summary;
    const key = `${s.coins}:${s.dishes}:${s.bestCombo}:${s.pakBudi}`;
    if (key !== ov.lastSummaryKey) {
      ov.lastSummaryKey = key;
      ov.sumCoins.setText(`Total: Rp ${s.coins}`);
      ov.sumDishes.setText(`${s.dishes} hidangan disajikan • kombo terbaik ×${s.bestCombo}`);
      ov.sumBudi.setText(s.pakBudi ? '★ Pak Budi dilayani — VIP senang!' : 'Pak Budi belum dilayani hari ini.');
      ov.sumStory.setText(s.story || '');
    }
  }
}
