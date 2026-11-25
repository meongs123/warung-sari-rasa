// warung-sari-rasa v3.0 — drawcharacter.js
import { PALETTE, CUSTOMER_KINDS, ANIM } from './config.js';
import { ZONES } from './zones.js';
import { eventActive } from './events.js';
import { gCircle, gEllipse, gRect, gRoundRect, gTriangle, gArc, gLine } from './gfx.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

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
  const container = scene.add.container(624, 600);
  container.setDepth(20);

  const shadow = scene.add.ellipse(624, 626, 44, 14, 0x000000, 0.2);
  shadow.setDepth(19);

  // M3 — true side profile: legs near the body centre, far leg slightly back.
  const legL = scene.add.rectangle(-3, 8, 9, 22, 0x5c3520);
  legL.setOrigin(0.5, 0);
  const legR = scene.add.rectangle(4, 8, 9, 22, 0x5c3520);
  legR.setOrigin(0.5, 0);

  // M3 — side view arms: both hang at the body's side, not spread wide.
  // armL = far arm (darker, at the back/shirt), armR = near arm (front edge).
  const armL = scene.add.rectangle(-6, -8, 7, 22, 0xe8dcc8);
  armL.setOrigin(0.5, 0);
  const armR = scene.add.rectangle(11, -8, 8, 22, 0xfff3d6);
  armR.setOrigin(0.5, 0);

  const torsoG = scene.add.graphics();
  // M3 — side-on torso: narrower than the front view (shoulder width unseen).
  torsoG.fillStyle(0xfff3d6, 1);
  torsoG.fillEllipse(0, 0, 24, 36);
  // Apron edge-on: on the FRONT (facing) side of the torso, not the chest centre.
  torsoG.fillStyle(0x4e7a3a, 1);
  torsoG.fillRoundedRect(-2, 2, 14, 22, 6);
  torsoG.fillStyle(0x3a5c2b, 1);
  torsoG.fillRect(-2, 2, 14, 4);
  // Chili emblem on the apron's side, low on the apron so the arms clear it.
  torsoG.fillStyle(0xc0392b, 1);
  torsoG.fillEllipse(5, 18, 7, 9);
  torsoG.fillStyle(0x3a5c2b, 1);
  torsoG.fillRect(4, 13, 2, 5);

  const headC = scene.add.container(0, -20);
  // M3 — TRUE SIDE PROFILE (facing right; the container flip mirrors it left).
  // Silhouette: forehead, nose BREAKING the face outline, lips, chin, round back.
  const faceG = scene.add.graphics();
  faceG.fillStyle(0xe8b88a, 1);
  faceG.fillPoints([
    { x: -6, y: -14 }, { x: 6, y: -13 }, { x: 10, y: -8 }, { x: 11, y: -4 },
    { x: 12, y: -1 }, { x: 17, y: 2 }, { x: 12, y: 5 }, { x: 11, y: 8 },
    { x: 9, y: 11 }, { x: 7, y: 13 }, { x: 0, y: 14 }, { x: -8, y: 12 },
    { x: -13, y: 4 }, { x: -13, y: -6 }, { x: -10, y: -12 },
  ], true);
  // ONE eye only, set back from the nose bridge (the far eye is unseen).
  const eye = scene.add.ellipse(6, -2, 3.6, 4.6, 0x2e1f14);
  // Profile mouth: a small curve at the front, under the nose.
  const smile = scene.add.arc(7, 8, 3.5, 15, 165, false, 0x2e1f14);
  smile.setOrigin(0.5, 0.5);
  const frown = scene.add.arc(7, 11, 3.5, 195, 345, false, 0x2e1f14);
  frown.setOrigin(0.5, 0.5);
  frown.setVisible(false);
  const flatMouth = scene.add.rectangle(7, 8, 7, 2, 0x2e1f14);
  flatMouth.setVisible(false);
  // Toque in profile: swept back, front edge above the forehead.
  const toque = scene.add.ellipse(-2, -14, 30, 17, 0xffffff);
  const toqueBand = scene.add.rectangle(-2, -8, 28, 6, 0xe8e4d8);
  headC.add([faceG, eye, smile, frown, flatMouth, toque, toqueBand]);

  const knifeC = scene.add.container(0, 0);
  const blade = scene.add.rectangle(8, 0, 18, 4, 0xc0c8cc);
  const handle = scene.add.rectangle(-4, 0, 8, 5, 0x5c3520);
  knifeC.add([blade, handle]);
  knifeC.setVisible(false);

  const carryG = scene.add.graphics();
  // Layer order: far arm behind the torso, near arm in front of it (side view).
  container.add([legL, legR, armL, torsoG, armR, headC, knifeC, carryG]);
  return {
    container, shadow, legL, legR, armL, armR, torsoG, headC,
    eye, smile, frown, flatMouth, knifeC, carryG,
    lastHandsKey: '', lastPlateKey: '',
  };
}

