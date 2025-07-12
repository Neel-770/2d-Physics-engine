// Importing functions from other modules
import { createPhysicsState, MATERIALS } from './shared.js'; // Creates a physics state object

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
  getDragCoefficient,       // Gets air resistance value from input
  getDensityValue,
  getRadiusValue,
  setMassValue,
  setRadiusValue,
  setDensityValue,
  getMaterialSelection
} from './environment.js';

let lastTime = 0; // Used to calculate deltaTime between frames

/**
 * Syncs all controls with material-first approach
 */
function syncControls() {
  let isUpdating = false;

  // Basic sync for non-physics controls
  const nonPhysicsGroups = document.querySelectorAll('.control-group:not(:has(#massRange, #densityRange, #radiusRange))');
  nonPhysicsGroups.forEach(group => {
    const [range, number] = group.querySelectorAll('input');
    if (range && number) {
      range.addEventListener('input', () => number.value = range.value);
      number.addEventListener('input', () => {
        let v = parseFloat(number.value);
        if (isNaN(v)) v = parseFloat(range.value);
        v = Math.min(Math.max(v, parseFloat(range.min)), parseFloat(range.max));
        number.value = range.value = v;
      });
    }
  });

  // Physics control sync (mass, density, radius)
  const physicsControls = ['mass', 'density', 'radius'];
  physicsControls.forEach(control => {
    const range = document.getElementById(control + 'Range');
    const number = document.getElementById(control + 'Text');

    range.addEventListener('input', () => number.value = range.value);
    number.addEventListener('input', () => {
      let v = parseFloat(number.value);
      if (isNaN(v)) v = parseFloat(range.value);
      v = Math.min(Math.max(v, parseFloat(range.min)), parseFloat(range.max));
      number.value = range.value = v;
    });
  });

  // Material selection handler
  const materialSelect = document.getElementById('materialSelect');
  materialSelect.addEventListener('change', () => {
    if (isUpdating) return;
    isUpdating = true;

    const materialKey = materialSelect.value;
    const material = MATERIALS[materialKey];

    setDensityValue(material.density);
    setRadiusValue(material.radius);
    setMassValue(material.mass); // Use pre-calculated realistic mass

    isUpdating = false;
  });

  // Manual radius change (user overrides material)
  const radiusRange = document.getElementById('radiusRange');
  const radiusText = document.getElementById('radiusText');

  function onRadiusChange() {
    if (isUpdating) return;
    isUpdating = true;

    const radius = parseFloat(radiusRange.value);
    const density = getDensityValue();
    const newMass = density * Math.PI * radius * radius;

    setMassValue(newMass);
    isUpdating = false;
  }

  // Manual mass change (user overrides material)
  const massRange = document.getElementById('massRange');
  const massText = document.getElementById('massText');

  function onMassChange() {
    if (isUpdating) return;
    isUpdating = true;

    const mass = parseFloat(massRange.value);
    const density = getDensityValue();
    const newRadius = Math.sqrt(mass / (density * Math.PI));

    setRadiusValue(newRadius);
    isUpdating = false;
  }

  // Add the physics binding listeners
  radiusRange.addEventListener('input', onRadiusChange);
  radiusText.addEventListener('input', onRadiusChange);
  massRange.addEventListener('input', onMassChange);
  massText.addEventListener('input', onMassChange);

  // Initialize with first material
  materialSelect.dispatchEvent(new Event('change'));
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
 * Handles spawning of a new ball using current mass and radius settings.
 */
function handleSpawnBall() {
  const canvas = document.getElementById('myCanvas');
  const mass = getMassValue();
  const radiusM = getRadiusValue(); // Now dynamic

  const config = {
    x: canvas.width / 2 + (Math.random() - 0.5) * 100,
    y: canvas.height / 10 + (Math.random() - 0.5) * 50,
    radiusM,
    mass
  };

  spawnBall(config);
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