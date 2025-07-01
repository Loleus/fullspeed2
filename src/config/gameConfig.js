// config.js – podstawowa konfiguracja silnika gry Full Speed 2
// W przyszłości można tu dodać różne profile aut, poziomy trudności, itp.

export const CONFIG = {
  MASS: 1230, // masa auta w kg
  INV_MASS: 1 / 1230, // odwrotność masy (prekalkulowana dla wydajności)
  ACCEL: 0.8, // przyspieszenie
  REVERSE_ACCEL: 0.4, // przyspieszenie na wstecznym
  BRAKE: 0.05, // siła hamowania (klasyczna, stabilna)
  FRICTION: 0.02, // tarcie
  FRICTION_MULT: 1 - 0.02, // mnożnik tarcia (prekalkulowany)
  DRAG: 1, // opór powietrza
  GRIP: 1, // przyczepność
  WHEELBASE: 70, // rozstaw osi
  ENGINE_MULTIPLIER: 800, // mnożnik mocy silnika
  MAX_STEERING: Math.PI / 4, // maksymalny kąt skrętu
  STEERING_SPEED: 0.005, // szybkość skręcania
  STEERING_RETURN: 0.085, // powrót kierownicy
  STOP_EPS: 0.001, // próg zatrzymania
  WALL_BOUNCE: 0.35, // odbicie od ściany
  THROTTLE_RAMP: 0.005, // narastanie gazu
  WORLD: { width: 6144, height: 6144} // rozmiar świata
};
