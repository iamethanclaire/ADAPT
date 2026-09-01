// Font-size control.
let size = 100;
let sizeStep = 5;
let maxSize = 150;
let minSize = 80;

const sizeInput = adaptShadow.getElementById("adapt-size-value");

function normalizeSize(value) {
    const parsed = Number.parseInt(value, 10);
    const fallback = Number.isFinite(parsed) ? parsed : 100;
    return Math.min(Math.max(fallback, minSize), maxSize);
}

function configureSizeControl(options = {}) {
    sizeStep = Math.min(
        Math.max(Number(options.step) || 5, 1),
        50
    );
    maxSize = Math.min(
        Math.max(Number(options.maximum) || 150, 100),
        200
    );
    minSize = Math.min(
        Math.max(Number(options.minimum) || 80, 50),
        100
    );

    return applySize(size);
}

function applySize(newSize, options = {}) {
    size = normalizeSize(newSize);
    sizeInput.value = `${size}%`;

    globalThis.ADAPTBold
        ?.prepareForTypographyChange?.();
    globalThis.ADAPTItalics
        ?.prepareForTypographyChange?.();

    globalThis.ADAPTApp?.applyTypography();

    globalThis.ADAPTBold?.refresh?.();
    globalThis.ADAPTItalics?.refresh?.();

    if (options.persist) {
        globalThis.ADAPTApp?.updateGlobalSetting({ size });
    }

    return size;
}

function commitSizeInput() {
    applySize(sizeInput.value, { persist: true });
}

sizeInput.value = `${size}%`;

sizeInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();
    commitSizeInput();
    sizeInput.blur();
});

sizeInput.addEventListener("blur", commitSizeInput);

function decreaseSize() {
    applySize(size - sizeStep, { persist: true });
}

function increaseSize() {
    applySize(size + sizeStep, { persist: true });
}