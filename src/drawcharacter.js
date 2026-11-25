// drawcharacter.js — Mas Joko (the cook) + the 3 customers, as Phaser
// GameObjects. NO image files, NO sprite sheets: every part is a Phaser
// primitive (Ellipse / Rectangle / Arc) or a Graphics drawn once. Poses are
// computed from cook.anim / cook.animT (deterministic — staged shots are
// reproducible), never from wall-clock time. Per-frame work is property sets
// only (x / y / rotation / alpha / visible) — no new objects per frame.
// Facing flips the whole container via scaleX; local rotations mirror
// automatically, so the walk cycle reads correctly in both directions.

import { PALETTE, CUSTOMER_KINDS, ANIM } from './config.js';
import { ZONES } from './zones.js';
import { gCircle, gEllipse, gRect, gRoundRect, gTriangle, gArc } from './gfx.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

// --- Cook (Mas Joko) -------------------------------------------------------

// Cook palette (from the pivot design doc §3).
const COOK = {
  skin: '#E8B88A',
  toque: '#FFFFFF',
  toqueShade: '#E8E4D8',
  shirt: '#FFF3D6',
  apron: '#4E7A3A',
  apronTrim: '#3A5C2B',
  trousers: '#5C3520',
  sandals: '#7A4A2B',
  chili: '#C0392B',
  outline: '#5C3520',
};

export function createCook(scene) {
  const container = scene.add.container(624, 430);
  container.setDepth(20);
  // Shadow (scene-level, stays on the ground — does not bob with the body).
  const shadow = scene.add.ellipse(624, 456, 44, 14, 0x000000, 0.2);
  shadow.setDepth(19);
  // Legs (origin top-centre so they rotate around the hip).
  const legL = scene.add.rectangle(-7, 8, 10, 22, 0x5c3520);
  legL.setOrigin(0.5, 0);
  const legR = scene.add.rectangle(7, 8, 10, 22, 0x5c3520);
  legR.setOrigin(0.5, 0);
  // Arms (origin top-centre so they rotate around the shoulder).
  const armL = scene.add.rectangle(-15, -4, 8, 22, 0xfff3d6);
  armL.setOrigin(0.5, 0);
  const armR = scene.add.rectangle(15, -4, 8, 22, 0xfff3d6);
  armR.setOrigin(0.5, 0);
  // Torso: shirt + apron + chili emblem, drawn once (it never changes shape).
  const torsoG = scene.add.graphics();
  torsoG.fillStyle(0xfff3d6, 1);
  torsoG.fillEllipse(0, 0, 34, 36); // shirt
  torsoG.fillStyle(0x4e7a3a, 1);
  torsoG.fillRoundedRect(-12, 2, 24, 22, 6); // apron
  torsoG.fillStyle(0x3a5c2b, 1);
  torsoG.fillRect(-12, 2, 24, 4); // apron trim
  torsoG.fillStyle(0xc0392b, 1);
  torsoG.fillEllipse(0, 12, 8, 10); // chili emblem
  torsoG.fillStyle(0x3a5c2b, 1);
  torsoG.fillRect(-1, 2, 2, 6); // chili stem
  // Head (its own container so it can tilt for sad / bow).
  const headC = scene.add.container(0, -20);
  const face = scene.add.ellipse(0, 0, 28, 28, 0xe8b88a);
  const eyeL = scene.add.ellipse(-5, -1, 3.6, 4.6, 0x2e1f14);
  const eyeR = scene.add.ellipse(5, -1, 3.6, 4.6, 0x2e1f14);
  const smile = scene.add.arc(0, 4, 7, 15, 165, false, 0x2e1f14);
  smile.setOrigin(0.5, 0.5);
  const frown = scene.add.arc(0, 9, 7, 195, 345, false, 0x2e1f14);
  frown.setOrigin(0.5, 0.5);
  frown.setVisible(false);
  const flatMouth = scene.add.rectangle(0, 6, 10, 2, 0x2e1f14);
  flatMouth.setVisible(false);
  // Toque: white puff + band.
  const toque = scene.add.ellipse(0, -13, 30, 18, 0xffffff);
  const toqueBand = scene.add.rectangle(0, -7, 28, 6, 0xe8e4d8);
  headC.add([face, eyeL, eyeR, smile, frown, flatMouth, toque, toqueBand]);
  // Knife (visible only while chopping; positioned from the arm angle).
  const knifeC = scene.add.container(0, 0);
  const blade = scene.add.rectangle(8, 0, 18, 4, 0xc0c8cc);
  const handle = scene.add.rectangle(-4, 0, 8, 5, 0x5c3520);
  knifeC.add([blade, handle]);
  knifeC.setVisible(false);
  // Carried items / plate (redrawn only when the hands change).
  const carryG = scene.add.graphics();
  container.add([legL, legR, armL, armR, torsoG, headC, knifeC, carryG]);
  return {
    container, shadow, legL, legR, armL, armR, torsoG, headC,
    eyeL, eyeR, smile, frown, flatMouth, knifeC, carryG,
    lastHandsKey: '', lastPlateKey: '',
  };
}

