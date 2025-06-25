// carPhysics.js – model fizyki pojazdu (ruch, siły, sterowanie)
// Wydzielone z car.js dla lepszej modularności i możliwości rozwoju
import { fwd, rgt, dot } from '../../core/utils.js';
import { getWorldBoundCollisionInPlace } from '../../world/worldPhysics.js';

export function updateCarPhysics(car, dt, surf, input, config) {
  const grip = config.GRIP * surf.gripMul;
  const accel = config.ACCEL * surf.accelMul;
  const reverse = config.REVERSE_ACCEL * surf.reverseMul;
  const brake = config.BRAKE * surf.brakeMul;

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

  let thrust = 0;
  if (car.gear === 'D') {
    if (input.up && !input.down) thrust = accel;
    else if (input.down && !input.up && fSpd > config.STOP_EPS) thrust = -brake;
    else if (input.down && !input.up && Math.abs(fSpd) <= config.STOP_EPS) thrust = 0;
    else thrust = 0;
  } else if (car.gear === 'R') {
    if (input.down && !input.up) thrust = -reverse;
    else if (input.up && !input.down && fSpd < -config.STOP_EPS) thrust = brake;
    else if (input.up && !input.down && Math.abs(fSpd) <= config.STOP_EPS) thrust = 0;
    else thrust = 0;
  } else if (car.gear === 0) {
    if ((input.up && !input.down && fSpd > config.STOP_EPS) || (input.down && !input.up && fSpd < -config.STOP_EPS)) thrust = -brake;
    else thrust = 0;
  }
  car.throttle += (thrust - car.throttle) * config.THROTTLE_RAMP;
  const engineX = F.x * car.throttle * config.ENGINE_MULTIPLIER * dt;
  const engineY = F.y * car.throttle * config.ENGINE_MULTIPLIER * dt;
  const dragX = -car.vel.x * config.DRAG * dt;
  const dragY = -car.vel.y * config.DRAG * dt;
  const lat = dot(car.vel, R);
  const slideX = -lat * R.x * grip * dt;
  const slideY = -lat * R.y * grip * dt;

  car.vel.x += (engineX + dragX + slideX) / config.MASS;
  car.vel.y += (engineY + dragY + slideY) / config.MASS;
  car.vel.x *= 1 - config.FRICTION;
  car.vel.y *= 1 - config.FRICTION;

  if (Math.abs(smoothedSteering) > 0.01) {
    const radius = config.WHEELBASE / Math.tan(smoothedSteering);
    car.angle += (fSpd / radius) * dt;
  }

  car.pos.x += car.vel.x;
  car.pos.y += car.vel.y;

  // Clamp: nie pozwól zmienić kierunku jazdy na przeciwny do biegu
  const newFSpd = dot(car.vel, F);
  if (car.gear === 'D' && newFSpd < 0) {
    // Wyzeruj prędkość w osi jazdy, zachowaj boczną
    car.vel.x -= F.x * newFSpd;
    car.vel.y -= F.y * newFSpd;
  } else if (car.gear === 'R' && newFSpd > 0) {
    car.vel.x -= F.x * newFSpd;
    car.vel.y -= F.y * newFSpd;
  }

  // Kolizje z granicami świata
  getWorldBoundCollisionInPlace(car.pos, car.vel, car.length, car.width, config);

  if (Math.hypot(car.vel.x, car.vel.y) < config.STOP_EPS) {
    car.vel.x = 0;
    car.vel.y = 0;
  }

  car.steering = smoothedSteering;
}