export function syncCook(cook, state, t) {
  const c = state.cook;
  const anim = c.anim || 'idle';
  const at = c.animT || 0;
  const carrying = c.hands.some(Boolean) || !!c.plate;

  const phase = (at / ANIM.walkCycle) * Math.PI * 2;
  const bob = anim === 'walk' || (anim === 'carry' && c.walking)
    ? Math.abs(Math.sin(phase)) * 3 : Math.sin(t * 5.2) * 2;
  cook.container.setPosition(c.x, c.y - bob);
  cook.container.setScale(c.facing, 1);
  cook.shadow.setPosition(c.x, c.y + 26);

  const swing = Math.sin(phase) * 0.44;
  const armSwing = Math.sin(phase) * 0.26;
  let legL = 0, legR = 0, armL = 0, armR = 0, lean = 0, headTilt = 0;
  if (anim === 'walk' || anim === 'carry') {
    legL = swing; legR = -swing;
    armL = -armSwing; armR = armSwing;
    lean = 0.09;
    if (anim === 'carry') { armL = -1.35; armR = -1.35; }
  } else if (anim === 'chop') {

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
    headTilt = 0.18 * Math.sin(f * Math.PI);
  } else if (anim === 'celebrate') {
    const f = Math.min(1, at / ANIM.celebrateTime);
    const jump = Math.sin(f * Math.PI) * 10;
    cook.container.setPosition(c.x, c.y - bob - jump);
    armL = -2.6; armR = -2.6;
  } else if (anim === 'sad') {
    headTilt = 0.21;
    armL = 0.15; armR = 0.15;
  }
  cook.legL.setRotation(legL);
  cook.legR.setRotation(legR);
  cook.armL.setRotation(armL);
  cook.armR.setRotation(armR);
  cook.torsoG.setRotation(lean);
  cook.headC.setRotation(headTilt);

  const blinking = (t % 3) < 0.1;
  // M3: a single side eye — it blinks, the (unseen) far eye does not exist.
  cook.eye.setScale(1, blinking ? 0.15 : 1);
  const sad = anim === 'sad';
  const happy = anim === 'celebrate';
  cook.smile.setVisible(!sad);
  cook.frown.setVisible(sad);
  cook.flatMouth.setVisible(false);
  cook.smile.setScale(1, happy ? 1.4 : 1);

  const chopping = anim === 'chop';
  cook.knifeC.setVisible(chopping);
  if (chopping) {
    // Knife follows the near arm's hand (pivot 11,-8, the arm's shoulder).
    const hx = 11 + Math.sin(armR) * 20;
    const hy = -8 + Math.cos(armR) * 20;
    cook.knifeC.setPosition(hx, hy);
    cook.knifeC.setRotation(armR + Math.PI / 2);
  }

  const handsKey = c.hands.map((i) => (i ? `${i.kind}:${i.prep}` : '-')).join(',');
  const plateKey = c.plate ? c.plate.dish : '-';
  if (handsKey !== cook.lastHandsKey || plateKey !== cook.lastPlateKey) {
    cook.lastHandsKey = handsKey;
    cook.lastPlateKey = plateKey;
    cook.carryG.clear();
    if (c.plate) {
      // M3: the plate is held in FRONT of the body (facing side), not the centre.
      drawCarriedPlate(cook.carryG, c.plate.dish, 10, -8, 22);
    } else {
      const held = c.hands.filter(Boolean);
      held.forEach((item, i) => {
        drawCarriedItem(cook.carryG, item.kind, item.prep, 4 + i * 14, -8, 11);
      });
    }
  }
  void carrying;
}