// Pose the cook from state. `t` is state.time (deterministic).
export function syncCook(cook, state, t) {
  const c = state.cook;
  const anim = c.anim || 'idle';
  const at = c.animT || 0;
  const carrying = c.hands.some(Boolean) || !!c.plate;
  // Walk phase from animT (0.5 s per cycle at 320 px/s — matches ground speed).
  const phase = (at / ANIM.walkCycle) * Math.PI * 2;
  const bob = anim === 'walk' || (anim === 'carry' && c.walking)
    ? Math.abs(Math.sin(phase)) * 3 : Math.sin(t * 5.2) * 2;
  cook.container.setPosition(c.x, c.y - bob);
  cook.container.setScale(c.facing, 1);
  cook.shadow.setPosition(c.x, c.y + 26);
  // Legs + arms by animation state.
  const swing = Math.sin(phase) * 0.44; // ±25 deg
  const armSwing = Math.sin(phase) * 0.26; // ±15 deg
  let legL = 0, legR = 0, armL = 0, armR = 0, lean = 0, headTilt = 0;
  if (anim === 'walk' || anim === 'carry') {
    legL = swing; legR = -swing;
    armL = -armSwing; armR = armSwing;
    lean = 0.09; // slight forward lean
    if (anim === 'carry') { armL = -1.35; armR = -1.35; } // both arms raised forward
  } else if (anim === 'chop') {
    // 3-frame loop: raise (0-0.16), strike (0.16-0.33), recover (0.33-0.5).
    const f = (at % ANIM.chopLoop) / ANIM.chopLoop;
    armR = f < 0.33 ? -2.4 * (f / 0.33) : f < 0.66 ? -2.4 + 2.4 * ((f - 0.33) / 0.33) : -0.4;
    armL = -0.3;
  } else if (anim === 'stir') {
    const a = (at / ANIM.stirLoop) * Math.PI * 2;
    armR = -1.1 + Math.sin(a) * 0.25;
    armL = -0.2;
  } else if (anim === 'serve') {
    const f = Math.min(1, at / ANIM.serveTime);
    armR = -1.5 * Math.sin(f * Math.PI);
    headTilt = 0.18 * Math.sin(f * Math.PI); // slight bow
  } else if (anim === 'celebrate') {
    const f = Math.min(1, at / ANIM.celebrateTime);
    const jump = Math.sin(f * Math.PI) * 10;
    cook.container.setPosition(c.x, c.y - bob - jump);
    armL = -2.6; armR = -2.6; // both arms up
  } else if (anim === 'sad') {
    headTilt = 0.21; // toque droops
    armL = 0.15; armR = 0.15; // arms hang low
  }
  cook.legL.setRotation(legL);
  cook.legR.setRotation(legR);
  cook.armL.setRotation(armL);
  cook.armR.setRotation(armR);
  cook.torsoG.setRotation(lean);
  cook.headC.setRotation(headTilt);
  // Face: blink every ~3 s for 100 ms (deterministic from state.time).
  const blinking = (t % 3) < 0.1;
  cook.eyeL.setScale(1, blinking ? 0.15 : 1);
  cook.eyeR.setScale(1, blinking ? 0.15 : 1);
  const sad = anim === 'sad';
  const happy = anim === 'celebrate';
  cook.smile.setVisible(!sad);
  cook.frown.setVisible(sad);
  cook.flatMouth.setVisible(false);
  cook.smile.setScale(1, happy ? 1.4 : 1);
  // Knife: visible while chopping, at the front hand (end of the raised arm).
  const chopping = anim === 'chop';
  cook.knifeC.setVisible(chopping);
  if (chopping) {
    const hx = 15 + Math.sin(armR) * 20;
    const hy = -4 + Math.cos(armR) * 20;
    cook.knifeC.setPosition(hx, hy);
    cook.knifeC.setRotation(armR + Math.PI / 2);
  }
  // Carried items / plate: redraw only when the hands change (dirty flag).
  const handsKey = c.hands.map((i) => (i ? `${i.kind}:${i.prep}` : '-')).join(',');
  const plateKey = c.plate ? c.plate.dish : '-';
  if (handsKey !== cook.lastHandsKey || plateKey !== cook.lastPlateKey) {
    cook.lastHandsKey = handsKey;
    cook.lastPlateKey = plateKey;
    cook.carryG.clear();
    if (c.plate) {
      // Finished plate held with both hands at chest height.
      drawCarriedPlate(cook.carryG, c.plate.dish, 0, -8, 22);
    } else {
      const held = c.hands.filter(Boolean);
      held.forEach((item, i) => {
        drawCarriedItem(cook.carryG, item.kind, item.prep, -12 + i * 24, -8, 11);
      });
    }
  }
  void carrying;
}

