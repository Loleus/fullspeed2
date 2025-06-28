// carPhysics.js – model fizyki pojazdu (ruch, siły, sterowanie)
// Wydzielone z car.js dla lepszej modularności i możliwości rozwoju
import { fwd, rgt, dot } from '../../core/utils.js';
import { getWorldBoundCollisionInPlace } from '../../world/worldPhysics.js';

function snapToZero(car, F, input) {
  const fSpdNow = dot(car.vel, F);
  if (
    (car.gear === 'D' && input.down && !input.up && Math.abs(fSpdNow) < 5 / 6.0) ||
    (car.gear === 'R' && input.up && !input.down && Math.abs(fSpdNow) < 5 / 6.0)
  ) {
    car.vel.x = 0;
    car.vel.y = 0;
  }
}

export function updateCarPhysics(car, dt, surf, input, config, worldSize) {
  // Prekalkulowane wartości dla wydajności
  const grip = config.GRIP * surf.gripMul;
  const accel = config.ACCEL * surf.accelMul;
  const reverse = config.REVERSE_ACCEL * surf.reverseMul;
  const brake = config.BRAKE * surf.brakeMul;
  const dragDt = config.DRAG * dt; // prekalkulowane
  const gripDt = grip * dt; // prekalkulowane

  let smoothedSteering = car.steering;
  const d = surf.gripMul * config.STEERING_SPEED;
  if (input.left)
    smoothedSteering = Math.max(smoothedSteering - d, -config.MAX_STEERING);
  else if (input.right)
    smoothedSteering = Math.min(smoothedSteering + d, config.MAX_STEERING);
  else
    smoothedSteering *= config.STEERING_RETURN;

  const F = fwd(car.angle);
  const R = rgt(car.angle);
  const fSpd = dot(car.vel, F);

  // Hamowanie: działa bezpośrednio na prędkość, throttle tylko do gazu
  const isBraking = (
    (car.gear === 'D' && input.down && !input.up && fSpd > config.STOP_EPS) ||
    (car.gear === 'R' && input.up && !input.down && fSpd < -config.STOP_EPS)
  );

  if (isBraking) {
    car.throttle = 0;
    car.vel.x -= F.x * brake * Math.sign(fSpd);
    car.vel.y -= F.y * brake * Math.sign(fSpd);
    if (Math.abs(fSpd) < 1) {
      car.vel.x = 0;
      car.vel.y = 0;
    }
  } else {
    let thrust = 0;
    if (car.gear === 'D') {
      if (input.up && !input.down) thrust = accel;
    } else if (car.gear === 'R') {
      if (input.down && !input.up) thrust = -reverse;
    }
    if (thrust !== 0) {
      car.throttle += (thrust - car.throttle) * config.THROTTLE_RAMP;
    } else {
      car.throttle *= 0.95;
    }
  }

  // Zoptymalizowane obliczenia sił - grupowanie mnożeń
  const throttleEngineDt = car.throttle * config.ENGINE_MULTIPLIER * dt;
  const engineX = F.x * throttleEngineDt;
  const engineY = F.y * throttleEngineDt;
  
  const dragX = -car.vel.x * dragDt;
  const dragY = -car.vel.y * dragDt;
  
  const lat = dot(car.vel, R);
  const slideX = -lat * R.x * gripDt;
  const slideY = -lat * R.y * gripDt;
  
  // Zapisz siłę poślizgu dla kamery FVP
  car.slideForce = Math.hypot(slideX, slideY);

  // Zoptymalizowane: mnożenie zamiast dzielenia
  car.vel.x += (engineX + dragX + slideX) * config.INV_MASS;
  car.vel.y += (engineY + dragY + slideY) * config.INV_MASS;
  
  // Zoptymalizowane: prekalkulowany mnożnik tarcia
  car.vel.x *= config.FRICTION_MULT;
  car.vel.y *= config.FRICTION_MULT;

  // SNAP TO ZERO (przód i tył, cała prędkość)
  snapToZero(car, F, input);

  if (Math.abs(smoothedSteering) > 0.01) {
    const radius = config.WHEELBASE / Math.tan(smoothedSteering);
    car.angle += (fSpd / radius) * dt;
  }

  car.pos.x += car.vel.x;
  car.pos.y += car.vel.y;

  // Clamp: nie pozwól zmienić kierunku jazdy na przeciwny do biegu
  const newFSpd = dot(car.vel, F);
  if (car.gear === 'D' && newFSpd < 0) {
    car.vel.x -= F.x * newFSpd;
    car.vel.y -= F.y * newFSpd;
  } else if (car.gear === 'R' && newFSpd > 0) {
    car.vel.x -= F.x * newFSpd;
    car.vel.y -= F.y * newFSpd;
  }

  // Kolizje z granicami świata
  getWorldBoundCollisionInPlace(car.pos, car.vel, car.length, car.width, config, worldSize);

  if (Math.hypot(car.vel.x, car.vel.y) < config.STOP_EPS) {
    car.vel.x = 0;
    car.vel.y = 0;
  }

  car.steering = smoothedSteering;
}
