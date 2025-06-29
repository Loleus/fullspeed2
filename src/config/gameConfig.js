// config.js – podstawowa konfiguracja silnika gry Full Speed 2
// W przyszłości można tu dodać różne profile aut, poziomy trudności, itp.

export const CONFIG = {
  MASS: 1230, // masa auta w kg
  INV_MASS: 1 / 1230, // odwrotność masy (prekalkulowana dla wydajności)
  ACCEL: 0.8, // przyspieszenie
  REVERSE_ACCEL: 0.5, // przyspieszenie na wstecznym
  BRAKE: 0.1, // siła hamowania
  FRICTION: 0.018, // tarcie
  FRICTION_MULT: 1 - 0.018, // mnożnik tarcia (prekalkulowany)
  DRAG: 0.05, // opór powietrza
  GRIP: 0.3, // przyczepność
  WHEELBASE: 300, // rozstaw osi
  ENGINE_MULTIPLIER: 800, // mnożnik mocy silnika
  MAX_STEERING: Math.PI / 4, // maksymalny kąt skrętu
  STEERING_SPEED: 0.03, // szybkość skręcania
  STEERING_RETURN: 0.085, // powrót kierownicy
  STOP_EPS: 0.06, // próg zatrzymania
  WALL_BOUNCE: 0.35, // odbicie od ściany
  THROTTLE_RAMP: 0.02, // narastanie gazu
  WORLD: { width: 6144, height: 6144} // rozmiar świata
};
