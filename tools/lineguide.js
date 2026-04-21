// Line Guide Tool
let isLineGuideActive = false;
let lineGuideBlurEnabled = true; // Variable to determine if blur is applied
let lineGuideElement = null;
let blurLayerElement = null;
let isDragging = false;
let dragStartY = 0;
let lineCurrentY = 0;

function toggleLineGuide(shouldEnable) {
    isLineGuideActive = shouldEnable;
    
    if (shouldEnable) {
        createLineGuide();
    } else {
        removeLineGuide();
    }
}

function createLineGuide() {
    // Remove existing line guide if it exists
    if (lineGuideElement) {
        removeLineGuide();
    }
    
    // Create the horizontal line guide
    lineGuideElement = document.createElement('div');
    lineGuideElement.id = 'adapt-line-guide-line';
    lineGuideElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: ${lineColor};
        z-index: 999998;
        cursor: grab;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    `;
    
    // Create blur layer if enabled
    if (lineGuideBlurEnabled) {
        blurLayerElement = document.createElement('div');
        blurLayerElement.id = 'adapt-line-guide-blur';
        blurLayerElement.style.cssText = `
            position: fixed;
            top: calc(50% + 2px);
            left: 0;
            width: 100%;
            height: calc(100vh - 50% - 2px);
            pointer-events: none;
            z-index: 999997;
            backdrop-filter: blur(3px);
        `;
        
        document.body.appendChild(blurLayerElement);
    }
    
    document.body.appendChild(lineGuideElement);
    
    // Add drag handlers
    lineGuideElement.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
}

function removeLineGuide() {
    if (lineGuideElement) {
        lineGuideElement.removeEventListener('mousedown', startDrag);
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);
        lineGuideElement.remove();
        lineGuideElement = null;
    }
    
    if (blurLayerElement) {
        blurLayerElement.remove();
        blurLayerElement = null;
    }
}

function startDrag(e) {
    isDragging = true;
    dragStartY = e.clientY;
    lineCurrentY = lineGuideElement.getBoundingClientRect().top;
    lineGuideElement.style.cursor = 'grabbing';
    e.preventDefault();
}

function handleDrag(e) {
    if (!isDragging || !lineGuideElement) return;
    
    const deltaY = e.clientY - dragStartY;
    const newY = lineCurrentY + deltaY;
    
    // Keep the line within viewport bounds
    const maxY = window.innerHeight - 2;
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    lineGuideElement.style.top = clampedY + 'px';
    
    // Update blur layer position and height
    if (blurLayerElement) {
        blurLayerElement.style.top = (clampedY + 2) + 'px';
        blurLayerElement.style.height = `calc(100vh - ${clampedY + 2}px)`;
    }
}

function stopDrag(e) {
    isDragging = false;
    if (lineGuideElement) {
        lineGuideElement.style.cursor = 'grab';
    }
}