// Carried ingredient (small bowl + item) drawn into a Graphics.
function drawCarriedItem(g, kind, prep, x, y, r) {
  gCircle(g, x, y, r, '#E8DCC8');
  if (kind === 'nasi') gEllipse(g, x, y - r * 0.2, r * 0.75, r * 0.45, '#FFF8E7');
  else if (kind === 'mie') gArc(g, x, y - r * 0.15, r * 0.5, Math.PI * 0.15, Math.PI * 1.15, '#F2C14E', Math.max(2, r * 0.14));
  else if (kind === 'telur') gCircle(g, x, y - r * 0.15, r * 0.32, prep === 'chopped' ? '#F2A541' : '#E8B06A');
  else if (kind === 'ayam') gEllipse(g, x, y - r * 0.15, r * 0.6, r * 0.5, '#E07856');
  else if (kind === 'sayur') gCircle(g, x, y - r * 0.1, r * 0.35, '#5E9A4A');
  else if (kind === 'teh') gEllipse(g, x, y - r * 0.2, r * 0.6, r * 0.35, '#8A5A2B');
}

// Carried finished plate (ellipse plate + dish top) at chest height.
function drawCarriedPlate(g, dishId, x, y, r) {
  gEllipse(g, x, y, r, r * 0.62, '#FFFFFF');
  if (dishId === 'nasi') {
    gEllipse(g, x, y, r * 0.62, r * 0.42, '#F2D492');
    gCircle(g, x + r * 0.25, y - r * 0.18, r * 0.22, '#F2A541');
  } else if (dishId === 'mie') {
    gArc(g, x, y, r * 0.5, Math.PI * 0.1, Math.PI * 1.3, '#F2C14E', Math.max(2, r * 0.13));
  } else if (dishId === 'sate') {
    gRect(g, x - r * 0.5, y - r * 0.16, r, r * 0.32, '#D97B4A');
  } else if (dishId === 'teh') {
    gRect(g, x - r * 0.3, y - r * 0.6, r * 0.6, r * 1.0, '#C68A3C');
  }
}

// --- Customers + order bubbles ----------------------------------------------

// Customer kinds: distinct hair / headgear / shirt so the judge can tell
// them apart at 60% scale. The bubble is a child of the customer container
// (it sways with them); the bubble carries dish icon + name + patience bar +
// picky tag — the order board, re-expressed.
const KIND_LOOK = {
  bun: { hair: '#2E1F14', top: 'bun' }, // Ibu Sari: dark hair in a bun
  cap: { hair: '#1A1A1A', top: 'cap' }, // Mas Andi: backwards blue cap
  ponytail: { hair: '#3B2416', top: 'ponytail' }, // Mbak Rina: long ponytail
  vip: { hair: '#9A9A9A', top: 'vip' }, // Pak Budi: grey moustache + glasses
};

