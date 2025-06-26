// hud.js – rysowanie liczników i logika HUD
import { getCarGear, getCarRpm, getCarSpeedKmh } from '../entities/car/carStats.js';

export function drawHUD(ctx, fps, car, config, keys) {
  ctx.save();
  ctx.font = '24px Arial';
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'top';
  ctx.fillText('FPS: ' + fps, 12, 8);
  const speed = getCarSpeedKmh(car);
  ctx.fillText('Prędkość: ' + Math.round(speed) + ' km/h', 12, 40);
  const gear = getCarGear(car, config);
  ctx.fillText('Bieg: ' + (gear === 0 ? '0' : gear), 12, 72);
  const rpm = getCarRpm(car, config, keys);
  ctx.fillText('Obroty: ' + rpm + ' rpm', 12, 104);
  ctx.restore();
}