function drawCarriedItem(g, kind, prep, x, y, r) {
  gCircle(g, x, y, r, '#E8DCC8');
  if (kind === 'nasi') gEllipse(g, x, y - r * 0.2, r * 0.75, r * 0.45, '#FFF8E7');
  else if (kind === 'mie') gArc(g, x, y - r * 0.15, r * 0.5, Math.PI * 0.15, Math.PI * 1.15, '#F2C14E', Math.max(2, r * 0.14));
  else if (kind === 'telur') gCircle(g, x, y - r * 0.15, r * 0.32, prep === 'chopped' ? '#F2A541' : '#E8B06A');
  else if (kind === 'ayam') gEllipse(g, x, y - r * 0.15, r * 0.6, r * 0.5, '#E07856');
  else if (kind === 'sayur') gCircle(g, x, y - r * 0.1, r * 0.35, '#5E9A4A');
  else if (kind === 'teh') gEllipse(g, x, y - r * 0.2, r * 0.6, r * 0.35, '#8A5A2B');
}

function drawCarriedPlate(g, dishId, x, y, r) {
  gEllipse(g, x, y, r, r * 0.62, '#FFFFFF');
  if (dishId === 'nasi') {
    gEllipse(g, x, y, r * 0.62, r * 0.42, '#F2D492');
    gCircle(g, x + r * 0.25, y - r * 0.18, r * 0.22, '#F2A541');
  } else if (dishId === 'mie') {
    gArc(g, x, y, r * 0.5, Math.PI * 0.1, Math.PI * 1.3, '#F2C14E', Math.max(2, r * 0.13));
  } else if (dishId === 'sate') {
    gLine(g, x - r * 0.55, y, x + r * 0.55, y, '#8A5A33', 3);
    gRect(g, x - r * 0.32, y - r * 0.2, r * 0.26, r * 0.4, '#D97B4A');
    gRect(g, x + r * 0.06, y - r * 0.2, r * 0.26, r * 0.4, '#C06830');
  } else if (dishId === 'teh') {
    gRect(g, x - r * 0.3, y - r * 0.45, r * 0.6, r * 0.9, '#BFE3EC');
    gRect(g, x - r * 0.22, y - r * 0.05, r * 0.44, r * 0.4, '#C68A3C');
    gRect(g, x - r * 0.1, y - r * 0.35, r * 0.2, r * 0.2, '#FFFFFF');
  }
}

const KIND_LOOK = {
  bun: { hair: '#2E1F14', top: 'bun' },
  cap: { hair: '#1A1A1A', top: 'cap' },
  ponytail: { hair: '#3B2416', top: 'ponytail' },
  vip: { hair: '#9A9A9A', top: 'vip' },
  kumis: { hair: '#5A5A5A', top: 'kumis' },
};

