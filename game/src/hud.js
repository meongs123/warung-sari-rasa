// hud.js — drawTopBar(), drawOrderBoard(), drawHintBar(): HUD + tickets + timer bar.
// No day badge, no goal (Revision 1): coins + combo + timer only.

import { CONFIG, PALETTE, RECIPES, LAYOUT, comboMultiplier, tipRate } from './config.js';
import { timeLeft, rampThird } from './state.js';
import { ZONES } from './zones.js';
import { drawDish, drawIngredient } from './drawfood.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(ctx, x, y, w, h, frac, color, bg = '#3A2A1A') {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * f, h);
  }
}

export function drawTopBar(ctx, state) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = PALETTE.teakDark;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = PALETTE.teak;
  ctx.fillRect(b.x, b.y + b.h - 4, b.w, 4);
  // Stall sign.
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('WARUNG SARI RASA', 20, 26);
  ctx.fillStyle = PALETTE.fire;
  ctx.font = 'italic 14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Dapur Kilat', 20, 50);
  // Shift timer — big warm bar, turns red in the last 30 s, pulses.
  const left = timeLeft(state);
  const frac = left / state.shiftLength;
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60).toString().padStart(2, '0');
  const timerColor = left <= 30 ? PALETTE.chili : PALETTE.fire;
  const pulse = left <= 30 ? 0.75 + 0.25 * Math.sin(state.time * 8) : 1;
  ctx.globalAlpha = pulse;
  bar(ctx, 440, 18, 400, 26, frac, timerColor, '#4A2E18');
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  ctx.strokeRect(440, 18, 400, 26);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${mm}:${ss}`, 640, 32);
  // Coins + combo.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Rp ${state.coins}`, 1090, 28);
  const mult = comboMultiplier(state.combo);
  ctx.fillStyle = mult >= 2 ? PALETTE.gold : PALETTE.cream;
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  const comboText = `×${mult.toFixed(2).replace(/0$/, '')}`;
  ctx.fillText(comboText, 1180, 28);
  ctx.fillStyle = '#B9A98A';
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('kombo', 1180, 50);
  // Sound + pause hints (right-aligned to the canvas edge, not left-aligned
  // from x=1240 — the old code ran the text off the right edge).
  ctx.fillStyle = '#B9A98A';
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(state.muted ? 'M: suara mati' : 'M: suara', 1272, 24);
  ctx.fillText('P: jeda', 1272, 44);
  ctx.textAlign = 'left';
}

export function drawOrderBoard(ctx, state) {
  const b = LAYOUT.board;
  // Wooden board.
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.teakDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PESANAN', b.x + b.w / 2, b.y + 24);
  for (let i = 0; i < 3; i++) {
    const z = ZONES.tickets[i];
    const ticket = state.tickets[i];
    const selected = state.selectedTicket === i && ticket;
    ctx.fillStyle = ticket ? '#FFF8E7' : 'rgba(255,243,214,0.25)';
    roundRect(ctx, z.x, z.y, z.w, z.h, 8);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    if (!ticket) {
      ctx.fillStyle = '#C9B896';
      ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('—', z.x + z.w / 2, z.y + z.h / 2);
      continue;
    }
    const recipe = RECIPES[ticket.dish];
    const frac = Math.max(0, ticket.patience / ticket.maxPatience);
    // Dish icon + name.
    drawDish(ctx, ticket.dish, z.x + 42, z.y + 44, 30);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.name, z.x + 80, z.y + 30);
    ctx.fillStyle = '#7A6A55';
    ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Rp ${recipe.price}${ticket.picky ? ' +25%' : ''}`, z.x + 80, z.y + 50);
    // Picky tag / starred tag.
    let tagY = z.y + 72;
    if (ticket.starred) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('★ Pak Budi', z.x + 80, tagY);
      tagY += 18;
    }
    if (ticket.picky) {
      ctx.fillStyle = PALETTE.chili;
      ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText(ticket.picky.tag, z.x + 80, tagY);
    }
    // Patience bar: green → amber → red, pulses when <25%.
    const pColor = frac > 0.5 ? PALETTE.leaf : frac >= 0.25 ? PALETTE.fire : PALETTE.chili;
    const pulse = frac < 0.25 ? 0.7 + 0.3 * Math.sin(state.time * 10) : 1;
    ctx.globalAlpha = pulse;
    bar(ctx, z.x + 14, z.y + z.h - 34, z.w - 28, 14, frac, pColor, '#E8DCC8');
    ctx.globalAlpha = 1;
    ctx.strokeStyle = PALETTE.teakDark;
    ctx.lineWidth = 1;
    ctx.strokeRect(z.x + 14, z.y + z.h - 34, z.w - 28, 14);
    if (frac < 0.25) {
      ctx.fillStyle = PALETTE.chili;
      ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CEPAT!', z.x + z.w / 2, z.y + z.h - 40);
      ctx.textAlign = 'left';
    }
    // Ingredient dots (what the dish needs).
    const need = recipe.plate;
    need.forEach((c, k) => {
      drawIngredient(ctx, c.kind, c.prep, z.x + 30 + k * 36, z.y + z.h - 52, 12);
    });
    if (recipe.finisher) {
      ctx.fillStyle = '#7A6A55';
      ctx.font = '11px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText(`+ ${recipe.finisher === 'kecap' ? 'Kecap' : recipe.finisher === 'saus' ? 'Saus Kacang' : 'Es Batu'}`, z.x + 14, z.y + z.h - 52);
    }
  }
}

export function drawHintBar(ctx, state) {
  const b = LAYOUT.hintBar;
  ctx.fillStyle = PALETTE.teakDark;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = '#D8CDB8';
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const hint = state.toast
    ? state.toast.text
    : 'Klik stasiun untuk jalan & masak • 1–3 pilih pesanan • Z–N ambil bahan • Q buang • K buku resep • P jeda';
  ctx.fillText(hint, b.w / 2, b.y + 8);
}
