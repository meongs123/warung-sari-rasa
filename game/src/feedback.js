// warung-sari-rasa v3.0 — feedback.js
export function spawnParticles(state, x, y, n, colors, speed = 120) {
  for (let i = 0; i < n; i++) {
    if (state.particles.length >= 120) return;
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 60,
      t: 0,
      life: 0.5 + Math.random() * 0.4,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() < 0.5 ? 'circle' : 'leaf',
    });
  }
}

export function spawnSteam(state, x, y, n = 3) {
  for (let i = 0; i < n; i++) {
    if (state.particles.length >= 120) return;
    state.particles.push({
      x: x + (Math.random() - 0.5) * 24,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: -30 - Math.random() * 30,
      t: 0,
      life: 0.9 + Math.random() * 0.5,
      size: 6 + Math.random() * 8,
      color: 'rgba(255,255,255,0.5)',
      shape: 'steam',
    });
  }
}

export function addFloat(state, x, y, text, sub, color = '#F5C542') {
  state.floats.push({ x, y, text, sub: sub || '', color, t: 0, life: 1.1 });
}

export function addShake(state, amount) {
  state.shake = Math.min(1, state.shake + amount);
}

export function updateFeedback(state, dt) {
  for (const p of state.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 140 * dt;
    if (p.shape === 'steam') p.vy -= 40 * dt;
  }
  state.particles = state.particles.filter((p) => p.t < p.life);
  for (const f of state.floats) f.t += dt;
  state.floats = state.floats.filter((f) => f.t < f.life);
  state.shake = Math.max(0, state.shake - dt * 1.6);
}

export function feedback(state, tier, x, y, opts = {}) {
  if (tier === 'small') {
    spawnParticles(state, x, y, 4, opts.colors || ['#FFF3D6', '#F5C542'], 80);
  } else if (tier === 'medium') {
    spawnParticles(state, x, y, 8, opts.colors || ['#5E9A4A', '#F2A541', '#FFF3D6'], 140);
    addShake(state, 0.25);
  } else if (tier === 'large') {
    spawnParticles(state, x, y, 16, opts.colors || ['#F5C542', '#F2A541', '#FFF3D6'], 180);
    addShake(state, 0.35);
  }
  if (opts.text) addFloat(state, x, y - 10, opts.text, opts.sub || '', opts.color);
}