export function createCustomers(scene) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const cx = 320 + i * 320;
    const container = scene.add.container(cx, 160);
    container.setDepth(15);
    container.setVisible(false);

    const shoulders = scene.add.ellipse(0, 4, 90, 16, 0x8a5a33);

    const head = scene.add.ellipse(0, -22, 34, 34, 0xe8b88a);
    const hair = scene.add.ellipse(0, -32, 34, 18, 0x2e1f14);
    const eyeL = scene.add.ellipse(-6, -22, 3.4, 4.4, 0x2e1f14);
    const eyeR = scene.add.ellipse(6, -22, 3.4, 4.4, 0x2e1f14);
    const smile = scene.add.arc(0, -14, 6, 15, 165, false, 0x2e1f14);
    const frown = scene.add.arc(0, -10, 6, 195, 345, false, 0x2e1f14);
    frown.setVisible(false);

    const moustache = scene.add.ellipse(0, -13, 16, 5, 0x9a9a9a);
    moustache.setVisible(false);
    const glassL = scene.add.ellipse(-6, -22, 9, 9, 0xffffff, 0);
    glassL.setStrokeStyle(1.5, 0x2e1f14, 1);
    const glassR = scene.add.ellipse(6, -22, 9, 9, 0xffffff, 0);
    glassR.setStrokeStyle(1.5, 0x2e1f14, 1);
    glassL.setVisible(false);
    glassR.setVisible(false);

    const sweat = scene.add.ellipse(14, -30, 5, 7, 0x7ab8e8);
    sweat.setVisible(false);
    container.add([shoulders, head, hair, eyeL, eyeR, smile, frown, moustache, glassL, glassR, sweat]);

    const bubble = scene.add.container(0, -76);
    const bubbleG = scene.add.graphics();
    const dishIcon = scene.add.graphics();
    const nameText = scene.add.text(-68, -28, '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#2E1F14' });
    nameText.setOrigin(0, 0.5);
    const subText = scene.add.text(-68, -6, '', { fontFamily: FONT, fontSize: '13px', color: '#7A6A55' });
    subText.setOrigin(0, 0.5);
    const compText = scene.add.text(-68, 12, '', { fontFamily: FONT, fontSize: '12px', color: '#5C4A33' });
    compText.setOrigin(0, 0.5);
    const barBg = scene.add.rectangle(-10, 30, 180, 10, 0xe8dcc8);
    const barFill = scene.add.rectangle(-100, 30, 180, 10, 0x4e7a3a);
    barFill.setOrigin(0, 0.5);
    const secsText = scene.add.text(112, 30, '', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#2E1F14' });
    secsText.setOrigin(1, 0.5);
    bubble.add([bubbleG, dishIcon, nameText, subText, compText, barBg, barFill, secsText]);
    bubble.setVisible(false);
    container.add(bubble);
    out.push({
      container, shoulders, head, hair, eyeL, eyeR, smile, frown,
      moustache, glassL, glassR, sweat, bubble, bubbleG, dishIcon,
      nameText, subText, compText, barBg, barFill, secsText,
      lastTicketId: -1, lastKind: '', lastMood: '', lastReady: false, lastSecs: '', lastSel: false,
    });
  }
  return out;
}

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

    const sway = Math.sin(t * 4.2 + i * 2.1) * 1.5;
    cust.container.setPosition(sx, 178 + sway + (eventActive(state) ? 11 : 0));

    if (cs.kind !== cust.lastKind) {
      cust.lastKind = cs.kind;
      const kind = CUSTOMER_KINDS.find((k) => k.id === cs.kind) || CUSTOMER_KINDS[0];
      const look = KIND_LOOK[kind.kind] || KIND_LOOK.bun;
      cust.shoulders.setFillStyle(parseInt(kind.shirt.slice(1), 16), 1);
      cust.hair.setFillStyle(parseInt(look.hair.slice(1), 16), 1);
      const isVip = kind.kind === 'vip' || kind.kind === 'kumis';
      cust.moustache.setVisible(isVip);
      cust.glassL.setVisible(isVip);
      cust.glassR.setVisible(isVip);

      cust.hair.setDisplaySize(isVip ? 30 : 34, isVip ? 12 : 18);
    }

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

    const ready = state.windowPlates.some((wp) => wp && wp.dish === ticket.dish);
    const sel = state.selectedTicket === i;
    if (ticket.id !== cust.lastTicketId || ready !== cust.lastReady || sel !== cust.lastSel) {
      const isNew = ticket.id !== cust.lastTicketId;
      cust.lastTicketId = ticket.id;
      cust.lastReady = ready;
      cust.lastSel = sel;
      cust.bubble.setVisible(true);
      const bg = cust.bubbleG;
      bg.clear();
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(-120, -40, 240, 80, 12);
      bg.fillStyle(0xffffff, 1);
      bg.fillTriangle(-12, 40, 12, 40, 0, 52);

      const col = ready ? 0x2e7d32 : sel ? 0xfff3d6 : 0x2e1f14;
      bg.lineStyle(ready || sel ? 4 : 2, col, ready || sel ? 1 : 0.25);
      bg.strokeRoundedRect(-120, -40, 240, 80, 12);
      if (isNew) {
        const icon = cust.dishIcon;
        icon.clear();
        drawBubbleDish(icon, ticket.dish, -96, -12, 20);
        const recipe = { nasi: 'Nasi Goreng', mie: 'Mie Goreng', sate: 'Sate Ayam', teh: 'Es Teh Melati' }[ticket.dish] || ticket.dish;
        cust.nameText.setText(recipe);
        cust.compText.setText({ nasi: 'Nasi + Telur + Kecap', mie: 'Mie + Sayur + Kecap', sate: 'Ayam + Saus Kacang', teh: 'Teh + Es Batu' }[ticket.dish] || '');
      }
      const price = { nasi: 100, mie: 110, sate: 140, teh: 60 }[ticket.dish] || 0;
      if (ready) {
        cust.subText.setText('RING THE BELL!');
        cust.subText.setColor('#2E7D32');
      } else if (ticket.vip === 'kumis') {
        cust.subText.setText('★ Pak Kumis · KRITIKUS');
        cust.subText.setColor('#B8860B');
      } else if (ticket.starred) {
        cust.subText.setText('★ Pak Budi');
        cust.subText.setColor('#B8860B');
      } else if (ticket.picky) {
        cust.subText.setText(ticket.picky.tag);
        cust.subText.setColor('#C0392B');
      } else {
        cust.subText.setText(`Rp ${price}`);
        cust.subText.setColor('#7A6A55');
      }
    }

    const frac2 = Math.max(0, Math.min(1, ticket.patience / ticket.maxPatience));
    const barColor = frac2 > 0.5 ? 0x4e7a3a : frac2 >= 0.25 ? 0xf2a541 : 0xc0392b;
    cust.barFill.setFillStyle(barColor, 1);
    cust.barFill.setScale(Math.max(0.001, frac2), 1);
    cust.barFill.setAlpha(frac2 < 0.25 ? 0.7 + 0.3 * Math.sin(t * 10) : 1);
    const secs = `${Math.max(0, Math.ceil(ticket.patience))} dtk`;
    if (secs !== cust.lastSecs) {
      cust.lastSecs = secs;
      cust.secsText.setText(secs);
    }
  }
}