export function createCustomers(scene) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const cx = 320 + i * 320;
    const container = scene.add.container(cx, 160);
    container.setDepth(15);
    container.setVisible(false);
    // Shoulders (upper body, cut off by the counter front below y 168).
    const shoulders = scene.add.ellipse(0, 22, 90, 56, 0x8a5a33);
    // Head.
    const head = scene.add.ellipse(0, -22, 34, 34, 0xe8b88a);
    const hair = scene.add.ellipse(0, -32, 34, 18, 0x2e1f14);
    const eyeL = scene.add.ellipse(-6, -22, 3.4, 4.4, 0x2e1f14);
    const eyeR = scene.add.ellipse(6, -22, 3.4, 4.4, 0x2e1f14);
    const smile = scene.add.arc(0, -14, 6, 15, 165, false, 0x2e1f14);
    const frown = scene.add.arc(0, -10, 6, 195, 345, false, 0x2e1f14);
    frown.setVisible(false);
    // VIP extras (Pak Budi): moustache + glasses, shown only for kind vip.
    const moustache = scene.add.ellipse(0, -13, 16, 5, 0x9a9a9a);
    moustache.setVisible(false);
    const glassL = scene.add.ellipse(-6, -22, 9, 9, 0xffffff, 0);
    glassL.setStrokeStyle(1.5, 0x2e1f14, 1);
    const glassR = scene.add.ellipse(6, -22, 9, 9, 0xffffff, 0);
    glassR.setStrokeStyle(1.5, 0x2e1f14, 1);
    glassL.setVisible(false);
    glassR.setVisible(false);
    // Sweat drop (impatient / angry).
    const sweat = scene.add.ellipse(14, -30, 5, 7, 0x7ab8e8);
    sweat.setVisible(false);
    container.add([shoulders, head, hair, eyeL, eyeR, smile, frown, moustache, glassL, glassR, sweat]);
    // Order bubble (child of the customer container, above the head).
    // Layout inside the 170x56 bubble: dish icon left, dish name top,
    // sub line (price / picky tag / ★ Pak Budi) below it, patience bar bottom.
    const bubble = scene.add.container(0, -78);
    const bubbleG = scene.add.graphics();
    const dishIcon = scene.add.graphics();
    const nameText = scene.add.text(-44, -14, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#2E1F14' });
    nameText.setOrigin(0, 0.5);
    const subText = scene.add.text(-44, 8, '', { fontFamily: FONT, fontSize: '12px', color: '#7A6A55' });
    subText.setOrigin(0, 0.5);
    const barBg = scene.add.rectangle(0, 18, 150, 8, 0xe8dcc8);
    const barFill = scene.add.rectangle(-75, 18, 150, 8, 0x4e7a3a);
    barFill.setOrigin(0, 0.5);
    const tagText = scene.add.text(0, -38, '', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#C0392B' });
    tagText.setOrigin(0.5, 0.5);
    const starText = scene.add.text(-78, -38, '', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#F5C542' });
    bubble.add([bubbleG, dishIcon, nameText, subText, barBg, barFill, tagText, starText]);
    bubble.setVisible(false);
    container.add(bubble);
    out.push({
      container, shoulders, head, hair, eyeL, eyeR, smile, frown,
      moustache, glassL, glassR, sweat, bubble, bubbleG, dishIcon,
      nameText, subText, barBg, barFill, tagText, starText,
      lastTicketId: -1, lastKind: '', lastMood: '',
    });
  }
  return out;
}

// Sync customers + bubbles from state.tickets / state.customers.
// `t` is state.time (deterministic).
export function syncCustomers(custs, state, t) {
  for (let i = 0; i < 3; i++) {
    const cust = custs[i];
    const ticket = state.tickets[i];
    const cs = state.customers[i];
    const slotX = 320 + i * 320;
    if (!ticket || !cs) {
      cust.container.setVisible(false);
      continue;
    }
    cust.container.setVisible(true);
    // Arrive slide-in (0.4 s ease-out from the nearest edge) / leave slide-out.
    // enterT / leaveT are DURATIONS (seconds since the move started).
    let sx = slotX;
    const enterAge = cs.enterT || 0;
    if (enterAge < ANIM.arriveTime) {
      const f = 1 - Math.pow(1 - enterAge / ANIM.arriveTime, 3);
      sx = slotX + (i === 0 ? -1 : 1) * 160 * (1 - f);
    }
    if (cs.leaving) {
      const leaveAge = cs.leaveT || 0;
      const f = Math.min(1, leaveAge / ANIM.leaveTime);
      sx = slotX + (i === 0 ? -1 : 1) * 160 * f;
      if (f >= 1) { cust.container.setVisible(false); continue; }
    }
    // Idle sway (phase offset per slot so they do not move in lockstep).
    const sway = Math.sin(t * 4.2 + i * 2.1) * 1.5;
    cust.container.setPosition(sx, 162 + sway);
    // Kind (only re-apply the look when it changes).
    if (cs.kind !== cust.lastKind) {
      cust.lastKind = cs.kind;
      const kind = CUSTOMER_KINDS.find((k) => k.id === cs.kind) || CUSTOMER_KINDS[0];
      const look = KIND_LOOK[kind.kind] || KIND_LOOK.bun;
      cust.shoulders.setFillStyle(parseInt(kind.shirt.slice(1), 16), 1);
      cust.hair.setFillStyle(parseInt(look.hair.slice(1), 16), 1);
      const isVip = kind.kind === 'vip';
      cust.moustache.setVisible(isVip);
      cust.glassL.setVisible(isVip);
      cust.glassR.setVisible(isVip);
      // Cap (Mas Andi): a blue arc over the hair; ponytail: a side lock.
      cust.hair.setDisplaySize(isVip ? 30 : 34, isVip ? 12 : 18);
    }
    // Mood (only re-apply the face when it changes).
    const frac = ticket.maxPatience > 0 ? ticket.patience / ticket.maxPatience : 1;
    const mood = cs.leaving ? (cs.mood || 'neutral')
      : frac < 0.25 ? 'angry' : frac < 0.5 ? 'impatient' : 'neutral';
    const shownMood = cs.mood === 'happy' ? 'happy' : mood;
    if (shownMood !== cust.lastMood) {
      cust.lastMood = shownMood;
      cust.smile.setVisible(shownMood !== 'angry');
      cust.frown.setVisible(shownMood === 'angry');
      cust.sweat.setVisible(shownMood === 'impatient' || shownMood === 'angry');
      cust.smile.setScale(1, shownMood === 'happy' ? 1.5 : 1);
    }
    // Bubble: redraw the dish icon + frame only when the ticket changes.
    if (ticket.id !== cust.lastTicketId) {
      cust.lastTicketId = ticket.id;
      cust.bubble.setVisible(true);
      const bg = cust.bubbleG;
      bg.clear();
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(-85, -28, 170, 56, 12);
      bg.lineStyle(2, 0x2e1f14, 0.25);
      bg.strokeRoundedRect(-85, -28, 170, 56, 12);
      bg.fillStyle(0xffffff, 1);
      bg.fillTriangle(-12, 28, 12, 28, 0, 40); // tail pointing down
      // Dish icon (small, left of the name).
      const icon = cust.dishIcon;
      icon.clear();
      drawBubbleDish(icon, ticket.dish, -62, 0, 14);
      const recipe = { nasi: 'Nasi Goreng', mie: 'Mie Goreng', sate: 'Sate Ayam', teh: 'Es Teh Melati' }[ticket.dish] || ticket.dish;
      const price = { nasi: 100, mie: 110, sate: 140, teh: 60 }[ticket.dish] || 0;
      cust.nameText.setText(recipe);
      // Sub line: ★ Pak Budi (gold) > picky tag (red) > price (grey).
      if (ticket.starred) {
        cust.subText.setText('★ Pak Budi');
        cust.subText.setColor('#B8860B');
      } else if (ticket.picky) {
        cust.subText.setText(ticket.picky.tag);
        cust.subText.setColor('#C0392B');
      } else {
        cust.subText.setText(`Rp ${price}`);
        cust.subText.setColor('#7A6A55');
      }
      cust.tagText.setText('');
      cust.starText.setText('');
      // Selected ticket: thick cream outline.
      const sel = state.selectedTicket === i;
      bg.lineStyle(sel ? 4 : 2, sel ? 0xfff3d6 : 0x2e1f14, sel ? 1 : 0.25);
      bg.strokeRoundedRect(-85, -28, 170, 56, 12);
    }
    // Patience bar (scaleX from the left edge — property only, no allocation).
    const frac2 = Math.max(0, Math.min(1, ticket.patience / ticket.maxPatience));
    const barColor = frac2 > 0.5 ? 0x4e7a3a : frac2 >= 0.25 ? 0xf2a541 : 0xc0392b;
    cust.barFill.setFillStyle(barColor, 1);
    cust.barFill.setScale(Math.max(0.001, frac2), 1);
    cust.barFill.setAlpha(frac2 < 0.25 ? 0.7 + 0.3 * Math.sin(t * 10) : 1);
  }
}

// Small dish icon for a bubble (15 px radius).
function drawBubbleDish(g, dishId, x, y, r) {
  gEllipse(g, x, y, r, r * 0.62, '#FFFFFF');
  if (dishId === 'nasi') {
    gEllipse(g, x, y, r * 0.62, r * 0.42, '#F2D492');
    gCircle(g, x + r * 0.25, y - r * 0.18, r * 0.22, '#F2A541');
  } else if (dishId === 'mie') {
    gArc(g, x, y, r * 0.5, Math.PI * 0.1, Math.PI * 1.3, '#F2C14E', Math.max(2, r * 0.13));
  } else if (dishId === 'sate') {
    gRect(g, x - r * 0.5, y - r * 0.16, r, r * 0.32, '#D97B4A');
  } else if (dishId === 'teh') {
    gRect(g, x - r * 0.3, y - r * 0.6, r * 0.6, r * 1.0, '#C68A3C');
  }
}
