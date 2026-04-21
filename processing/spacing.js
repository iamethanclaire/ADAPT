// Spacing functionality
let spacing = 100;
let spacingStep = 50; // this should be changable in settings
let maxSpacing = 400; // this should be changable in settings
let minSpacing = 50; // this should be changable in settings

const spacingSnapshot = new Map(); // original letter spacings
let spacingSnapshotInitialized = false;

const spacingInput = adaptShadow.getElementById("adapt-spacing-value");

// Initialize spacing snapshot with original letter spacings
function initializeSpacingSnapshot() {
    if (spacingSnapshotInitialized) return;
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const originalLetterSpacing = computedStyle.letterSpacing;
        spacingSnapshot.set(el, originalLetterSpacing);
    });
    
    spacingSnapshotInitialized = true;
}

// Apply spacing multiplier to all elements
function applySpacing(newSpacing) {
    // Initialize snapshot if not done yet
    if (!spacingSnapshotInitialized) {
        initializeSpacingSnapshot();
    }
    
    const multiplier = newSpacing / 100;
    
    spacingSnapshot.forEach((originalLetterSpacing, el) => {
        if (el && el.isConnected) { // Check if element is still in DOM
            const originalValue = parseFloat(originalLetterSpacing);
            const originalUnit = originalLetterSpacing.replace(/[\d.-]/g, '');
            
            if (newSpacing === 100) {
                // Revert to original
                el.style.letterSpacing = originalLetterSpacing;
            } else {
                // Apply multiplier
                const newValue = originalValue * multiplier;
                el.style.letterSpacing = newValue + (originalUnit || 'px');
            }
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

