// Spacing functionality
let spacing = 100;
let spacingStep = 25; // this should be changable in settings
let maxSpacing = 200; // this should be changable in settings
let minSpacing = 50; // this should be changable in settings

const spacingInput = adaptShadow.getElementById("adapt-spacing-value");

// Initialize spacing snapshot with original letter spacings
const spacingSnapshot = new Map();
let spacingSnapshotInitialized = false;

function initializeSpacingSnapshot() {
    if (spacingSnapshotInitialized) return;

    document.querySelectorAll("body, body *").forEach((el) => {
        const computedSpacing = getComputedStyle(el).letterSpacing;

        spacingSnapshot.set(el, {
            // Save the existing inline declaration so it can be restored exactly.
            inlineValue: el.style.getPropertyValue("letter-spacing"),
            inlinePriority: el.style.getPropertyPriority("letter-spacing"),

            // CSS "normal" is effectively zero for this calculation.
            computedValue:
                computedSpacing === "normal" ? "0px" : computedSpacing
        });
    });

    spacingSnapshotInitialized = true;
}

function applySpacing(newSpacing) {
    initializeSpacingSnapshot();

    // Each 100% above/below the baseline changes spacing by 0.12em.
    const spacingChange = ((newSpacing - 100) / 100) * 0.12;

    spacingSnapshot.forEach((original, el) => {
        if (!el.isConnected) return;

        if (newSpacing === 100) {
            // Restore the element's original inline styling.
            if (original.inlineValue) {
                el.style.setProperty(
                    "letter-spacing",
                    original.inlineValue,
                    original.inlinePriority
                );
            } else {
                el.style.removeProperty("letter-spacing");
            }
        } else {
            el.style.setProperty(
                "letter-spacing",
                `calc(${original.computedValue} + ${spacingChange}em)`,
                "important"
            );
        }
    });
}

// set initial input value
spacingInput.value = spacing + "%";

// handle spacing input changes
spacingInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const numValue = parseInt(e.target.value) || 100;
        if (numValue >= minSpacing && numValue <= maxSpacing) {
            spacing = numValue;
        } else if (numValue < minSpacing) {
            spacing = minSpacing;
        } else if (numValue > maxSpacing) {
            spacing = maxSpacing;
        }
        e.target.value = spacing + "%";
        applySpacing(spacing);
        e.target.blur();
    }
});

spacingInput.addEventListener("blur", (e) => {
    const numValue = parseInt(e.target.value) || 100;
    if (numValue >= minSpacing && numValue <= maxSpacing) {
        spacing = numValue;
    } else if (numValue < minSpacing) {
        spacing = minSpacing;
    } else if (numValue > maxSpacing) {
        spacing = maxSpacing;
    }
    e.target.value = spacing + "%";
    applySpacing(spacing);
});

function decreaseSpacing() {
    if (spacing - spacingStep >= minSpacing) {
        spacing = spacing - spacingStep;
        spacingInput.value = spacing + "%";
        applySpacing(spacing);
        console.log("decrease text spacing to " + spacing + "%");
    } else {
        spacing = minSpacing;
        spacingInput.value = spacing + "%";
        applySpacing(spacing);
    }
}

function increaseSpacing() {
    if (spacing + spacingStep <= maxSpacing) {
        spacing = spacing + spacingStep;
        spacingInput.value = spacing + "%";
        applySpacing(spacing);
        console.log("increase text spacing to " + spacing + "%");
    } else {
        spacing = maxSpacing;
        spacingInput.value = spacing + "%";
        applySpacing(spacing);
    }
}

