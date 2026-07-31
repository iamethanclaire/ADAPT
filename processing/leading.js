// Line-spacing control.
let leading = 100;
let leadingStep = 10;
let maxLeading = 200;
let minLeading = 80;

const leadingInput = adaptShadow.getElementById(
    "adapt-leading-value"
);

function normalizeLeading(value) {
    const parsed = Number.parseInt(value, 10);
    const fallback = Number.isFinite(parsed) ? parsed : 100;
    return Math.min(
        Math.max(fallback, minLeading),
        maxLeading
    );
}

function configureLeadingControl(options = {}) {
    leadingStep = Math.min(
        Math.max(Number(options.step) || 10, 1),
        50
    );
    maxLeading = Math.min(
        Math.max(Number(options.maximum) || 200, 100),
        300
    );
    minLeading = Math.min(
        Math.max(Number(options.minimum) || 80, 50),
        100
    );

    return applyLeading(leading);
}

function applyLeading(newLeading, options = {}) {
    leading = normalizeLeading(newLeading);
    leadingInput.value = `${leading}%`;
    globalThis.ADAPTApp?.applyTypography();

    if (options.persist) {
        globalThis.ADAPTApp?.updateGlobalSetting({ leading });
    }

    return leading;
}

function commitLeadingInput() {
    applyLeading(leadingInput.value, { persist: true });
}

leadingInput.value = `${leading}%`;

leadingInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();
    commitLeadingInput();
    leadingInput.blur();
});

leadingInput.addEventListener("blur", commitLeadingInput);

function decreaseLeading() {
    applyLeading(leading - leadingStep, {
        persist: true
    });
}

function increaseLeading() {
    applyLeading(leading + leadingStep, {
        persist: true
    });
}
