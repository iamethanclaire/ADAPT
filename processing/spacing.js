// Letter-spacing control.
let spacing = 100;
let spacingStep = 25;
let maxSpacing = 200;
let minSpacing = 50;

const spacingInput = adaptShadow.getElementById(
    "adapt-spacing-value"
);

function normalizeSpacing(value) {
    const parsed = Number.parseInt(value, 10);
    const fallback = Number.isFinite(parsed) ? parsed : 100;
    return Math.min(
        Math.max(fallback, minSpacing),
        maxSpacing
    );
}

function configureSpacingControl(options = {}) {
    spacingStep = Math.min(
        Math.max(Number(options.step) || 25, 1),
        50
    );
    maxSpacing = Math.min(
        Math.max(Number(options.maximum) || 200, 100),
        300
    );
    minSpacing = Math.min(
        Math.max(Number(options.minimum) || 50, 25),
        100
    );

    return applySpacing(spacing);
}

function applySpacing(newSpacing, options = {}) {
    spacing = normalizeSpacing(newSpacing);
    spacingInput.value = `${spacing}%`;
    globalThis.ADAPTApp?.applyTypography();

    if (options.persist) {
        globalThis.ADAPTApp?.updateGlobalSetting({ spacing });
    }

    return spacing;
}

function commitSpacingInput() {
    applySpacing(spacingInput.value, { persist: true });
}

spacingInput.value = `${spacing}%`;

spacingInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();
    commitSpacingInput();
    spacingInput.blur();
});

spacingInput.addEventListener("blur", commitSpacingInput);

function decreaseSpacing() {
    applySpacing(spacing - spacingStep, {
        persist: true
    });
}

function increaseSpacing() {
    applySpacing(spacing + spacingStep, {
        persist: true
    });
}
