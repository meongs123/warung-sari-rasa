// warung-sari-rasa v3.0 — gfx.js
function parseColor(color) {
  if (typeof color === 'number') return [color, 1];
  if (color.startsWith('rgba')) {
    const parts = color.slice(5, -1).split(',').map((s) => parseFloat(s));
    const n = ((parts[0] | 0) << 16) | ((parts[1] | 0) << 8) | (parts[2] | 0);
    return [n, parts.length > 3 ? parts[3] : 1];
  }
  return [parseInt(color.slice(1), 16), 1];
}

function resolve(color, alpha) {
  const [n, a] = parseColor(color);
  return [n, a * alpha];
}

export function gCircle(g, x, y, r, color, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.fillStyle(c, a);
  g.fillCircle(x, y, r);
  return g;
}

export function gEllipse(g, x, y, rx, ry, color, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.fillStyle(c, a);
  g.fillEllipse(x, y, rx * 2, ry * 2);
  return g;
}

export function gRect(g, x, y, w, h, color, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.fillStyle(c, a);
  g.fillRect(x, y, w, h);
  return g;
}

export function gRoundRect(g, x, y, w, h, r, color, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.fillStyle(c, a);
  g.fillRoundedRect(x, y, w, h, r);
  return g;
}

export function gTriangle(g, x0, y0, x1, y1, x2, y2, color, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.fillStyle(c, a);
  g.fillTriangle(x0, y0, x1, y1, x2, y2);
  return g;
}

export function gCircleStroke(g, x, y, r, color, width = 2, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.lineStyle(width, c, a);
  g.strokeCircle(x, y, r);
  return g;
}

export function gRoundRectStroke(g, x, y, w, h, r, color, width = 2, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.lineStyle(width, c, a);
  g.strokeRoundedRect(x, y, w, h, r);
  return g;
}

export function gLine(g, x0, y0, x1, y1, color, width = 2, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.lineStyle(width, c, a);
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.closePath();
  g.strokePath();
  return g;
}

export function gArc(g, x, y, r, start, end, color, width = 2, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.lineStyle(width, c, a);
  g.beginPath();
  g.arc(x, y, r, start, end, false);
  g.strokePath();
  return g;
}
