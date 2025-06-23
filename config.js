// config.js – podstawowa konfiguracja silnika gry Full Speed 2
// W przyszłości można tu dodać różne profile aut, poziomy trudności, itp.

export const CONFIG = {
  MASS: 1230, // masa auta w kg
  ACCEL: 0.6, // przyspieszenie
  REVERSE_ACCEL: 0.25, // przyspieszenie na wstecznym
  BRAKE: 0.7, // siła hamowania
  FRICTION: 0.015, // tarcie
  DRAG: 0.01, // opór powietrza
  GRIP: 0.5, // przyczepność
  WHEELBASE: 300, // rozstaw osi
  ENGINE_MULTIPLIER: 800, // mnożnik mocy silnika
  MAX_STEERING: Math.PI / 4, // maksymalny kąt skrętu
  STEERING_SPEED: 0.05, // szybkość skręcania
  STEERING_RETURN: 0.085, // powrót kierownicy
  ROAD_WIDTH: 400, // szerokość drogi
  STOP_EPS: 0.1, // próg zatrzymania
  WALL_BOUNCE: 0.35, // odbicie od ściany
  THROTTLE_RAMP: 0.04, // narastanie gazu
  WORLD: { width: 4000, height: 4000 } // rozmiar świata
};
