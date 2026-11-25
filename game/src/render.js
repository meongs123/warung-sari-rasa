// warung-sari-rasa v3.0 — render.js
import { CONFIG, PALETTE, RECIPES, INGREDIENTS, FINISHERS, LAYOUT, comboMultiplier } from './config.js';
import { ZONES } from './zones.js';
import { drawDish, drawIngredient, drawFinisher } from './drawfood.js';
import { createCook, syncCook, createCustomers, syncCustomers } from './drawcharacter.js';
import { buildHUD, syncHUD } from './hud.js';
import { recipeBookEntries } from './recipebook.js';
import { burnerProgress } from './stove.js';
import { requiredComponents, plateTargetDish } from './plating.js';
import { nextChoppable } from './chopping.js';
import { buildResults, syncResults } from './results.js';
import { gCircle, gEllipse, gRect, gRoundRect, gTriangle, gLine, gArc, gCircleStroke } from './gfx.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const ING_TAG = ['KOMPOR', 'KOMPOR', 'TALENAN', 'KOMPOR', 'TALENAN', 'KOMPOR'];
const COMP_NAME = { nasi: 'Nasi matang', mie: 'Mie matang', telur: 'Telur ceplok', ayam: 'Ayam panggang', sayur: 'Sayur potong', teh: 'Teh seduh' };
const FIN_NAME = { kecap: 'Kecap', saus: 'Saus Kacang', es: 'Es Batu' };

function drawBackground(g) {

  gRect(g, 0, 56, 1280, 152, PALETTE.creamDark);
  gRect(g, 400, 64, 480, 86, '#9FD3E8');
  gCircle(g, 820, 84, 16, '#FFF3D6');
  gRect(g, 400, 128, 480, 22, '#7AB85E');
  gTriangle(g, 430, 150, 460, 118, 490, 150, '#5E9A4A');
  gTriangle(g, 700, 150, 730, 116, 760, 150, '#5E9A4A');

  gRect(g, 0, 56, 1280, 20, PALETTE.terracotta);
  for (let x = 0; x < 1280; x += 36) gTriangle(g, x, 76, x + 18, 56, x + 36, 76, PALETTE.cream);
  for (const lx of [200, 1080]) {
    gLine(g, lx, 56, lx, 84, PALETTE.teakDark, 3);
    gCircle(g, lx, 92, 12, PALETTE.fire);
    gCircle(g, lx, 92, 26, 'rgba(242,165,65,0.25)');
  }
  gRect(g, 0, 202, 1280, 6, PALETTE.teakDark);

  gRect(g, 16, 168, 1248, 32, PALETTE.teak);
  gRect(g, 16, 168, 1248, 4, '#A06A3F');
  for (let x = 136; x < 1264; x += 120) gRect(g, x, 172, 2, 28, 'rgba(0,0,0,0.15)');

  gRoundRect(g, 40, 200, 280, 120, 8, PALETTE.teak);
  gRoundRect(g, 360, 200, 280, 120, 8, '#D9B380');
  gLine(g, 420, 250, 475, 250, '#C0C8CC', 12);
  gRect(g, 408, 246, 14, 8, PALETTE.teakDark);
  gRoundRect(g, 680, 200, 280, 120, 8, PALETTE.teak);
  gRoundRect(g, 1000, 200, 240, 120, 8, '#8A5A33');
  gRect(g, 1010, 224, 220, 44, '#FFF3D6');
  gRect(g, 1115, 224, 4, 44, '#8A5A33');

  gRoundRect(g, 16, 340, 184, 220, 8, '#8A5A33');
  ZONES.bowls.forEach((z) => gRoundRect(g, z.x, z.y, z.w, z.h, 6, '#FFF3D6'));
  gRoundRect(g, 220, 340, 340, 220, 8, '#D9B380');
  gRoundRect(g, 240, 385, 300, 90, 8, '#C9A86A');
  gLine(g, 500, 410, 530, 410, '#C0C8CC', 10);
  gRect(g, 488, 406, 14, 8, PALETTE.teakDark);
  gRoundRect(g, 580, 340, 340, 220, 8, '#A9713F');
  gRect(g, 590, 350, 320, 26, '#C8C8C8');
  // UI reorg: menu board compacted to y 340-482 so the COOK'S DOCKET fits
  // below it (y 492-560) in the same right column — same grid as the reference.
  gRoundRect(g, 940, 340, 300, 142, 8, '#3A2A1A');

  gRect(g, 16, 560, 1248, 80, '#C98A5A');
  g.lineStyle(2, 0x7a4a2b, 0.35);
  for (let x = 16; x <= 1264; x += 64) { g.beginPath(); g.moveTo(x, 560); g.lineTo(x, 640); g.strokePath(); }
  g.beginPath(); g.moveTo(16, 600); g.lineTo(1264, 600); g.strokePath();

  gEllipse(g, 60, 620, 34, 24, '#D9C9A8');
  gEllipse(g, 60, 600, 30, 18, '#E8DCC8');
  gRect(g, 52, 592, 16, 8, '#B89A6A');
  gEllipse(g, 105, 622, 28, 20, '#C9B896');
  gRect(g, 150, 612, 22, 24, '#B85C38');
  gEllipse(g, 161, 600, 10, 18, '#4E7A3A');
  gEllipse(g, 150, 604, 8, 14, '#5E9A4A');
  gEllipse(g, 172, 604, 8, 14, '#7AB85E');
  gRect(g, 1060, 612, 44, 8, '#8A5A33');
  gRect(g, 1066, 620, 6, 16, '#5C3520');
  gRect(g, 1092, 620, 6, 16, '#5C3520');
  gEllipse(g, 990, 626, 36, 13, '#E8B88A');
  gCircle(g, 1022, 620, 9, '#E8B88A');
  gTriangle(g, 1018, 613, 1021, 606, 1025, 613, '#E8B88A');
  gLine(g, 956, 626, 972, 618, '#D9A066', 4);
  gRect(g, 1180, 596, 40, 40, '#8A5A33');
  gRect(g, 1224, 596, 40, 40, '#A9713F');
  gRect(g, 1202, 556, 40, 40, '#7A4A2B');

  gRoundRect(g, 1120, 575, 50, 65, 6, '#5A5A5A');
  gRect(g, 1124, 571, 42, 6, '#8A8A8A');
}

