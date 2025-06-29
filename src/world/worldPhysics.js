// worldPhysics.js – fizyka świata: kolizje z granicami, przeszkodami, itp.
// Wydzielone z world.js

// Kolizja z granicami świata (ekranu)
export function getWorldBoundCollisionInPlace(pos, vel, length, width, config, worldSize) {
  const R = Math.max(length, width) / 2;
  
  // Sprawdź czy auto jest blisko granicy (100 pikseli marginesu)
  if (pos.x - R < 100 || pos.x + R > worldSize - 100 || pos.y - R < 100 || pos.y + R > worldSize - 100) {
    // Kolizja z lewą granicą
    if (pos.x - R < 0) {
      pos.x = R;
      vel.x = -vel.x * config.WALL_BOUNCE;
    }
    // Kolizja z prawą granicą
    else if (pos.x + R > worldSize) {
      pos.x = worldSize - R;
      vel.x = -vel.x * config.WALL_BOUNCE;
    }
    // Kolizja z górną granicą
    else if (pos.y - R < 0) {
      pos.y = R;
      vel.y = -vel.y * config.WALL_BOUNCE;
    }
    // Kolizja z dolną granicą
    else if (pos.y + R > worldSize) {
      pos.y = worldSize - R;
      vel.y = -vel.y * config.WALL_BOUNCE;
    }
  }
}
