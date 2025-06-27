// worldPhysics.js – fizyka świata: kolizje z granicami, przeszkodami, itp.
// Wydzielone z world.js

// Kolizja z granicami świata (ekranu)
export function getWorldBoundCollisionInPlace(pos, vel, length, width, config, worldSize) {
  const R = Math.hypot(length, width) * 0.5;
  let collided = false;
  if (pos.x - R < 0) {
    pos.x = R;
    vel.x = Math.abs(vel.x) * config.WALL_BOUNCE;
    collided = true;
  } else if (pos.x + R > worldSize) {
    pos.x = worldSize - R;
    vel.x = -Math.abs(vel.x) * config.WALL_BOUNCE;
    collided = true;
  }
  if (pos.y - R < 0) {
    pos.y = R;
    vel.y = Math.abs(vel.y) * config.WALL_BOUNCE;
    collided = true;
  } else if (pos.y + R > worldSize) {
    pos.y = worldSize - R;
    vel.y = -Math.abs(vel.y) * config.WALL_BOUNCE;
    collided = true;
  }
  return collided;
}
