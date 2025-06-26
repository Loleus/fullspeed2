// car.js – logika auta, tworzenie instancji samochodu
// Fizyka pojazdu wydzielona do carPhysics.js
import { updateCarPhysics } from './carPhysics.js';
import { getSurfaceParams } from './world.js';

export function createCar(trackXY, T_START) {
  return {
    pos: trackXY(T_START),
    vel: { x: 0, y: 0 },
    angle: Math.PI / 4,
    steering: 0,
    length: 180,
    width: 80,
    throttle: 0
  };
}

export function createCarWithPosition(pos) {
  return {
    pos: { ...pos },
    vel: { x: 0, y: 0 },
    angle: Math.PI / 4,
    steering: 0,
    length: 180,
    width: 80,
    throttle: 0,
    surfaceType: 'grass',
    surf: getSurfaceParams('grass')
  };
}

export function createCarImg(src) {
  const carImg = new Image();
  carImg.src = src;
  return { carImg };
}

// Eksportuj updateCar jako delegację do updateCarPhysics
export function updateCar(car, dt, surf, input, config) {
  updateCarPhysics(car, dt, surf, input, config);
}
