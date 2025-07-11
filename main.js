// Importing functions from other modules
import { createPhysicsState } from './shared.js'; // Creates a physics state object

import {
  updatePhysics,           // Applies physics (forces, velocity, position update)
  handleBallCollisions,    // Handles ball-to-ball collisions
  spawnBall,               // Spawns a new ball with given config
  getBalls                 // Returns current list of balls
} from './objects.js';

import {
  initializeCanvas,        // Sets up canvas size and context
  clearCanvas,              // Clears the canvas each frame
  render,                   // Renders all objects (balls, velocity vectors)
  handleWallCollisions,     // Handles collisions with walls
  getGravityValue,          // Gets gravity value from input
  getFrictionValue,         // Gets friction value from input
  getMassValue,             // Gets current object mass from input
  getDragCoefficient        // Gets air resistance value from input
} from './environment.js';

let lastTime = 0; // Used to calculate deltaTime between frames

/**
 * Syncs all slider inputs and number inputs to reflect the same values.
 * Ensures user can type OR slide and both stay in sync.
 */
function syncControls() {
  const groups = document.querySelectorAll('.control-group');

  groups.forEach(group => {
    const [range, number] = group.querySelectorAll('input');

    // If slider changes, update number input
    range.addEventListener('input', () => number.value = range.value);

    // If number changes, update slider input
    number.addEventListener('input', () => {
      let v = parseFloat(number.value);

      // If input is invalid, fallback to slider's value
      if (isNaN(v)) v = parseFloat(range.value);

      // Clamp value to min/max
      v = Math.min(Math.max(v, range.min), range.max);

      number.value = range.value = v;
    });
  });
}

/**
 * Combines current input settings into a physics state object
 * This gets passed into physics and collision functions.
 */
function getCurrentPhysicsState() {
  return createPhysicsState(
    getGravityValue(),
    getFrictionValue(),
    getDragCoefficient()
  );
}

/**
 * Main animation loop - runs every frame
 * Handles:
 *  - Clearing canvas
 *  - Applying physics
 *  - Handling collisions
 *  - Drawing everything
 */
function update(currentTime) {
  // First frame skip delta calculation
  if (!lastTime) lastTime = currentTime;

  // Calculate time difference in seconds
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Clear canvas
  clearCanvas();

  // Get updated physics state and pass deltaTime
  const physics = getCurrentPhysicsState();
  physics.deltaTime = deltaTime;

  // Step simulation forward
  updatePhysics(deltaTime, physics); // Update positions, velocities
  handleBallCollisions();            // Detect & resolve ball-to-ball
  const balls = getBalls();          // Get active balls
  handleWallCollisions(balls, physics); // Handle canvas boundary collisions
  render(balls);                     // Draw everything

  // Continue loop
  requestAnimationFrame(update);
}

/**
 * Handles spawning of a new ball using current mass setting.
 */
function handleSpawnBall() {
  const canvas = document.getElementById('myCanvas');
  const mass = getMassValue();
  const radiusM = 0.2; // Fixed radius (can be dynamic later)

  const config = {
    x: canvas.width / 2 + (Math.random() - 0.5) * 100, // Random offset near center
    y: canvas.height / 10 + (Math.random() - 0.5) * 50, // Random offset near top
    radiusM,
    mass
  };

  spawnBall(config); // Create and store the new ball
}

/**
 * Initializes everything on page load:
 * - Canvas setup
 * - Input sync
 * - Button handler
 * - Starts animation loop
 */
function initialize() {
  initializeCanvas(); // Prepare canvas
  syncControls();     // Connect sliders + text boxes
  document.getElementById('btn').addEventListener('click', handleSpawnBall); // Spawn handler
  requestAnimationFrame(update); // Begin animation
  handleSpawnBall(); // Auto-spawn first ball
}

// Start the app when page is ready
document.addEventListener('DOMContentLoaded', initialize);
