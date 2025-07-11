// This file is the "conductor" - it coordinates everything else and runs the main animation loop
// It doesn't do physics or rendering itself, but tells other modules when to do their jobs

import { createPhysicsState } from './shared.js';
import { updatePhysics, handleBallCollisions, spawnBall, getBalls } from './objects.js';
import { 
    initializeCanvas, 
    clearCanvas, 
    render, 
    handleWallCollisions,
    getGravityValue,
    getFrictionValue,
    getMassValue,
    getDragCoefficient
} from './environment.js';

// --- Animation Loop Variables ---
let lastTime = 0; // Timestamp of the last frame (for deltaTime calculation)

// --- Control Synchronization ---
/**
 * Sets up synchronization between range sliders and text inputs
 * This makes sure when you move a slider, the text input updates and vice versa
 */
function setupControlSynchronization() {
    // Select all control groups (each has a slider and text input)
    const controlGroups = document.querySelectorAll('.control-group');

    controlGroups.forEach(group => {
        const rangeInput = group.querySelector('input[type="range"]');
        const textInput = group.querySelector('input[type="number"]');

        // When slider moves, update text input
        rangeInput.addEventListener('input', () => {
            textInput.value = rangeInput.value;
        });

        // When text input changes, update slider
        textInput.addEventListener('input', () => {
            let value = parseFloat(textInput.value);
            const min = parseFloat(rangeInput.min);
            const max = parseFloat(rangeInput.max);

            // Validate the input
            if (isNaN(value)) {
                // If not a number, revert to slider value
                textInput.value = rangeInput.value;
                return;
            }

            // Clamp value to valid range
            if (value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }

            // Update both inputs to the valid value
            rangeInput.value = value;
            textInput.value = value;
        });

        // Handle when user finishes editing text input
        textInput.addEventListener('change', () => {
            let value = parseFloat(textInput.value);
            const min = parseFloat(rangeInput.min);
            const max = parseFloat(rangeInput.max);

            // Ensure value is valid and in range
            if (isNaN(value) || value < min || value > max) {
                value = Math.max(min, Math.min(max, value));
            }
            
            rangeInput.value = value;
            textInput.value = value;
        });
    });
}

// --- Physics State Management ---
/**
 * Creates a physics state object from current control values
 * This bundles all physics settings into one object to pass around
 * @returns {PhysicsState} Current physics settings
 */
function getCurrentPhysicsState() {
    return createPhysicsState(
        getGravityValue(),
        getFrictionValue(),
        getDragCoefficient()
    );
}

// --- Main Animation Loop ---
/**
 * The main update loop that runs every frame
 * This is where everything happens: physics updates, collision detection, and rendering
 * @param {number} currentTime - Current timestamp from requestAnimationFrame
 */
function update(currentTime) {

    if (!lastTime) {
        lastTime = currentTime; // skip delta calc for first frame
    }
    // Calculate time elapsed since last frame (in seconds)
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // --- Step 1: Clear the canvas ---
    clearCanvas();

    // --- Step 2: Get current physics settings ---
    const physicsState = getCurrentPhysicsState();
    // Add deltaTime to physics state for modules that need it
    physicsState.deltaTime = deltaTime;

    // --- Step 3: Update ball physics ---
    // This applies gravity, drag, and updates positions
    updatePhysics(deltaTime, physicsState);

    // --- Step 4: Handle ball-to-ball collisions ---
    // This checks all balls against each other and resolves collisions
    handleBallCollisions();

    // --- Step 5: Handle wall collisions ---
    // This checks balls against canvas boundaries and applies bounce/friction
    const balls = getBalls();
    handleWallCollisions(balls, physicsState);

    // --- Step 6: Render everything ---
    // This draws all balls and their velocity arrows
    render(balls);

    // --- Step 7: Request next frame ---
    requestAnimationFrame(update);
}

// --- Ball Spawning ---
/**
 * Spawns a new ball when the spawn button is clicked
 * Uses current mass setting from the controls
 */
function handleSpawnBall() {
    const canvas = document.getElementById('myCanvas');
    const currentMass = getMassValue();
    const radiusM = 0.2; // Fixed radius in meters for all balls

    // Create ball configuration
    const ballConfig = {
        x: canvas.width / 2 + (Math.random() - 0.5) * 100, // Near center, slightly randomized
        y: canvas.height / 10 + (Math.random() - 0.5) * 50, // Near top, slightly randomized
        radiusM: radiusM,
        mass: currentMass
    };

    // Tell the objects module to create the ball
    spawnBall(ballConfig);
}

// --- Initialization ---
/**
 * Main initialization function
 * Sets up everything needed for the simulation
 */
function initialize() {
    // Initialize the rendering system
    initializeCanvas();
    
    // Set up control synchronization
    setupControlSynchronization();
    
    // Set up spawn button
    const spawnBtn = document.getElementById('btn');
    spawnBtn.addEventListener('click', handleSpawnBall);
    
    // Start the animation loop
    lastTime = performance.now();
    requestAnimationFrame(update);
    
    // Spawn the first ball automatically
    handleSpawnBall();
}

// --- Start Everything ---
// Wait for the DOM to load, then initialize
document.addEventListener('DOMContentLoaded', initialize);