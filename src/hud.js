// warung-sari-rasa v3.0 — hud.js
import { CONFIG, PALETTE, RECIPES, RECIPE_ORDER, comboMultiplier } from './config.js';
import { timeLeft } from './state.js';
import { eventActive } from './events.js';
import { drawDish, drawIngredient } from './drawfood.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const ING_NAME = { nasi: 'Nasi', mie: 'Mie', telur: 'Telur', ayam: 'Ayam', sayur: 'Sayur', teh: 'Teh' };

function nextStep(state) {
  const hands = state.cook.hands.filter(Boolean);
  const handNames = hands.map((h) => ING_NAME[h.kind] || h.kind);
  const held = handNames.length ? handNames.join(' + ') : 'kosong';
  if (state.windowPlates.some(Boolean)) return `Lagi pegang: ${held} · Piring siap — klik BEL untuk sajikan!`;
  if (state.cook.plate) return `Lagi pegang: ${held} · Bawa piring ke jendela saji!`;
  const done = state.plates.findIndex((p) => p.done);
  if (done >= 0) return `Lagi pegang: ${held} · Piring jadi! Klik RAKIT untuk ambil.`;
  const ticket = state.tickets[state.selectedTicket] || state.tickets.find(Boolean);
  if (!ticket) return `Lagi pegang: ${held} · Tunggu pesanan masuk.`;
  const r = RECIPES[ticket.dish];
  const first = r.plate[0];
  const raw = hands.find((h) => h.prep === 'raw');
  if (raw) {
    const ing = ING_NAME[raw.kind];
    if (raw.kind === 'telur' || raw.kind === 'sayur' || raw.kind === 'ayam') return `Lagi pegang: ${held} · Potong ${ing} di TALENAN (SPACE)!`;
    return `Lagi pegang: ${held} · Masak ${ing} di KOMPOR (klik kompor)!`;
  }
  const prepped = hands.find((h) => h.prep !== 'raw');
  if (prepped) return `Lagi pegang: ${held} · Rakit di meja (klik RAKIT)!`;
  return `Lagi pegang: ${held} · 1. Ambil ${ING_NAME[first.kind]} (klik RAK BAHAN)`;
}

// COOK'S DOCKET — the dish being made + the next step, in plain words.
// (Same state as nextStep, but without the "Lagi pegang" prefix, so the
// panel reads as a ticket: dish on one line, action on the next.)
function docketInfo(state) {
  // R4: when the cook carries a plate, the docket names the CARRIED dish —
  // the plate in hand is the dish being served, not the selected ticket's.
  // (The step already branched on cook.plate; only the dish was wrong.)
  const carried = state.cook.plate ? RECIPES[state.cook.plate.dish] : null;
  const ticket = state.tickets[state.selectedTicket] || state.tickets.find(Boolean);
  if (!carried && !ticket) return { dish: '—', step: 'Tunggu pesanan masuk.', num: '' };
  const r = carried || RECIPES[ticket.dish];
  const hands = state.cook.hands.filter(Boolean);
  const raw = hands.find((h) => h.prep === 'raw');
  let step;
  if (state.windowPlates.some(Boolean)) step = 'Piring siap — klik BEL untuk sajikan!';
  else if (state.cook.plate) step = 'Bawa piring ke jendela saji!';
  else if (state.plates.findIndex((p) => p.done) >= 0) step = 'Piring jadi! Klik RAKIT untuk ambil.';
  else if (raw) {
    const ing = ING_NAME[raw.kind];
    step = (raw.kind === 'telur' || raw.kind === 'sayur' || raw.kind === 'ayam')
      ? `Potong ${ing} di TALENAN (SPACE)`
      : `Masak ${ing} di KOMPOR`;
  } else if (hands.find((h) => h.prep !== 'raw')) step = 'Rakit di meja (klik RAKIT)!';
  else step = `Ambil ${ING_NAME[r.plate[0].kind]} di RAK BAHAN`;
  return { dish: r.name, step, num: carried || !ticket ? '' : `Nº ${String(ticket.id + 1).padStart(2, '0')}` };
}

