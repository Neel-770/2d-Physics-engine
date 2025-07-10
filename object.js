// object.js - Main Physics Simulation Logic with Ball-to-Ball Collisions
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // --- Input Controls ---
    const gravityInput = document.getElementById('gravityRange');
    const frictionInput = document.getElementById('frictionRange'); // For wall/floor friction
    const massInput = document.getElementById('massRange');
    const densityInput = document.getElementById('densityRange'); // Object density
    const dragInput = document.getElementById('dragRange'); // Air resistance Cd
    const spawnBtn = document.getElementById('btn');

    // --- Physics Constants ---
    const METER = 100; // 1 meter = 100 pixels (for rendering)
    const RESTITUTION_WALL_FLOOR = 0.7; // Bounciness for wall/floor collisions
    const RESTITUTION_BALL_BALL = 0.9; // Bounciness for ball-to-ball collisions (closer to 1 for "hard" balls)
    const FLUID_DENSITY = 1.225; // kg/m³ (density of air at STP)

    let balls = [];
    let lastTime = 0;

    // --- Getters for input values ---
    const getGravityValue = () => parseFloat(gravityInput.value); // in m/s^2
    const getFrictionValue = () => parseFloat(frictionInput.value); // coefficient of friction (for ground)
    const getMassValue = () => parseFloat(massInput.value); // in kg
    const getDensityValue = () => parseFloat(densityInput.value); // in kg/m^3 (object's density for air resistance)
    const getDragCoefficient = () => parseFloat(dragInput.value); // Cd (dimensionless)

    // --- Ball Object Constructor/Factory ---
    function createBall(initialX, initialY, radiusM, mass) {
        const radiusPx = radiusM * METER;
        return {
            x: initialX, // in pixels
            y: initialY, // in pixels
            radiusM: radiusM, // radius in meters
            radius: radiusPx, // radius in pixels
            vx: (Math.random() - 0.5) * 2, // Initial horizontal velocity m/s
            vy: 0,                         // Initial vertical velocity m/s
            mass: mass, // in kg
            color: `hsl(${(balls.length * 50) % 360}, 70%, 50%)`
        };
    }

    // --- Drawing Functions ---
    function drawBall(ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    function drawVelocityArrow(ball) {
        const arrowScale = 0.5; // Adjust length of arrow for visibility
        const endX = ball.x + ball.vx * METER * arrowScale;
        const endY = ball.y + ball.vy * METER * arrowScale;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw arrowhead
        const angle = Math.atan2(endY - ball.y, endX - ball.x);
        const arrowHeadLength = 10;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowHeadLength * Math.cos(angle - Math.PI / 6), endY - arrowHeadLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowHeadLength * Math.cos(angle + Math.PI / 6), endY - arrowHeadLength * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    // --- Collision Resolution for two balls ---
    function resolveBallCollision(b1, b2, e = RESTITUTION_BALL_BALL) {
        // Distance between centers (in pixels)
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Check for collision (and overlap)
        const minDistance = b1.radius + b2.radius;
        if (dist >= minDistance || dist === 0) { // dist === 0 avoids division by zero if objects are perfectly stacked
            return;
        }

        // Collision normal (unit vector)
        const nx = dx / dist;
        const ny = dy / dist;

        // Relative velocity (in m/s)
        const rvx = b2.vx - b1.vx;
        const rvy = b2.vy - b1.vy;

        // Relative velocity along the normal (scalar projection)
        const normalVelocity = rvx * nx + rvy * ny;

        // If objects are moving away from each other, do nothing (prevents double collision)
        if (normalVelocity > 0) {
            return;
        }

        // Impulse scalar (J = -(1+e) * normalVelocity) / (1/m1 + 1/m2)
        const impulseMagnitude = -(1 + e) * normalVelocity / (1 / b1.mass + 1 / b2.mass);

        // Apply impulse to velocities
        b1.vx -= (impulseMagnitude / b1.mass) * nx;
        b1.vy -= (impulseMagnitude / b1.mass) * ny;
        b2.vx += (impulseMagnitude / b2.mass) * nx;
        b2.vy += (impulseMagnitude / b2.mass) * ny;

        // --- Position Correction (Depenetration) ---
        // Move balls apart to prevent sticking or multiple collisions
        const overlap = minDistance - dist;
        const separationAmount = overlap / 2; // Split overlap evenly

        b1.x -= separationAmount * nx;
        b1.y -= separationAmount * ny;
        b2.x += separationAmount * nx;
        b2.y += separationAmount * ny;
    }


    // --- Main Update/Animation Loop ---
    function update(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000; // Delta time in seconds
        lastTime = currentTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas once per frame

        // --- Physics Step for each ball ---
        balls.forEach(ball => {
            const m = ball.mass; // Mass in kg
            const g = getGravityValue(); // Gravity in m/s^2
            const Cd = getDragCoefficient(); // Drag coefficient (dimensionless)
            const rho = FLUID_DENSITY; // Fluid density (air)
            const radiusM = ball.radiusM; // Ball radius in meters
            const area = Math.PI * radiusM ** 2; // Cross-sectional area in m^2

            // 1. Gravity Force (F_g = m * g) -> Acceleration (a = g)
            ball.vy += g * deltaTime;

            // 2. Drag Force (F_d = 0.5 * Cd * ρ * A * v^2) -> Acceleration (a = F_d / m)
            // Separate components for X and Y velocities
            const speedX = Math.abs(ball.vx);
            const speedY = Math.abs(ball.vy);

            // Using drag formula F_d = 0.5 * Cd * rho * A * v^2
            const dragMagnitudeX = 0.5 * Cd * rho * area * speedX * speedX;
            const dragMagnitudeY = 0.5 * Cd * rho * area * speedY * speedY;

            // Apply drag acceleration in opposite direction of velocity
            if (speedX > 0.01) { // Apply only if moving horizontally
                ball.vx -= (Math.sign(ball.vx) * dragMagnitudeX / m) * deltaTime;
            } else {
                ball.vx = 0; // Prevent infinite tiny drag
            }
            if (speedY > 0.01) { // Apply only if moving vertically
                ball.vy -= (Math.sign(ball.vy) * dragMagnitudeY / m) * deltaTime;
            } else {
                ball.vy = 0; // Prevent infinite tiny drag
            }

            // --- Update Position ---
            // Convert velocity from m/s to pixels/frame
            ball.x += ball.vx * deltaTime * METER;
            ball.y += ball.vy * deltaTime * METER;
        });

        // --- Handle Collisions between balls ---
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                resolveBallCollision(balls[i], balls[j], RESTITUTION_BALL_BALL);
            }
        }

        // --- Handle Wall/Floor Collisions ---
        balls.forEach(ball => {
            // Floor collision
            if (ball.y + ball.radius > canvas.height) {
                ball.y = canvas.height - ball.radius; // Position on the floor
                ball.vy *= -RESTITUTION_WALL_FLOOR; // Reverse vertical velocity and apply bounce

                // Apply friction on horizontal velocity when touching ground
                // Friction force F_f = μ * F_normal. F_normal on flat ground is approximately m*g
                const normalForce = ball.mass * getGravityValue(); // Approximate normal force
                const frictionAcceleration = getFrictionValue() * normalForce / ball.mass; // a = F/m = μ*g

                if (Math.abs(ball.vx) > frictionAcceleration * deltaTime) {
                    ball.vx -= Math.sign(ball.vx) * frictionAcceleration * deltaTime;
                } else {
                    ball.vx = 0; // Stop if friction is strong enough
                }

                // Stop vertical velocity if very small to prevent tiny, endless bounces
                if (Math.abs(ball.vy) < 0.5) ball.vy = 0; // Threshold in m/s
            }

            // Wall collisions
            if (ball.x + ball.radius > canvas.width) {
                ball.x = canvas.width - ball.radius;
                ball.vx *= -RESTITUTION_WALL_FLOOR; // Apply restitution on horizontal bounce
            } else if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.vx *= -RESTITUTION_WALL_FLOOR; // Apply restitution on horizontal bounce
            }

            // --- Draw Ball and Velocity ---
            drawBall(ball);
            drawVelocityArrow(ball);
        });

        requestAnimationFrame(update); // Request next frame
    }

    // --- Event Listener for the "Spawn Object" Button ---
    spawnBtn.addEventListener('click', () => {
        const radiusM = 0.2; // Fixed radius in meters for spawned objects (adjust as needed)
        const currentMass = getMassValue();

        const newBall = createBall(
            canvas.width / 2 + (Math.random() - 0.5) * 100, // x-pos in pixels, slightly randomized
            canvas.height / 10 + (Math.random() - 0.5) * 50, // y-pos in pixels, slightly randomized
            radiusM, // radius in meters
            currentMass // mass in kg
        );
        balls.push(newBall); // Add the new ball to our array
    });

    // --- Start Simulation ---
    lastTime = performance.now();
    requestAnimationFrame(update);
    spawnBtn.click(); // Auto-spawn the first ball on load
});