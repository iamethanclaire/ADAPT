// Line-spacing control.
let leading = 100;
const leadingStep = 10;
const maxLeading = 200;
const minLeading = 80;

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
