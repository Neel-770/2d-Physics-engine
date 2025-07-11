// This file owns everything about balls: creating them, updating their physics, and handling collisions
// Think of this as the "ball manager" - it knows about all balls and how they move/interact

import { PHYSICS_CONFIG, generateBallColor } from './shared.js';

// --- Ball Storage ---
// This is THE master list of all balls in the simulation
// Other files can read this but shouldn't modify it directly
let balls = [];

// --- Ball Creation ---
/**
 * Creates a new ball with the specified properties
 * This is our "ball factory" - it makes sure all balls have the right structure
 * @param {number} initialX - Starting X position in pixels
 * @param {number} initialY - Starting Y position in pixels  
 * @param {number} radiusM - Radius in meters
 * @param {number} mass - Mass in kg
 * @returns {Ball} A new ball object
 */
function createBall(initialX, initialY, radiusM, mass) {
    const radiusPx = radiusM * PHYSICS_CONFIG.METER; // Convert meters to pixels for rendering
    
    return {
        x: initialX, // Position in pixels
        y: initialY, 
        radiusM: radiusM, // Radius in meters (for physics calculations)
        radius: radiusPx, // Radius in pixels (for rendering)
        vx: (Math.random() - 0.5) * 2, // Random initial horizontal velocity m/s
        vy: 0, // Start with no vertical velocity
        mass: mass, // Mass in kg
        color: generateBallColor(balls.length) // Unique color based on ball count
    };
}

// --- Physics Updates ---
/**
 * Updates physics for all balls (gravity, drag, position)
 * This is the main physics loop - applies forces and updates positions
 * @param {number} deltaTime - Time elapsed since last update (in seconds)
 * @param {PhysicsState} physicsState - Current physics settings
 */
export function updatePhysics(deltaTime, physicsState) {
    // Loop through each ball and apply physics
    balls.forEach(ball => {
        const m = ball.mass; // Mass in kg
        const g = physicsState.gravity; // Gravity in m/s²
        const Cd = physicsState.drag; // Drag coefficient
        const rho = PHYSICS_CONFIG.FLUID_DENSITY; // Air density
        const radiusM = ball.radiusM; // Ball radius in meters
        const area = Math.PI * radiusM ** 2; // Cross-sectional area in m²

        // --- 1. Apply Gravity ---
        // F = mg, so acceleration = g (force per unit mass)
        ball.vy += g * deltaTime;

        // --- 2. Apply Drag Force ---
        // Drag opposes motion: F_drag = 0.5 * Cd * ρ * A * v²
        // We calculate drag for X and Y separately
        
        const speedX = Math.abs(ball.vx);
        const speedY = Math.abs(ball.vy);

        // Calculate drag force magnitude for each direction
        const dragMagnitudeX = 0.5 * Cd * rho * area * speedX * speedX;
        const dragMagnitudeY = 0.5 * Cd * rho * area * speedY * speedY;

        // Apply drag acceleration (F/m) in opposite direction of velocity
        if (speedX > 0.01) { // Only apply if moving fast enough (prevents tiny oscillations)
            ball.vx -= (Math.sign(ball.vx) * dragMagnitudeX / m) * deltaTime;
        } else {
            ball.vx = 0; // Stop tiny movements
        }
        
        if (speedY > 0.01) { // Same for vertical movement
            ball.vy -= (Math.sign(ball.vy) * dragMagnitudeY / m) * deltaTime;
        } else {
            ball.vy = 0; // Stop tiny movements
        }

        // --- 3. Update Position ---
        // Convert velocity from m/s to pixels/second, then to pixels/frame
        ball.x += ball.vx * deltaTime * PHYSICS_CONFIG.METER;
        ball.y += ball.vy * deltaTime * PHYSICS_CONFIG.METER;
    });
}

// --- Ball-to-Ball Collision Detection & Resolution ---
/**
 * Checks all balls against each other and resolves collisions
 * This is O(n²) - for each ball, check against every other ball
 * For 50 balls, that's 2500 checks per frame (should be fine for 60fps)
 */
