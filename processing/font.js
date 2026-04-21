// Font functionality
const fontSnapshot = new Map(); // original font families
let fontSnapshotInitialized = false;

// Initialize font snapshot with original font families
function initializeFontSnapshot() {
    if (fontSnapshotInitialized) return;
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const originalFontFamily = computedStyle.fontFamily;
        fontSnapshot.set(el, originalFontFamily);
    });
    
    fontSnapshotInitialized = true;
}

// Apply font to all elements
function changeFont(fontValue, fontObj) {
    // Initialize snapshot if not done yet
    if (!fontSnapshotInitialized) {
        initializeFontSnapshot();
    }
    
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(el => {
        if (el && el.isConnected) { // Check if element is still in DOM
            if (fontValue === "page-default") {
                // Revert to original
                const originalFont = fontSnapshot.get(el);
                if (originalFont) {
                    el.style.fontFamily = originalFont;
                }
            } else {
                // Apply selected font
                el.style.fontFamily = `"${fontObj.label}", sans-serif`;
            }
        }
    });
}
