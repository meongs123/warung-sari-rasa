// warung-sari-rasa v3.0 — results.js
import { RANKS } from './config.js';
import { drawDish } from './drawfood.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const STAT_DEFS = [
  ['PIRING TERSAJI', 'served'], ['TINGKAT SEMPURNA', 'perfectPct'], ['KOMBO TERTINGGI', 'bestCombo'],
  ['BONUS BATCH', 'batchBonus'], ['PELANGGAN PERGI', 'walkouts'], ['WAKTU SHIFT', 'time'],
];
const DISH_NAMES = { nasi: 'Nasi Goreng', mie: 'Mie Goreng', sate: 'Sate Ayam', teh: 'Es Teh Melati' };

export function buildResults(scene) {
  const c = scene.add.container(0, 0);
  c.setDepth(40);
  c.setVisible(false);
  const dim = scene.add.rectangle(640, 360, 1280, 720, 0x2e1f14, 0.78);
  c.add(dim);
  const txt = (x, y, str, size, color, style = 'bold') => {
    const t = scene.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: style, color });
    t.setOrigin(0.5, 0.5);
    c.add(t);
    return t;
  };
  txt(640, 70, 'WARUNG TUTUP · HASIL SHIFT', 40, '#FFF3D6');
  txt(640, 105, 'Shift 1 · 3 menit', 16, '#F2A541', 'normal');
  const g = scene.add.graphics();
  g.fillStyle(0xf5c542, 1);
  g.fillCircle(280, 200, 52);
  g.lineStyle(4, 0xb8860b, 1);
  g.strokeCircle(280, 200, 52);
  c.add(g);
  const rankLetter = txt(280, 200, 'C', 56, '#2E1F14');
  const rankTitle = txt(280, 272, 'PELAJAR MASAK', 18, '#F5C542');
  txt(640, 150, 'SKOR AKHIR', 16, '#FFF3D6', 'normal');
  const scoreText = txt(640, 195, 'Rp 0', 44, '#F5C542');
  const recordText = txt(830, 190, 'REKOR BARU!', 22, '#FF6B5E');
  recordText.setRotation(-0.2);
  recordText.setVisible(false);

  const statVals = [];
  const boxG = scene.add.graphics();
  STAT_DEFS.forEach(([label, key], i) => {
    const x = 320 + (i % 3) * 320;
    const y = 310 + Math.floor(i / 3) * 90;
    boxG.fillStyle(0xfff3d6, 0.12);
    boxG.fillRoundedRect(x - 130, y - 24, 260, 68, 10);
    txt(x, y, label, 13, '#D8CDB8', 'normal');
    const v = txt(x, y + 28, '0', 22, '#FFFFFF');
    statVals.push({ key, text: v });
  });
  c.add(boxG);
  txt(640, 448, 'MEDALI', 13, '#D8CDB8', 'normal');
  const medalTexts = [320, 640, 960].map((x) => txt(x, 472, '', 14, '#F5C542'));
  const dishesG = scene.add.graphics();
  c.add(dishesG);
  const dishesText = txt(640, 522, '', 16, '#FFF3D6', 'normal');
  const storyText = txt(640, 560, '', 16, '#FFF3D6', 'italic');
  const eventText = txt(640, 588, '', 16, '#F5C542', 'normal');

  const btnG = scene.add.graphics();
  btnG.fillStyle(0xd96c3f, 1);
  btnG.fillRoundedRect(540, 630, 200, 56, 12);
  btnG.fillStyle(0x3a2a1a, 1);
  btnG.fillRoundedRect(770, 630, 160, 56, 12);
  c.add(btnG);
  txt(640, 658, 'MAIN LAGI [R]', 22, '#FFFFFF');
  txt(850, 658, 'MENU [ESC]', 20, '#FFF3D6');
  txt(640, 702, 'R / S = main lagi · ESC = menu', 12, '#B9A98A', 'normal');
  return { container: c, rankLetter, rankTitle, scoreText, recordText, statVals, medalTexts, dishesG, dishesText, storyText, eventText, lastKey: '', lastDishesKey: '' };
}

export function syncResults(view, state) {
  const s = state.summary;
  if (!s) return;
  const key = `${s.coins}:${s.dishes}:${s.bestCombo}:${s.pakBudi}:${s.record}:${s.lives}`;
  if (key === view.lastKey) return;
  view.lastKey = key;
  const rank = RANKS.find((r) => s.coins >= r.min) || RANKS[RANKS.length - 1];
  view.rankLetter.setText(rank.letter);
  view.rankTitle.setText(rank.title);
  view.scoreText.setText(`Rp ${s.coins}`);
  view.recordText.setVisible(!!s.record);
  const st = s.stats || {};
  const vals = {
    served: `${st.served || 0}`,
    perfectPct: st.served ? `${Math.round((st.perfect || 0) / st.served * 100)}%` : '—',
    bestCombo: `×${s.bestCombo || 0}`,
    batchBonus: `Rp ${st.batchBonus || 0}`,
    walkouts: `${st.walkouts || 0}`,
    time: '3:00',
  };
  view.statVals.forEach(({ key: k, text }) => text.setText(vals[k] ?? '0'));
  const medals = [];
  if (st.firstBell) medals.push('★ BEL PERTAMA');
  if ((st.burnt || 0) === 0) medals.push('★ TANPA GOSONG');
  if (s.event && s.event.cleared) medals.push('★ KRITIKUS PUAS');
  view.medalTexts.forEach((t, i) => t.setText(medals[i] || ''));
  const dkey = JSON.stringify(st.dishes || {});
  if (dkey !== view.lastDishesKey) {
    view.lastDishesKey = dkey;
    const dg = view.dishesG;
    dg.clear();
    const served = Object.entries(st.dishes || {}).filter(([, n]) => n > 0);
    const parts = [];
    served.forEach(([id, n], i) => {
      const x = 640 + (i - (served.length - 1) / 2) * 170;
      drawDish(dg, id, x - 62, 522, 15);
      parts.push(`${DISH_NAMES[id]} ×${n}`);
    });
    view.dishesText.setText(parts.join('   ·   ') || 'Belum ada hidangan tersaji.');
    view.dishesText.setX(640);
  }
  view.storyText.setText(s.pakBudi ? '★ Pak Budi dilayani — VIP senang!' : (s.story || ''));
  view.eventText.setText(s.event ? (s.event.cleared ? 'Pak Kumis: PUAS — kritikus takluk!' : s.event.failed ? 'Pak Kumis: GAGAL — kritikus kecewa.' : 'Pak Kumis: tidak datang.') : '');
}
