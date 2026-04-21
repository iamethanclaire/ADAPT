const italicsSnapshot = new Map(); // original font style

function toggleItalics(shouldRemoveItalics) {
    console.log("toggleItalics called");
    
    if (shouldRemoveItalics) {
        // Unitalicize all elements and save their original styles
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
            // Skip if already in snapshot 
            if (italicsSnapshot.has(el)) {
                return;
            }
            
            // Get the current computed font style
            const computedStyle = window.getComputedStyle(el);
            const originalStyle = computedStyle.fontStyle;
            
            // Save the original style
            italicsSnapshot.set(el, originalStyle);
            
            // Set font style to normal
            el.style.fontStyle = 'normal';
        });
    } else {
        // Restore all original styles
        italicsSnapshot.forEach((originalStyle, el) => {
            if (el && el.isConnected) { // Check if element is still in DOM
                el.style.fontStyle = originalStyle;
            }
        });
        
        // Clear the snapshot
        italicsSnapshot.clear();
    }
}
