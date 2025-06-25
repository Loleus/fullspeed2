// worldPhysics.js – fizyka świata: kolizje z granicami, przeszkodami, itp.
// Wydzielone z world.js

// Kolizja z granicami świata (ekranu)
export function getWorldBoundCollisionInPlace(pos, vel, length, width, config) {
  const R = Math.hypot(length, width) * 0.5;
  let collided = false;
  if (pos.x - R < 0) {
    pos.x = R;
    vel.x = Math.abs(vel.x) * config.WALL_BOUNCE;
    collided = true;
  } else if (pos.x + R > config.WORLD.width) {
    pos.x = config.WORLD.width - R;
    vel.x = -Math.abs(vel.x) * config.WALL_BOUNCE;
    collided = true;
  }
  if (pos.y - R < 0) {
    pos.y = R;
    vel.y = Math.abs(vel.y) * config.WALL_BOUNCE;
    collided = true;
  } else if (pos.y + R > config.WORLD.height) {
    pos.y = config.WORLD.height - R;
    vel.y = -Math.abs(vel.y) * config.WALL_BOUNCE;
    collided = true;
  }
  return collided;
}

// Sprawdza kolizję z przeszkodą (obstacle) na podstawie collision mapy SVG
// Działa analogicznie do getWorldBoundCollision: nie pozwala wejść nawet na 1px, odbija na zewnątrz
// Lepsza wersja: wypycha auto aż cały obwód jest poza przeszkodą
export function getObstacleCollision(pos, vel, radius, getSurfaceTypeAt, config) {
  const step = 1; // px
  let collided = false;
  let newPos = { ...pos };
  let newVel = { ...vel };
  // Funkcja pomocnicza: czy jakikolwiek punkt obwodu jest w przeszkodzie
  function isAnyPointInObstacle(cx, cy, r) {
    for (let a = 0; a < 360; a += 10) {
      const px = cx + Math.cos(a * Math.PI / 180) * r;
      const py = cy + Math.sin(a * Math.PI / 180) * r;
      if (getSurfaceTypeAt(Math.round(px), Math.round(py)) === 'obstacle') return true;
    }
    return getSurfaceTypeAt(Math.round(cx), Math.round(cy)) === 'obstacle';
  }
  if (isAnyPointInObstacle(pos.x, pos.y, radius)) {
    // Szukaj najbliższego kierunku wyjścia (co 10 stopni)
    let bestDir = null;
    let bestDist = 9999;
    for (let a = 0; a < 360; a += 10) {
      const dir = { x: Math.cos(a * Math.PI / 180), y: Math.sin(a * Math.PI / 180) };
      // Szukaj do 2*radius px na zewnątrz
      for (let d = 1; d <= radius * 2; d += step) {
        const tx = pos.x + dir.x * d;
        const ty = pos.y + dir.y * d;
        if (!isAnyPointInObstacle(tx, ty, radius)) {
          if (d < bestDist) {
            bestDist = d;
            bestDir = dir;
          }
          break;
        }
      }
    }
    if (bestDir) {
      // Przesuwaj auto aż cały obwód będzie poza przeszkodą
      let safeX = pos.x, safeY = pos.y, tries = 0;
      while (isAnyPointInObstacle(safeX, safeY, radius) && tries < radius * 3) {
        safeX += bestDir.x * step;
        safeY += bestDir.y * step;
        tries++;
      }
      newPos = { x: safeX, y: safeY };
      // Odbij prędkość na zewnątrz
      const normal = bestDir;
      const dotProd = vel.x * normal.x + vel.y * normal.y;
      newVel.x = (vel.x - 2 * dotProd * normal.x) * config.WALL_BOUNCE;
      newVel.y = (vel.y - 2 * dotProd * normal.y) * config.WALL_BOUNCE;
      collided = true;
    }
  }
  return { collided, newPos, newVel };
}