export function buildScene(scene, state) {
  const world = scene.add.container(0, 0);
  world.setDepth(0);
  const bgG = scene.add.graphics();
  drawBackground(bgG);
  world.add(bgG);

  const finG = scene.add.graphics();
  FINISHERS.forEach((f, i) => {
    const z = ZONES.finishers[i];
    drawFinisher(finG, f.id, z.x, z.y, z.w, z.h);
  });
  world.add(finG);

  const pantryG = scene.add.graphics();
  INGREDIENTS.forEach((ing, i) => {
    const z = ZONES.bowls[i];
    drawIngredient(pantryG, ing.id, 'raw', 36, z.y + z.h / 2, 13);
  });
  world.add(pantryG);
  const labels = [];
  const addLabel = (txt, x, y, size, color, bold = true, ox = 0.5) => {
    const t = scene.add.text(x, y, txt, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: bold ? 'bold' : 'normal', color });
    t.setOrigin(ox, 0.5);
    labels.push(t);
    return t;
  };

  addLabel('KOMPOR', 180, 212, 18, PALETTE.cream);
  addLabel('TALENAN', 500, 212, 18, PALETTE.teakDark);
  addLabel('RAKIT', 820, 212, 18, PALETTE.cream);
  addLabel('THE PASS', 1120, 212, 18, PALETTE.cream);

  addLabel('KECAP', 720, 306, 12, PALETTE.cream);
  addLabel('SAUS', 780, 306, 12, PALETTE.cream);
  addLabel('ES', 840, 306, 12, PALETTE.cream);
  addLabel('SAMPAH', 1145, 607, 12, '#FFF3D6');

  addLabel('RAK BAHAN', 108, 356, 18, PALETTE.cream);
  INGREDIENTS.forEach((ing, i) => {
    const z = ZONES.bowls[i];
    const cy = z.y + z.h / 2;
    addLabel(ing.name.toUpperCase(), 56, cy - 6, 16, PALETTE.ink, true, 0);
    addLabel(ING_TAG[i], 56, cy + 9, 10, '#7A6A55', false, 0);
    addLabel(ing.key, 190, cy, 14, '#B8860B', true, 1);
  });

  addLabel('TALENAN · POTONG', 390, 358, 18, PALETTE.teakDark);
  addLabel('SPACE = POTONG!', 390, 505, 16, PALETTE.teakDark);

  const rakitHeader = addLabel('RAKIT · 0/0', 750, 358, 18, PALETTE.teakDark);
  addLabel('MENU HARI INI', 1090, 358, 17, PALETTE.cream);
  addLabel('ENTER = SAJIKAN', 1120, 306, 16, PALETTE.cream);
  labels.forEach((t) => world.add(t));

  const menuG = scene.add.graphics();
  const menuTexts = [];
  ['nasi', 'mie', 'sate', 'teh'].forEach((id, i) => {
    // Compacted rows (26px apart, icon r 12) to fit the docket below.
    const y = 384 + i * 26;
    drawDish(menuG, id, 972, y, 12);
    const nm = scene.add.text(992, y, RECIPES[id].name, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#FFF3D6' });
    nm.setOrigin(0, 0.5);
    const pr = scene.add.text(1224, y, `Rp ${RECIPES[id].price}`, { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#F5C542' });
    pr.setOrigin(1, 0.5);
    world.add(nm);
    world.add(pr);
    menuTexts.push(nm, pr);
  });
  world.add(menuG);

  const passBellG = scene.add.graphics();
  gCircle(passBellG, 1120, 268, 24, PALETTE.gold);
  gRect(passBellG, 1096, 268, 48, 6, PALETTE.gold);
  gCircle(passBellG, 1120, 252, 6, '#B8860B');
  world.add(passBellG);

  const dynG = scene.add.graphics();
  dynG.setDepth(5);
  world.add(dynG);

  const chopG = scene.add.graphics();
  chopG.setDepth(5);
  world.add(chopG);
  // Route planning overlay (dashed line + waypoints + ETA, drawn per frame).
  const routeG = scene.add.graphics();
  routeG.setDepth(6);
  world.add(routeG);
  const routeText = scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#E86A1C' });
  routeText.setOrigin(0.5, 0.5);
  routeText.setStroke('#FFFFFF', 3);
  routeText.setVisible(false);
  world.add(routeText);
  const routeNum1 = scene.add.text(0, 0, '1', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#FFFFFF' });
  routeNum1.setOrigin(0.5, 0.5);
  routeNum1.setVisible(false);
  world.add(routeNum1);
  const routeNum2 = scene.add.text(0, 0, '2', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#FFFFFF' });
  routeNum2.setOrigin(0.5, 0.5);
  routeNum2.setVisible(false);
  world.add(routeNum2);

  const burnerBars = [];
  for (let i = 0; i < 2; i++) {
    const b = ZONES.burners[i];
    const bg = scene.add.rectangle(b.x + 8, b.y + 67, b.w - 16, 9, 0x3a2a1a);
    bg.setOrigin(0, 0.5);
    const fill = scene.add.rectangle(b.x + 8, b.y + 67, b.w - 16, 9, 0xf2a541);
    fill.setOrigin(0, 0.5);
    const status = scene.add.text(b.x + b.w / 2, b.y + 81, '', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#4E7A3A' });
    status.setOrigin(0.5, 0.5);
    world.add(bg);
    world.add(fill);
    world.add(status);
    burnerBars.push({ bg, fill, status });
  }

  const readyTags = [];
  for (let i = 0; i < 2; i++) {
    const t = scene.add.text(0, 0, 'READY', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#2E7D32' });
    t.setOrigin(0.5, 0.5);
    t.setStroke('#FFFFFF', 2);
    t.setVisible(false);
    // Depth 16: above the customer bubbles (depth 15) so the tag is never
    // painted over by an order card (H1 — the tag sits at the card's bottom edge).
    t.setDepth(16);
    world.add(t);
    readyTags.push(t);
  }

  const chopName = scene.add.text(350, 430, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#2E1F14' });
  chopName.setOrigin(0, 0.5);
  world.add(chopName);

  const checkTexts = [];
  for (let i = 0; i < 3; i++) {
    const t = scene.add.text(760, 400 + i * 30, '', { fontFamily: FONT, fontSize: '16px', color: '#FFF3D6' });
    t.setOrigin(0, 0.5);
    world.add(t);
    checkTexts.push(t);
  }

  const dlg = buildDialogue(scene);

  const cook = createCook(scene);
  world.add(cook.container);
  world.add(cook.shadow);
  const customers = createCustomers(scene);
  customers.forEach((c) => world.add(c.container));

  const counterFrontG = scene.add.graphics();
  gRect(counterFrontG, 16, 168, 1248, 32, PALETTE.teak);
  gRect(counterFrontG, 16, 168, 1248, 4, '#A06A3F');
  for (let x = 136; x < 1264; x += 120) gRect(counterFrontG, x, 172, 2, 28, 'rgba(0,0,0,0.15)');
  world.add(counterFrontG);

  const bellG = scene.add.graphics();
  gCircle(bellG, 802, 168, 14, PALETTE.gold);
  gRect(bellG, 788, 168, 28, 4, PALETTE.gold);
  gCircle(bellG, 802, 158, 4, '#B8860B');
  world.add(bellG);

  const winG = scene.add.graphics();
  winG.setDepth(7);
  world.add(winG);

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
  const hud = buildHUD(scene);
  const overlays = buildOverlays(scene);
  return {
    world, bgG, dynG, chopG, routeG, routeText, routeNum1, routeNum2, burnerBars, readyTags, cook, customers, particlePool, floatPool,
    hud, overlays, labels, chopName, checkTexts, rakitHeader, dlg, winG,
    lastDyn: {
      ticketIds: [-1, -1, -1], burnerItems: [false, false],
      plateItemsLen: [0, 0], plateDone: [false, false],
      plateFinisher: [null, null], windowDishes: [null, null],
      selected: -1, handsKey: '',
    },
    lastWin: [null, null],
    lastDynRedraw: -10, lastChopDots: -1, lastCheckKey: '', lastDlgKey: '',
  };
}

function buildDialogue(scene) {
  const c = scene.add.container(0, 0);
  c.setDepth(30);
  c.setVisible(false);
  const g = scene.add.graphics();
  g.fillStyle(0xfff8e7, 1);
  g.fillRoundedRect(320, 480, 640, 120, 12);
  g.lineStyle(3, 0x5c3520, 1);
  g.strokeRoundedRect(320, 480, 640, 120, 12);
  c.add(g);
  const portrait = scene.add.circle(360, 540, 24, 0xf2c14e);
  portrait.setStrokeStyle(2, 0x5c3520, 1);
  c.add(portrait);
  // L3: a simple face on the portrait (was a plain coloured circle).
  const faceL = scene.add.ellipse(351, 536, 4, 5, 0x2e1f14);
  const faceR = scene.add.ellipse(369, 536, 4, 5, 0x2e1f14);
  const faceSmile = scene.add.arc(360, 546, 9, 15, 165, false, 0x2e1f14);
  c.add(faceL);
  c.add(faceR);
  c.add(faceSmile);
  const name = scene.add.text(396, 508, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#2E1F14' });
  name.setOrigin(0, 0.5);
  c.add(name);
  const lines = scene.add.text(396, 536, '', { fontFamily: FONT, fontSize: '16px', color: '#2E1F14', wordWrap: { width: 540 } });
  lines.setOrigin(0, 0);
  c.add(lines);
  return { container: c, portrait, name, lines };
}

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
  const title = mk(40);
  txt(title, 640, 220, 'WARUNG SARI RASA', 64, PALETTE.cream);
  txt(title, 640, 280, '— Dapur Kilat —', 28, PALETTE.fire, 'italic bold');
  txt(title, 640, 330, 'Masak cepat, antar tepat. Satu shift, tiga menit, pesanan tak berhenti.', 20, '#FFF3D6', 'normal');
  txt(title, 640, 362, 'Klik stasiun untuk jalan & masak • 1–6 ambil bahan • K buku resep', 16, '#D8CDB8', 'normal');
  const playBtn = scene.add.graphics();
  playBtn.fillStyle(0xd96c3f, 1);
  playBtn.fillRoundedRect(540, 400, 200, 56, 12);
  title.add(playBtn);
  txt(title, 640, 428, 'MULAI MASAK', 24, '#FFFFFF');
  txt(title, 640, 478, 'Enter / klik tombol', 14, '#D8CDB8', 'normal');
  txt(title, 640, 530, 'Nasi Goreng • Mie Goreng • Sate Ayam • Es Teh Melati', 15, PALETTE.gold, 'normal');
  const paused = mk(40);
  txt(paused, 640, 320, 'JEDA', 56, PALETTE.cream);
  txt(paused, 640, 380, 'P / Esc untuk lanjut • K buku resep • M suara', 18, '#FFF3D6', 'normal');
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
  const results = buildResults(scene);
  return { title, paused, book, results };
}

function activePlate(state) {
  return state.plates.find((p) => p && (p.items.length || p.finisher || p.done)) || null;
}

function redrawDynamic(view, state) {
  const g = view.dynG;
  g.clear();
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
        gCircle(g, cx + 22, cy - 12, 5, plate.finisher === 'kecap' ? '#3A1F10' : plate.finisher === 'saus' ? '#C68A3C' : '#7AB8D8');
      }
    }
  });
  const ap = activePlate(state);
  if (ap) {
    const cx = 680;
    const cy = 450;
    if (ap.done && ap.dish) {
      drawDish(g, ap.dish, cx, cy, 48);
    } else {
      gEllipse(g, cx, cy, 62, 40, '#FFFFFF');
      gEllipse(g, cx, cy, 50, 30, '#E8E0D0');
      ap.items.forEach((c, j) => {
        const ox = (j - (ap.items.length - 1) / 2) * 44;
        drawIngredient(g, c.kind, c.prep, cx + ox, cy - 6, 22);
      });
      if (ap.finisher) gCircle(g, cx + 44, cy - 22, 9, ap.finisher === 'kecap' ? '#3A1F10' : ap.finisher === 'saus' ? '#C68A3C' : '#7AB8D8');
    }
  }

  const item = nextChoppable(state) || state.cook.hands.find((h) => h && h.prep === 'chopped');
  if (item) drawIngredient(g, item.kind, item.prep, 300, 430, 22);
}

function redrawWindow(view, state) {
  const g = view.winG;
  g.clear();
  state.windowPlates.forEach((wp, i) => {
    if (!wp) return;
    const z = ZONES.windowPlates[i];
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    gEllipse(g, cx, cy, 40, 20, 'rgba(78,122,58,0.35)');
    drawDish(g, wp.dish, cx, cy + 4, 26);
    gTriangle(g, cx - 8, cy - 24, cx, cy - 34, cx + 8, cy - 24, PALETTE.gold);
    gTriangle(g, cx - 8, cy - 24, cx, cy - 14, cx + 8, cy - 24, PALETTE.gold);
  });
}

function parseFill(str) {
  if (typeof str === 'number') return { color: str, alpha: 1 };
  if (typeof str === 'string' && str.startsWith('#')) return { color: parseInt(str.slice(1), 16), alpha: 1 };
  const m = typeof str === 'string' ? str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/) : null;
  if (m) return { color: (parseInt(m[1], 10) << 16) | (parseInt(m[2], 10) << 8) | parseInt(m[3], 10), alpha: m[4] === undefined ? 1 : parseFloat(m[4]) };
  return { color: 0xffffff, alpha: 1 };
}

export function syncScene(view, state, dt) {
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
  }
  let winDirty = false;
  for (let i = 0; i < 2; i++) {
    const wd = state.windowPlates[i] ? state.windowPlates[i].dish : null;
    if (wd !== view.lastWin[i]) { view.lastWin[i] = wd; winDirty = true; }
  }
  if (state.selectedTicket !== ld.selected) { ld.selected = state.selectedTicket; dirty = true; }
  const hk = state.cook.hands.map((h) => (h ? `${h.kind}:${h.prep}` : '-')).join(',');
  if (hk !== ld.handsKey) { ld.handsKey = hk; dirty = true; }
  if (dirty) {
    redrawDynamic(view, state);
    view.lastDynRedraw = state.time;
  }
  if (winDirty) redrawWindow(view, state);

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
      bar.status.setText('SIAP! Angkat!');
      bar.status.setColor('#4E7A3A');
    } else {
      bar.status.setText('MASAK!');
      bar.status.setColor('#F2A541');
    }
  });

  state.windowPlates.forEach((wp, i) => {
    const tag = view.readyTags[i];
    if (!wp) { tag.setVisible(false); return; }
    const z = ZONES.windowPlates[i];
    tag.setVisible(true);
    // y - 10 sits just below the order card's bottom edge (card ends ~y142)
    // in the clear gap above the counter, so the tag never hides behind a card.
    tag.setPosition(z.x + z.w / 2, z.y - 10);
  });

  const chopItem = nextChoppable(state) || state.cook.hands.find((h) => h && h.prep === 'chopped');
  const chopping = state.cook.anim === 'chop';
  const choppedHeld = !!state.cook.hands.find((h) => h && h.prep === 'chopped');
  const dots = choppedHeld ? 4 : chopping ? Math.min(4, Math.floor((state.cook.animT % 0.5) / 0.5 * 4) + 1) : 0;
  if (dots !== view.lastChopDots) {
    view.lastChopDots = dots;
    const cg = view.chopG;
    cg.clear();
    for (let d = 0; d < 4; d++) {
      const dx = 330 + d * 40;
      if (d < dots) gCircle(cg, dx, 470, 9, '#4E7A3A');
      else gCircleStroke(cg, dx, 470, 9, '#5C3520', 2);
    }
  }
  view.chopName.setText(chopItem ? (chopItem.prep === 'chopped' ? `${COMP_NAME[chopItem.kind] || chopItem.kind} ✓` : `Potong: ${INGREDIENTS.find((n) => n.id === chopItem.kind)?.name || chopItem.kind}`) : 'Bawa bahan yang bisa dipotong');

  const ap = activePlate(state);
  const sel = state.selectedTicket !== null && state.tickets[state.selectedTicket] ? state.tickets[state.selectedTicket] : null;
  const dish = ap ? plateTargetDish(state, ap) : sel ? sel.dish : null;
  const need = sel && dish === sel.dish ? requiredComponents(sel) : dish ? { items: RECIPES[dish].plate, finisher: RECIPES[dish].finisher } : null;
  const doneCount = ap ? ap.items.length + (ap.finisher ? 1 : 0) : 0;
  const totalCount = need ? need.items.length + (need.finisher ? 1 : 0) : 0;
  view.rakitHeader.setText(`RAKIT · ${doneCount}/${totalCount}`);
  const checkKey = `${dish}:${doneCount}:${need ? need.items.map((c) => c.kind).join(',') : ''}`;
  if (checkKey !== view.lastCheckKey) {
    view.lastCheckKey = checkKey;
    const lines = [];
    if (need) {
      need.items.forEach((c) => {
        const on = ap && ap.items.some((i) => i.kind === c.kind && i.prep === c.prep);
        lines.push(`${on ? '✓' : '☐'} ${COMP_NAME[`${c.kind}:${c.prep}`] || COMP_NAME[c.kind] || c.kind}`);
      });
      if (need.finisher) lines.push(`${ap && ap.finisher ? '✓' : '☐'} ${FIN_NAME[need.finisher] || need.finisher}`);
    }
    for (let i = 0; i < 3; i++) {
      const t = view.checkTexts[i];
      t.setText(lines[i] || '');
      t.setColor(lines[i] && lines[i].startsWith('✓') ? '#8FE388' : '#FFF3D6');
    }
  }

  const dlg = view.dlg;
  if (state.dialogue) {
    const key = `${state.dialogue.who}:${state.dialogue.lines}`;
    if (key !== view.lastDlgKey) {
      view.lastDlgKey = key;
      dlg.name.setText(state.dialogue.who);
      dlg.lines.setText(state.dialogue.lines);
      const col = { 'Mbak Rina': 0xf2c14e, 'Ibu Sari': 0xe0789a, 'Mas Joko': 0xfff3d6 }[state.dialogue.who] || 0xf2c14e;
      dlg.portrait.setFillStyle(col, 1);
    }
    dlg.container.setVisible(true);
  } else {
    dlg.container.setVisible(false);
    view.lastDlgKey = '';
  }
  const rg = view.routeG;
  rg.clear();
  if (state.route && state.cook.walking) {
    const x0 = state.cook.x;
    const x1 = state.route.tx;
    const y = 600;
    const step = x1 > x0 ? 1 : -1;
    rg.lineStyle(3, 0xe86a1c, 0.9);
    for (let x = x0; step > 0 ? x < x1 : x > x1; x += step * 16) {
      const xe = step > 0 ? Math.min(x + 10, x1) : Math.max(x - 10, x1);
      rg.beginPath();
      rg.moveTo(x, y);
      rg.lineTo(xe, y);
      rg.strokePath();
    }
    rg.fillStyle(0xe86a1c, 1);
    rg.fillCircle(x1, y, 12);
    rg.lineStyle(2, 0xffffff, 1);
    rg.strokeCircle(x1, y, 12);
    view.routeNum1.setPosition(x1, y);
    view.routeNum1.setVisible(true);
    const hasQ = state.route.queued && state.routeQueue;
    if (hasQ) {
      const qx = state.routeQueue.x;
      rg.fillStyle(0xe86a1c, 1);
      rg.fillCircle(qx, y, 12);
      rg.lineStyle(2, 0xffffff, 1);
      rg.strokeCircle(qx, y, 12);
      view.routeNum2.setPosition(qx, y);
      view.routeNum2.setVisible(true);
    } else {
      view.routeNum2.setVisible(false);
    }
    const eta = Math.abs(x1 - x0) / 320 + 0.5 * (hasQ ? 2 : 1);
    view.routeText.setText(`RUTE · ${hasQ ? 2 : 1} STOP · ${eta.toFixed(1).replace('.', ',')} dtk`);
    view.routeText.setPosition((x0 + x1) / 2, 572);
    view.routeText.setVisible(true);
  } else {
    view.routeText.setVisible(false);
    view.routeNum1.setVisible(false);
    view.routeNum2.setVisible(false);
  }
  syncCook(view.cook, state, state.time);
  syncCustomers(view.customers, state, state.time);
  const parts = state.particles;
  let circleIdx = 0;
  let leafIdx = 0;
  for (let i = 0; i < view.particlePool.length; i++) view.particlePool[i].setVisible(false);
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
  syncHUD(view.hud, state);
  const ov = view.overlays;
  ov.title.setVisible(state.mode === 'title');
  ov.paused.setVisible(state.mode === 'paused');
  ov.book.setVisible(state.mode === 'book');
  const showResults = state.mode === 'summary';
  ov.results.container.setVisible(showResults);
  if (showResults) syncResults(ov.results, state);
}
