// worldPhysics.js – fizyka świata: kolizje z granicami, przeszkodami, itp.
// Wydzielone z world.js

// Kolizja z granicami świata (ekranu)
export function getWorldBoundCollision(pos, vel, length, width, config) {
  const R = Math.hypot(length, width) * 0.5;
  let collided = false;
  let newPos = { ...pos };
  let newVel = { ...vel };
  if (pos.x - R < 0) {
    newPos.x = R;
    newVel.x = Math.abs(vel.x) * config.WALL_BOUNCE;
    collided = true;
  } else if (pos.x + R > config.WORLD.width) {
    newPos.x = config.WORLD.width - R;
    newVel.x = -Math.abs(vel.x) * config.WALL_BOUNCE;
    collided = true;
  }
  if (pos.y - R < 0) {
    newPos.y = R;
    newVel.y = Math.abs(vel.y) * config.WALL_BOUNCE;
    collided = true;
  } else if (pos.y + R > config.WORLD.height) {
    newPos.y = config.WORLD.height - R;
    newVel.y = -Math.abs(vel.y) * config.WALL_BOUNCE;
    collided = true;
  }
  return { collided, newPos, newVel };
}

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
