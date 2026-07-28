// Draggable line guide with a persisted viewport-relative position.
let isLineGuideActive = false;
let lineGuideBlurEnabled = true;
let lineGuideElement = null;
let blurLayerElement = null;
let lineGuideYRatio = 0.5;
let isDraggingLineGuide = false;
let lineGuideDragStartY = 0;
let lineGuideDragOriginY = 0;

function clampLineGuideRatio(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0.5;
    }

    return Math.min(Math.max(number, 0), 1);
}

function updateLineGuidePosition() {
    if (!lineGuideElement) {
        return;
    }

    const maximumY = Math.max(window.innerHeight - 2, 0);
    const y = Math.min(
        Math.max(lineGuideYRatio * window.innerHeight, 0),
        maximumY
    );

    lineGuideElement.style.top = `${y}px`;

    if (blurLayerElement) {
        blurLayerElement.style.top = `${y + 2}px`;
        blurLayerElement.style.height =
            `calc(100vh - ${y + 2}px)`;
    }
}

function createLineGuide() {
    removeLineGuide();

    if (lineGuideBlurEnabled) {
        blurLayerElement = document.createElement("div");
        blurLayerElement.id = "adapt-line-guide-blur";
        blurLayerElement.dataset.adaptOwned = "true";
        blurLayerElement.style.cssText = `
            position: fixed;
            left: 0;
            width: 100%;
            pointer-events: none;
            z-index: 2147483597;
            backdrop-filter: blur(3px);
        `;
        document.body.appendChild(blurLayerElement);
    }

    lineGuideElement = document.createElement("div");
    lineGuideElement.id = "adapt-line-guide-line";
    lineGuideElement.dataset.adaptOwned = "true";
    lineGuideElement.setAttribute("role", "separator");
    lineGuideElement.setAttribute(
        "aria-label",
        "Draggable reading line guide"
    );
    lineGuideElement.style.cssText = `
        position: fixed;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: ${ADAPT.lineColor};
        z-index: 2147483598;
        cursor: grab;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(lineGuideElement);
    updateLineGuidePosition();

    lineGuideElement.addEventListener(
        "mousedown",
        startLineGuideDrag
    );
    document.addEventListener(
        "mousemove",
        handleLineGuideDrag
    );
    document.addEventListener(
        "mouseup",
        stopLineGuideDrag
    );
}

function removeLineGuide() {
    if (lineGuideElement) {
        lineGuideElement.removeEventListener(
            "mousedown",
            startLineGuideDrag
        );
        lineGuideElement.remove();
        lineGuideElement = null;
    }

    document.removeEventListener(
        "mousemove",
        handleLineGuideDrag
    );
    document.removeEventListener(
        "mouseup",
        stopLineGuideDrag
    );

    blurLayerElement?.remove();
    blurLayerElement = null;
    isDraggingLineGuide = false;
}

function toggleLineGuide(shouldEnable, options = {}) {
    isLineGuideActive = Boolean(shouldEnable);

    if (options.yRatio !== undefined) {
        lineGuideYRatio = clampLineGuideRatio(
            options.yRatio
        );
    }

    if (isLineGuideActive) {
        createLineGuide();
    } else {
        removeLineGuide();
    }
}

function startLineGuideDrag(event) {
    if (!lineGuideElement || event.button !== 0) {
        return;
    }

    isDraggingLineGuide = true;
    lineGuideDragStartY = event.clientY;
    lineGuideDragOriginY =
        lineGuideElement.getBoundingClientRect().top;
    lineGuideElement.style.cursor = "grabbing";
    event.preventDefault();
}

function handleLineGuideDrag(event) {
    if (!isDraggingLineGuide || !lineGuideElement) {
        return;
    }

    const maximumY = Math.max(window.innerHeight - 2, 0);
    const nextY =
        lineGuideDragOriginY +
        (event.clientY - lineGuideDragStartY);
    const clampedY = Math.min(
        Math.max(nextY, 0),
        maximumY
    );

    lineGuideYRatio =
        window.innerHeight > 0
            ? clampedY / window.innerHeight
            : 0.5;

    updateLineGuidePosition();
}

function stopLineGuideDrag() {
    if (!isDraggingLineGuide) {
        return;
    }

    isDraggingLineGuide = false;

    if (lineGuideElement) {
        lineGuideElement.style.cursor = "grab";
    }

    globalThis.ADAPTApp?.updateGlobalSetting(
        { lineGuideYRatio },
        { apply: false }
    );
}

window.addEventListener("resize", updateLineGuidePosition);
