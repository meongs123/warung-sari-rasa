// warung-sari-rasa v3.0 — pathfind.js
import { ZONES } from './zones.js';

const BLOCKERS = ZONES.blockers;

const CELL = 20;
const FLOOR = { x: 16, y: 560, w: 1248, h: 80 };

const COOK_R = 16;

const COLS = Math.ceil(FLOOR.w / CELL);
const ROWS = Math.ceil(FLOOR.h / CELL);

function cellCenter(col, row) {
  return { x: FLOOR.x + col * CELL + CELL / 2, y: FLOOR.y + row * CELL + CELL / 2 };
}

function pointToCell(x, y) {
  return {
    col: Math.max(0, Math.min(COLS - 1, Math.floor((x - FLOOR.x) / CELL))),
    row: Math.max(0, Math.min(ROWS - 1, Math.floor((y - FLOOR.y) / CELL))),
  };
}

function cellWalkable(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  const p = cellCenter(col, row);
  for (const b of BLOCKERS) {

    if (
      p.x + COOK_R > b.x && p.x - COOK_R < b.x + b.w &&
      p.y + COOK_R > b.y && p.y - COOK_R < b.y + b.h
    ) return false;
  }
  return true;
}

function key(col, row) {
  return row * COLS + col;
}

export function findPath(fromX, fromY, toX, toY) {
  const start = pointToCell(fromX, fromY);
  const goal = pointToCell(toX, toY);

  let goalCell = goal;
  if (!cellWalkable(goal.col, goal.row)) {
    let best = null;
    let bestD = Infinity;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!cellWalkable(c, r)) continue;
        const d = Math.abs(c - goal.col) + Math.abs(r - goal.row);
        if (d < bestD) { bestD = d; best = { col: c, row: r }; }
      }
    }
    if (!best) return null;
    goalCell = best;
  }

  const open = [{ col: start.col, row: start.row, g: 0, f: 0, parent: null }];
  const openSet = new Map([[key(start.col, start.row), open[0]]]);
  const closed = new Set();
  const heuristic = (c, r) => Math.abs(c - goalCell.col) + Math.abs(r - goalCell.row);

  while (open.length > 0) {

    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const current = open.splice(bestIdx, 1)[0];
    openSet.delete(key(current.col, current.row));
    if (current.col === goalCell.col && current.row === goalCell.row) {

      const path = [];
      let node = current;
      while (node.parent) {
        path.unshift(cellCenter(node.col, node.row));
        node = node.parent;
      }

      path.push({ x: toX, y: toY });
      return path;
    }
    closed.add(key(current.col, current.row));
    const neighbours = [
      { col: current.col + 1, row: current.row },
      { col: current.col - 1, row: current.row },
      { col: current.col, row: current.row + 1 },
      { col: current.col, row: current.row - 1 },
    ];
    for (const n of neighbours) {
      const k = key(n.col, n.row);
      if (closed.has(k) || !cellWalkable(n.col, n.row)) continue;
      const g = current.g + 1;
      const existing = openSet.get(k);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = g + heuristic(n.col, n.row);
          existing.parent = current;
        }
        continue;
      }
      const node = { col: n.col, row: n.row, g, f: g + heuristic(n.col, n.row), parent: current };
      open.push(node);
      openSet.set(k, node);
    }
  }
  return null;
}

export function simplifyPath(path) {
  if (!path || path.length < 3) return path || [];
  const out = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const a = out[out.length - 1];
    const b = path[i];
    const c = path[i + 1];
    const collinear =
      (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (!collinear) out.push(b);
  }
  out.push(path[path.length - 1]);
  return out;
}
