// obstacles.js – obsługa kolizji z przeszkodami na podstawie polygonów
import { obstaclePolys } from '../../world/world.js';
import { findClosestPointOnPolygon } from '../../core/utils.js';

// Funkcja do sprawdzenia czy punkt jest wewnątrz polygonu (ray casting algorithm)
function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
        (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
      inside = !inside;
    }
  }
  return inside;
}

// Sprawdź czy pozycja startowa nie jest wewnątrz przeszkody
export function checkStartPosition(startPos, obstaclePolys) {
  for (let i = 0; i < obstaclePolys.length; i++) {
    const isInside = isPointInPolygon(startPos, obstaclePolys[i]);
    if (isInside) {
      return false; // Pozycja startowa jest wewnątrz przeszkody
    }
  }
  return true; // Pozycja startowa jest bezpieczna
}

// Kolizja z przeszkodą: wypychanie i ślizganie
export function handleObstacleCollisionWithPolygon(car, CONFIG) {
  // Sprawdź kolizję z każdą przeszkodą
  for (const obstaclePoly of obstaclePolys) {
    const closestPoint = findClosestPointOnPolygon(car.pos, obstaclePoly);
    if (!closestPoint) continue;
    
    const dx = car.pos.x - closestPoint.x;
    const dy = car.pos.y - closestPoint.y;
    const distSq = dx * dx + dy * dy;
    
    // Jeśli samochód jest zbyt blisko przeszkody
    if (distSq < car.radius * car.radius) {
      const dist = Math.sqrt(distSq);
      const normal = { x: dx / dist, y: dy / dist };
      
      // Wypchnij samochód na zewnątrz przeszkody
      let pushSteps = 0;
      const maxPushSteps = 10;
      while (distSq < car.radius * car.radius && pushSteps < maxPushSteps) {
        car.pos.x += normal.x * 2;
        car.pos.y += normal.y * 2;
        pushSteps++;
      }
      
      // Odbij prędkość od normalnej przeszkody
      const dotProduct = car.vel.x * normal.x + car.vel.y * normal.y;
      car.vel.x -= 2 * dotProduct * normal.x;
      car.vel.y -= 2 * dotProduct * normal.y;
      
      // Zastosuj tarcie
      car.vel.x *= 0.8;
      car.vel.y *= 0.8;
    }
  }
}

// Sprawdza kolizję prostokąta auta z przeszkodami używając polygonów
function checkCarObstacleCollisionOnPolygons(car) {
  const carWidth = car.width;
  const carHeight = car.length;
  
  // Sprawdź rogi prostokąta samochodu
  const corners = [
    { x: car.pos.x - carWidth/2, y: car.pos.y - carHeight/2 },
    { x: car.pos.x + carWidth/2, y: car.pos.y - carHeight/2 },
    { x: car.pos.x + carWidth/2, y: car.pos.y + carHeight/2 },
    { x: car.pos.x - carWidth/2, y: car.pos.y + carHeight/2 }
  ];
  
  for (const corner of corners) {
    for (const polygon of obstaclePolys) {
      if (isPointInPolygon(corner, polygon)) {
        return { collided: true, index: 0 };
      }
    }
  }
  
  return { collided: false };
}

// Główna funkcja: sprawdza kolizję auta z przeszkodami
export function checkCarObstacleCollision(car) {
  return checkCarObstacleCollisionOnPolygons(car);
}
