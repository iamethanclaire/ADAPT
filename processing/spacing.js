// Spacing functionality
let spacing = 100;
let spacingStep = 10; // this should be changable in settings
let maxSpacing = 200; // this should be changable in settings
let minSpacing = 80; // this should be changable in settings

const spacingInput = adaptShadow.getElementById("adapt-spacing-value");

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
});

function decreaseSpacing() {
    if (spacing - spacingStep >= minSpacing) {
        spacing = spacing - spacingStep;
        spacingInput.value = spacing + "%";
        console.log("decrease text spacing to " + spacing + "%");
    } else {
        spacing = minSpacing;
    }
}

function increaseSpacing() {
    if (spacing + spacingStep <= maxSpacing) {
        spacing = spacing + spacingStep;
        spacingInput.value = spacing + "%";
        console.log("increase text spacing to " + spacing + "%");
    } else {
        spacing = maxSpacing;
    }
}

