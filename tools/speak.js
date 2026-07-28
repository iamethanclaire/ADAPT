// Read hovered words or sentences aloud with the Web Speech API.
(function initializeADAPTSpeak() {
    "use strict";

    const ACTIVE_CLASS = "adapt-speak-active";
    const STYLE_ID = "adapt-speak-style";
    const OVERLAY_ID = "adapt-speak-overlay";

    const SENTENCE_CONTAINER_SELECTOR = [
        "p",
        "li",
        "blockquote",
        "figcaption",
        "caption",
        "td",
        "th",
        "dt",
        "dd",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6"
    ].join(",");

    const EXCLUDED_CONTENT_SELECTOR = [
        "script",
        "style",
        "noscript",
        "template",
        "textarea",
        "input",
        "select",
        "option",
        "canvas",
        "svg",
        "[contenteditable='true']",
        "[contenteditable='']",
        "[aria-hidden='true']"
    ].join(",");

    const speakerCursorSvg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">',
        '<path d="M2 2l8.6 21.1 3.1-7.4 7.5-3.1L2 2z" fill="white" stroke="#17202a" stroke-width="1.6" stroke-linejoin="round"/>',
        '<path d="M18 19h3l4-3v10l-4-3h-3z" fill="#1479b8" stroke="white" stroke-width="1.2" stroke-linejoin="round"/>',
        '<path d="M26.2 18.3a4.3 4.3 0 010 5.4M28.4 16.2a7.2 7.2 0 010 9.6" fill="none" stroke="#1479b8" stroke-width="1.8" stroke-linecap="round"/>',
        "</svg>"
    ].join("");

    const speakerCursor =
        `url("data:image/svg+xml,${encodeURIComponent(
            speakerCursorSvg
        )}") 2 2, pointer`;

    const wordSegmenter =
        typeof Intl?.Segmenter === "function"
            ? new Intl.Segmenter(undefined, {
                  granularity: "word"
              })
            : null;

    const sentenceSegmenter =
        typeof Intl?.Segmenter === "function"
            ? new Intl.Segmenter(undefined, {
                  granularity: "sentence"
              })
            : null;

    let enabled = false;
    let shiftPressed = false;
    let animationFrameId = null;
    let lastPointer = null;
    let currentRange = null;
    let currentText = "";
    let activeUtterance = null;

    function installStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement("style");
        style.id = STYLE_ID;

        style.textContent = `
            html.${ACTIVE_CLASS},
            html.${ACTIVE_CLASS} body,
            html.${ACTIVE_CLASS} body * {
                cursor: ${speakerCursor} !important;
            }

            html.${ACTIVE_CLASS} body,
            html.${ACTIVE_CLASS} body * {
                -webkit-user-select: none !important;
                user-select: none !important;
            }
        `;

        (document.head || document.documentElement).appendChild(
            style
        );
    }

    function isAdaptInterfaceEvent(event) {
        const path = event.composedPath();
        let toolbarShadow = null;

        try {
            if (typeof adaptShadow !== "undefined") {
                toolbarShadow = adaptShadow;
            }
        } catch {
            toolbarShadow = null;
        }

        if (
            toolbarShadow &&
            (path.includes(toolbarShadow) ||
                path.includes(toolbarShadow.host))
        ) {
            return true;
        }

        return path.some((entry) => {
            if (!(entry instanceof Element)) {
                return false;
            }

            const root = entry.getRootNode();

            if (!(root instanceof ShadowRoot)) {
                return false;
            }

            const hostId = root.host?.id || "";

            const hostClass =
                typeof root.host?.className === "string"
                    ? root.host.className
                    : "";

            return (
                hostId.startsWith("adapt-") ||
                hostClass
                    .split(/\s+/)
                    .some((name) => name.startsWith("adapt-"))
            );
        });
    }

    function isReadableTextNode(node) {
        if (
            !node ||
            node.nodeType !== Node.TEXT_NODE
        ) {
            return false;
        }

        const parent = node.parentElement;

        return Boolean(
            parent &&
                node.data.trim() &&
                !parent.closest(EXCLUDED_CONTENT_SELECTOR)
        );
    }

    function normalizeCaret(caret) {
        if (!caret) {
            return null;
        }

        if (!isReadableTextNode(caret.node)) {
            return null;
        }

        return {
            node: caret.node,
            offset: Math.max(
                0,
                Math.min(
                    caret.offset,
                    caret.node.data.length
                )
            )
        };
    }

    function getWordSegments(text) {
        if (wordSegmenter) {
            return Array.from(wordSegmenter.segment(text))
                .filter((segment) => segment.isWordLike)
                .map((segment) => ({
                    start: segment.index,
                    end:
                        segment.index +
                        segment.segment.length
                }));
        }

        const segments = [];

        const wordPattern =
            /[\p{L}\p{M}\p{N}_'’\u2010-\u2015-]+/gu;

        let match;

        while ((match = wordPattern.exec(text))) {
            segments.push({
                start: match.index,
                end: match.index + match[0].length
            });
        }

        return segments;
    }

    function getRectDistance(rect, x, y) {
        const horizontalDistance =
            x < rect.left
                ? rect.left - x
                : x > rect.right
                  ? x - rect.right
                  : 0;

        const verticalDistance =
            y < rect.top
                ? rect.top - y
                : y > rect.bottom
                  ? y - rect.bottom
                  : 0;

        return Math.hypot(
            horizontalDistance,
            verticalDistance
        );
    }

    function findTextPositionAtPoint(x, y) {
        let element = document.elementFromPoint(x, y);

        if (!element) {
            return null;
        }

        const candidates = [];
        let level = 0;

        while (
            element &&
            level < 4 &&
            element !== document.documentElement
        ) {
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT
            );

            let textNode;
            let inspectedNodes = 0;

            while (
                (textNode = walker.nextNode()) &&
                inspectedNodes < 250
            ) {
                inspectedNodes += 1;

                if (!isReadableTextNode(textNode)) {
                    continue;
                }

                const segments = getWordSegments(
                    textNode.data
                );

                for (const segment of segments) {
                    const range = document.createRange();

                    range.setStart(
                        textNode,
                        segment.start
                    );

                    range.setEnd(
                        textNode,
                        segment.end
                    );

                    for (const rect of range.getClientRects()) {
                        const distance = getRectDistance(
                            rect,
                            x,
                            y
                        );

                        if (distance <= 6) {
                            candidates.push({
                                node: textNode,
                                offset: segment.start,
                                distance
                            });
                        }
                    }
                }
            }

            if (candidates.length) {
                candidates.sort(
                    (first, second) =>
                        first.distance - second.distance
                );

                return {
                    node: candidates[0].node,
                    offset: candidates[0].offset
                };
            }

            element = element.parentElement;
            level += 1;
        }

        return null;
    }

    function getCaretAtPoint(x, y) {
        if (
            typeof document.caretRangeFromPoint ===
            "function"
        ) {
            const caretRange =
                document.caretRangeFromPoint(x, y);

            const normalizedCaret = normalizeCaret(
                caretRange
                    ? {
                          node: caretRange.startContainer,
                          offset: caretRange.startOffset
                      }
                    : null
            );

            if (normalizedCaret) {
                return normalizedCaret;
            }
        }

        if (
            typeof document.caretPositionFromPoint ===
            "function"
        ) {
            const caretPosition =
                document.caretPositionFromPoint(x, y);

            const normalizedCaret = normalizeCaret(
                caretPosition
                    ? {
                          node: caretPosition.offsetNode,
                          offset: caretPosition.offset
                      }
                    : null
            );

            if (normalizedCaret) {
                return normalizedCaret;
            }
        }

        return findTextPositionAtPoint(x, y);
    }

    function getWordBoundsWithSegmenter(
        text,
        offset
    ) {
        const candidates = [offset, offset - 1].filter(
            (value, index, values) =>
                value >= 0 &&
                value < text.length &&
                values.indexOf(value) === index
        );

        for (const candidate of candidates) {
            for (const segment of wordSegmenter.segment(text)) {
                const end =
                    segment.index +
                    segment.segment.length;

                if (
                    segment.isWordLike &&
                    candidate >= segment.index &&
                    candidate < end
                ) {
                    return {
                        start: segment.index,
                        end
                    };
                }
            }
        }

        return null;
    }

    function getWordBoundsFallback(text, offset) {
        const candidates = new Set([
            offset,
            offset - 1
        ]);

        const wordPattern =
            /[\p{L}\p{M}\p{N}_'’\u2010-\u2015-]+/gu;

        let match;

        while ((match = wordPattern.exec(text))) {
            const start = match.index;
            const end = start + match[0].length;

            for (const candidate of candidates) {
                if (
                    candidate >= start &&
                    candidate < end
                ) {
                    return {
                        start,
                        end
                    };
                }
            }
        }

        return null;
    }

    function getWordRange(textNode, offset) {
        const text = textNode.data;

        const bounds = wordSegmenter
            ? getWordBoundsWithSegmenter(
                  text,
                  offset
              )
            : getWordBoundsFallback(
                  text,
                  offset
              );

        if (!bounds) {
            return null;
        }

        const range = document.createRange();

        range.setStart(
            textNode,
            bounds.start
        );

        range.setEnd(
            textNode,
            bounds.end
        );

        return range;
    }

    function getSentenceContainer(textNode) {
        const parent = textNode.parentElement;

        const explicitContainer = parent.closest(
            SENTENCE_CONTAINER_SELECTOR
        );

        if (explicitContainer) {
            return explicitContainer;
        }

        let element = parent;

        while (
            element &&
            element !== document.body &&
            element !== document.documentElement
        ) {
            const display =
                getComputedStyle(element).display;

            if (
                display !== "inline" &&
                display !== "contents"
            ) {
                return element;
            }

            element = element.parentElement;
        }

        return parent;
    }

    function collectTextMap(
        container,
        targetNode
    ) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    return isReadableTextNode(node)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );

        const entries = [];
        let text = "";
        let targetEntry = null;
        let node;

        while ((node = walker.nextNode())) {
            const entry = {
                node,
                start: text.length,
                end: text.length + node.data.length
            };

            entries.push(entry);
            text += node.data;

            if (node === targetNode) {
                targetEntry = entry;
            }
        }

        return {
            text,
            entries,
            targetEntry
        };
    }

    function trimBounds(
        text,
        start,
        end
    ) {
        while (
            start < end &&
            /\s/u.test(text[start])
        ) {
            start += 1;
        }

        while (
            end > start &&
            /\s/u.test(text[end - 1])
        ) {
            end -= 1;
        }

        return {
            start,
            end
        };
    }

    function getSentenceBoundsWithSegmenter(
        text,
        offset
    ) {
        const safeOffset = Math.max(
            0,
            Math.min(
                offset,
                text.length - 1
            )
        );

        for (
            const segment of sentenceSegmenter.segment(text)
        ) {
            const end =
                segment.index +
                segment.segment.length;

            if (
                safeOffset >= segment.index &&
                safeOffset < end
            ) {
                return trimBounds(
                    text,
                    segment.index,
                    end
                );
            }
        }

        return null;
    }

    function getSentenceBoundsFallback(
        text,
        offset
    ) {
        let start = 0;
        let end = text.length;

        for (
            let index = offset - 1;
            index >= 0;
            index -= 1
        ) {
            if (/[.!?]/u.test(text[index])) {
                start = index + 1;
                break;
            }
        }

        for (
            let index = Math.max(0, offset);
            index < text.length;
            index += 1
        ) {
            if (/[.!?]/u.test(text[index])) {
                end = index + 1;
                break;
            }
        }

        return trimBounds(
            text,
            start,
            end
        );
    }

    function mapTextIndexToDom(
        entries,
        index,
        isEnd
    ) {
        if (isEnd) {
            for (
                let entryIndex = entries.length - 1;
                entryIndex >= 0;
                entryIndex -= 1
            ) {
                const entry = entries[entryIndex];

                if (
                    index >= entry.start &&
                    index <= entry.end
                ) {
                    return {
                        node: entry.node,
                        offset: Math.min(
                            index - entry.start,
                            entry.node.data.length
                        )
                    };
                }
            }
        } else {
            for (const entry of entries) {
                if (
                    index >= entry.start &&
                    index <= entry.end
                ) {
                    return {
                        node: entry.node,
                        offset: Math.max(
                            0,
                            index - entry.start
                        )
                    };
                }
            }
        }

        return null;
    }

    function getSentenceRange(
        textNode,
        offset
    ) {
        const container =
            getSentenceContainer(textNode);

        const map = collectTextMap(
            container,
            textNode
        );

        if (
            !map.targetEntry ||
            !map.text.trim()
        ) {
            return null;
        }

        const absoluteOffset =
            map.targetEntry.start +
            Math.min(
                offset,
                textNode.data.length
            );

        const bounds = sentenceSegmenter
            ? getSentenceBoundsWithSegmenter(
                  map.text,
                  absoluteOffset
              )
            : getSentenceBoundsFallback(
                  map.text,
                  absoluteOffset
              );

        if (
            !bounds ||
            bounds.start >= bounds.end
        ) {
            return null;
        }

        const start = mapTextIndexToDom(
            map.entries,
            bounds.start,
            false
        );

        const end = mapTextIndexToDom(
            map.entries,
            bounds.end,
            true
        );

        if (!start || !end) {
            return null;
        }

        const range = document.createRange();

        range.setStart(
            start.node,
            start.offset
        );

        range.setEnd(
            end.node,
            end.offset
        );

        return range;
    }

    function getRangeAtPoint(
        x,
        y,
        useSentence
    ) {
        const caret = getCaretAtPoint(x, y);

        if (
            !caret ||
            !isReadableTextNode(caret.node)
        ) {
            return null;
        }

        return useSentence
            ? getSentenceRange(
                  caret.node,
                  caret.offset
              )
            : getWordRange(
                  caret.node,
                  caret.offset
              );
    }

    function getOverlay() {
        let overlay =
            document.getElementById(OVERLAY_ID);

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = OVERLAY_ID;

            Object.assign(overlay.style, {
                position: "fixed",
                inset: "0",
                zIndex: "2147483646",
                pointerEvents: "none"
            });

            document.documentElement.appendChild(
                overlay
            );
        }

        return overlay;
    }

    function clearHighlight() {
        document
            .getElementById(OVERLAY_ID)
            ?.remove();

        currentRange = null;
        currentText = "";
    }

    function renderHighlight(range) {
        const overlay = getOverlay();

        overlay.replaceChildren();

        for (const rect of range.getClientRects()) {
            if (
                !rect.width ||
                !rect.height
            ) {
                continue;
            }

            const highlight =
                document.createElement("div");

            Object.assign(highlight.style, {
                position: "absolute",
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                borderRadius: "2px",
                background:
                    "rgba(135, 206, 250, 0.58)"
            });

            overlay.appendChild(highlight);
        }
    }

    function showHighlight(range) {
        const text = range
            .toString()
            .replace(/\s+/gu, " ")
            .trim();

        if (!text) {
            clearHighlight();
            return;
        }

        currentRange = range.cloneRange();
        currentText = text;

        renderHighlight(currentRange);
    }

    function updateHighlightAtPointer() {
        animationFrameId = null;

        if (
            !enabled ||
            !lastPointer
        ) {
            clearHighlight();
            return;
        }

        const element = document.elementFromPoint(
            lastPointer.x,
            lastPointer.y
        );

        if (!element) {
            clearHighlight();
            return;
        }

        const range = getRangeAtPoint(
            lastPointer.x,
            lastPointer.y,
            shiftPressed ||
                lastPointer.shiftKey
        );

        if (range) {
            showHighlight(range);
        } else {
            clearHighlight();
        }
    }

    function scheduleHighlightUpdate() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(
                animationFrameId
            );
        }

        animationFrameId =
            requestAnimationFrame(
                updateHighlightAtPointer
            );
    }

    function handlePointerMove(event) {
        if (!enabled) {
            return;
        }

        if (isAdaptInterfaceEvent(event)) {
            lastPointer = null;
            clearHighlight();
            return;
        }

        lastPointer = {
            x: event.clientX,
            y: event.clientY,
            shiftKey: event.shiftKey
        };

        scheduleHighlightUpdate();
    }

    function speakText(text) {
        if (
            !("speechSynthesis" in globalThis) ||
            typeof globalThis.SpeechSynthesisUtterance !==
                "function"
        ) {
            console.warn(
                "[ADAPT] Speech synthesis is not supported in this browser."
            );
            return;
        }

        speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(text);

        utterance.lang =
            document.documentElement.lang ||
            navigator.language ||
            "en-US";

        utterance.onend = () => {
            if (
                activeUtterance === utterance
            ) {
                activeUtterance = null;
            }
        };

        utterance.onerror = () => {
            if (
                activeUtterance === utterance
            ) {
                activeUtterance = null;
            }
        };

        activeUtterance = utterance;

        speechSynthesis.speak(utterance);
    }

    function handleClick(event) {
        if (
            !enabled ||
            event.button !== 0 ||
            isAdaptInterfaceEvent(event)
        ) {
            return;
        }

        const range = getRangeAtPoint(
            event.clientX,
            event.clientY,
            event.shiftKey ||
                shiftPressed
        );

        if (!range) {
            return;
        }

        const text = range
            .toString()
            .replace(/\s+/gu, " ")
            .trim();

        if (!text) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        showHighlight(range);
        speakText(text);
    }

    function handleKeyDown(event) {
        if (
            event.key !== "Shift" ||
            event.repeat
        ) {
            return;
        }

        shiftPressed = true;

        if (lastPointer) {
            lastPointer.shiftKey = true;
            scheduleHighlightUpdate();
        }
    }

    function handleKeyUp(event) {
        if (event.key !== "Shift") {
            return;
        }

        shiftPressed = false;

        if (lastPointer) {
            lastPointer.shiftKey = false;
            scheduleHighlightUpdate();
        }
    }

    function handlePointerExit(event) {
        if (event.relatedTarget === null) {
            lastPointer = null;
            clearHighlight();
        }
    }

    function handleViewportChange() {
        if (lastPointer) {
            scheduleHighlightUpdate();
        }
    }

    function addListeners() {
        document.addEventListener(
            "pointermove",
            handlePointerMove,
            true
        );

        document.addEventListener(
            "mousemove",
            handlePointerMove,
            true
        );

        document.addEventListener(
            "click",
            handleClick,
            true
        );

        document.addEventListener(
            "keydown",
            handleKeyDown,
            true
        );

        document.addEventListener(
            "keyup",
            handleKeyUp,
            true
        );

        document.addEventListener(
            "mouseout",
            handlePointerExit,
            true
        );

        document.addEventListener(
            "scroll",
            handleViewportChange,
            true
        );

        globalThis.addEventListener(
            "resize",
            handleViewportChange
        );

        globalThis.addEventListener(
            "blur",
            clearHighlight
        );
    }

    function removeListeners() {
        document.removeEventListener(
            "pointermove",
            handlePointerMove,
            true
        );

        document.removeEventListener(
            "mousemove",
            handlePointerMove,
            true
        );

        document.removeEventListener(
            "click",
            handleClick,
            true
        );

        document.removeEventListener(
            "keydown",
            handleKeyDown,
            true
        );

        document.removeEventListener(
            "keyup",
            handleKeyUp,
            true
        );

        document.removeEventListener(
            "mouseout",
            handlePointerExit,
            true
        );

        document.removeEventListener(
            "scroll",
            handleViewportChange,
            true
        );

        globalThis.removeEventListener(
            "resize",
            handleViewportChange
        );

        globalThis.removeEventListener(
            "blur",
            clearHighlight
        );
    }

    function toggle(shouldEnable) {
        const nextEnabled =
            Boolean(shouldEnable);

        if (enabled === nextEnabled) {
            return;
        }

        enabled = nextEnabled;

        installStyles();

        document.documentElement.classList.toggle(
            ACTIVE_CLASS,
            enabled
        );

        if (enabled) {
            addListeners();
            return;
        }

        removeListeners();

        shiftPressed = false;
        lastPointer = null;

        if (animationFrameId !== null) {
            cancelAnimationFrame(
                animationFrameId
            );

            animationFrameId = null;
        }

        clearHighlight();

        if ("speechSynthesis" in globalThis) {
            speechSynthesis.cancel();
        }

        activeUtterance = null;
    }

    globalThis.ADAPTSpeak = Object.freeze({
        toggle,

        isEnabled() {
            return enabled;
        },

        getCurrentText() {
            return currentText;
        },

        isSupported() {
            return (
                "speechSynthesis" in globalThis &&
                typeof globalThis
                    .SpeechSynthesisUtterance ===
                    "function"
            );
        }
    });
})();