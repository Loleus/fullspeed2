// car.js – logika auta, tworzenie instancji samochodu
// Fizyka pojazdu wydzielona do carPhysics.js
import { updateCarPhysics } from './carPhysics.js';

export function createCarWithPosition(pos) {
  return {
    pos: { ...pos },
    vel: { x: 0, y: 0 },
    angle: Math.PI / 4,
    steering: 0,
    length: 90,
    width: 50,
    radius: 51, // promień kolizji - średnia z width i length
    throttle: 0,
    gear: 'D',
    speed: 0,
    slideForce: 0
  };
}

// Funkcja do aktualizacji prędkości auta w km/h
export function updateCarSpeed(car) {
  car.speed = Math.hypot(car.vel.x, car.vel.y) * 6.0; // konwersja do km/h
}

// Eksportuj updateCar jako delegację do updateCarPhysics
export function updateCar(car, dt, surf, input, config, worldSize) {
  updateCarPhysics(car, dt, surf, input, config, worldSize);
  updateCarSpeed(car); // aktualizuj prędkość po fizyce
}

export function setCarGear(car, gear) {
  car.gear = gear;
}
