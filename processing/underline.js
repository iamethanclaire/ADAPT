const underlineSnapshot = new Map(); // original text decoration

function toggleUnderline(shouldRemoveUnderline) {
    console.log("toggleUnderline called");
    
    if (shouldRemoveUnderline) {
        // Remove underline from all elements and save their original decorations
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
            // Skip if already in snapshot 
            if (underlineSnapshot.has(el)) {
                return;
            }
            
            // Get the current computed text decoration
            const computedStyle = window.getComputedStyle(el);
            const originalDecoration = computedStyle.textDecoration;
            
            // Save the original decoration
            underlineSnapshot.set(el, originalDecoration);
            
            // Set text decoration to none
            el.style.textDecoration = 'none';
        });
    } else {
        // Restore all original decorations
        underlineSnapshot.forEach((originalDecoration, el) => {
            if (el && el.isConnected) { // Check if element is still in DOM
                el.style.textDecoration = originalDecoration;
            }
        });
        
        // Clear the snapshot
        underlineSnapshot.clear();
    }
}
