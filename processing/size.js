// Font-size control.
let size = 100;
const sizeStep = 5;
const maxSize = 150;
const minSize = 80;

const sizeInput = adaptShadow.getElementById("adapt-size-value");

function normalizeSize(value) {
    const parsed = Number.parseInt(value, 10);
    const fallback = Number.isFinite(parsed) ? parsed : 100;
    return Math.min(Math.max(fallback, minSize), maxSize);
}

function applySize(newSize, options = {}) {
    size = normalizeSize(newSize);
    sizeInput.value = `${size}%`;
    globalThis.ADAPTApp?.applyTypography();

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
