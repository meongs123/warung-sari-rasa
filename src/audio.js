// warung-sari-rasa v3.0 — audio.js
let ctx = null;
let master = null;
let muted = false;
let sizzleNodes = null;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.5, when = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, filterFreq, vol = 0.4) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start();
}

export function playChop() {
  noiseBurst(0.08, 2400, 0.5);
}

export function playTake() {
  tone(660, 0.08, 'sine', 0.3);
}

export function playPlok() {
  tone(320, 0.1, 'sine', 0.4);
  tone(520, 0.08, 'sine', 0.25, 0.03);
}

export function playDing() {
  tone(880, 0.4, 'sine', 0.4);
  tone(1320, 0.3, 'sine', 0.2, 0.02);
}

export function playCoin() {
  tone(1320, 0.09, 'sine', 0.4);
  tone(1760, 0.14, 'sine', 0.4, 0.08);
}

export function playBell() {
  tone(1568, 0.5, 'triangle', 0.5);
  tone(2093, 0.3, 'sine', 0.2, 0.02);
}

export function playBurn() {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, t0);
  osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.25);
  g.gain.setValueAtTime(0.5, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.35);
}

export function playJingle() {
  tone(523, 0.18, 'sine', 0.4);
  tone(659, 0.18, 'sine', 0.4, 0.15);
  tone(784, 0.3, 'sine', 0.4, 0.3);
}

export function playRefuse() {
  tone(220, 0.12, 'square', 0.2);
}

export function setSizzle(activeCount) {
  const ac = ensureCtx();
  if (!ac) return;
  if (activeCount > 0 && !sizzleNodes) {
    const len = ac.sampleRate * 1;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const g = ac.createGain();
    g.gain.value = muted ? 0 : 0.05 * activeCount;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start();
    sizzleNodes = { src, g };
  } else if (sizzleNodes) {
    if (activeCount <= 0) {
      try { sizzleNodes.src.stop(); } catch (e) {  }
      sizzleNodes = null;
    } else {
      sizzleNodes.g.gain.value = muted ? 0 : 0.05 * activeCount;
    }
  }
}

export function resumeAudio() {
  const ac = ensureCtx();
  if (ac && ac.state === 'suspended') ac.resume();
}
