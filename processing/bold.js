const boldSnapshot = new Map(); // original font weight

function toggleBold(shouldRemoveBold) {
    console.log("toggleBold called");
    
    if (shouldRemoveBold) {
        // Unbold all elements and save their original weights
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
            // Skip if already in snapshot 
            if (boldSnapshot.has(el)) {
                return;
            }
            
            // Get the current computed font weight
            const computedStyle = window.getComputedStyle(el);
            const originalWeight = computedStyle.fontWeight;
            
            // Save the original weight
            boldSnapshot.set(el, originalWeight);
            
            // Set font weight to normal
            el.style.fontWeight = 'normal';
        });
    } else {
        // Restore all original weights
        boldSnapshot.forEach((originalWeight, el) => {
            if (el && el.isConnected) { // Check if element is still in DOM
                el.style.fontWeight = originalWeight;
            }
        });
        
        // Clear the snapshot
        boldSnapshot.clear();
    }
}
