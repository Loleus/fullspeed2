// hud.js – rysowanie liczników i logika HUD
let rpmDisplay = 1200;
export const GEAR_SPEEDS = [0, 70, 110, 150, 180, 200, 220];
export const MAX_RPM = 8500;
export const IDLE_RPM = 1200;

export function getCarSpeedKmh(car) {
  return Math.hypot(car.vel.x, car.vel.y) * 8.5;
}
export function getCarGear(car, config) {
  const fSpd = car.vel.x * Math.cos(car.angle) + car.vel.y * Math.sin(car.angle);
  if (fSpd < -config.STOP_EPS) return 'R';
  const speedKmh = getCarSpeedKmh(car);
  if (speedKmh < 1) return 0;
  for (let i = 1; i < GEAR_SPEEDS.length; ++i) {
    if (speedKmh < GEAR_SPEEDS[i]) return i;
  }
  return 6;
}
export function getCarRpm(car, config, keys) {
  const speedKmh = getCarSpeedKmh(car);
  const gear = getCarGear(car, config);
  if (gear === 0) {
    const target = keys.ArrowUp ? 6000 : IDLE_RPM;
    rpmDisplay += (target - rpmDisplay) * 0.18;
    return Math.round(rpmDisplay);
  }
  if (gear === 'R') return IDLE_RPM;
  const rpmRanges = [
    [0, 0],
    [6000, 8000],
    [5000, 7000],
    [4000, 6000],
    [3000, 5000],
    [2500, 4000],
    [2000, 3500],
  ];
  const v0 = GEAR_SPEEDS[gear - 1];
  const v1 = GEAR_SPEEDS[gear];
  let ratio = (speedKmh - v0) / (v1 - v0);
  ratio = Math.max(0, Math.min(1, ratio));
  const [rpmMin, rpmMax] = rpmRanges[gear];
  return Math.round(rpmMin + ratio * (rpmMax - rpmMin));
}

export function drawHUD(ctx, fps, car, config, keys) {
  ctx.save();
  ctx.font = '24px Arial';
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'top';
  ctx.fillText('FPS: ' + fps, 12, 8);
  // const speed = getCarSpeedKmh(car);
  // ctx.fillText('Prędkość: ' + Math.round(speed) + ' km/h', 12, 40);
  // const gear = getCarGear(car, config);
  // ctx.fillText('Bieg: ' + (gear === 0 ? '0' : gear), 12, 72);
  // const rpm = getCarRpm(car, config, keys);
  // ctx.fillText('Obroty: ' + rpm + ' rpm', 12, 104);
  ctx.restore();
}
