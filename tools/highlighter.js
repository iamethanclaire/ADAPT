// Persistent page highlighter.
const highlighterColor = "#ffff00";
let isHighlighting = false;
let highlightRecords = [];

(function initializeHighlighterStyles() {
    const style = document.createElement("style");
    style.id = "adapt-highlighter-styles";
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
    document.head.appendChild(style);
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

function removeHighlight(highlightId, span) {
    const parent = span.parentNode;

    if (parent) {
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }

        span.remove();
        parent.normalize();
    }

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

function createHighlightRecord(range, block) {
    return {
        id: makeHighlightId(),
        blockPath: getHighlightBlockPath(block),
        startOffset: getTextOffset(
            block,
            range.startContainer,
            range.startOffset
        ),
        endOffset: getTextOffset(
            block,
            range.endContainer,
            range.endOffset
        ),
        text: range.toString()
    };
}

function restoreHighlightRecord(record) {
    let block;

    try {
        block = document.querySelector(record.blockPath);
    } catch {
        return false;
    }

    if (!block) {
        return false;
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
            return false;
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
        return false;
    }

    wrapHighlightRange(range, {
        ...record,
        startOffset,
        endOffset
    });

    return true;
}

function restoreHighlights(records) {
    document
        .querySelectorAll(".adapt-highlight-span")
        .forEach((span) => {
            const parent = span.parentNode;

            while (span.firstChild) {
                parent?.insertBefore(span.firstChild, span);
            }

            span.remove();
            parent?.normalize();
        });

    highlightRecords = [];

    if (!Array.isArray(records)) {
        return;
    }

    records.forEach((record) => {
        if (restoreHighlightRecord(record)) {
            highlightRecords.push({ ...record });
        }
    });
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
        selection.toString().trim().length === 0
    ) {
        return;
    }

    try {
        const selectionRange = selection.getRangeAt(0);
        const textNodes = [];
        const walker = document.createTreeWalker(
            selectionRange.commonAncestorContainer,
            NodeFilter.SHOW_TEXT
        );

        if (
            selectionRange.commonAncestorContainer.nodeType ===
            Node.TEXT_NODE
        ) {
            textNodes.push(
                selectionRange.commonAncestorContainer
            );
        }

        let textNode = walker.nextNode();

        while (textNode) {
            if (selectionRange.intersectsNode(textNode)) {
                textNodes.push(textNode);
            }

            textNode = walker.nextNode();
        }

        const blocks = [];

        textNodes.forEach((node) => {
            const block = getHighlightBlock(node);

            if (!blocks.includes(block)) {
                blocks.push(block);
            }
        });

        const newRecords = [];

        blocks.forEach((block) => {
            const firstNode = textNodes.find(
                (node) => getHighlightBlock(node) === block
            );
            const lastNode = [...textNodes]
                .reverse()
                .find(
                    (node) => getHighlightBlock(node) === block
                );

            if (!firstNode || !lastNode) {
                return;
            }

            const blockRange = document.createRange();

            blockRange.setStart(
                firstNode,
                firstNode === selectionRange.startContainer
                    ? selectionRange.startOffset
                    : 0
            );
            blockRange.setEnd(
                lastNode,
                lastNode === selectionRange.endContainer
                    ? selectionRange.endOffset
                    : lastNode.length
            );

            if (blockRange.collapsed) {
                return;
            }

            const record = createHighlightRecord(
                blockRange,
                block
            );

            if (!record.blockPath || !record.text) {
                return;
            }

            wrapHighlightRange(blockRange, record);
            newRecords.push(record);
        });

        if (newRecords.length > 0) {
            highlightRecords.push(...newRecords);
            saveHighlights();
        }

        selection.removeAllRanges();
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
