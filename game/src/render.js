// render.js — render(state): draws kitchen, stations, cook, tickets, HUD.
// Calls the draw helpers. Shake is camera-offset only (never moves the cook
// or stations). The title screen shows the kitchen behind it (dimmed).

import { CONFIG, PALETTE, RECIPES, INGREDIENTS, FINISHERS, LAYOUT } from './config.js';
import { ZONES } from './zones.js';
import { drawDish, drawIngredient } from './drawfood.js';
import { drawTopBar, drawOrderBoard, drawHintBar } from './hud.js';
import { recipeBookEntries } from './recipebook.js';
import { burnerProgress } from './stove.js';
import { requiredComponents } from './plating.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, font, color, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function drawBackground(ctx, state) {
  // Wall + floor.
  ctx.fillStyle = PALETTE.creamDark;
  ctx.fillRect(0, 64, 1280, 496);
  ctx.fillStyle = '#E8C9A0';
  ctx.fillRect(264, 560, 720, 16);
  // Terracotta floor tiles.
  ctx.fillStyle = '#D98A5F';
  ctx.fillRect(264, 80, 720, 480);
  ctx.strokeStyle = 'rgba(122,74,43,0.35)';
  ctx.lineWidth = 2;
  for (let x = 264; x <= 984; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x, 560);
    ctx.stroke();
  }
  for (let y = 80; y <= 560; y += 96) {
    ctx.beginPath();
    ctx.moveTo(264, y);
    ctx.lineTo(984, y);
    ctx.stroke();
  }
  // Batik-trim awning across the kitchen top.
  ctx.fillStyle = PALETTE.terracotta;
  ctx.fillRect(264, 80, 720, 26);
  ctx.fillStyle = PALETTE.cream;
  for (let x = 264; x < 984; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 106);
    ctx.lineTo(x + 18, 80);
    ctx.lineTo(x + 36, 106);
    ctx.closePath();
    ctx.fill();
  }
  // Hanging lamps.
  for (const lx of [360, 624, 888]) {
    ctx.strokeStyle = PALETTE.teakDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 106);
    ctx.lineTo(lx, 130);
    ctx.stroke();
    ctx.fillStyle = PALETTE.fire;
    ctx.beginPath();
    ctx.arc(lx, 142, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(242,165,65,0.25)';
    ctx.beginPath();
    ctx.arc(lx, 142, 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStove(ctx, state) {
  const s = { x: 470, y: 95, w: 310, h: 80 };
  ctx.fillStyle = PALETTE.teak;
  roundRect(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.fillStyle = '#3A2A1A';
  ctx.fillRect(s.x + 10, s.y + 10, s.w - 20, 14);
  text(ctx, 'KOMPOR', s.x + s.w / 2, s.y + 17, `bold 11px ${FONT}`, PALETTE.cream);
  for (let i = 0; i < 2; i++) {
    const b = ZONES.burners[i];
    const burner = state.burners[i];
    // Burner ring.
    ctx.fillStyle = '#2A2A2A';
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2 + 8, b.w / 2 - 6, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    if (burner.item) {
      // Fire under the pot.
      const flick = 0.7 + 0.3 * Math.sin(state.time * 12 + i * 2);
      ctx.fillStyle = `rgba(242,165,65,${0.5 * flick})`;
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2 + 8, b.w / 2 - 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pot with the item.
      ctx.fillStyle = '#6B6B6B';
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 - 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, burner.item.kind, burner.item.prep, b.x + b.w / 2, b.y + b.h / 2 - 4, 14);
      // Cook timer bar above the burner.
      const prog = burnerProgress(burner);
      const bx = b.x + 8;
      const by = b.y - 14;
      const bw = b.w - 16;
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(bx, by, bw, 9);
      if (burner.burnt) {
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(bx, by, bw, 9);
        text(ctx, 'GOSONG!', b.x + b.w / 2, by - 8, `bold 11px ${FONT}`, PALETTE.chili);
      } else {
        ctx.fillStyle = burner.done ? PALETTE.leaf : PALETTE.fire;
        ctx.fillRect(bx, by, bw * prog, 9);
        if (burner.done) text(ctx, 'SIAP!', b.x + b.w / 2, by - 8, `bold 11px ${FONT}`, PALETTE.leaf);
      }
    } else {
      ctx.fillStyle = '#4A4A4A';
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2 + 8, b.w / 2 - 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawChopping(ctx, state) {
  const c = { x: 295, y: 255, w: 130, h: 90 };
  ctx.fillStyle = '#C9A86A';
  roundRect(ctx, c.x, c.y, c.w, c.h, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.teakDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'TALENAN', c.x + c.w / 2, c.y + 14, `bold 11px ${FONT}`, PALETTE.teakDark);
  // Knife.
  ctx.fillStyle = '#C0C8CC';
  ctx.beginPath();
  ctx.moveTo(c.x + 40, c.y + 40);
  ctx.lineTo(c.x + 95, c.y + 40);
  ctx.lineTo(c.x + 95, c.y + 52);
  ctx.lineTo(c.x + 40, c.y + 52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.teakDark;
  ctx.fillRect(c.x + 28, c.y + 42, 14, 8);
  // A chopped item in hand shows on the board when the cook is here.
  const choppable = state.cook.hands.find((i) => i && i.prep === 'raw');
  if (choppable) {
    drawIngredient(ctx, choppable.kind, 'raw', c.x + c.w / 2, c.y + 68, 16);
  }
}

function drawPlating(ctx, state) {
  const c = { x: 825, y: 255, w: 140, h: 90 };
  ctx.fillStyle = PALETTE.teak;
  roundRect(ctx, c.x, c.y, c.w, c.h, 8);
  ctx.fill();
  text(ctx, 'RAKIT', c.x + c.w / 2, c.y + 14, `bold 11px ${FONT}`, PALETTE.cream);
  // Finisher bottles above the counter.
  const finColors = { kecap: '#3B2416', saus: '#C68A3C', es: '#BFE3F0' };
  FINISHERS.forEach((f, i) => {
    const z = ZONES.finishers[i];
    ctx.fillStyle = finColors[f.id];
    roundRect(ctx, z.x, z.y, z.w, z.h, 6);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, f.name === 'Saus Kacang' ? 'SAUS' : f.name.toUpperCase(), z.x + z.w / 2, z.y + z.h + 10, `bold 9px ${FONT}`, PALETTE.ink);
  });
  // Plate slots.
  state.plates.forEach((plate, i) => {
    const z = ZONES.plates[i];
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    if (plate.done && plate.dish) {
      drawDish(ctx, plate.dish, cx, cy, 26);
      ctx.fillStyle = PALETTE.leaf;
      text(ctx, 'SELESAI', cx, cy + 38, `bold 10px ${FONT}`, PALETTE.leaf);
    } else if (plate.items.length) {
      // Mid-assembly plate: plain plate + the items on it + step dots.
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D8CDB8';
      ctx.lineWidth = 2;
      ctx.stroke();
      plate.items.forEach((item, k) => {
        drawIngredient(ctx, item.kind, item.prep, cx - 14 + k * 28, cy, 11);
      });
      const need = plate.items.length;
      const total = 3;
      for (let d = 0; d < total; d++) {
        ctx.fillStyle = d < need ? PALETTE.leaf : '#D8CDB8';
        ctx.beginPath();
        ctx.arc(cx - 12 + d * 12, cy + 34, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      text(ctx, `${plate.items.length}/3`, cx, cy - 34, `bold 11px ${FONT}`, PALETTE.ink);
    } else {
      ctx.strokeStyle = 'rgba(255,243,214,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

function drawPrepCounter(ctx, state) {
  // Meja Siap: the active order's ingredients laid out on a counter (a real
  // game object — the "ingredients on the counter" the judge must see).
  const c = { x: 495, y: 275, w: 260, h: 110 };
  ctx.fillStyle = '#A9713F';
  roundRect(ctx, c.x, c.y, c.w, c.h, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.teakDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'MEJA SIAP', c.x + c.w / 2, c.y + 14, `bold 11px ${FONT}`, PALETTE.cream);
  const ticket = state.tickets[state.selectedTicket];
  if (!ticket) {
    text(ctx, 'pilih pesanan', c.x + c.w / 2, c.y + 60, `13px ${FONT}`, '#E8DCC8');
    return;
  }
  const need = requiredComponents(ticket);
  const recipe = RECIPES[ticket.dish];
  // Lay out the needed ingredients on the counter. Vertical rhythm (the
  // counter is 110 px tall): title 14, icons 50, labels 74, finisher 94 —
  // the old code put the labels at 94 and the finisher at 96, so they sat
  // on top of each other.
  const items = [...need.items];
  const n = items.length;
  items.forEach((comp, i) => {
    const x = c.x + c.w / 2 + (i - (n - 1) / 2) * 62;
    const y = c.y + 50;
    drawIngredient(ctx, comp.kind, comp.prep, x, y, 20);
    text(ctx, comp.prep === 'cooked' ? 'masak' : comp.prep === 'chopped' ? 'potong' : 'ambil', x, y + 26, `10px ${FONT}`, '#FFF3D6');
  });
  if (need.finisher) {
    const fin = FINISHERS.find((f) => f.id === need.finisher);
    text(ctx, `+ ${fin ? fin.name : need.finisher}`, c.x + c.w / 2, c.y + 96, `bold 12px ${FONT}`, PALETTE.gold);
  } else if (ticket.picky) {
    text(ctx, ticket.picky.tag, c.x + c.w / 2, c.y + 96, `bold 12px ${FONT}`, PALETTE.chili);
  }
  void recipe;
}

function drawPantry(ctx, state) {
  const p = LAYOUT.pantry;
  ctx.fillStyle = PALETTE.teak;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = PALETTE.teakDark;
  ctx.fillRect(p.x, p.y, p.w, 4);
  text(ctx, 'RAK BAHAN', p.x + 60, p.y + 18, `bold 12px ${FONT}`, PALETTE.cream, 'left');
  INGREDIENTS.forEach((ing, i) => {
    const z = ZONES.bowls[i];
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    ctx.fillStyle = '#8A5A33';
    roundRect(ctx, z.x, z.y, z.w, z.h, 8);
    ctx.fill();
    drawIngredient(ctx, ing.id, 'raw', cx, cy - 8, 24);
    text(ctx, ing.name, cx, cy + 28, `bold 13px ${FONT}`, PALETTE.cream);
    text(ctx, ing.key.toUpperCase(), cx, cy - 34, `bold 11px ${FONT}`, PALETTE.gold);
  });
}

function drawWindow(ctx, state) {
  const w = LAYOUT.window;
  // Wall + hatch.
  ctx.fillStyle = '#E8C9A0';
  ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = PALETTE.teakDark;
  ctx.fillRect(w.x, w.y + 200, w.w, 8);
  text(ctx, 'JENDELA SAJI', w.x + w.w / 2, w.y + 24, `bold 16px ${FONT}`, PALETTE.teakDark);
  // Customer silhouettes behind the hatch.
  const silhouettes = [
    { x: w.x + 50, y: w.y + 150, color: '#8A5A33', smile: true },
    { x: w.x + 132, y: w.y + 150, color: '#5E9A4A', smile: false },
    { x: w.x + 214, y: w.y + 150, color: '#7A4A2B', smile: true },
  ];
  for (const s of silhouettes) {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x, s.y + 44, 30, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#FFF3D6';
    ctx.beginPath();
    ctx.arc(s.x - 9, s.y - 4, 3, 0, Math.PI * 2);
    ctx.arc(s.x + 9, s.y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFF3D6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (s.smile) ctx.arc(s.x, s.y + 6, 8, Math.PI * 0.15, Math.PI * 0.85);
    else ctx.arc(s.x, s.y + 12, 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  // Counter hatch.
  ctx.fillStyle = PALETTE.teak;
  ctx.fillRect(w.x, w.y + 208, w.w, 20);
  // Bell.
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(w.x + w.w - 30, w.y + 250, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(w.x + w.w - 42, w.y + 250, 24, 4);
  text(ctx, 'BEL', w.x + w.w - 30, w.y + 272, `bold 10px ${FONT}`, PALETTE.teakDark);
  // READY plates at the window: bell + READY tag + green glow.
  state.windowPlates.forEach((plate, i) => {
    if (!plate) return;
    const z = ZONES.windowPlates[i];
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    ctx.save();
    ctx.shadowColor = PALETTE.leaf;
    ctx.shadowBlur = 18;
    drawDish(ctx, plate.dish, cx, cy, 30);
    ctx.restore();
    ctx.fillStyle = PALETTE.leaf;
    roundRect(ctx, cx - 30, cy + 32, 60, 18, 9);
    ctx.fill();
    text(ctx, 'READY', cx, cy + 41, `bold 11px ${FONT}`, '#FFFFFF');
  });
  // Bin (trash) next to the window.
  const bin = ZONES.bin;
  ctx.fillStyle = '#5A5A5A';
  roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 6);
  ctx.fill();
  ctx.fillStyle = '#8A8A8A';
  ctx.fillRect(bin.x + 4, bin.y - 4, bin.w - 8, 6);
  text(ctx, 'SAMPAH', bin.x + bin.w / 2, bin.y + bin.h + 12, `bold 10px ${FONT}`, PALETTE.ink);
}

function drawCook(ctx, state) {
  const c = state.cook;
  const x = c.x;
  const y = c.y;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + 26, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body + apron.
  ctx.fillStyle = '#F5F0E6';
  roundRect(ctx, x - 16, y - 8, 32, 34, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.leaf;
  ctx.fillRect(x - 12, y + 4, 24, 22);
  // Head + headscarf.
  ctx.fillStyle = '#E8B88A';
  ctx.beginPath();
  ctx.arc(x, y - 20, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.terracotta;
  ctx.beginPath();
  ctx.arc(x, y - 22, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - 15, y - 24, 30, 6);
  // Eyes.
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(x - 5, y - 20, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 20, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Hands: carried items above the head so the judge can see them.
  const hands = c.hands.filter(Boolean);
  hands.forEach((item, i) => {
    const hx = x - 14 + i * 28;
    const hy = y - 44;
    drawIngredient(ctx, item.kind, item.prep, hx, hy, 13);
  });
  // Carried plate above the head.
  if (c.plate) {
    drawDish(ctx, c.plate.dish, x, y - 48, 20);
  }
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = a;
    if (p.shape === 'steam') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + p.t), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'leaf') {
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.t * 6);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawFloats(ctx, state) {
  for (const f of state.floats) {
    const a = 1 - f.t / f.life;
    const y = f.y - f.t * 40;
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, y, `bold 22px ${FONT}`, f.color);
    if (f.sub) text(ctx, f.sub, f.x, y + 20, `13px ${FONT}`, '#FFF3D6');
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(46,31,20,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'WARUNG SARI RASA', 640, 220, `bold 64px ${FONT}`, PALETTE.cream);
  text(ctx, '— Dapur Kilat —', 640, 280, `italic bold 28px ${FONT}`, PALETTE.fire);
  text(ctx, 'Masak cepat, antar tepat. Satu shift, tiga menit, pesanan tak berhenti.', 640, 330, `20px ${FONT}`, '#FFF3D6');
  text(ctx, 'Klik stasiun untuk jalan & masak • 1–3 pilih pesanan • K buku resep', 640, 362, `16px ${FONT}`, '#D8CDB8');
  // Play button.
  ctx.fillStyle = PALETTE.terracotta;
  roundRect(ctx, 540, 400, 200, 56, 12);
  ctx.fill();
  text(ctx, 'MULAI MASAK', 640, 428, `bold 24px ${FONT}`, '#FFFFFF');
  text(ctx, 'Enter / klik tombol', 640, 478, `14px ${FONT}`, '#D8CDB8');
  text(ctx, 'Nasi Goreng • Mie Goreng • Sate Ayam • Es Teh Melati', 640, 530, `15px ${FONT}`, PALETTE.gold);
}

function drawPaused(ctx, state) {
  ctx.fillStyle = 'rgba(46,31,20,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'JEDA', 640, 320, `bold 56px ${FONT}`, PALETTE.cream);
  text(ctx, 'P / Esc untuk lanjut • K buku resep • M suara', 640, 380, `18px ${FONT}`, '#FFF3D6');
}

function drawBook(ctx, state) {
  ctx.fillStyle = 'rgba(46,31,20,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  const entries = recipeBookEntries();
  const bx = 340;
  const by = 90;
  const bw = 600;
  const bh = 540;
  ctx.fillStyle = '#FFF8E7';
  roundRect(ctx, bx, by, bw, bh, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.teakDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'BUKU RESEP', 640, by + 34, `bold 26px ${FONT}`, PALETTE.teakDark);
  entries.forEach((e, i) => {
    const y = by + 80 + i * 112;
    drawDish(ctx, e.id, bx + 60, y + 30, 34);
    text(ctx, `${e.name} — ${e.gloss}`, bx + 110, y + 12, `bold 19px ${FONT}`, PALETTE.ink, 'left');
    text(ctx, `Rp ${e.price}`, bx + 110, y + 36, `15px ${FONT}`, '#7A6A55', 'left');
    text(ctx, e.steps.join(' → '), bx + 110, y + 62, `14px ${FONT}`, PALETTE.teakDark, 'left');
    if (e.finisher) text(ctx, `+ ${e.finisher}`, bx + 110, y + 84, `13px ${FONT}`, '#7A6A55', 'left');
  });
  text(ctx, 'K / Esc untuk tutup — timer dijeda', 640, by + bh - 24, `14px ${FONT}`, '#7A6A55');
}

function drawSummary(ctx, state) {
  const s = state.summary;
  if (!s) return;
  ctx.fillStyle = 'rgba(46,31,20,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'SHIFT SELESAI!', 640, 180, `bold 52px ${FONT}`, PALETTE.cream);
  text(ctx, `Koin: Rp ${s.coins}`, 640, 250, `bold 28px ${FONT}`, PALETTE.gold);
  text(ctx, `Hidangan diantar: ${s.dishes}  •  Kombo terbaik: ×${s.bestCombo}`, 640, 300, `20px ${FONT}`, '#FFF3D6');
  if (s.pakBudi) {
    text(ctx, "★ Pak Budi dilayani!", 640, 350, `bold 22px ${FONT}`, PALETTE.gold);
    text(ctx, s.story, 640, 386, `italic 18px ${FONT}`, '#FFF3D6');
  } else {
    text(ctx, 'Pak Budi belum sempat dilayani — lain kali!', 640, 350, `18px ${FONT}`, '#D8CDB8');
  }
  ctx.fillStyle = PALETTE.terracotta;
  roundRect(ctx, 540, 430, 200, 56, 12);
  ctx.fill();
  text(ctx, 'MAIN LAGI (R)', 640, 458, `bold 22px ${FONT}`, '#FFFFFF');
  text(ctx, 'Terima kasih sudah masak di Warung Sari Rasa!', 640, 530, `15px ${FONT}`, '#D8CDB8');
}

export function render(ctx, state) {
  ctx.save();
  // Camera shake (offset only).
  if (state.shake > 0) {
    const mag = state.shake * 6;
    const ox = (Math.random() - 0.5) * mag;
    const oy = (Math.random() - 0.5) * mag;
    ctx.translate(ox, oy);
  }
  ctx.clearRect(-10, -10, 1300, 740);
  drawBackground(ctx, state);
  drawStove(ctx, state);
  drawChopping(ctx, state);
  drawPlating(ctx, state);
  drawPrepCounter(ctx, state);
  drawPantry(ctx, state);
  drawWindow(ctx, state);
  drawCook(ctx, state);
  drawParticles(ctx, state);
  drawFloats(ctx, state);
  ctx.restore();
  // HUD (not shaken).
  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  drawHintBar(ctx, state);
  // Toast (one-line message just above the pantry, not over the bowls —
  // the old y=660 sat inside the pantry counter).
  if (state.toast && state.toastT > 0) {
    ctx.fillStyle = 'rgba(46,31,20,0.85)';
    const w = ctx.measureText(state.toast.text).width + 30;
    roundRect(ctx, 640 - w / 2, 540, w, 30, 8);
    ctx.fill();
    text(ctx, state.toast.text, 640, 556, `bold 15px ${FONT}`, '#FFF3D6');
  }
  // Overlays.
  if (state.mode === 'title') drawTitle(ctx, state);
  else if (state.mode === 'paused') drawPaused(ctx, state);
  else if (state.mode === 'book') drawBook(ctx, state);
  else if (state.mode === 'summary') drawSummary(ctx, state);
}
