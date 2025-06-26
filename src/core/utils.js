// utils.js – funkcje pomocnicze matematyczne i wektorowe

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