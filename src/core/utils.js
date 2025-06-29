// utils.js – funkcje pomocnicze matematyczne i wektorowe

// Można dodać dla często używanych kątów
const COS_TABLE = new Float32Array(360);
const SIN_TABLE = new Float32Array(360);
// Wypełnić tabelę przy inicjalizacji

export function fwd(a) { 
  return { x: Math.cos(a), y: Math.sin(a) }; 
}

export function rgt(a) { 
  return { x: Math.cos(a + Math.PI / 2), y: Math.sin(a + Math.PI / 2) }; 
}

export function dot(a, b) { 
  return a.x * b.x + a.y * b.y; 
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function hypot(a, b) {
  return Math.hypot(a, b);
}

export function round(value) {
  return Math.round(value);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

// Znajdź najbliższy punkt na wielokącie do punktu p
export function findClosestPointOnPolygon(p, polygon) {
  let minDistSq = Infinity;
  let closest = null;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    // Najbliższy punkt na odcinku ab do p
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const abLenSq = ab.x * ab.x + ab.y * ab.y;
    let t = abLenSq > 0 ? (ap.x * ab.x + ap.y * ab.y) / abLenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + ab.x * t, y: a.y + ab.y * t };
    const dx = p.x - proj.x;
    const dy = p.y - proj.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      closest = proj;
    }
  }
  return closest;
} 