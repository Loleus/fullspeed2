// physicsUtils.js – funkcje pomocnicze fizyki

export function calculateVelocity(velocity, acceleration, friction, drag, dt) {
  velocity.x += acceleration.x * dt;
  velocity.y += acceleration.y * dt;
  
  // Zastosuj tarcie
  velocity.x *= (1 - friction * dt);
  velocity.y *= (1 - friction * dt);
  
  // Zastosuj opór powietrza
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed > 0) {
    const dragForce = drag * speed * speed;
    velocity.x -= (velocity.x / speed) * dragForce * dt;
    velocity.y -= (velocity.y / speed) * dragForce * dt;
  }
  
  return velocity;
}

export function applyForce(velocity, force, mass, dt) {
  velocity.x += (force.x / mass) * dt;
  velocity.y += (force.y / mass) * dt;
  return velocity;
}

export function calculateCollisionResponse(velocity, normal, bounce) {
  const vDotN = velocity.x * normal.x + velocity.y * normal.y;
  const tangent = { 
    x: velocity.x - vDotN * normal.x, 
    y: velocity.y - vDotN * normal.y 
  };
  const vNormal = { 
    x: -vDotN * normal.x * bounce, 
    y: -vDotN * normal.y * bounce 
  };
  
  return {
    x: tangent.x + vNormal.x,
    y: tangent.y + vNormal.y
  };
} 