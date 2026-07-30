// Define hovered words with a compact dictionary popup.
(function initializeADAPTDefine() {
    "use strict";

    const ACTIVE_CLASS = "adapt-define-active";
    const STYLE_ID = "adapt-define-style";
    const OVERLAY_ID = "adapt-define-highlight-overlay";
    const POPUP_HOST_ID = "adapt-define-popup-host";
    const DICTIONARY_ENDPOINT =
        "https://api.dictionaryapi.dev/api/v2/entries/en/";
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

    const wordSegmenter =
        typeof Intl?.Segmenter === "function"
            ? new Intl.Segmenter(undefined, {
                  granularity: "word"
              })
            : null;

    const definitionCache = new Map();

    let enabled = false;
    let animationFrameId = null;
    let lastPointer = null;
    let currentRange = null;
    let currentWord = "";
    let popupHost = null;
    let popupShadow = null;
    let activeRequest = null;
    let requestNumber = 0;
    let activeAudio = null;

    function installPageStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            html.${ACTIVE_CLASS},
            html.${ACTIVE_CLASS} body,
            html.${ACTIVE_CLASS} body * {
                cursor: help !important;
            }

            html.${ACTIVE_CLASS} body,
            html.${ACTIVE_CLASS} body * {
                -webkit-user-select: none !important;
                user-select: none !important;
            }

            #${POPUP_HOST_ID} {
                -webkit-user-select: text !important;
                user-select: text !important;
            }
        `;

        (document.head || document.documentElement).appendChild(
            style
        );
    }

    function isToolbarEvent(event) {
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
                hostId.startsWith("adapt-toolbar") ||
                hostClass
                    .split(/\s+/)
                    .some((name) =>
                        name.startsWith("adapt-toolbar")
                    )
            );
        });
    }

    function isPopupEvent(event) {
        return Boolean(
            popupHost &&
                event
                    .composedPath()
                    .some(
                        (entry) =>
                            entry === popupHost ||
                            entry === popupShadow
                    )
        );
    }

    function isExtensionInterfaceEvent(event) {
        return isToolbarEvent(event) || isPopupEvent(event);
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
                !parent.closest(EXCLUDED_CONTENT_SELECTOR) &&
                !parent.closest(`#${POPUP_HOST_ID}`)
        );
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

    function normalizeCaret(caret) {
        if (!caret || !isReadableTextNode(caret.node)) {
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

        if (!element || element === popupHost) {
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

                for (const segment of getWordSegments(
                    textNode.data
                )) {
                    const range = document.createRange();
                    range.setStart(
                        textNode,
                        segment.start
                    );
                    range.setEnd(textNode, segment.end);

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
        if (typeof document.caretRangeFromPoint === "function") {
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

    function getWordBounds(text, offset) {
        const candidates = [offset, offset - 1].filter(
            (value, index, values) =>
                value >= 0 &&
                value < text.length &&
                values.indexOf(value) === index
        );

        for (const candidate of candidates) {
            for (const segment of getWordSegments(text)) {
                if (
                    candidate >= segment.start &&
                    candidate < segment.end
                ) {
                    return segment;
                }
            }
        }

        return null;
    }

    function getWordRangeAtPoint(x, y) {
        const caret = getCaretAtPoint(x, y);

        if (!caret) {
            return null;
        }

        const bounds = getWordBounds(
            caret.node.data,
            caret.offset
        );

        if (!bounds) {
            return null;
        }

        const range = document.createRange();
        range.setStart(caret.node, bounds.start);
        range.setEnd(caret.node, bounds.end);

        return range;
    }

    function getOverlay() {
        let overlay = document.getElementById(OVERLAY_ID);

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = OVERLAY_ID;
            Object.assign(overlay.style, {
                position: "fixed",
                inset: "0",
                zIndex: "2147483645",
                pointerEvents: "none"
            });
            document.documentElement.appendChild(overlay);
        }

        return overlay;
    }

    function clearHighlight() {
        document.getElementById(OVERLAY_ID)?.remove();
        currentRange = null;
        currentWord = "";
    }

    function renderHighlight(range) {
        const overlay = getOverlay();
        overlay.replaceChildren();

        for (const rect of range.getClientRects()) {
            if (!rect.width || !rect.height) {
                continue;
            }

            const highlight = document.createElement("div");
            Object.assign(highlight.style, {
                position: "absolute",
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                borderRadius: "2px",
                background: "rgba(135, 206, 250, 0.58)"
            });
            overlay.appendChild(highlight);
        }
    }

    function showHighlight(range) {
        const word = range.toString().trim();

        if (!word) {
            clearHighlight();
            return;
        }

        currentRange = range.cloneRange();
        currentWord = word;
        renderHighlight(currentRange);
    }

    function createElement(
        tagName,
        options = {}
    ) {
        const element = document.createElement(tagName);

        if (options.className) {
            element.className = options.className;
        }

        if (options.text !== undefined) {
            element.textContent = options.text;
        }

        if (options.title) {
            element.title = options.title;
        }

        return element;
    }

    function ensurePopup() {
        if (
            popupHost?.isConnected &&
            popupShadow
        ) {
            return popupHost;
        }

        popupHost = document.createElement("div");
        popupHost.id = POPUP_HOST_ID;
        Object.assign(popupHost.style, {
            position: "fixed",
            left: "12px",
            top: "12px",
            width: "min(340px, calc(100vw - 24px))",
            zIndex: "2147483647",
            visibility: "hidden"
        });

        popupShadow = popupHost.attachShadow({
            mode: "open"
        });

        const style = document.createElement("style");
        style.textContent = `
            :host {
                color-scheme: light;
                font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    Roboto,
                    Helvetica,
                    Arial,
                    sans-serif;
            }

            * {
                box-sizing: border-box;
            }

            .popup {
                width: 100%;
                max-height: min(420px, calc(100vh - 24px));
                overflow: auto;
                color: #18212a;
                background: #ffffff;
                border: 1px solid #b8c7d3;
                border-radius: 12px;
                box-shadow:
                    0 12px 34px rgba(17, 35, 50, 0.22),
                    0 2px 8px rgba(17, 35, 50, 0.12);
                cursor: default;
                -webkit-user-select: text;
                user-select: text;
            }

            .header {
                position: sticky;
                top: 0;
                z-index: 0;
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 14px 14px 12px;
                background: #ffffff;
                border-bottom: 1px solid #e4ebf0;
            }

            .heading {
                flex: 1;
                min-width: 0;
            }

            .word {
                margin: 0;
                color: #13212c;
                font-size: 21px;
                font-weight: 700;
                line-height: 1.2;
                overflow-wrap: anywhere;
            }

            .phonetic {
                display: block;
                margin-top: 3px;
                color: #587080;
                font-size: 13px;
                line-height: 1.35;
            }

            button {
                border: 0;
                font: inherit;
                cursor: pointer;
            }

            .close {
                display: grid;
                flex: 0 0 28px;
                width: 28px;
                height: 28px;
                place-items: center;
                padding: 0;
                color: #425767;
                background: #ffffff;
                border-radius: 7px;
                font-size: 20px;
                line-height: 1;
            }

            .close:hover {
                color: #17242e;
                background: #ffffff;
            }

            .content {
                padding: 14px;
            }

            .status {
                margin: 0;
                color: #4d6372;
                font-size: 14px;
                line-height: 1.5;
            }

            .error {
                color: #9c2f2f;
            }

            .meaning + .meaning {
                margin-top: 17px;
                padding-top: 15px;
                border-top: 1px solid #e7edf1;
            }

            .part-of-speech {
                margin: 0 0 8px;
                color: #176eaa;
                font-size: 13px;
                font-style: italic;
                font-weight: 700;
                text-transform: capitalize;
            }

            .definitions {
                margin: 0;
                padding-left: 21px;
            }

            .definition {
                padding-left: 2px;
                color: #22313b;
                font-size: 14px;
                line-height: 1.48;
            }

            .definition + .definition {
                margin-top: 10px;
            }

            .example {
                display: block;
                margin-top: 5px;
                color: #657985;
                font-size: 13px;
                font-style: italic;
            }

            .synonyms {
                margin: 10px 0 0;
                color: #526a78;
                font-size: 12px;
                line-height: 1.45;
            }

            .source {
                margin: 16px 0 0;
                color: #82939e;
                font-size: 10px;
                text-align: right;
            }
        `;

        const popup = createElement("section", {
            className: "popup"
        });
        popup.setAttribute(
            "role",
            "dialog"
        );
        popup.setAttribute(
            "aria-label",
            "Dictionary definition"
        );

        const header = createElement("header", {
            className: "header"
        });
        const heading = createElement("div", {
            className: "heading"
        });
        const word = createElement("h2", {
            className: "word"
        });
        const phonetic = createElement("span", {
            className: "phonetic"
        });
        const closeButton = createElement("button", {
            className: "close",
            text: "×",
            title: "Close definition"
        });
        closeButton.type = "button";
        closeButton.setAttribute(
            "aria-label",
            "Close definition"
        );

        const content = createElement("div", {
            className: "content"
        });

        heading.append(word, phonetic);
        header.append(heading, closeButton);
        popup.append(header, content);
        popupShadow.append(style, popup);

        closeButton.addEventListener("click", () => {
            closePopup({
                clearSelection: true
            });
        });

        document.documentElement.appendChild(popupHost);
        return popupHost;
    }

    function getPopupElement(selector) {
        return popupShadow?.querySelector(selector) || null;
    }

    function setPopupHeading(word, phonetic = "") {
        const wordElement = getPopupElement(".word");
        const phoneticElement =
            getPopupElement(".phonetic");

        if (wordElement) {
            wordElement.textContent = word;
        }

        if (phoneticElement) {
            phoneticElement.textContent = phonetic;
            phoneticElement.hidden = !phonetic;
        }
    }

    function setPopupStatus(word, message, isError = false) {
        ensurePopup();
        setPopupHeading(word);

        const content = getPopupElement(".content");
        const status = createElement("p", {
            className: `status${isError ? " error" : ""}`,
            text: message
        });

        content?.replaceChildren(status);
        positionPopup();
    }

    function getAudioUrl(entry) {
        const audio = entry.phonetics?.find(
            (phonetic) => phonetic.audio
        )?.audio;

        if (!audio) {
            return "";
        }

        return audio.startsWith("//")
            ? `https:${audio}`
            : audio;
    }

    function getPhonetic(entry) {
        return (
            entry.phonetic ||
            entry.phonetics?.find(
                (phonetic) => phonetic.text
            )?.text ||
            ""
        );
    }

    function playPronunciation(audioUrl, button) {
        activeAudio?.pause();
        activeAudio = new Audio(audioUrl);

        const originalText = button.textContent;
        button.textContent = "Playing…";
        button.disabled = true;

        const restoreButton = () => {
            button.textContent = originalText;
            button.disabled = false;
        };

        activeAudio.addEventListener(
            "ended",
            restoreButton,
            {
                once: true
            }
        );
        activeAudio.addEventListener(
            "error",
            restoreButton,
            {
                once: true
            }
        );

        activeAudio.play().catch(() => {
            restoreButton();
        });
    }

    function renderDefinition(word, entries) {
        ensurePopup();

        const entry = entries[0];
        const displayWord = entry?.word || word;
        const phonetic = entry ? getPhonetic(entry) : "";
        const audioUrl = entry ? getAudioUrl(entry) : "";
        const content = getPopupElement(".content");

        setPopupHeading(displayWord, phonetic);

        if (!content) {
            return;
        }

        const fragment = document.createDocumentFragment();

        const meanings = entries
            .flatMap((item) => item.meanings || [])
            .filter(
                (meaning) =>
                    Array.isArray(meaning.definitions) &&
                    meaning.definitions.length
            )
            .slice(0, 4);

        for (const meaning of meanings) {
            const section = createElement("section", {
                className: "meaning"
            });
            const partOfSpeech = createElement("h3", {
                className: "part-of-speech",
                text:
                    meaning.partOfSpeech ||
                    "Definition"
            });
            const definitions = createElement("ol", {
                className: "definitions"
            });

            for (
                const definition of meaning.definitions.slice(
                    0,
                    3
                )
            ) {
                const item = createElement("li", {
                    className: "definition",
                    text: definition.definition
                });

                if (definition.example) {
                    const example = createElement("span", {
                        className: "example",
                        text: `“${definition.example}”`
                    });
                    item.appendChild(example);
                }

                definitions.appendChild(item);
            }

            section.append(partOfSpeech, definitions);

            const synonyms = [
                ...(meaning.synonyms || []),
                ...meaning.definitions.flatMap(
                    (definition) =>
                        definition.synonyms || []
                )
            ]
                .filter(
                    (synonym, index, values) =>
                        synonym &&
                        values.indexOf(synonym) === index
                )
                .slice(0, 6);

            if (synonyms.length) {
                section.appendChild(
                    createElement("p", {
                        className: "synonyms",
                        text: `Synonyms: ${synonyms.join(", ")}`
                    })
                );
            }

            fragment.appendChild(section);
        }

        if (!meanings.length) {
            fragment.appendChild(
                createElement("p", {
                    className: "status error",
                    text: `No definition was found for “${word}.”`
                })
            );
        }

        fragment.appendChild(
            createElement("p", {
                className: "source",
                text: "Dictionary data: Free Dictionary API"
            })
        );

        content.replaceChildren(fragment);
        positionPopup();
    }

    function positionPopup() {
        if (
            !popupHost?.isConnected ||
            !currentRange
        ) {
            return;
        }

        popupHost.style.visibility = "hidden";

        requestAnimationFrame(() => {
            if (
                !popupHost?.isConnected ||
                !currentRange
            ) {
                return;
            }

            const anchor =
                currentRange.getBoundingClientRect();
            const popupRect =
                popupHost.getBoundingClientRect();
            const margin = 12;
            const gap = 8;

            let left = anchor.left;
            let top = anchor.bottom + gap;

            if (
                left + popupRect.width >
                globalThis.innerWidth - margin
            ) {
                left =
                    globalThis.innerWidth -
                    popupRect.width -
                    margin;
            }

            if (left < margin) {
                left = margin;
            }

            if (
                top + popupRect.height >
                globalThis.innerHeight - margin
            ) {
                top =
                    anchor.top -
                    popupRect.height -
                    gap;
            }

            if (top < margin) {
                top = margin;
            }

            popupHost.style.left = `${Math.round(left)}px`;
            popupHost.style.top = `${Math.round(top)}px`;
            popupHost.style.visibility = "visible";
        });
    }

    function closePopup(options = {}) {
        activeRequest?.abort();
        activeRequest = null;

        activeAudio?.pause();
        activeAudio = null;

        popupHost?.remove();
        popupHost = null;
        popupShadow = null;

        if (options.clearSelection) {
            clearHighlight();
        }
    }

    async function lookupWord(word) {
        const normalizedWord = word.trim().toLowerCase();

        if (!normalizedWord) {
            return;
        }

        ensurePopup();
        setPopupStatus(
            word,
            `Looking up “${word}”…`
        );

        activeRequest?.abort();
        activeRequest = null;
        const currentRequest = ++requestNumber;
        const cached = definitionCache.get(normalizedWord);

        if (cached) {
            renderDefinition(word, cached);
            return;
        }

        activeRequest = new AbortController();

        try {
            const response = await fetch(
                `${DICTIONARY_ENDPOINT}${encodeURIComponent(
                    normalizedWord
                )}`,
                {
                    signal: activeRequest.signal
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("not-found");
                }

                throw new Error("request-failed");
            }

            const entries = await response.json();

            if (
                currentRequest !== requestNumber ||
                !popupHost?.isConnected
            ) {
                return;
            }

            if (!Array.isArray(entries) || !entries.length) {
                throw new Error("not-found");
            }

            definitionCache.set(
                normalizedWord,
                entries
            );
            renderDefinition(word, entries);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            if (
                currentRequest !== requestNumber ||
                !popupHost?.isConnected
            ) {
                return;
            }

            if (error.message === "not-found") {
                setPopupStatus(
                    word,
                    `No definition was found for “${word}.”`,
                    true
                );
            } else {
                setPopupStatus(
                    word,
                    "The dictionary could not be reached. Check your connection and try again.",
                    true
                );
            }
        } finally {
            if (currentRequest === requestNumber) {
                activeRequest = null;
            }
        }
    }

    function updateHighlightAtPointer() {
        animationFrameId = null;

        if (!enabled || !lastPointer) {
            clearHighlight();
            return;
        }

        if (popupHost?.isConnected) {
            return;
        }

        const range = getWordRangeAtPoint(
            lastPointer.x,
            lastPointer.y
        );

        if (range) {
            showHighlight(range);
        } else {
            clearHighlight();
        }
    }

    function scheduleHighlightUpdate() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(
            updateHighlightAtPointer
        );
    }

    function handlePointerMove(event) {
        if (!enabled) {
            return;
        }

        if (isExtensionInterfaceEvent(event)) {
            return;
        }

        lastPointer = {
            x: event.clientX,
            y: event.clientY
        };
        scheduleHighlightUpdate();
    }

    function handleClick(event) {
        if (
            !enabled ||
            event.button !== 0 ||
            isExtensionInterfaceEvent(event)
        ) {
            return;
        }

        const range = getWordRangeAtPoint(
            event.clientX,
            event.clientY
        );

        if (!range) {
            closePopup({
                clearSelection: true
            });
            return;
        }

        const word = range.toString().trim();

        if (!word) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        globalThis.getSelection?.()?.removeAllRanges();

        showHighlight(range);
        lookupWord(word);
    }

    function handleKeyDown(event) {
        if (
            event.key === "Escape" &&
            popupHost?.isConnected
        ) {
            event.preventDefault();
            closePopup({
                clearSelection: true
            });
        }
    }

    function handlePointerExit(event) {
        if (
            event.relatedTarget === null &&
            !popupHost?.isConnected
        ) {
            lastPointer = null;
            clearHighlight();
        }
    }

    function handleViewportChange() {
        if (currentRange) {
            renderHighlight(currentRange);
            positionPopup();
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
    }

    function toggle(shouldEnable) {
        const nextEnabled = Boolean(shouldEnable);

        if (enabled === nextEnabled) {
            return;
        }

        enabled = nextEnabled;
        installPageStyles();
        document.documentElement.classList.toggle(
            ACTIVE_CLASS,
            enabled
        );

        if (enabled) {
            globalThis.getSelection?.()?.removeAllRanges();
            addListeners();
            return;
        }

        removeListeners();
        lastPointer = null;

        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        closePopup({
            clearSelection: true
        });
    }

    globalThis.ADAPTDefine = Object.freeze({
        toggle,
        isEnabled() {
            return enabled;
        },
        getCurrentWord() {
            return currentWord;
        }
    });
})();