// carStats.js – logika statystyk auta

export const GEAR_SPEEDS = [0, 70, 110, 150, 180, 200, 220];
export const MAX_RPM = 8500;
export const IDLE_RPM = 1200;

export function getCarSpeedKmh(car) {
  return Math.abs(car.speed) * 3.6;
}

export function getCarGear(car, config) {
  if (car.gear === 'R') return 'R';
  if (car.gear === 0) return 0;
  const speedKmh = getCarSpeedKmh(car);
  if (speedKmh < 1) return 0;
  for (let i = 1; i < GEAR_SPEEDS.length; ++i) {
    if (speedKmh < GEAR_SPEEDS[i]) return i;
  }
  return 6;
}

let rpmDisplay = IDLE_RPM;
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