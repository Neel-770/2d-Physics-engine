// This file contains all the physics constants and shared data structures
// Think of it as the "contract" that all other files agree to follow

// --- Physics Constants ---
// These don't change during runtime, so we define them once here
export const PHYSICS_CONFIG = {
    METER: 100, // 1 meter = 100 pixels (for rendering conversion)
    RESTITUTION_WALL_FLOOR: 0.7, // How bouncy walls/floor are (0 = no bounce, 1 = perfect bounce)
    RESTITUTION_BALL_BALL: 0.9, // How bouncy ball-to-ball collisions are
    FLUID_DENSITY: 1.225, // kg/m³ (density of air at standard conditions)
    VERSION: '1.0.0' // Version tracking in case we change these later
};

// --- Data Structure Templates ---
// These define what a "ball" object looks like and what physics state contains
// Everyone uses these same structures so we don't get confused about data format

/**
 * Ball Object Structure
 * This is what every ball in the simulation looks like
 * @typedef {Object} Ball
 * @property {number} x - Position in pixels (horizontal)
 * @property {number} y - Position in pixels (vertical)
 * @property {number} vx - Velocity in m/s (horizontal)
 * @property {number} vy - Velocity in m/s (vertical)
 * @property {number} radius - Radius in pixels (for rendering)
 * @property {number} radiusM - Radius in meters (for physics calculations)
 * @property {number} mass - Mass in kg
 * @property {string} color - Color for rendering (HSL format)
 */

/**
 * Physics State Object
 * Contains all the physics settings that can change during simulation
 * Gets passed around to avoid reading DOM elements repeatedly
 * @typedef {Object} PhysicsState
 * @property {number} gravity - Gravity acceleration in m/s²
 * @property {number} friction - Friction coefficient (0-1)
 * @property {number} drag - Drag coefficient (dimensionless)
 * @property {number} timestamp - When this state was created
 */

/**
 * Creates a physics state object from current values
 * This bundles all the physics settings into one neat package
 * @param {number} gravity - Gravity value in m/s²
 * @param {number} friction - Friction coefficient
 * @param {number} drag - Drag coefficient
 * @returns {PhysicsState} The physics state object
 */
export function createPhysicsState(gravity, friction, drag) {
    return {
        gravity,
        friction,
        drag,
        timestamp: Date.now() // For debugging - when was this state created?
    };
}

/**
 * Canvas Bounds Object
 * Defines the boundaries of our simulation world
 * @typedef {Object} CanvasBounds
 * @property {number} width - Canvas width in pixels
 * @property {number} height - Canvas height in pixels
 */

// --- Utility Functions ---
// Small helper functions that multiple files might need

/**
 * Clamps a value between min and max
 * Useful for keeping values in valid ranges
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} The clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Generates a random HSL color
 * Used for giving each ball a unique color
 * @param {number} index - Ball index (for consistent colors)
 * @returns {string} HSL color string
 */
export function generateBallColor(index) {
    return `hsl(${(index * 50) % 360}, 70%, 50%)`;
}


export const MATERIALS = {
  'ping-pong': { name: 'Ping Pong Ball', density: 2150, radius: 0.10, mass: 0.067 },
  'tennis': { name: 'Tennis Ball', density: 1700, radius: 0.16, mass: 0.137 },
  'golf': { name: 'Golf Ball', density: 1660, radius: 0.11, mass: 0.063 },
  'baseball': { name: 'Baseball', density: 680, radius: 0.18, mass: 0.069 },
  'billiard': { name: 'Billiard Ball', density: 1830, radius: 0.14, mass: 0.113 },
  'basketball': { name: 'Basketball', density: 1320, radius: 0.24, mass: 0.252 },
  'marble': { name: 'Marble', density: 2700, radius: 0.08, mass: 0.043 },
  'steel-bearing': { name: 'Steel Ball Bearing', density: 7850, radius: 0.12, mass: 0.355 },
  'bowling': { name: 'Bowling Ball', density: 1900, radius: 0.22, mass: 0.290 },
  'lead-shot': { name: 'Lead Shot', density: 11340, radius: 0.06, mass: 0.043 }
};