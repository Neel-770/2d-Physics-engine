// --- Importing Dependencies ---

// These functions handle physics updates, collisions, and spawning
import {
  updatePhysics,
  handleBallCollisions,
  spawnBall,
  getBalls
} from './objects.js';

// These functions handle canvas setup, rendering, environment controls, and reading/writing values
import {
  initializeCanvas,
  clearCanvas,
  render,
  handleWallCollisions,
  getGravityValue,
  getFrictionValue,
  getMassValue,
  getDragCoefficient,
  getDensityValue,
  getRadiusValue,
  setMassValue,
  setRadiusValue,
  setDensityValue,
  getMaterialSelection
} from './environment.js';

// These provide shared constants (like physics units) and material presets
import {
  createPhysicsState,
  MATERIALS
} from './shared.js';

let lastTime = 0; // Timestamp of last frame for deltaTime calculation

// Creates a fresh physics state object (gravity, friction, drag) for each update cycle
function getCurrentPhysicsState() {
  return createPhysicsState(
    getGravityValue(),
    getFrictionValue(),
    getDragCoefficient()
  );
}

// Main animation loop called by requestAnimationFrame
function update(currentTime) {
  if (!lastTime) lastTime = currentTime;
  const deltaTime = (currentTime - lastTime) / 1000; // Convert ms to seconds
  lastTime = currentTime;

  clearCanvas(); // Clear previous frame

  const physics = getCurrentPhysicsState(); // Get current settings
  physics.deltaTime = deltaTime; // Pass frame time to physics

  updatePhysics(deltaTime, physics); // Update position, velocity, drag
  handleBallCollisions(); // Handle ball-ball collisions
  const balls = getBalls(); // Fetch current ball list
  handleWallCollisions(balls, physics); // Handle wall-ground collisions
  render(balls); // Draw everything

  requestAnimationFrame(update); // Schedule next frame
}

// Called when the "Spawn Object" button is clicked
function handleSpawnBall() {
  const canvas = document.getElementById('myCanvas');
  const mass = getMassValue();
  const radiusM = getRadiusValue();

  const config = {
    x: canvas.width / 2 + (Math.random() - 0.5) * 100, // Spawn near center
    y: canvas.height / 10 + (Math.random() - 0.5) * 50,
    radiusM,
    mass
  };

  spawnBall(config); // Add a new ball to the simulation
}

// Initializes canvas, control syncing, event listeners, and starts the animation loop
function initialize() {
  initializeCanvas(); // Prepare canvas
  syncControls(); // Connect UI sliders and dropdowns
  document.getElementById('btn').addEventListener('click', handleSpawnBall); // Button handler
  requestAnimationFrame(update); // Start simulation
  handleSpawnBall(); // Add first object immediately
}

document.addEventListener('DOMContentLoaded', initialize); // Start when page loads


// --- UI Control Sync Logic ---

function syncControls() {
  let isUpdating = false; // Prevents recursion when updating linked controls
  let enableRealisticBinding = false; // If true, sliders are linked based on real mass-density-radius formula

  // Sync every range-number pair (e.g., gravity slider and number input)
  const controlGroups = document.querySelectorAll('.control-group');
  controlGroups.forEach(group => {
    const [range, number] = group.querySelectorAll('input[type="range"], input[type="number"]');
    if (range && number) {
      // When slider changes, update number box
      range.addEventListener('input', () => number.value = range.value);

      // When number changes, validate and update slider
      number.addEventListener('input', () => {
        let v = parseFloat(number.value);
        if (isNaN(v)) v = parseFloat(range.value);
        v = Math.min(Math.max(v, parseFloat(range.min)), parseFloat(range.max));
        range.value = number.value = v;
      });
    }
  });

  // Fetch references to radius, mass, density inputs
  const materialSelect = document.getElementById('materialSelect');
  const radiusRange = document.getElementById('radiusRange');
  const radiusText = document.getElementById('radiusText');
  const massRange = document.getElementById('massRange');
  const massText = document.getElementById('massText');
  const densityRange = document.getElementById('densityRange');
  const densityText = document.getElementById('densityText');

  // Recalculates mass when radius or density changes
  function updateMassFromRadiusAndDensity() {
    const r = parseFloat(radiusRange.value);
    const d = parseFloat(densityRange.value);
    const m = Math.PI * r * r * d;
    setMassValue(m);
  }

  // Recalculates radius when mass or density changes
  function updateRadiusFromMassAndDensity() {
    const m = parseFloat(massRange.value);
    const d = parseFloat(densityRange.value);
    const r = Math.sqrt(m / (Math.PI * d));
    setRadiusValue(r);
  }

  function updateMassFromDensityAndRadius() {
    updateMassFromRadiusAndDensity(); // Alias function
  }

  // Link sliders for realistic physics when enabled
  radiusRange.addEventListener('input', () => {
    if (isUpdating || !enableRealisticBinding) return;
    isUpdating = true;
    updateMassFromRadiusAndDensity();
    isUpdating = false;
  });

  radiusText.addEventListener('input', () => {
    if (isUpdating || !enableRealisticBinding) return;
    isUpdating = true;
    updateMassFromRadiusAndDensity();
    isUpdating = false;
  });

  massRange.addEventListener('input', () => {
    if (isUpdating || !enableRealisticBinding) return;
    isUpdating = true;
    updateRadiusFromMassAndDensity();
    isUpdating = false;
  });

  massText.addEventListener('input', () => {
    if (isUpdating || !enableRealisticBinding) return;
    isUpdating = true;
    updateRadiusFromMassAndDensity();
    isUpdating = false;
  });

  densityRange.addEventListener('input', () => {
    if (isUpdating || !enableRealisticBinding) return;
    isUpdating = true;
    updateMassFromDensityAndRadius();
    isUpdating = false;
  });

  densityText.addEventListener('input', () => {
    if (isUpdating || !enableRealisticBinding) return;
    isUpdating = true;
    updateMassFromDensityAndRadius();
    isUpdating = false;
  });

  // Handle dropdown material selection
  materialSelect.addEventListener('change', () => {
    if (isUpdating) return;
    isUpdating = true;

    const materialKey = materialSelect.value;

    if (materialKey !== 'custom') {
      // Set density, radius, and mass from material preset
      const mat = MATERIALS[materialKey];
      setDensityValue(mat.density);
      setRadiusValue(mat.radius);
      setMassValue(mat.mass);
      enableRealisticBinding = true; // Lock sliders together
    } else {
      enableRealisticBinding = false; // Free sliders when "custom"
    }

    isUpdating = false;
  });

  // Trigger material change once on load to apply defaults
  materialSelect.dispatchEvent(new Event('change'));
}
