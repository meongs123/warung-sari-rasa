// gfx.js — tiny Phaser Graphics helpers, so the drawing code reads like the
// old canvas code (circle / ellipse / rect / triangle) instead of spelling
// out Phaser's fill* calls everywhere. All helpers take a Phaser Graphics
// object `g` and draw at ABSOLUTE coordinates (the Graphics sits at 0,0).
// Colours are hex strings ('#RRGGBB'), 'rgba(r,g,b,a)' strings, or numbers.

// parseColor: '#RRGGBB' -> [0xRRGGBB, 1], 'rgba(r,g,b,a)' -> [0xRRGGBB, a],
// a plain number -> [number, 1]. Returns a pair so the caller can multiply
// the string alpha into the fill alpha (resolve() does that).
function parseColor(color) {
  if (typeof color === 'number') return [color, 1];
  if (color.startsWith('rgba')) {
    const parts = color.slice(5, -1).split(',').map((s) => parseFloat(s));
    const n = ((parts[0] | 0) << 16) | ((parts[1] | 0) << 8) | (parts[2] | 0);
    return [n, parts.length > 3 ? parts[3] : 1];
  }
  return [parseInt(color.slice(1), 16), 1];
}

// Resolve a colour + alpha into the pair Phaser's fillStyle/lineStyle want.
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

// Stroked circle outline (no fill).
export function gCircleStroke(g, x, y, r, color, width = 2, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.lineStyle(width, c, a);
  g.strokeCircle(x, y, r);
  return g;
}

// Stroked rounded-rect outline (no fill).
export function gRoundRectStroke(g, x, y, w, h, r, color, width = 2, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.lineStyle(width, c, a);
  g.strokeRoundedRect(x, y, w, h, r);
  return g;
}

// A line segment.
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

// An arc stroke (part of a circle outline), angles in radians.
export function gArc(g, x, y, r, start, end, color, width = 2, alpha = 1) {
  const [c, a] = resolve(color, alpha);
  g.lineStyle(width, c, a);
  g.beginPath();
  g.arc(x, y, r, start, end, false);
  g.strokePath();
  return g;
}
