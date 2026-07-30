// Persistent, text-anchored page highlighter.
const highlighterColor = "#ffff00";
const HIGHLIGHT_VERSION = 2;
const QUOTE_CONTEXT_LENGTH = 64;
const RESTORE_DELAYS = [0, 250, 1000, 3000];
const REJECTED_TEXT_SELECTOR = [
    "script",
    "style",
    "noscript",
    "textarea",
    "input",
    "select",
    "option",
    "[data-adapt-owned]"
].join(", ");

let isHighlighting = false;
let highlightRecords = [];
let isApplyingHighlights = false;
let restoreTimer = null;
let restoreRetryTimers = [];
let saveChain = Promise.resolve();

(function initializeHighlighterStyles() {
    if (document.getElementById("adapt-highlighter-styles")) {
        return;
    }

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

    (document.head || document.documentElement).appendChild(style);
})();

function toggleHighlight(shouldHighlight) {
    const nextValue = Boolean(shouldHighlight);

    if (nextValue === isHighlighting) {
        return;
    }

    isHighlighting = nextValue;

    if (isHighlighting) {
        document.addEventListener("mouseup", handleHighlightSelection);
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

    return [
        "block",
        "list-item",
        "table",
        "flex",
        "grid"
    ].includes(getComputedStyle(element).display);
}

function getHighlightBlock(node) {
    let element =
        node?.nodeType === Node.ELEMENT_NODE
            ? node
            : node?.parentElement;

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

    return String(value).replace(
        /[^a-zA-Z0-9_-]/g,
        (character) => `\\${character}`
    );
}

function getHighlightBlockPath(element) {
    if (!element || element === document.body) {
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

function isUsableTextNode(node) {
    const parent = node?.parentElement;

    return Boolean(
        node &&
            node.nodeType === Node.TEXT_NODE &&
            node.data.length > 0 &&
            parent &&
            !parent.closest(REJECTED_TEXT_SELECTOR)
    );
}

function getTextNodes(container) {
    if (!container) {
        return [];
    }

    const nodes = [];
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                return isUsableTextNode(node)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
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

function buildTextIndex(container) {
    const entries = [];
    let text = "";

    getTextNodes(container).forEach((node) => {
        const start = text.length;
        text += node.data;
        entries.push({
            node,
            start,
            end: text.length
        });
    });

    return { container, entries, text };
}

function getBoundaryOffset(index, node, offset) {
    const entry = index.entries.find(
        (candidate) => candidate.node === node
    );

    if (!entry) {
        return null;
    }

    return (
        entry.start +
        Math.min(Math.max(Number(offset) || 0, 0), node.length)
    );
}

function findTextEntry(
    index,
    offset,
    preferNextAtBoundary = false
) {
    if (index.entries.length === 0) {
        return null;
    }

    const boundedOffset = Math.min(
        Math.max(offset, 0),
        index.text.length
    );

    for (
        let entryIndex = 0;
        entryIndex < index.entries.length;
        entryIndex += 1
    ) {
        const entry = index.entries[entryIndex];

        if (
            boundedOffset >= entry.start &&
            boundedOffset < entry.end
        ) {
            return entry;
        }

        if (boundedOffset === entry.end) {
            const nextEntry = index.entries[entryIndex + 1];

            if (
                preferNextAtBoundary &&
                nextEntry?.start === boundedOffset
            ) {
                return nextEntry;
            }

            return entry;
        }
    }

    return index.entries[index.entries.length - 1];
}

function createRangeFromIndexOffsets(index, startOffset, endOffset) {
    if (
        startOffset < 0 ||
        endOffset <= startOffset ||
        endOffset > index.text.length
    ) {
        return null;
    }

    const startEntry = findTextEntry(index, startOffset, true);
    const endEntry = findTextEntry(index, endOffset, false);

    if (!startEntry || !endEntry) {
        return null;
    }

    const range = document.createRange();

    try {
        range.setStart(
            startEntry.node,
            Math.min(
                Math.max(startOffset - startEntry.start, 0),
                startEntry.node.length
            )
        );
        range.setEnd(
            endEntry.node,
            Math.min(
                Math.max(endOffset - endEntry.start, 0),
                endEntry.node.length
            )
        );
    } catch {
        return null;
    }

    return range.collapsed ? null : range;
}

function makeHighlightId() {
    return globalThis.crypto?.randomUUID
        ? crypto.randomUUID()
        : `highlight-${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}`;
}

function normalizeHighlightRecord(record) {
    if (!record || typeof record !== "object") {
        return null;
    }

    const exact =
        typeof record.exact === "string"
            ? record.exact
            : typeof record.text === "string"
              ? record.text
              : "";

    if (!exact) {
        return null;
    }

    return {
        ...record,
        id:
            typeof record.id === "string" && record.id
                ? record.id
                : makeHighlightId(),
        version: Number(record.version) || 1,
        exact,
        text: exact,
        prefix:
            typeof record.prefix === "string" ? record.prefix : "",
        suffix:
            typeof record.suffix === "string" ? record.suffix : ""
    };
}

function createHighlightRecord(range, block, existingId) {
    const blockIndex = buildTextIndex(block);
    const startOffset = getBoundaryOffset(
        blockIndex,
        range.startContainer,
        range.startOffset
    );
    const endOffset = getBoundaryOffset(
        blockIndex,
        range.endContainer,
        range.endOffset
    );

    if (
        startOffset === null ||
        endOffset === null ||
        endOffset <= startOffset
    ) {
        return null;
    }

    const exact = blockIndex.text.slice(startOffset, endOffset);

    if (!exact.trim()) {
        return null;
    }

    const documentIndex = buildTextIndex(document.body);
    const documentStart = getBoundaryOffset(
        documentIndex,
        range.startContainer,
        range.startOffset
    );
    const documentEnd = getBoundaryOffset(
        documentIndex,
        range.endContainer,
        range.endOffset
    );

    return {
        id: existingId || makeHighlightId(),
        version: HIGHLIGHT_VERSION,
        blockPath: getHighlightBlockPath(block),
        blockTag: block?.tagName?.toLowerCase() || "",
        startOffset,
        endOffset,
        exact,
        text: exact,
        prefix:
            documentStart === null
                ? ""
                : documentIndex.text.slice(
                      Math.max(
                          0,
                          documentStart - QUOTE_CONTEXT_LENGTH
                      ),
                      documentStart
                  ),
        suffix:
            documentEnd === null
                ? ""
                : documentIndex.text.slice(
                      documentEnd,
                      documentEnd + QUOTE_CONTEXT_LENGTH
                  )
    };
}

function saveHighlights() {
    const storage = globalThis.ADAPTStorage;

    if (!storage?.updatePage) {
        console.error(
            "[ADAPT] Could not save highlights because ADAPTStorage is unavailable."
        );
        return Promise.resolve();
    }

    const snapshot = highlightRecords.map((record) => ({
        ...record
    }));

    saveChain = saveChain
        .catch(() => {
            // A new save should still run after an earlier failure.
        })
        .then(() => storage.updatePage({ highlights: snapshot }))
        .catch((error) => {
            console.error(
                "[ADAPT] Could not save highlights:",
                error
            );
        });

    return saveChain;
}

function getHighlightSpans(highlightId) {
    return Array.from(
        document.querySelectorAll(".adapt-highlight-span")
    ).filter(
        (span) => span.dataset.adaptHighlightId === highlightId
    );
}

function unwrapHighlightSpans(highlightId = null) {
    const spans = highlightId
        ? getHighlightSpans(highlightId)
        : Array.from(
              document.querySelectorAll(".adapt-highlight-span")
          );
    const parents = new Set();

    spans.forEach((span) => {
        const parent = span.parentNode;

        if (!parent) {
            return;
        }

        parents.add(parent);

        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }

        span.remove();
    });

    parents.forEach((parent) => parent.normalize());
}

function removeHighlight(highlightId) {
    isApplyingHighlights = true;

    try {
        unwrapHighlightSpans(highlightId);
    } finally {
        isApplyingHighlights = false;
    }

    highlightRecords = highlightRecords.filter(
        (record) => record.id !== highlightId
    );
    saveHighlights();
}

function getRangeTextSegments(range) {
    const root =
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentNode
            : range.commonAncestorContainer;
    const index = buildTextIndex(root);
    const startOffset = getBoundaryOffset(
        index,
        range.startContainer,
        range.startOffset
    );
    const endOffset = getBoundaryOffset(
        index,
        range.endContainer,
        range.endOffset
    );

    if (
        startOffset === null ||
        endOffset === null ||
        endOffset <= startOffset
    ) {
        return [];
    }

    return index.entries
        .filter(
            (entry) =>
                entry.end > startOffset &&
                entry.start < endOffset
        )
        .map((entry) => ({
            node: entry.node,
            start: Math.max(
                0,
                startOffset - entry.start
            ),
            end: Math.min(
                entry.node.length,
                endOffset - entry.start
            )
        }))
        .filter(
            (segment) =>
                segment.end > segment.start &&
                segment.node.isConnected
        );
}

function getRangeOffsets(range, index) {
    const start = getBoundaryOffset(
        index,
        range.startContainer,
        range.startOffset
    );
    const end = getBoundaryOffset(
        index,
        range.endContainer,
        range.endOffset
    );

    if (start === null || end === null || end <= start) {
        return null;
    }

    return { start, end };
}

function getSpanOffsets(span, index) {
    const entries = index.entries.filter((entry) =>
        span.contains(entry.node)
    );

    if (entries.length === 0) {
        return null;
    }

    return {
        start: entries[0].start,
        end: entries[entries.length - 1].end
    };
}

function rangesOverlap(first, second) {
    return (
        first.start < second.end &&
        first.end > second.start
    );
}

function getOverlappingHighlightIds(range) {
    const index = buildTextIndex(document.body);
    const rangeOffsets = getRangeOffsets(range, index);

    if (!rangeOffsets) {
        return new Set();
    }

    const ids = new Set();

    document
        .querySelectorAll(".adapt-highlight-span")
        .forEach((span) => {
            const spanOffsets = getSpanOffsets(span, index);

            if (
                spanOffsets &&
                rangesOverlap(rangeOffsets, spanOffsets) &&
                span.dataset.adaptHighlightId
            ) {
                ids.add(span.dataset.adaptHighlightId);
            }
        });

    return ids;
}

function rangeIntersectsExistingHighlight(range) {
    return getOverlappingHighlightIds(range).size > 0;
}

function expandRangeToExistingHighlights(range, block) {
    const index = buildTextIndex(block);
    const originalOffsets = getRangeOffsets(range, index);

    if (!originalOffsets) {
        return {
            range,
            overlappingIds: new Set()
        };
    }

    const overlappingIds = new Set();

    document
        .querySelectorAll(".adapt-highlight-span")
        .forEach((span) => {
            if (!block.contains(span)) {
                return;
            }

            const spanOffsets = getSpanOffsets(span, index);

            if (
                spanOffsets &&
                rangesOverlap(originalOffsets, spanOffsets) &&
                span.dataset.adaptHighlightId
            ) {
                overlappingIds.add(
                    span.dataset.adaptHighlightId
                );
            }
        });

    let start = originalOffsets.start;
    let end = originalOffsets.end;

    if (overlappingIds.size > 0) {
        document
            .querySelectorAll(".adapt-highlight-span")
            .forEach((span) => {
                if (
                    !block.contains(span) ||
                    !overlappingIds.has(
                        span.dataset.adaptHighlightId
                    )
                ) {
                    return;
                }

                const spanOffsets = getSpanOffsets(span, index);

                if (spanOffsets) {
                    start = Math.min(start, spanOffsets.start);
                    end = Math.max(end, spanOffsets.end);
                }
            });
    }

    return {
        range:
            createRangeFromIndexOffsets(index, start, end) ||
            range,
        overlappingIds
    };
}

function wrapHighlightRange(range, record) {
    if (rangeIntersectsExistingHighlight(range)) {
        return false;
    }

    const segments = getRangeTextSegments(range);

    if (segments.length === 0) {
        return false;
    }

    isApplyingHighlights = true;

    try {
        [...segments].reverse().forEach((segment) => {
            const { node, start, end } = segment;
            let selectedNode =
                start === 0 ? node : node.splitText(start);
            const selectedLength = end - start;

            if (selectedLength < selectedNode.length) {
                selectedNode.splitText(selectedLength);
            }

            const span = document.createElement("span");
            span.className = "adapt-highlight-span";
            span.dataset.adaptHighlightId = record.id;

            selectedNode.parentNode.insertBefore(span, selectedNode);
            span.appendChild(selectedNode);
        });
    } catch (error) {
        console.error(
            "[ADAPT] Could not apply a highlight:",
            error
        );
        unwrapHighlightSpans(record.id);
        return false;
    } finally {
        isApplyingHighlights = false;
    }

    return getHighlightSpans(record.id).length > 0;
}

function commonPrefixLength(first, second) {
    const limit = Math.min(first.length, second.length);
    let length = 0;

    while (length < limit && first[length] === second[length]) {
        length += 1;
    }

    return length;
}

function commonSuffixLength(first, second) {
    const limit = Math.min(first.length, second.length);
    let length = 0;

    while (
        length < limit &&
        first[first.length - 1 - length] ===
            second[second.length - 1 - length]
    ) {
        length += 1;
    }

    return length;
}

function createNormalizedTextMap(rawText) {
    let normalizedText = "";
    const rawStarts = [];
    const rawEnds = [];
    let whitespaceStart = -1;
    let whitespaceEnd = -1;

    function appendPendingWhitespace() {
        if (
            whitespaceStart < 0 ||
            normalizedText.length === 0 ||
            normalizedText.endsWith(" ")
        ) {
            whitespaceStart = -1;
            whitespaceEnd = -1;
            return;
        }

        normalizedText += " ";
        rawStarts.push(whitespaceStart);
        rawEnds.push(whitespaceEnd);
        whitespaceStart = -1;
        whitespaceEnd = -1;
    }

    for (let index = 0; index < rawText.length; index += 1) {
        const character = rawText[index];

        if (/\s/u.test(character)) {
            if (whitespaceStart < 0) {
                whitespaceStart = index;
            }

            whitespaceEnd = index + 1;
            continue;
        }

        appendPendingWhitespace();
        normalizedText += character;
        rawStarts.push(index);
        rawEnds.push(index + 1);
    }

    return {
        text: normalizedText,
        rawStarts,
        rawEnds
    };
}

function normalizeQuoteText(value) {
    return String(value || "").replace(/\s+/gu, " ").trim();
}

function scoreQuoteCandidate(
    searchableText,
    start,
    end,
    prefix,
    suffix,
    preferredBlock,
    documentIndex,
    rawStart
) {
    const before = searchableText.slice(
        Math.max(0, start - prefix.length),
        start
    );
    const after = searchableText.slice(end, end + suffix.length);
    let score =
        commonSuffixLength(prefix, before) * 4 +
        commonPrefixLength(suffix, after) * 4;

    if (prefix && before.endsWith(prefix)) {
        score += 100;
    }

    if (suffix && after.startsWith(suffix)) {
        score += 100;
    }

    if (preferredBlock) {
        const entry = findTextEntry(
            documentIndex,
            rawStart,
            true
        );

        if (
            entry?.node &&
            preferredBlock.contains(entry.node)
        ) {
            score += 25;
        }
    }

    return score;
}

function findBestExactOffsets(
    documentIndex,
    record,
    preferredBlock
) {
    const exact = record.exact;
    let position = documentIndex.text.indexOf(exact);
    let occurrenceCount = 0;
    let best = null;
    let secondBestScore = -1;

    while (position >= 0 && occurrenceCount < 5000) {
        const end = position + exact.length;
        const score = scoreQuoteCandidate(
            documentIndex.text,
            position,
            end,
            record.prefix,
            record.suffix,
            preferredBlock,
            documentIndex,
            position
        );

        occurrenceCount += 1;

        if (!best || score > best.score) {
            secondBestScore = best?.score ?? secondBestScore;
            best = { start: position, end, score };
        } else if (score > secondBestScore) {
            secondBestScore = score;
        }

        position = documentIndex.text.indexOf(
            exact,
            position + Math.max(exact.length, 1)
        );
    }

    if (!best) {
        return null;
    }

    if (
        occurrenceCount === 1 ||
        best.score > secondBestScore
    ) {
        return best;
    }

    return null;
}

function findBestNormalizedOffsets(
    documentIndex,
    record,
    preferredBlock
) {
    const normalizedIndex = createNormalizedTextMap(
        documentIndex.text
    );
    const exact = normalizeQuoteText(record.exact);

    if (!exact) {
        return null;
    }

    const prefix = normalizeQuoteText(record.prefix);
    const suffix = normalizeQuoteText(record.suffix);
    let position = normalizedIndex.text.indexOf(exact);
    let occurrenceCount = 0;
    let best = null;
    let secondBestScore = -1;

    while (position >= 0 && occurrenceCount < 5000) {
        const normalizedEnd = position + exact.length;
        const rawStart = normalizedIndex.rawStarts[position];
        const rawEnd =
            normalizedIndex.rawEnds[normalizedEnd - 1];

        if (
            Number.isInteger(rawStart) &&
            Number.isInteger(rawEnd)
        ) {
            const score = scoreQuoteCandidate(
                normalizedIndex.text,
                position,
                normalizedEnd,
                prefix,
                suffix,
                preferredBlock,
                documentIndex,
                rawStart
            );

            occurrenceCount += 1;

            if (!best || score > best.score) {
                secondBestScore =
                    best?.score ?? secondBestScore;
                best = {
                    start: rawStart,
                    end: rawEnd,
                    score
                };
            } else if (score > secondBestScore) {
                secondBestScore = score;
            }
        }

        position = normalizedIndex.text.indexOf(
            exact,
            position + Math.max(exact.length, 1)
        );
    }

    if (!best) {
        return null;
    }

    if (
        occurrenceCount === 1 ||
        best.score > secondBestScore
    ) {
        return best;
    }

    return null;
}

function getPreferredBlock(record) {
    if (!record.blockPath) {
        return null;
    }

    try {
        return document.querySelector(record.blockPath);
    } catch {
        return null;
    }
}

function locateLegacyRecord(record, preferredBlock) {
    if (!preferredBlock) {
        return null;
    }

    const index = buildTextIndex(preferredBlock);
    const startOffset = Number(record.startOffset);
    const endOffset = Number(record.endOffset);

    if (
        Number.isFinite(startOffset) &&
        Number.isFinite(endOffset) &&
        index.text.slice(startOffset, endOffset) === record.exact
    ) {
        return {
            range: createRangeFromIndexOffsets(
                index,
                startOffset,
                endOffset
            ),
            block: preferredBlock
        };
    }

    const firstPosition = index.text.indexOf(record.exact);

    if (
        firstPosition >= 0 &&
        index.text.indexOf(
            record.exact,
            firstPosition + record.exact.length
        ) < 0
    ) {
        return {
            range: createRangeFromIndexOffsets(
                index,
                firstPosition,
                firstPosition + record.exact.length
            ),
            block: preferredBlock
        };
    }

    return null;
}

function locateHighlightRecord(record) {
    if (!document.body || !record.exact) {
        return null;
    }

    const preferredBlock = getPreferredBlock(record);

    if (!record.prefix && !record.suffix) {
        const legacyLocation = locateLegacyRecord(
            record,
            preferredBlock
        );

        if (legacyLocation?.range) {
            return legacyLocation;
        }
    }

    const documentIndex = buildTextIndex(document.body);
    const offsets =
        findBestExactOffsets(
            documentIndex,
            record,
            preferredBlock
        ) ||
        findBestNormalizedOffsets(
            documentIndex,
            record,
            preferredBlock
        );

    if (offsets) {
        const range = createRangeFromIndexOffsets(
            documentIndex,
            offsets.start,
            offsets.end
        );

        if (range) {
            return {
                range,
                block: getHighlightBlock(range.startContainer)
            };
        }
    }

    const preferredLocation = locateLegacyRecord(
        record,
        preferredBlock
    );

    return preferredLocation?.range
        ? preferredLocation
        : null;
}

function clearRestoreRetryTimers() {
    restoreRetryTimers.forEach((timer) =>
        window.clearTimeout(timer)
    );
    restoreRetryTimers = [];
}

function restoreMissingHighlights(options = {}) {
    if (isApplyingHighlights || !document.body) {
        return;
    }

    let migratedRecord = false;

    highlightRecords = highlightRecords.map((record) => {
        if (getHighlightSpans(record.id).length > 0) {
            return record;
        }

        const located = locateHighlightRecord(record);

        if (!located?.range) {
            return record;
        }

        const refreshedRecord =
            createHighlightRecord(
                located.range,
                located.block,
                record.id
            ) || record;

        if (!wrapHighlightRange(located.range, refreshedRecord)) {
            return record;
        }

        if (record.version < HIGHLIGHT_VERSION) {
            migratedRecord = true;
        }

        return refreshedRecord;
    });

    if (migratedRecord && options.saveMigrations !== false) {
        saveHighlights();
    }
}

function scheduleRestore(delay = 300) {
    if (restoreTimer !== null) {
        return;
    }

    restoreTimer = window.setTimeout(() => {
        restoreTimer = null;
        restoreMissingHighlights();
    }, delay);
}

function restoreHighlights(records) {
    clearRestoreRetryTimers();

    if (restoreTimer !== null) {
        window.clearTimeout(restoreTimer);
        restoreTimer = null;
    }

    isApplyingHighlights = true;

    try {
        unwrapHighlightSpans();
    } finally {
        isApplyingHighlights = false;
    }

    highlightRecords = Array.isArray(records)
        ? records
              .map(normalizeHighlightRecord)
              .filter(Boolean)
        : [];

    RESTORE_DELAYS.forEach((delay) => {
        const timer = window.setTimeout(() => {
            restoreMissingHighlights({
                saveMigrations: true
            });
        }, delay);

        restoreRetryTimers.push(timer);
    });
}

function getSelectedTextNodes(selectionRange) {
    if (
        selectionRange.commonAncestorContainer.nodeType ===
        Node.TEXT_NODE
    ) {
        return isUsableTextNode(
            selectionRange.commonAncestorContainer
        )
            ? [selectionRange.commonAncestorContainer]
            : [];
    }

    const index = buildTextIndex(
        selectionRange.commonAncestorContainer
    );
    const offsets = getRangeOffsets(selectionRange, index);

    if (!offsets) {
        return [];
    }

    return index.entries
        .filter(
            (entry) =>
                entry.end > offsets.start &&
                entry.start < offsets.end
        )
        .map((entry) => entry.node);
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
        selection.rangeCount === 0 ||
        selection.isCollapsed ||
        !selection.toString().trim()
    ) {
        return;
    }

    try {
        const selectionRange = selection.getRangeAt(0);
        const textNodes =
            getSelectedTextNodes(selectionRange);
        const blocks = [];

        textNodes.forEach((node) => {
            const block = getHighlightBlock(node);

            if (block && !blocks.includes(block)) {
                blocks.push(block);
            }
        });

        const candidates = [];

        blocks.forEach((block) => {
            const blockNodes = textNodes.filter(
                (node) => getHighlightBlock(node) === block
            );
            const firstNode = blockNodes[0];
            const lastNode = blockNodes[blockNodes.length - 1];

            if (!firstNode || !lastNode) {
                return;
            }

            const range = document.createRange();
            range.setStart(
                firstNode,
                firstNode === selectionRange.startContainer
                    ? selectionRange.startOffset
                    : 0
            );
            range.setEnd(
                lastNode,
                lastNode === selectionRange.endContainer
                    ? selectionRange.endOffset
                    : lastNode.length
            );

            if (range.collapsed) {
                return;
            }

            const expanded =
                expandRangeToExistingHighlights(range, block);
            const record = createHighlightRecord(
                expanded.range,
                block
            );

            if (!record?.blockPath || !record.exact) {
                return;
            }

            const duplicate = highlightRecords.some(
                (existing) =>
                    !expanded.overlappingIds.has(existing.id) &&
                    existing.exact === record.exact &&
                    existing.prefix === record.prefix &&
                    existing.suffix === record.suffix
            );

            if (!duplicate) {
                candidates.push({
                    range: expanded.range,
                    record,
                    overlappingIds:
                        expanded.overlappingIds
                });
            }
        });

        const allOverlappingIds = new Set();

        candidates.forEach(({ overlappingIds }) => {
            overlappingIds.forEach((id) =>
                allOverlappingIds.add(id)
            );
        });

        const removedRecords = highlightRecords.filter((record) =>
            allOverlappingIds.has(record.id)
        );

        if (allOverlappingIds.size > 0) {
            isApplyingHighlights = true;

            try {
                allOverlappingIds.forEach((id) =>
                    unwrapHighlightSpans(id)
                );
            } finally {
                isApplyingHighlights = false;
            }

            highlightRecords = highlightRecords.filter(
                (record) => !allOverlappingIds.has(record.id)
            );
        }

        const newRecords = [];
        const consumedOverlappingIds = new Set();

        candidates.forEach(
            ({ range, record, overlappingIds }) => {
                let targetRange = range;

                if (overlappingIds.size > 0) {
                    targetRange =
                        locateHighlightRecord(record)?.range ||
                        null;
                }

                if (
                    targetRange &&
                    wrapHighlightRange(targetRange, record)
                ) {
                    newRecords.push(record);
                    overlappingIds.forEach((id) =>
                        consumedOverlappingIds.add(id)
                    );
                }
            }
        );

        const recordsToRestore = removedRecords.filter(
            (record) =>
                !consumedOverlappingIds.has(record.id)
        );

        if (recordsToRestore.length > 0) {
            highlightRecords.push(...recordsToRestore);
            restoreMissingHighlights({
                saveMigrations: false
            });
        }

        if (newRecords.length > 0) {
            highlightRecords.push(...newRecords);
            saveHighlights();
        }

        if (
            newRecords.length === 0 &&
            recordsToRestore.length === 0 &&
            allOverlappingIds.size > 0
        ) {
            removedRecords.forEach((record) => {
                if (
                    !highlightRecords.some(
                        (existing) => existing.id === record.id
                    )
                ) {
                    highlightRecords.push(record);
                }
            });
            restoreMissingHighlights({
                saveMigrations: false
            });
        }

        selection.removeAllRanges();
    } catch (error) {
        console.error(
            "[ADAPT] Error highlighting text:",
            error
        );
    }
}

document.addEventListener(
    "click",
    (event) => {
        const target =
            event.target instanceof Element
                ? event.target
                : event.target?.parentElement;
        const span = target?.closest?.(
            ".adapt-highlight-span"
        );

        if (
            !span ||
            !document.documentElement.classList.contains(
                "adapt-extension-active"
            )
        ) {
            return;
        }

        const selection = window.getSelection();

        if (selection && !selection.isCollapsed) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        removeHighlight(span.dataset.adaptHighlightId);
    },
    true
);

const highlighterObserver = new MutationObserver((mutations) => {
    if (isApplyingHighlights || highlightRecords.length === 0) {
        return;
    }

    const hasRelevantMutation = mutations.some((mutation) => {
        const element =
            mutation.target.nodeType === Node.ELEMENT_NODE
                ? mutation.target
                : mutation.target.parentElement;

        return !element?.closest?.("[data-adapt-owned]");
    });

    if (hasRelevantMutation) {
        scheduleRestore();
    }
});

highlighterObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
});

globalThis.ADAPTStorage?.subscribePage?.((savedPage) => {
    restoreHighlights(savedPage.highlights);
});

globalThis.ADAPTHighlighter = Object.freeze({
    toggle: toggleHighlight,
    restore: restoreHighlights,
    retryRestore: restoreMissingHighlights,
    getHighlights: () =>
        highlightRecords.map((record) => ({ ...record }))
});