// Size functionality
let size = 100;
let sizeStep = 5; // this should be changable in settings
let maxSize = 150; // this should be changable in settings
let minSize = 80; // this should be changable in settings

const sizeSnapshot = new Map(); // original font sizes
let sizeSnapshotInitialized = false;

const sizeInput = adaptShadow.getElementById("adapt-size-value");

// Initialize size snapshot with original font sizes
function initializeSizeSnapshot() {
    if (sizeSnapshotInitialized) return;
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const originalSize = computedStyle.fontSize;
        sizeSnapshot.set(el, originalSize);
    });
    
    sizeSnapshotInitialized = true;
}

// Apply size multiplier to all elements
function applySize(newSize) {
    // Initialize snapshot if not done yet
    if (!sizeSnapshotInitialized) {
        initializeSizeSnapshot();
    }
    
    const multiplier = newSize / 100;
    
    sizeSnapshot.forEach((originalSize, el) => {
        if (el && el.isConnected) { // Check if element is still in DOM
            const originalValue = parseFloat(originalSize);
            const originalUnit = originalSize.replace(/[\d.-]/g, '');
            
            if (newSize === 100) {
                // Revert to original
                el.style.fontSize = originalSize;
            } else {
                // Apply multiplier
                const newValue = originalValue * multiplier;
                el.style.fontSize = newValue + (originalUnit || 'px');
            }
        }
    });
}

// set initial input value
sizeInput.value = size + "%";

// handle size input changes
sizeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const numValue = parseInt(e.target.value) || 100;
        if (numValue >= minSize && numValue <= maxSize) {
            size = numValue;
        } else if (numValue < minSize) {
            size = minSize;
        } else if (numValue > maxSize) {
            size = maxSize;
        }
        e.target.value = size + "%";
        applySize(size);
        e.target.blur();
    }
});

sizeInput.addEventListener("blur", (e) => {
    const numValue = parseInt(e.target.value) || 100;
    if (numValue >= minSize && numValue <= maxSize) {
        size = numValue;
    } else if (numValue < minSize) {
        size = minSize;
    } else if (numValue > maxSize) {
        size = maxSize;
    }
    e.target.value = size + "%";
    applySize(size);
});

// font size buttons

function decreaseSize() {
    if (size - sizeStep >= minSize) {
        size = size - sizeStep;
        sizeInput.value = size + "%";
        applySize(size);
        console.log("decrease font size to " + size + "%");
    } else {
        size = minSize;
        sizeInput.value = size + "%";
        applySize(size);
    }
}

function increaseSize() {
    if (size + sizeStep <= maxSize) {
        size = size + sizeStep;
        sizeInput.value = size + "%";
        applySize(size);
        console.log("increase font size to " + size + "%");
    } else {
        size = maxSize;
        sizeInput.value = size + "%";
        applySize(size);
    }
}