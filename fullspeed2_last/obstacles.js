// obstacles.js – obsługa kolizji z przeszkodami na podstawie mapy kolizji z SVG
import { obstaclePolys, getSurfaceParams } from './world.js';

// Główna funkcja: obsługuje kolizję auta z przeszkodami - wypychanie i odbijanie
export function handleObstacleCollisionWithPolygon(car, config) {
  const obstacleResult = checkCarObstacleCollision(car);
  if (obstacleResult.collided) {
    const poly = obstacleResult.index !== undefined ? obstaclePolys[obstacleResult.index] : null;
    if (poly) {
      // Znajdź najbliższy punkt polygona
      let minDist = Infinity, closest = null;
      for (let i = 0; i < poly.length; ++i) {
        const p = poly[i];
        const dx = car.pos.x - p.x, dy = car.pos.y - p.y;
        const dist = dx*dx + dy*dy;
        if (dist < minDist) { minDist = dist; closest = p; }
      }
      
      // Oblicz normalną od najbliższego punktu
      let normal = { x: car.pos.x - closest.x, y: car.pos.y - closest.y };
      let len = Math.hypot(normal.x, normal.y);
      if (len > 0) { normal.x /= len; normal.y /= len; }
      
      // Wypchnij auto poza przeszkodę
      let pushSteps = 0;
      while (checkCarObstacleCollision(car, [poly]).collided && pushSteps < 10) {
        car.pos.x += normal.x;
        car.pos.y += normal.y;
        pushSteps++;
      }
      
      // Odbij prędkość względem normalnej
      const vDotN = car.vel.x * normal.x + car.vel.y * normal.y;
      const tangent = { x: car.vel.x - vDotN * normal.x, y: car.vel.y - vDotN * normal.y };
      const vNormal = { x: -vDotN * normal.x * config.WALL_BOUNCE, y: -vDotN * normal.y * config.WALL_BOUNCE };
      car.vel.x = tangent.x + vNormal.x;
      car.vel.y = tangent.y + vNormal.y;
    } else {
      // Jeśli nie ma polygona, zatrzymaj auto
      car.vel.x = 0;
      car.vel.y = 0;
    }
    
    // Ustaw typ powierzchni na obstacle
    car.surfaceType = 'obstacle';
    car.surf = getSurfaceParams('obstacle');
  }
}

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
