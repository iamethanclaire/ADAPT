// Persistent page highlighter.
const highlighterColor = "#ffff00";
const highlightSelector = ".adapt-highlight-span";
let isHighlighting = false;
let highlightRecords = [];

(function initializeHighlighterStyles() {
    let style = document.getElementById("adapt-highlighter-styles");

    if (!style) {
        style = document.createElement("style");
        style.id = "adapt-highlighter-styles";
        document.head.appendChild(style);
    }

    style.textContent = `
        .adapt-highlight-span {
            background-color: transparent;
            cursor: inherit;
        }

        html.adapt-extension-active .adapt-highlight-span {
            background-color: ${highlighterColor};
            cursor: pointer;
        }
    `;
})();

function toggleHighlight(shouldHighlight) {
    const nextValue = Boolean(shouldHighlight);

    if (nextValue === isHighlighting) {
        return;
    }

    isHighlighting = nextValue;

    if (isHighlighting) {
        document.addEventListener(
            "mouseup",
            handleHighlightSelection
        );
    } else {
        document.removeEventListener(
            "mouseup",
            handleHighlightSelection
        );
    }
}

function isHighlightBlock(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }

    const display = getComputedStyle(element).display;

    return [
        "block",
        "list-item",
        "table",
        "flex",
        "grid"
    ].includes(display);
}

function getHighlightBlock(node) {
    let element =
        node.nodeType === Node.ELEMENT_NODE
            ? node
            : node.parentElement;

    while (element && element !== document.body) {
        if (isHighlightBlock(element)) {
            return element;
        }

        element = element.parentElement;
    }

    return document.body;
}

