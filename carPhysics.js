// carPhysics.js – model fizyki pojazdu (ruch, siły, sterowanie)
// Wydzielone z car.js dla lepszej modularności i możliwości rozwoju
import { fwd, rgt, dot } from './world.js';
import { getWorldBoundCollision } from './world.js';

export function getNextCarState(car, dt, surf, input, config) {
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

  const thrust = input.up && !input.down
    ? (fSpd < -config.STOP_EPS ? brake : accel)
    : input.down && !input.up
      ? (fSpd > config.STOP_EPS ? -brake : -reverse)
      : 0;
  const throttle = car.throttle + (thrust - car.throttle) * config.THROTTLE_RAMP;
  const engine = {
    x: F.x * throttle * config.ENGINE_MULTIPLIER * dt,
    y: F.y * throttle * config.ENGINE_MULTIPLIER * dt,
  };
  const drag = {
    x: -car.vel.x * config.DRAG * dt,
    y: -car.vel.y * config.DRAG * dt,
  };
  const lat = dot(car.vel, R);
  const slide = {
    x: -lat * R.x * grip * dt,
    y: -lat * R.y * grip * dt,
  };
  let vel = {
    x: car.vel.x + (engine.x + drag.x + slide.x) / config.MASS,
    y: car.vel.y + (engine.y + drag.y + slide.y) / config.MASS,
  };
  vel.x *= 1 - config.FRICTION;
  vel.y *= 1 - config.FRICTION;

  let angle = car.angle;
  if (Math.abs(smoothedSteering) > 0.01) {
    const radius = config.WHEELBASE / Math.tan(smoothedSteering);
    angle += (fSpd / radius) * dt;
  }

  let pos = {
    x: car.pos.x + vel.x,
    y: car.pos.y + vel.y,
  };

  const bounds = getWorldBoundCollision(pos, vel, car.length, car.width, config);
  if (bounds.collided) {
    pos = bounds.newPos;
    vel = bounds.newVel;
  }

  if (Math.hypot(vel.x, vel.y) < config.STOP_EPS) {
    vel.x = 0;
    vel.y = 0;
  }

  return {
    pos,
    vel,
    angle,
    steering: smoothedSteering,
    throttle
  };
}

export function updateCarPhysics(car, dt, surf, input, config) {
  const next = getNextCarState(car, dt, surf, input, config);
  car.pos = next.pos;
  car.vel = next.vel;
  car.angle = next.angle;
  car.steering = next.steering;
  car.throttle = next.throttle;
}
