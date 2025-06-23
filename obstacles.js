// obstacles.js – obsługa kolizji z przeszkodami na podstawie mapy kolizji z SVG
import { getSurfaceTypeAt, obstaclePolys } from './world.js';

// Odbij i natychmiast wypchnij auto poza przeszkodę (ramka: odbicie na zewnątrz, normalnie do krawędzi)
export function handleObstacleCollision(car, config) {
  if (getSurfaceTypeAt(car.pos.x, car.pos.y) === 'obstacle') {
    // Szukaj najbliższego kierunku na zewnątrz przeszkody (w promieniu 360 stopni)
    const EPS = 1.5;
    let best = null, bestDist = 9999;
    for (let a = 0; a < 360; a += 10) {
      const nx = Math.cos(a * Math.PI / 180), ny = Math.sin(a * Math.PI / 180);
      let tx = car.pos.x, ty = car.pos.y, steps = 0;
      while (getSurfaceTypeAt(tx, ty) === 'obstacle' && steps < 30) {
        tx += nx * EPS;
        ty += ny * EPS;
        steps++;
      }
      if (steps < bestDist) {
        bestDist = steps;
        best = { nx, ny };
      }
    }
    // Cofnij auto na zewnątrz przeszkody w najlepszym kierunku
    let i = 0;
    while (getSurfaceTypeAt(car.pos.x, car.pos.y) === 'obstacle' && i < 30) {
      car.pos.x += best.nx * EPS;
      car.pos.y += best.ny * EPS;
      i++;
    }
    // Odbij prędkość względem normalnej
    const vDotN = car.vel.x * best.nx + car.vel.y * best.ny;
    car.vel.x = (car.vel.x - 2 * vDotN * best.nx) * config.WALL_BOUNCE;
    car.vel.y = (car.vel.y - 2 * vDotN * best.ny) * config.WALL_BOUNCE;
  }
}

export function isCarOnObstacle(car) {
  return getSurfaceTypeAt(car.pos.x, car.pos.y) === 'obstacle';
}

// Eksport funkcji getObstacleCollision z world.js (forward)
export { getObstacleCollision } from './world.js';

// Sprawdza kolizję prostokąta auta z polygonem przeszkody (SAT)
function rectPolyCollision(rect, poly) {
  // rect: {x, y, angle, length, width}
  // poly: [{x, y}, ...]
  // Wyznacz wierzchołki prostokąta auta
  const c = Math.cos(rect.angle), s = Math.sin(rect.angle);
  const hw = rect.width / 2, hl = rect.length / 2;
  const corners = [
    { x: rect.x + c * hl - s * hw, y: rect.y + s * hl + c * hw },
    { x: rect.x - c * hl - s * hw, y: rect.y - s * hl + c * hw },
    { x: rect.x - c * hl + s * hw, y: rect.y - s * hl - c * hw },
    { x: rect.x + c * hl + s * hw, y: rect.y + s * hl - c * hw }
  ];
  // SAT: sprawdź separację na wszystkich osiach prostokąta i polygona
  function project(axis, points) {
    let min = Infinity, max = -Infinity;
    for (const p of points) {
      const val = p.x * axis.x + p.y * axis.y;
      if (val < min) min = val;
      if (val > max) max = val;
    }
    return { min, max };
  }
  function getAxes(points) {
    const axes = [];
    for (let i = 0; i < points.length; ++i) {
      const p1 = points[i], p2 = points[(i + 1) % points.length];
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const normal = { x: -edge.y, y: edge.x };
      const len = Math.hypot(normal.x, normal.y);
      axes.push({ x: normal.x / len, y: normal.y / len });
    }
    return axes;
  }
  const axes = [...getAxes(corners), ...getAxes(poly)];
  for (const axis of axes) {
    const pr1 = project(axis, corners);
    const pr2 = project(axis, poly);
    if (pr1.max < pr2.min || pr2.max < pr1.min) return false;
  }
  return true;
}

// Główna funkcja: sprawdza kolizję auta z przeszkodami
export function checkCarObstacleCollision(car, polys = obstaclePolys) {
  const rect = {
    x: car.pos.x,
    y: car.pos.y,
    angle: car.angle,
    length: car.length,
    width: car.width
  };
  for (let i = 0; i < polys.length; ++i) {
    if (rectPolyCollision(rect, polys[i])) return { collided: true, index: i };
  }
  return { collided: false };
}
