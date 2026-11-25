// hud.js — Phaser HUD: top bar (sign + timer + coins + combo) and hint bar.
// No order board (the bubbles above the customers carry the tickets now).
// Texts are updated only when their value changes (no per-frame strings);
// the timer bar is a Rectangle scaled from the left edge (property only).

import { CONFIG, PALETTE, comboMultiplier } from './config.js';
import { timeLeft } from './state.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

export function buildHUD(scene) {
  // Top bar background.
  const topBarG = scene.add.graphics();
  topBarG.fillStyle(0x5c3520, 1);
  topBarG.fillRect(0, 0, 1280, 56);
  topBarG.fillStyle(0x7a4a2b, 1);
  topBarG.fillRect(0, 52, 1280, 4);
  // Stall sign.
  const signText = scene.add.text(20, 20, 'WARUNG SARI RASA', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#FFF3D6' });
  signText.setOrigin(0, 0.5);
  const subText = scene.add.text(20, 44, 'Dapur Kilat', { fontFamily: FONT, fontSize: '14px', fontStyle: 'italic', color: '#F2A541' });
  subText.setOrigin(0, 0.5);
  // Shift timer bar + digits.
  const timerBg = scene.add.rectangle(440, 31, 400, 26, 0x4a2e18);
  timerBg.setOrigin(0, 0.5);
  const timerFill = scene.add.rectangle(440, 31, 400, 26, 0xf2a541);
  timerFill.setOrigin(0, 0.5);
  const timerFrame = scene.add.rectangle(640, 31, 400, 26, 0x000000, 0);
  timerFrame.setOrigin(0.5, 0.5);
  timerFrame.setStrokeStyle(2, 0xfff3d6, 1);
  const timerText = scene.add.text(640, 31, '3:00', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#FFFFFF' });
  timerText.setOrigin(0.5, 0.5);
  // Coins + combo.
  const coinsText = scene.add.text(1090, 28, 'Rp 0', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#F5C542' });
  coinsText.setOrigin(1, 0.5);
  const comboText = scene.add.text(1180, 28, '×1', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#FFF3D6' });
  comboText.setOrigin(1, 0.5);
  const comboLabel = scene.add.text(1180, 48, 'kombo', { fontFamily: FONT, fontSize: '12px', color: '#B9A98A' });
  comboLabel.setOrigin(1, 0.5);
  // Sound + pause hints.
  const muteText = scene.add.text(1272, 20, 'M: suara', { fontFamily: FONT, fontSize: '12px', color: '#B9A98A' });
  muteText.setOrigin(1, 0.5);
  const pauseText = scene.add.text(1272, 40, 'P: jeda', { fontFamily: FONT, fontSize: '12px', color: '#B9A98A' });
  pauseText.setOrigin(1, 0.5);
  // Hint bar background + text.
  const hintBg = scene.add.graphics();
  hintBg.fillStyle(0x5c3520, 1);
  hintBg.fillRect(0, 704, 1280, 16);
  const hintText = scene.add.text(640, 712, '', { fontFamily: FONT, fontSize: '12px', color: '#D8CDB8' });
  hintText.setOrigin(0.5, 0.5);
  return {
    timerFill, timerText, coinsText, comboText, muteText, hintText,
    lastTimer: '', lastCoins: -1, lastCombo: '', lastMuted: null, lastHint: '',
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
  if (state.muted !== hud.lastMuted) {
    hud.lastMuted = state.muted;
    hud.muteText.setText(state.muted ? 'M: suara mati' : 'M: suara');
  }
  const hint = state.toast
    ? state.toast.text
    : 'Klik stasiun untuk jalan & masak • 1–3 pilih pesanan • Z–N ambil bahan • Q buang • K buku resep • P jeda';
  if (hint !== hud.lastHint) {
    hud.lastHint = hint;
    hud.hintText.setText(hint);
  }
}