function escapeHighlightSelector(value) {
    if (globalThis.CSS?.escape) {
        return CSS.escape(value);
    }

    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function getHighlightBlockPath(element) {
    if (element === document.body) {
        return "body";
    }

    if (
        element.id &&
        document.querySelectorAll(
            `#${escapeHighlightSelector(element.id)}`
        ).length === 1
    ) {
        return `#${escapeHighlightSelector(element.id)}`;
    }

    const segments = [];
    let current = element;

    while (current && current !== document.body) {
        const parent = current.parentElement;

        if (!parent) {
            return "";
        }

        const sameTagSiblings = Array.from(parent.children).filter(
            (sibling) => sibling.tagName === current.tagName
        );
        const position = sameTagSiblings.indexOf(current) + 1;

        segments.unshift(
            `${current.tagName.toLowerCase()}:nth-of-type(${position})`
        );
        current = parent;
    }

    return `body > ${segments.join(" > ")}`;
}

function getTextOffset(container, node, offset) {
    const range = document.createRange();
    range.selectNodeContents(container);
    range.setEnd(node, offset);
    return range.toString().length;
}

function getTextNodes(container) {
    const nodes = [];
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;

                if (
                    !parent ||
                    parent.closest(
                        "script, style, [data-adapt-owned]"
                    )
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let node = walker.nextNode();

    while (node) {
        nodes.push(node);
        node = walker.nextNode();
    }

    return nodes;
}

function createRangeFromTextOffsets(
    container,
    startOffset,
    endOffset
) {
    const range = document.createRange();
    const textNodes = getTextNodes(container);
    let runningOffset = 0;
    let startWasSet = false;

    for (const textNode of textNodes) {
        const nextOffset = runningOffset + textNode.length;

        if (!startWasSet && startOffset <= nextOffset) {
            range.setStart(
                textNode,
                Math.max(startOffset - runningOffset, 0)
            );
            startWasSet = true;
        }

        if (startWasSet && endOffset <= nextOffset) {
            range.setEnd(
                textNode,
                Math.max(endOffset - runningOffset, 0)
            );
            return range;
        }

        runningOffset = nextOffset;
    }

    return null;
}

function makeHighlightId() {
    return globalThis.crypto?.randomUUID
        ? crypto.randomUUID()
        : `highlight-${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}`;
}

function saveHighlights() {
    globalThis.ADAPTStorage
        ?.updatePage({ highlights: highlightRecords })
        .catch((error) => {
            console.error(
                "[ADAPT] Could not save highlights:",
                error
            );
        });
}

function getNodeDepth(node) {
    let depth = 0;
    let current = node;

    while (current?.parentNode) {
        depth += 1;
        current = current.parentNode;
    }

    return depth;
}

function unwrapHighlightSpan(span) {
    const parent = span?.parentNode;

    if (!parent) {
        return;
    }

    while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
    }

    span.remove();
    parent.normalize();
}

function removeHighlight(highlightId, span) {
    unwrapHighlightSpan(span);

    highlightRecords = highlightRecords.filter(
        (record) => record.id !== highlightId
    );
    saveHighlights();
}

function addHighlightClickHandler(span, highlightId) {
    span.addEventListener("click", (event) => {
        if (
            !document.documentElement.classList.contains(
                "adapt-extension-active"
            )
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        removeHighlight(highlightId, span);
    });
}

function wrapHighlightRange(range, record) {
    const span = document.createElement("span");
    span.className = "adapt-highlight-span";
    span.dataset.adaptHighlightId = record.id;

    const contents = range.extractContents();
    span.appendChild(contents);
    addHighlightClickHandler(span, record.id);
    range.insertNode(span);
}

function rangesOverlap(
    firstStart,
    firstEnd,
    secondStart,
    secondEnd
) {
    return firstStart < secondEnd && secondStart < firstEnd;
}

function getRenderedHighlightLocation(span) {
    const block = getHighlightBlock(span);

    try {
        return {
            block,
            startOffset: getTextOffset(block, span, 0),
            endOffset: getTextOffset(
                block,
                span,
                span.childNodes.length
            )
        };
    } catch {
        return null;
    }
}

/*
 * Remove rendered highlights that intersect a new selection.
 *
 * The selection is stored as text offsets before this function runs, so
 * unwrapping and normalizing the old spans cannot change the intended text.
 */
function removeHighlightsOverlappingSegments(segments) {
    const spansToRemove = [];
    const recordIdsToRemove = new Set();

    document
        .querySelectorAll(highlightSelector)
        .forEach((span) => {
            const location = getRenderedHighlightLocation(span);

            if (!location) {
                return;
            }

            const overlapsSelection = segments.some(
                (segment) =>
                    segment.block === location.block &&
                    rangesOverlap(
                        segment.startOffset,
                        segment.endOffset,
                        location.startOffset,
                        location.endOffset
                    )
            );

            if (!overlapsSelection) {
                return;
            }

            spansToRemove.push(span);

            if (span.dataset.adaptHighlightId) {
                recordIdsToRemove.add(
                    span.dataset.adaptHighlightId
                );
            }
        });

    // Unwrap inner spans first so legacy nested highlights are also cleaned up.
    spansToRemove
        .sort(
            (first, second) =>
                getNodeDepth(second) - getNodeDepth(first)
        )
        .forEach(unwrapHighlightSpan);

    if (recordIdsToRemove.size > 0) {
        highlightRecords = highlightRecords.filter(
            (record) => !recordIdsToRemove.has(record.id)
        );
    }

    return recordIdsToRemove.size;
}

function createHighlightRecord(
    block,
    startOffset,
    endOffset,
    text
) {
    return {
        id: makeHighlightId(),
        blockPath: getHighlightBlockPath(block),
        startOffset,
        endOffset,
        text
    };
}

function nodeIsInsideBlock(block, node) {
    return node === block || block.contains(node);
}

function getSelectedTextNodes(selectionRange) {
    const textNodes = [];
    const commonAncestor = selectionRange.commonAncestorContainer;

    if (commonAncestor.nodeType === Node.TEXT_NODE) {
        const parent = commonAncestor.parentElement;

        if (
            parent &&
            !parent.closest(
                "script, style, [data-adapt-owned]"
            )
        ) {
            textNodes.push(commonAncestor);
        }

        return textNodes;
    }

    const walker = document.createTreeWalker(
        commonAncestor,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;

                if (
                    !parent ||
                    parent.closest(
                        "script, style, [data-adapt-owned]"
                    )
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let textNode = walker.nextNode();

    while (textNode) {
        if (selectionRange.intersectsNode(textNode)) {
            textNodes.push(textNode);
        }

        textNode = walker.nextNode();
    }

    return textNodes;
}

/*
 * Convert the live browser selection into stable offsets before changing
 * the DOM. A separate segment is used for each block-level element.
 */
function captureSelectionSegments(selectionRange) {
    const textNodes = getSelectedTextNodes(selectionRange);
    const blocks = [];

    textNodes.forEach((node) => {
        const block = getHighlightBlock(node);

        if (!blocks.includes(block)) {
            blocks.push(block);
        }
    });

    return blocks
        .map((block) => {
            let startOffset = 0;
            let endOffset = getTextOffset(
                block,
                block,
                block.childNodes.length
            );

            if (
                nodeIsInsideBlock(
                    block,
                    selectionRange.startContainer
                )
            ) {
                startOffset = getTextOffset(
                    block,
                    selectionRange.startContainer,
                    selectionRange.startOffset
                );
            }

            if (
                nodeIsInsideBlock(
                    block,
                    selectionRange.endContainer
                )
            ) {
                endOffset = getTextOffset(
                    block,
                    selectionRange.endContainer,
                    selectionRange.endOffset
                );
            }

            const range = createRangeFromTextOffsets(
                block,
                startOffset,
                endOffset
            );

            if (
                !range ||
                range.collapsed ||
                range.toString().trim().length === 0
            ) {
                return null;
            }

            return {
                block,
                startOffset,
                endOffset,
                text: range.toString()
            };
        })
        .filter(Boolean);
}

function resolveStoredHighlight(record) {
    let block;

    try {
        block = document.querySelector(record.blockPath);
    } catch {
        return null;
    }

    if (!block) {
        return null;
    }

    let startOffset = Number(record.startOffset);
    let endOffset = Number(record.endOffset);
    const blockText = block.textContent || "";

    if (
        !Number.isFinite(startOffset) ||
        !Number.isFinite(endOffset) ||
        startOffset < 0 ||
        endOffset <= startOffset ||
        blockText.slice(startOffset, endOffset) !== record.text
    ) {
        const locatedOffset = blockText.indexOf(record.text || "");

        if (locatedOffset < 0 || !record.text) {
            return null;
        }

        startOffset = locatedOffset;
        endOffset = locatedOffset + record.text.length;
    }

    const range = createRangeFromTextOffsets(
        block,
        startOffset,
        endOffset
    );

    if (!range || range.collapsed) {
        return null;
    }

    return {
        block,
        startOffset,
        endOffset,
        text: range.toString()
    };
}

function restoreHighlightRecord(record) {
    const resolved = resolveStoredHighlight(record);

    if (!resolved) {
        return false;
    }

    /*
     * Old saved data may already contain overlapping records. Remove the
     * smaller rendered highlight before restoring the current one so old
     * data cannot recreate nested highlight spans.
     */
    removeHighlightsOverlappingSegments([resolved]);

    const range = createRangeFromTextOffsets(
        resolved.block,
        resolved.startOffset,
        resolved.endOffset
    );

    if (!range || range.collapsed) {
        return false;
    }

    const normalizedRecord = {
        ...record,
        id: record.id || makeHighlightId(),
        blockPath: getHighlightBlockPath(resolved.block),
        startOffset: resolved.startOffset,
        endOffset: resolved.endOffset,
        text: resolved.text
    };

    wrapHighlightRange(range, normalizedRecord);
    highlightRecords.push(normalizedRecord);

    return true;
}

function clearRenderedHighlights() {
    Array.from(
        document.querySelectorAll(highlightSelector)
    )
        .sort(
            (first, second) =>
                getNodeDepth(second) - getNodeDepth(first)
        )
        .forEach(unwrapHighlightSpan);
}

function restoreHighlights(records) {
    clearRenderedHighlights();
    highlightRecords = [];

    if (!Array.isArray(records)) {
        return;
    }

    /*
     * Restore shorter legacy records first. If old records overlap, a wider
     * record is restored last and replaces the nested record.
     */
    [...records]
        .sort((first, second) => {
            const firstLength =
                Number(first.endOffset) -
                Number(first.startOffset);
            const secondLength =
                Number(second.endOffset) -
                Number(second.startOffset);

            return firstLength - secondLength;
        })
        .forEach(restoreHighlightRecord);
}

function handleHighlightSelection(event) {
    if (
        !isHighlighting ||
        !document.documentElement.classList.contains(
            "adapt-extension-active"
        ) ||
        event.composedPath().some(
            (node) =>
                node instanceof Element &&
                (node.id === "adapt-host" ||
                    node.hasAttribute("data-adapt-owned"))
        )
    ) {
        return;
    }

    const selection = window.getSelection();

    if (
        !selection ||
        selection.isCollapsed ||
        selection.toString().trim().length === 0 ||
        selection.rangeCount === 0
    ) {
        return;
    }

    try {
        const selectionRange = selection.getRangeAt(0);
        const segments =
            captureSelectionSegments(selectionRange);

        if (segments.length === 0) {
            return;
        }

        /*
         * Keep only stable text offsets before unwrapping old highlights.
         * The browser's live Range is no longer needed after this point.
         */
        selection.removeAllRanges();
        removeHighlightsOverlappingSegments(segments);

        const newRecords = [];

        segments.forEach((segment) => {
            const range = createRangeFromTextOffsets(
                segment.block,
                segment.startOffset,
                segment.endOffset
            );

            if (!range || range.collapsed) {
                return;
            }

            const text = range.toString();
            const record = createHighlightRecord(
                segment.block,
                segment.startOffset,
                segment.endOffset,
                text
            );

            if (!record.blockPath || !record.text) {
                return;
            }

            wrapHighlightRange(range, record);
            newRecords.push(record);
        });

        if (newRecords.length > 0) {
            highlightRecords.push(...newRecords);
            saveHighlights();
        }
    } catch (error) {
        console.error("[ADAPT] Error highlighting text:", error);
    }
}

globalThis.ADAPTHighlighter = Object.freeze({
    toggle: toggleHighlight,
    restore: restoreHighlights,
    getHighlights: () =>
        highlightRecords.map((record) => ({ ...record }))
});