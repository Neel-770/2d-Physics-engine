document.addEventListener('DOMContentLoaded', () => {
    // Select all control groups
    const controlGroups = document.querySelectorAll('.control-group');

    controlGroups.forEach(group => {
        const rangeInput = group.querySelector('input[type="range"]');
        const textInput = group.querySelector('input[type="number"]');

        // --- Synchronize Range to Text Input ---
        // When the slider is moved, update the text input
        rangeInput.addEventListener('input', () => {
            textInput.value = rangeInput.value;
        });

        // --- Synchronize Text Input to Range ---
        // When the user types into the text input, update the slider
        textInput.addEventListener('input', () => {
            let value = parseFloat(textInput.value); // Get the typed value as a number
            const min = parseFloat(rangeInput.min);
            const max = parseFloat(rangeInput.max);
            const step = parseFloat(rangeInput.step);

            // Basic validation and clamping
            if (isNaN(value)) {
                // If not a number, revert to the current range value or a default
                textInput.value = rangeInput.value;
                return;
            }

            if (value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }

            // Optional: Snap to step value if desired (more complex, but good for precision)
            // value = Math.round(value / step) * step;
            // value = parseFloat(value.toFixed(String(step).split('.')[1]?.length || 0));


            rangeInput.value = value; // Update the slider's position
            textInput.value = value; // Update the text input to reflect the clamped/adjusted value
        });

        // Optional: Listen for 'change' event on text input to re-sync after user finishes typing (e.g., on blur)
        textInput.addEventListener('change', () => {
            let value = parseFloat(textInput.value);
            const min = parseFloat(rangeInput.min);
            const max = parseFloat(rangeInput.max);

            if (isNaN(value) || value < min || value > max) {
                value = Math.max(min, Math.min(max, value)); // Clamp value
            }
            rangeInput.value = value;
            textInput.value = value;
        });
    });
});
