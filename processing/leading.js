// Leading functionality
let leading = 100;
let leadingStep = 10; // this should be changable in settings
let maxLeading = 200; // this should be changable in settings
let minLeading = 80; // this should be changable in settings

const leadingSnapshot = new Map(); // original line heights
let leadingSnapshotInitialized = false;

const leadingInput = adaptShadow.getElementById("adapt-leading-value");

// Initialize leading snapshot with original line heights
function initializeLeadingSnapshot() {
    if (leadingSnapshotInitialized) return;
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const originalLineHeight = computedStyle.lineHeight;
        leadingSnapshot.set(el, originalLineHeight);
    });
    
    leadingSnapshotInitialized = true;
}

// Apply leading multiplier to all elements
function applyLeading(newLeading) {
    // Initialize snapshot if not done yet
    if (!leadingSnapshotInitialized) {
        initializeLeadingSnapshot();
    }
    
    const multiplier = newLeading / 100;
    
    leadingSnapshot.forEach((originalLineHeight, el) => {
        if (el && el.isConnected) { // Check if element is still in DOM
            const originalValue = parseFloat(originalLineHeight);
            const originalUnit = originalLineHeight.replace(/[\d.-]/g, '');
            
            if (newLeading === 100) {
                // Revert to original
                el.style.lineHeight = originalLineHeight;
            } else {
                // Apply multiplier
                const newValue = originalValue * multiplier;
                el.style.lineHeight = newValue + (originalUnit || '');
            }
        }
    });
}

// set initial input value
leadingInput.value = leading + "%";

// handle leading input changes
leadingInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const numValue = parseInt(e.target.value) || 100;
        if (numValue >= minLeading && numValue <= maxLeading) {
            leading = numValue;
        } else if (numValue < minLeading) {
            leading = minLeading;
        } else if (numValue > maxLeading) {
            leading = maxLeading;
        }
        e.target.value = leading + "%";
        applyLeading(leading);
        e.target.blur();
    }
});

leadingInput.addEventListener("blur", (e) => {
    const numValue = parseInt(e.target.value) || 100;
    if (numValue >= minLeading && numValue <= maxLeading) {
        leading = numValue;
    } else if (numValue < minLeading) {
        leading = minLeading;
    } else if (numValue > maxLeading) {
        leading = maxLeading;
    }
    e.target.value = leading + "%";
    applyLeading(leading);
});

function decreaseLeading() {
    if (leading - leadingStep >= minLeading) {
        leading = leading - leadingStep;
        leadingInput.value = leading + "%";
        applyLeading(leading);
        console.log("decrease text leading to " + leading + "%");
    } else {
        leading = minLeading;
        leadingInput.value = leading + "%";
        applyLeading(leading);
    }
}

function increaseLeading() {
    if (leading + leadingStep <= maxLeading) {
        leading = leading + leadingStep;
        leadingInput.value = leading + "%";
        applyLeading(leading);
        console.log("increase text leading to " + leading + "%");
    } else {
        leading = maxLeading;
        leadingInput.value = leading + "%";
        applyLeading(leading);
    }
}