export function handleBallCollisions() {
    // Nested loop: check every ball against every other ball
    // Start j at i+1 to avoid checking the same pair twice
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            resolveBallCollision(balls[i], balls[j]);
        }
    }
}

/**
 * Resolves collision between two specific balls
 * This is where the actual physics magic happens
 * @param {Ball} b1 - First ball
 * @param {Ball} b2 - Second ball
 */
function resolveBallCollision(b1, b2) {
    // --- Step 1: Check if balls are actually colliding ---
    const dx = b2.x - b1.x; // Distance between centers (X)
    const dy = b2.y - b1.y; // Distance between centers (Y)
    const dist = Math.sqrt(dx * dx + dy * dy); // Actual distance between centers

    const minDistance = b1.radius + b2.radius; // Minimum distance (when just touching)
    
    // If distance >= minimum distance, no collision
    // Also check dist === 0 to avoid division by zero if balls are perfectly stacked
    if (dist >= minDistance || dist === 0) {
        return; // No collision, exit early
    }

    // --- Step 2: Calculate collision normal ---
    // This is the direction of the collision (unit vector pointing from b1 to b2)
    const nx = dx / dist; // Normalized X component
    const ny = dy / dist; // Normalized Y component

    // --- Step 3: Calculate relative velocity ---
    // How fast are the balls moving relative to each other?
    const rvx = b2.vx - b1.vx; // Relative velocity X
    const rvy = b2.vy - b1.vy; // Relative velocity Y

    // Project relative velocity onto collision normal
    // This tells us how fast they're moving toward/away from each other
    const normalVelocity = rvx * nx + rvy * ny;

    // If objects are moving away from each other, don't resolve
    // This prevents "double collisions" when balls are separating
    if (normalVelocity > 0) {
        return;
    }

    // --- Step 4: Calculate impulse ---
    // Impulse is the change in momentum needed to resolve the collision
    // Formula: J = -(1+e) * normalVelocity / (1/m1 + 1/m2)
    // where e is the coefficient of restitution (bounciness)
    const e = PHYSICS_CONFIG.RESTITUTION_BALL_BALL;
    const impulseMagnitude = -(1 + e) * normalVelocity / (1 / b1.mass + 1 / b2.mass);

    // --- Step 5: Apply impulse to velocities ---
    // Change velocity based on impulse and mass
    b1.vx -= (impulseMagnitude / b1.mass) * nx;
    b1.vy -= (impulseMagnitude / b1.mass) * ny;
    b2.vx += (impulseMagnitude / b2.mass) * nx;
    b2.vy += (impulseMagnitude / b2.mass) * ny;

    // --- Step 6: Separate overlapping balls ---
    // If balls are overlapping, push them apart to prevent sticking
    const overlap = minDistance - dist;
    const separationAmount = overlap / 2; // Split the separation evenly

    b1.x -= separationAmount * nx;
    b1.y -= separationAmount * ny;
    b2.x += separationAmount * nx;
    b2.y += separationAmount * ny;
}

// --- Ball Management Functions ---
/**
 * Spawns a new ball with given configuration
 * This is called from main.js when the spawn button is clicked
 * @param {Object} config - Ball configuration
 * @param {number} config.x - X position in pixels
 * @param {number} config.y - Y position in pixels
 * @param {number} config.radiusM - Radius in meters
 * @param {number} config.mass - Mass in kg
 */
export function spawnBall(config) {
    const newBall = createBall(config.x, config.y, config.radiusM, config.mass);
    balls.push(newBall);
}

/**
 * Returns reference to the balls array
 * Other modules can read this but shouldn't modify it directly
 * @returns {Ball[]} Array of all balls
 */
export function getBalls() {
    return balls;
}

/**
 * Gets the current number of balls
 * @returns {number} Number of balls in simulation
 */
export function getBallCount() {
    return balls.length;
}

/**
 * Clears all balls from the simulation
 * Useful for reset functionality
 */
export function clearAllBalls() {
    balls.length = 0; // Clear the array
}