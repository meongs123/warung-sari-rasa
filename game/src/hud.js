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
  const shiftText = scene.add.text(330, 20, 'SHIFT 1', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#FFF3D6' });
  shiftText.setOrigin(0, 0.5);
  const shiftSub = scene.add.text(330, 40, '3 menit', { fontFamily: FONT, fontSize: '11px', color: '#B9A98A' });
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
  return {
    timerFill, timerText, coinsText, comboText, heartsText, streakText, bestText, rushText,
    moodFill, bannerG, bannerText, statusText, trayG, trayTexts,
    lastTimer: '', lastCoins: -1, lastCombo: '', lastHearts: '', lastStreak: '', lastBest: -1,
    lastMood: -1, lastEvent: null, lastBatch: '', lastStatus: '', lastHandsKey: '',
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