export function buildHUD(scene) {
  const topBarG = scene.add.graphics();
  topBarG.fillStyle(0x5c3520, 1);
  topBarG.fillRect(0, 0, 1280, 56);
  topBarG.fillStyle(0x7a4a2b, 1);
  topBarG.fillRect(0, 52, 1280, 4);
  const signText = scene.add.text(16, 16, 'WARUNG SARI RASA', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#FFF3D6' });
  signText.setOrigin(0, 0.5);
  const subText = scene.add.text(16, 40, 'Dapur Kilat', { fontFamily: FONT, fontSize: '12px', fontStyle: 'italic', color: '#F2A541' });
  subText.setOrigin(0, 0.5);
  const moodLabel = scene.add.text(210, 12, 'SUASANA', { fontFamily: FONT, fontSize: '10px', color: '#B9A98A' });
  moodLabel.setOrigin(0, 0.5);
  const moodBg = scene.add.rectangle(210, 24, 100, 10, 0x4a2e18);
  moodBg.setOrigin(0, 0.5);
  const moodFill = scene.add.rectangle(210, 24, 100, 10, 0x4e7a3a);
  moodFill.setOrigin(0, 0.5);
  // SERVICE WAVE: the shift runs in 3 waves (60s each); the label is derived
  // from elapsed time only — no phase mechanic, just the wave the shift is in.
  const shiftText = scene.add.text(330, 20, 'GELOMBANG 1/3', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#FFF3D6' });
  shiftText.setOrigin(0, 0.5);
  const shiftSub = scene.add.text(330, 40, 'Awal Shift', { fontFamily: FONT, fontSize: '11px', color: '#B9A98A' });
  shiftSub.setOrigin(0, 0.5);
  const timerBg = scene.add.rectangle(440, 31, 400, 26, 0x4a2e18);
  timerBg.setOrigin(0, 0.5);
  const timerFill = scene.add.rectangle(440, 31, 400, 26, 0xf2a541);
  timerFill.setOrigin(0, 0.5);
  const timerFrame = scene.add.rectangle(640, 31, 400, 26, 0x000000, 0);
  timerFrame.setOrigin(0.5, 0.5);
  timerFrame.setStrokeStyle(2, 0xfff3d6, 1);
  const timerText = scene.add.text(640, 31, '3:00', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#FFFFFF' });
  timerText.setOrigin(0.5, 0.5);
  const heartsText = scene.add.text(860, 20, '♥♥♥', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#E85A5A' });
  heartsText.setOrigin(0, 0.5);
  const streakText = scene.add.text(860, 46, 'STREAK ×0', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#FFF3D6' });
  streakText.setOrigin(0, 0.5);
  const bestText = scene.add.text(1010, 20, 'TERBAIK Rp 0', { fontFamily: FONT, fontSize: '13px', color: '#FFF3D6' });
  bestText.setOrigin(0, 0.5);
  const rushText = scene.add.text(1010, 46, '', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#F5C542' });
  rushText.setOrigin(0, 0.5);
  const coinsText = scene.add.text(1264, 20, 'Rp 0', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#F5C542' });
  coinsText.setOrigin(1, 0.5);
  const comboText = scene.add.text(1264, 46, '×1', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#FFF3D6' });
  comboText.setOrigin(1, 0.5);
  // Event banner (red/gold strip under the top bar, y 56-76).
  const bannerG = scene.add.graphics();
  bannerG.fillStyle(0xc0392b, 1);
  bannerG.fillRect(0, 56, 1280, 20);
  bannerG.fillStyle(0xf5c542, 1);
  bannerG.fillRect(0, 74, 1280, 2);
  bannerG.setVisible(false);
  const bannerText = scene.add.text(640, 66, 'JAM MAKAN SIANG — RUSH! · PAK KUMIS MINTA SEMPURNA', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#FFFFFF' });
  bannerText.setOrigin(0.5, 0.5);
  bannerText.setVisible(false);
  // Batch info rides on the status line (no free strip space for a banner).
  // Status line (y 640-668).
  const statusBg = scene.add.graphics();
  statusBg.fillStyle(0x5c3520, 1);
  statusBg.fillRect(0, 640, 1280, 28);
  const statusText = scene.add.text(16, 654, '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#FFF3D6' });
  statusText.setOrigin(0, 0.5);
  // Bottom bar (y 668-720): recipe strip + controls + tray.
  const bottomBg = scene.add.graphics();
  bottomBg.fillStyle(0x3a2a1a, 1);
  bottomBg.fillRect(0, 668, 1280, 52);
  const recipeG = scene.add.graphics();
  RECIPE_ORDER.forEach((id, i) => {
    drawDish(recipeG, id, 36 + i * 150, 688, 13);
    const nm = scene.add.text(56 + i * 150, 682, RECIPES[id].name, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#FFF3D6' });
    nm.setOrigin(0, 0.5);
    const pr = scene.add.text(56 + i * 150, 700, `Rp ${RECIPES[id].price} · ${RECIPES[id].plate.length + 1} bahan`, { fontFamily: FONT, fontSize: '12px', color: '#F5C542' });
    pr.setOrigin(0, 0.5);
  });
  const ctrl1 = scene.add.text(630, 682, 'WASD jalan · 1-6 bahan · SPACE potong · E rakit', { fontFamily: FONT, fontSize: '14px', color: '#D8CDB8' });
  ctrl1.setOrigin(0, 0.5);
  const ctrl2 = scene.add.text(630, 702, 'ENTER sajikan · K buku · P jeda · M suara · Q buang', { fontFamily: FONT, fontSize: '14px', color: '#D8CDB8' });
  ctrl2.setOrigin(0, 0.5);
  const trayLabel = scene.add.text(1010, 698, 'NAMPAN', { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#FFF3D6' });
  trayLabel.setOrigin(0, 0.5);
  const trayG = scene.add.graphics();
  const trayTexts = [];
  for (let i = 0; i < 2; i++) {
    const t = scene.add.text(1092 + i * 100, 698, '—', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#FFF3D6' });
    t.setOrigin(0, 0.5);
    trayTexts.push(t);
  }
  // COOK'S DOCKET (x 940-1240, y 492-560): the dish being made + the next
  // step in plain words + the recipe link. Persistent, always visible —
  // the same info as the status line, but as a proper ticket panel.
  const docketG = scene.add.graphics();
  docketG.fillStyle(0xfff3d6, 1);
  docketG.fillRoundedRect(940, 492, 300, 68, 8);
  docketG.lineStyle(2, 0x5c3520, 1);
  docketG.strokeRoundedRect(940, 492, 300, 68, 8);
  docketG.fillStyle(0x4e7a3a, 1);
  docketG.fillRoundedRect(940, 492, 300, 20, { tl: 8, tr: 8, bl: 0, br: 0 });
  const docketLabel = scene.add.text(956, 502, 'DOCKET', { fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#FFF3D6' });
  docketLabel.setOrigin(0, 0.5);
  const docketNum = scene.add.text(1224, 502, '', { fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#F5C542' });
  docketNum.setOrigin(1, 0.5);
  const docketDish = scene.add.text(956, 526, '—', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#2E1F14' });
  docketDish.setOrigin(0, 0.5);
  const docketRecipe = scene.add.text(1224, 526, 'Resep [K] ↗', { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#2E7D32' });
  docketRecipe.setOrigin(1, 0.5);
  const docketStep = scene.add.text(956, 546, 'Tunggu pesanan masuk.', { fontFamily: FONT, fontSize: '13px', color: '#5C4A33' });
  docketStep.setOrigin(0, 0.5);
  return {
    timerFill, timerText, coinsText, comboText, heartsText, streakText, bestText, rushText,
    moodFill, bannerG, bannerText, statusText, trayG, trayTexts,
    shiftText, shiftSub, docketDish, docketStep, docketNum,
    lastTimer: '', lastCoins: -1, lastCombo: '', lastHearts: '', lastStreak: '', lastBest: -1,
    lastMood: -1, lastEvent: null, lastBatch: '', lastStatus: '', lastHandsKey: '',
    lastWave: '', lastDocket: '',
  };
}

export function syncHUD(hud, state) {
  const left = timeLeft(state);
  const frac = left / state.shiftLength;
  hud.timerFill.setScale(Math.max(0.001, frac), 1);
  const timerColor = left <= 30 ? 0xc0392b : 0xf2a541;
  hud.timerFill.setFillStyle(timerColor, 1);
  hud.timerFill.setAlpha(left <= 30 ? 0.75 + 0.25 * Math.sin(state.time * 8) : 1);
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60).toString().padStart(2, '0');
  const timerStr = `${mm}:${ss}`;
  if (timerStr !== hud.lastTimer) {
    hud.lastTimer = timerStr;
    hud.timerText.setText(timerStr);
  }
  if (state.coins !== hud.lastCoins) {
    hud.lastCoins = state.coins;
    hud.coinsText.setText(`Rp ${state.coins}`);
  }
  const mult = comboMultiplier(state.combo);
  const comboStr = `×${mult.toFixed(2).replace(/0$/, '')}`;
  if (comboStr !== hud.lastCombo) {
    hud.lastCombo = comboStr;
    hud.comboText.setText(comboStr);
    hud.comboText.setColor(mult >= 2 ? '#F5C542' : '#FFF3D6');
  }
  const hearts = '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 3 - state.lives));
  if (hearts !== hud.lastHearts) {
    hud.lastHearts = hearts;
    hud.heartsText.setText(hearts);
  }
  const streakStr = `STREAK ×${state.streak}`;
  if (streakStr !== hud.lastStreak) {
    hud.lastStreak = streakStr;
    hud.streakText.setText(streakStr);
  }
  if (state.best !== hud.lastBest) {
    hud.lastBest = state.best;
    hud.bestText.setText(`TERBAIK Rp ${state.best}`);
  }
  const ev = eventActive(state);
  if (ev !== hud.lastEvent) {
    hud.lastEvent = ev;
    hud.bannerG.setVisible(ev);
    hud.bannerText.setVisible(ev);
    hud.rushText.setText(ev ? 'TEKANAN ×2' : '');
  }
  const open = state.tickets.filter(Boolean);
  const mood = open.length ? open.reduce((a, t) => a + t.patience / t.maxPatience, 0) / open.length : 1;
  const moodQ = Math.round(mood * 20) / 20;
  if (moodQ !== hud.lastMood) {
    hud.lastMood = moodQ;
    hud.moodFill.setScale(Math.max(0.001, moodQ), 1);
    hud.moodFill.setFillStyle(moodQ > 0.5 ? 0x4e7a3a : moodQ >= 0.25 ? 0xf2a541 : 0xc0392b, 1);
  }
  const counts = {};
  open.forEach((t) => { counts[t.dish] = (counts[t.dish] || 0) + 1; });
  const batchDish = Object.keys(counts).find((d) => counts[d] >= 2);
  const batchStr = batchDish ? ` · BATCH: ${RECIPES[batchDish].name.toUpperCase()} ×2` : '';
  const status = nextStep(state) + batchStr;
  if (status !== hud.lastStatus) {
    hud.lastStatus = status;
    hud.statusText.setText(status);
  }
  // SERVICE WAVE (label only): 3 waves of 60s across the 180s shift.
  const elapsed = state.shiftLength - left;
  const wave = Math.min(3, Math.floor(elapsed / 60) + 1);
  const waveStr = `GELOMBANG ${wave}/3`;
  if (waveStr !== hud.lastWave) {
    hud.lastWave = waveStr;
    hud.shiftText.setText(waveStr);
    hud.shiftSub.setText(['', 'Awal Shift', 'Tengah Shift', 'Akhir Shift'][wave]);
  }
  // COOK'S DOCKET: dish + next step + ticket number, updated on change.
  const dk = docketInfo(state);
  const dkKey = `${dk.dish}|${dk.step}|${dk.num}`;
  if (dkKey !== hud.lastDocket) {
    hud.lastDocket = dkKey;
    hud.docketDish.setText(dk.dish);
    hud.docketStep.setText(dk.step);
    hud.docketNum.setText(dk.num);
  }
  const hk = state.cook.hands.map((h) => (h ? `${h.kind}:${h.prep}` : '-')).join(',');
  if (hk !== hud.lastHandsKey) {
    hud.lastHandsKey = hk;
    const tg = hud.trayG;
    tg.clear();
    state.cook.hands.forEach((item, i) => {
      const x = 1060 + i * 100;
      tg.fillStyle(0x7a4a2b, 1);
      tg.fillRoundedRect(x, 682, 92, 32, 6);
      tg.lineStyle(1, 0xfff3d6, 0.5);
      tg.strokeRoundedRect(x, 682, 92, 32, 6);
      if (item) {
        drawIngredient(tg, item.kind, item.prep, x + 14, 698, 9);
        hud.trayTexts[i].setText(ING_NAME[item.kind].toUpperCase());
      } else {
        hud.trayTexts[i].setText('—');
      }
    });
  }
}
