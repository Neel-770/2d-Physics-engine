// This file owns everything about the visual world: canvas setup, drawing, and wall collisions
// Think of this as the "world manager" - it knows about boundaries and how to draw things

import { PHYSICS_CONFIG } from './shared.js';
import { clearAllBalls } from './objects.js';
// --- Canvas Management ---
let canvas;
let ctx;

/**
 * Initializes the canvas and gets the rendering context
 * Call this once at startup
 */
export function initializeCanvas() {
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');
    
    if (!canvas || !ctx) {
        throw new Error('Canvas not found! Make sure you have <canvas id="myCanvas"> in your HTML');
    }

    // Match internal buffer size with visual size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

/**
 * Gets the canvas dimensions
 * Used by other modules to know the world boundaries
 * @returns {CanvasBounds} Canvas width and height
 */
export function getCanvasDimensions() {
    return {
        width: canvas.width,
        height: canvas.height
    };
}

// --- Rendering Functions ---
/**
 * Clears the entire canvas
 * Call this at the start of each frame
 */
export function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draws a single ball on the canvas
 * @param {Ball} ball - The ball to draw
 */
function drawBall(ball) {
    // Draw the ball circle
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    ctx.fillStyle = ball.color;
    ctx.fill();
    
    // Draw the outline
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

/**
 * Draws a velocity arrow for a ball
 * The arrow shows the direction and speed of the ball
 * @param {Ball} ball - The ball to draw velocity for
 */
function drawVelocityArrow(ball) {
    const arrowScale = 0.5; // Makes arrows visible but not too long
    
    // Calculate arrow end position
    const endX = ball.x + ball.vx * PHYSICS_CONFIG.METER * arrowScale;
    const endY = ball.y + ball.vy * PHYSICS_CONFIG.METER * arrowScale;

    // Draw the main arrow line
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw the arrowhead
    const angle = Math.atan2(endY - ball.y, endX - ball.x);
    const arrowHeadLength = 10;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    // Left side of arrowhead
    ctx.lineTo(
        endX - arrowHeadLength * Math.cos(angle - Math.PI / 6), 
        endY - arrowHeadLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    // Right side of arrowhead
    ctx.lineTo(
        endX - arrowHeadLength * Math.cos(angle + Math.PI / 6), 
        endY - arrowHeadLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

/**
 * Renders all balls and their velocity arrows
 * This is the main rendering function called each frame
 * @param {Ball[]} balls - Array of all balls to render
 */
export function render(balls) {
    // Draw each ball and its velocity arrow
    balls.forEach(ball => {
        drawBall(ball);
        drawVelocityArrow(ball);
    });
}

// --- Wall Collision Detection & Resolution ---
/**
 * Handles collisions between balls and walls/floor
 * This modifies ball positions and velocities when they hit boundaries
 * @param {Ball[]} balls - Array of all balls to check
 * @param {PhysicsState} physicsState - Current physics settings
 */
export function handleWallCollisions(balls, physicsState) {
    const canvasBounds = getCanvasDimensions();
    
    balls.forEach(ball => {
        // --- Floor Collision ---
        if (ball.y + ball.radius > canvasBounds.height) {
            // Position ball on the floor (prevent sinking)
            ball.y = canvasBounds.height - ball.radius;
            
            // Reverse vertical velocity and apply bounce
            ball.vy *= -PHYSICS_CONFIG.RESTITUTION_WALL_FLOOR;

            // Apply friction when touching ground
            // Friction force = μ * Normal force
            // On flat ground, normal force ≈ weight = mg
            const normalForce = ball.mass * physicsState.gravity;
            const mass = Math.max(ball.mass, 0.0001);
            const frictionAcceleration = physicsState.friction * normalForce / ball.mass;
            
            // Apply friction to horizontal velocity
            if (Math.abs(ball.vx) > frictionAcceleration * physicsState.deltaTime) {
                ball.vx -= Math.sign(ball.vx) * frictionAcceleration * physicsState.deltaTime;
            } else {
                ball.vx = 0; // Stop if friction is strong enough
            }

            // Stop tiny bounces (prevents endless tiny movements)
            if (Math.abs(ball.vy) < 0.5) {
                ball.vy = 0;
            }
        }

        // --- Right Wall Collision ---
        if (ball.x + ball.radius > canvasBounds.width) {
            ball.x = canvasBounds.width - ball.radius; // Position at wall
            ball.vx *= -PHYSICS_CONFIG.RESTITUTION_WALL_FLOOR; // Reverse and apply bounce
        }
        
        // --- Left Wall Collision ---
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius; // Position at wall
            ball.vx *= -PHYSICS_CONFIG.RESTITUTION_WALL_FLOOR; // Reverse and apply bounce
        }

        // Note: We don't handle ceiling collision because balls shouldn't go up that high
        // If you want ceiling collision, add:
        // if (ball.y - ball.radius < 0) {
        //     ball.y = ball.radius;
        //     ball.vy *= -PHYSICS_CONFIG.RESTITUTION_WALL_FLOOR;
        // }
    });
}

// --- Input Control Getters ---
// These functions read the current values from the HTML controls
// They're here because the environment module handles user interaction

/**
 * Gets the current gravity value from the slider
 * @returns {number} Gravity in m/s²
 */
export function getGravityValue() {
    const gravityInput = document.getElementById('gravityRange');
    return parseFloat(gravityInput.value);
}

/**
 * Gets the current friction value from the slider
 * @returns {number} Friction coefficient
 */
export function getFrictionValue() {
    const frictionInput = document.getElementById('frictionRange');
    return parseFloat(frictionInput.value);
}

/**
 * Gets the current mass value from the slider
 * @returns {number} Mass in kg
 */
export function getMassValue() {
    const massInput = document.getElementById('massRange');
    return parseFloat(massInput.value);
}

/**
 * Gets the current density value from the slider
 * @returns {number} Density in kg/m³
 */
export function getDensityValue() {
    const densityInput = document.getElementById('densityRange');
    return parseFloat(densityInput.value);
}

/**
 * Gets the current drag coefficient from the slider
 * @returns {number} Drag coefficient (dimensionless)
 */
export function getDragCoefficient() {
    const dragInput = document.getElementById('dragRange');
    return parseFloat(dragInput.value);
}

/**
 * Gets the current radius value from the slider
 * @returns {number} Radius in meters
 */
export function getRadiusValue() {
    const radiusInput = document.getElementById('radiusRange');
    return parseFloat(radiusInput.value);
}



/**
 * Sets the mass value in both slider and text input
 * @param {number} value - Mass in kg
 */
export function setMassValue(value) {
    const massRange = document.getElementById('massRange');
    const massText = document.getElementById('massText');
    const clampedValue = Math.min(Math.max(value, parseFloat(massRange.min)), parseFloat(massRange.max));
    massRange.value = clampedValue.toFixed(3); // 3 decimal places for grams
    massText.value = clampedValue.toFixed(3);
}

/**
 * Sets the radius value in both slider and text input
 * @param {number} value - Radius in meters
 */
export function setRadiusValue(value) {
    const radiusRange = document.getElementById('radiusRange');
    const radiusText = document.getElementById('radiusText');
    const clampedValue = Math.min(Math.max(value, parseFloat(radiusRange.min)), parseFloat(radiusRange.max));
    radiusRange.value = clampedValue.toFixed(2); // 2 decimal places for cm precision
    radiusText.value = clampedValue.toFixed(2);
}

/**
 * Sets the density value in both slider and text input
 * @param {number} value - Density in kg/m³
 */
export function setDensityValue(value) {
    const densityRange = document.getElementById('densityRange');
    const densityText = document.getElementById('densityText');
    const clampedValue = Math.min(Math.max(value, parseFloat(densityRange.min)), parseFloat(densityRange.max));
    densityRange.value = Math.round(clampedValue); // Whole numbers for density
    densityText.value = Math.round(clampedValue);
}

/**
 * Gets the current material selection
 * @returns {string} Material key
 */
export function getMaterialSelection() {
    const materialSelect = document.getElementById('materialSelect');
    return materialSelect.value;
}

let clr_canv=document.getElementById('clr_canv')
clr_canv.addEventListener('click',()=>{
    clearAllBalls()
})