function drawBubbleDish(g, dishId, x, y, r) {
  gEllipse(g, x, y, r, r * 0.62, '#FFFFFF');
  if (dishId === 'nasi') {
    gEllipse(g, x, y, r * 0.62, r * 0.42, '#F2D492');
    gCircle(g, x + r * 0.25, y - r * 0.18, r * 0.22, '#F2A541');
  } else if (dishId === 'mie') {
    gArc(g, x, y, r * 0.5, Math.PI * 0.1, Math.PI * 1.3, '#F2C14E', Math.max(2, r * 0.13));
  } else if (dishId === 'sate') {
    gLine(g, x - r * 0.55, y, x + r * 0.55, y, '#8A5A33', 3);
    gRect(g, x - r * 0.32, y - r * 0.2, r * 0.26, r * 0.4, '#D97B4A');
    gRect(g, x + r * 0.06, y - r * 0.2, r * 0.26, r * 0.4, '#C06830');
  } else if (dishId === 'teh') {
    gRect(g, x - r * 0.3, y - r * 0.45, r * 0.6, r * 0.9, '#BFE3EC');
    gRect(g, x - r * 0.22, y - r * 0.05, r * 0.44, r * 0.4, '#C68A3C');
    gRect(g, x - r * 0.1, y - r * 0.35, r * 0.2, r * 0.2, '#FFFFFF');
  }
}
