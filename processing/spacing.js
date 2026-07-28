// Letter-spacing control.
let spacing = 100;
const spacingStep = 25;
const maxSpacing = 200;
const minSpacing = 50;

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
