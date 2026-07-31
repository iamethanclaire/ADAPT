// ADAPT Sticky Note Tool
(function initializeADAPTNote() {
    "use strict";

    if (!document.head || !document.body) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeADAPTNote,
            { once: true }
        );
        return;
    }

    if (
        window.ADAPTNote &&
        typeof window.ADAPTNote.destroy === "function"
    ) {
        window.ADAPTNote.destroy();
    }

    const STYLE_ID = "adapt-note-styles";
    const ICON_SIZE = 42;

    const NOTE_ICON_URL =
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.getURL
            ? chrome.runtime.getURL(
                "images/stickynote.svg"
            )
            : "images/stickynote.svg";

    const notes = new Map();

    let isEnabled = false;
    let selectedNoteColor = "yellow";
    let isShiftPressed = false;
    let nextNoteId = 1;
    let activeNoteId = null;
    let resizeAnimationFrame = null;
    let isRestoringNotes = false;

    let overlay = null;
    let textarea = null;
    let closeButton = null;

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement("style");
        style.id = STYLE_ID;

        style.textContent = `
            html.adapt-note-placement-mode
                body > :not(#adapt-host):not([data-adapt-owned]),
            html.adapt-note-placement-mode
                body > :not(#adapt-host):not([data-adapt-owned]) * {
                cursor: copy !important;
            }

            html:not(.adapt-extension-active)
                .adapt-note-icon,
            html:not(.adapt-extension-active)
                .adapt-note-overlay {
                display: none !important;
            }

            .adapt-note-icon {
                position: absolute;

                width: ${ICON_SIZE}px;
                height: ${ICON_SIZE}px;

                display: block;

                margin: 0;
                padding: 0;

                transform: translate(-50%, -50%);

                background:
                    ${ADAPT.colors.transparent};
                border: none;

                cursor: pointer;
                appearance: none;

                filter: drop-shadow(
                    0 3px 4px
                    ${ADAPT.colors.shadowMedium}
                );

                z-index: 99998;
            }

            .adapt-note-icon:hover {
                transform:
                    translate(-50%, -50%)
                    scale(1.08);
            }

            .adapt-note-icon:focus-visible {
                outline:
                    3px solid
                    ${ADAPT.colors.focusBlue};
                outline-offset: 3px;
                border-radius: 5px;
            }

            .adapt-note-icon img {
                width: 100%;
                height: 100%;

                display: block;

                object-fit: contain;

                pointer-events: none;
                user-select: none;
                -webkit-user-drag: none;
            }

            .adapt-note-icon.adapt-note-delete-mode,
            .adapt-note-icon.adapt-note-delete-mode:hover {
                cursor: not-allowed;

                transform:
                    translate(-50%, -50%)
                    scale(1.08);

                filter: none !important;

                outline:
                    3px solid
                    ${ADAPT.colors.deleteRed};
                outline-offset: 3px;
                border-radius: 5px;
            }

            .adapt-note-overlay {
                position: fixed;
                inset: 0;

                display: flex;
                align-items: center;
                justify-content: center;

                box-sizing: border-box;
                padding: 20px;

                background:
                    ${ADAPT.colors.overlayScrim};

                cursor: default !important;

                z-index: 99998;
            }
            
            .adapt-note-dialog,
            .adapt-note-header,
            .adapt-note-title {
                cursor: default !important;
            }

            .adapt-note-textarea {
                cursor: text !important;
            }

            .adapt-note-close,
            .adapt-note-close:hover {
                cursor: pointer !important;
            }

            .adapt-note-overlay[hidden] {
                display: none;
            }

            .adapt-note-dialog {
                width: min(380px, calc(100vw - 40px));
                min-height: 320px;

                display: flex;
                flex-direction: column;

                overflow: hidden;

                background:
                    var(
                        --adapt-note-background,
                        ${ADAPT.noteColors[0].background}
                    );
                border-radius: 10px;

                box-shadow:
                    0 24px 70px
                    ${ADAPT.colors.shadowHeavy};

                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;
            }

            .adapt-note-header {
                min-height: 46px;

                display: flex;
                align-items: center;
                justify-content: space-between;

                gap: 12px;
                padding: 8px 9px 8px 16px;

                background:
                    var(
                        --adapt-note-header,
                        ${ADAPT.noteColors[0].header}
                    );
                border-bottom:
                    1px solid
                    var(
                        --adapt-note-header,
                        ${ADAPT.noteColors[0].header}
                    );
            }

            .adapt-note-title {
                margin: 0;

                color:
                    var(
                        --adapt-note-text,
                        ${ADAPT.noteColors[0].text}
                    );

                font-size: 16px;
                font-weight: 700;
                line-height: 1.2;

                text-decoration: none !important;
                border: none !important;
                border-bottom: none !important;
                box-shadow: none !important;
                background:
                    ${ADAPT.colors.transparent}
                    !important;
            }

            .adapt-note-title::before,
            .adapt-note-title::after {
                display: none !important;
                content: none !important;
            }

            .adapt-note-close {
                width: 32px;
                height: 32px;

                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex: 0 0 auto;

                margin: 0;
                padding: 0;

                color:
                    var(
                        --adapt-note-text,
                        ${ADAPT.noteColors[0].text}
                    );
                background:
                    ${ADAPT.colors.transparent};
                border: none;
                border-radius: 6px;

                cursor: pointer;
                appearance: none;

                font:
                    700 24px/1
                    Helvetica,
                    sans-serif;
            }

            .adapt-note-close:hover {
                background:
                    ${ADAPT.colors.noteHover};
            }

            .adapt-note-close:focus-visible {
                outline:
                    3px solid
                    ${ADAPT.colors.focusBlue};
                outline-offset: 1px;
            }

            .adapt-note-textarea {
                width: 100%;
                min-height: 274px;

                flex: 1;

                box-sizing: border-box;
                resize: none;

                padding: 18px;

                color:
                    var(
                        --adapt-note-text,
                        ${ADAPT.noteColors[0].text}
                    );
                background:
                    ${ADAPT.colors.transparent};

                border: none;
                outline: none;

                font:
                    17px/1.55
                    Arial,
                    Helvetica,
                    sans-serif;
            }

            .adapt-note-textarea::placeholder {
                color:
                    ${ADAPT.colors.notePlaceholder};
            }
        `;

        document.head.appendChild(style);
    }

    function createDialog() {
        if (overlay) {
            return;
        }

        overlay = document.createElement("div");
        overlay.className = "adapt-note-overlay";
        overlay.dataset.adaptOwned = "true";
        overlay.hidden = true;
        overlay.setAttribute("role", "presentation");

        const dialog = document.createElement("section");
        dialog.className = "adapt-note-dialog";
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute(
            "aria-labelledby",
            "adapt-note-dialog-title"
        );

        const header = document.createElement("header");
        header.className = "adapt-note-header";

        const title = document.createElement("h2");
        title.id = "adapt-note-dialog-title";
        title.className = "adapt-note-title";
        title.textContent = "Sticky Note";

        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "adapt-note-close";
        closeButton.setAttribute(
            "aria-label",
            "Close sticky note"
        );
        closeButton.textContent = "×";

        textarea = document.createElement("textarea");
        textarea.className = "adapt-note-textarea";
        textarea.placeholder = "Type your note here…";
        textarea.setAttribute(
            "aria-label",
            "Sticky note text"
        );

        header.append(title, closeButton);
        dialog.append(header, textarea);
        overlay.appendChild(dialog);

        document.body.appendChild(overlay);

        overlay.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        closeButton.addEventListener(
            "click",
            closeNote
        );

        textarea.addEventListener("input", () => {
            if (activeNoteId === null) {
                return;
            }

            const note = notes.get(activeNoteId);

            if (!note) {
                return;
            }

            note.text = textarea.value;
            updateIconLabel(note);
            saveNotes({ debounce: true });
        });
    }

    function getPageDimensions() {
        return {
            width: Math.max(
                document.documentElement.clientWidth,
                document.documentElement.scrollWidth,
                document.body?.scrollWidth || 0
            ),

            height: Math.max(
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.body?.scrollHeight || 0
            )
        };
    }

    function positionNote(note) {
        const halfIcon = ICON_SIZE / 2;
        const page = getPageDimensions();

        const x = Math.min(
            Math.max(
                note.xRatio * page.width,
                halfIcon
            ),
            Math.max(
                page.width - halfIcon,
                halfIcon
            )
        );

        const y = Math.min(
            Math.max(
                note.yRatio * page.height,
                halfIcon
            ),
            Math.max(
                page.height - halfIcon,
                halfIcon
            )
        );

        note.x = x;
        note.y = y;

        note.element.style.left = `${x}px`;
        note.element.style.top = `${y}px`;
    }

    function repositionNotes() {
        notes.forEach((note) => {
            positionNote(note);
        });
    }

    function handleWindowResize() {
        if (resizeAnimationFrame !== null) {
            window.cancelAnimationFrame(
                resizeAnimationFrame
            );
        }

        resizeAnimationFrame =
            window.requestAnimationFrame(() => {
                resizeAnimationFrame = null;
                repositionNotes();
            });
    }

    function getNotePreview(note) {
        return note.text
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 60);
    }

    function updateIconLabel(note) {
        const preview = getNotePreview(note);

        note.element.setAttribute(
            "aria-label",
            isShiftPressed
                ? "Delete sticky note"
                : preview
                    ? `Open sticky note: ${preview}`
                    : "Open empty sticky note"
        );

        note.element.title = isShiftPressed
            ? "Delete sticky note"
            : preview || "Open sticky note";
    }

    function updateDeleteMode() {
        notes.forEach((note) => {
            note.element.classList.toggle(
                "adapt-note-delete-mode",
                isShiftPressed
            );

            updateIconLabel(note);
        });
    }

    function openNote(noteId) {
        const note = notes.get(noteId);

        if (!note) {
            return;
        }

        activeNoteId = noteId;
        const noteTheme = ADAPT.getNoteColor(
            note.color
        );
        overlay.style.setProperty(
            "--adapt-note-background",
            noteTheme.background
        );
        overlay.style.setProperty(
            "--adapt-note-header",
            noteTheme.header
        );
        overlay.style.setProperty(
            "--adapt-note-text",
            noteTheme.text
        );
        textarea.value = note.text;
        overlay.hidden = false;

        window.requestAnimationFrame(() => {
            textarea.focus();

            textarea.setSelectionRange(
                textarea.value.length,
                textarea.value.length
            );
        });
    }

    function closeNote() {
        if (!overlay || overlay.hidden) {
            return;
        }

        const note = notes.get(activeNoteId);

        overlay.hidden = true;
        activeNoteId = null;

        if (note && note.element.isConnected) {
            note.element.focus({
                preventScroll: true
            });
        }
    }

    function deleteNote(noteId) {
        const note = notes.get(noteId);

        if (!note) {
            return;
        }

        if (activeNoteId === noteId) {
            overlay.hidden = true;
            activeNoteId = null;
        }

        note.element.remove();
        notes.delete(noteId);
        saveNotes();
    }

    function createNoteIcon(
        pageX,
        pageY,
        initialText = "",
        options = {}
    ) {
        const noteId = Number.isInteger(options.id)
            ? options.id
            : nextNoteId;

        nextNoteId = Math.max(nextNoteId, noteId + 1);
        const page = getPageDimensions();

        /*
         * Store the note's location as a proportion of
         * the total page width and height.
         *
         * A value of 0.5 means halfway across/down.
         */
        const xRatio = Math.min(
            Math.max(pageX / page.width, 0),
            1
        );

        const yRatio = Math.min(
            Math.max(pageY / page.height, 0),
            1
        );

        const icon = document.createElement("button");

        icon.type = "button";
        icon.className = "adapt-note-icon";
        icon.dataset.adaptOwned = "true";
        icon.dataset.adaptNoteId = String(noteId);

        const iconImage = document.createElement("img");

        iconImage.src = NOTE_ICON_URL;
        iconImage.alt = "";
        iconImage.draggable = false;

        icon.appendChild(iconImage);

        const note = {
            id: noteId,

            xRatio,
            yRatio,

            x: 0,
            y: 0,

            text: String(initialText || ""),
            color: ADAPT.getNoteColor(
                options.color || selectedNoteColor
            ).id,
            element: icon
        };

        const noteTheme = ADAPT.getNoteColor(
            note.color
        );
        iconImage.style.filter =
            noteTheme.iconFilter;

        notes.set(noteId, note);
        updateIconLabel(note);

        if (isShiftPressed) {
            icon.classList.add(
                "adapt-note-delete-mode"
            );
        }

        icon.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (event.shiftKey || isShiftPressed) {
                deleteNote(noteId);
                return;
            }

            openNote(noteId);
        });

        document.body.appendChild(icon);
        positionNote(note);

        if (!options.skipSave && !isRestoringNotes) {
            saveNotes();
        }

        return note;
    }

    function serializeNotes() {
        return Array.from(notes.values()).map((note) => ({
            id: note.id,
            xRatio: note.xRatio,
            yRatio: note.yRatio,
            text: note.text,
            color: note.color
        }));
    }

    function saveNotes(options = {}) {
        if (isRestoringNotes) {
            return;
        }

        globalThis.ADAPTStorage
            ?.updatePage(
                { notes: serializeNotes() },
                { debounce: Boolean(options.debounce) }
            )
            .catch((error) => {
                console.error(
                    "[ADAPT] Could not save sticky notes:",
                    error
                );
            });
    }

    function restoreNotes(savedNotes) {
        isRestoringNotes = true;

        closeNote();

        notes.forEach((note) => {
            note.element.remove();
        });

        notes.clear();
        nextNoteId = 1;

        if (Array.isArray(savedNotes)) {
            const page = getPageDimensions();

            savedNotes.forEach((savedNote) => {
                const xRatio = Math.min(
                    Math.max(Number(savedNote.xRatio) || 0, 0),
                    1
                );
                const yRatio = Math.min(
                    Math.max(Number(savedNote.yRatio) || 0, 0),
                    1
                );

                createNoteIcon(
                    xRatio * page.width,
                    yRatio * page.height,
                    savedNote.text,
                    {
                        id: Number.isInteger(savedNote.id)
                            ? savedNote.id
                            : undefined,
                        color: savedNote.color,
                        skipSave: true
                    }
                );
            });
        }

        isRestoringNotes = false;
        repositionNotes();
    }

    function isADAPTInterfaceClick(event) {
        return event.composedPath().some((node) => {
            if (!(node instanceof Element)) {
                return false;
            }

            return (
                node.classList.contains(
                    "adapt-note-icon"
                ) ||
                node.classList.contains(
                    "adapt-note-overlay"
                ) ||
                node.id.startsWith("adapt-") ||
                node.hasAttribute(
                    "data-adapt-toolbar"
                )
            );
        });
    }

    function handlePageClick(event) {
        if (!isEnabled || event.button !== 0) {
            return;
        }

        if (isADAPTInterfaceClick(event)) {
            return;
        }

        /*
         * Holding Shift is reserved for deleting notes.
         * Do not place a new note during delete mode.
         */
        if (event.shiftKey || isShiftPressed) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        createNoteIcon(
            event.pageX,
            event.pageY
        );
    }

    function handleKeyDown(event) {
        if (event.key === "Shift") {
            isShiftPressed = true;
            updateDeleteMode();
        }

        if (
            event.key === "Escape" &&
            overlay &&
            !overlay.hidden
        ) {
            event.preventDefault();
            closeNote();
        }
    }

    function handleKeyUp(event) {
        if (event.key === "Shift") {
            isShiftPressed = false;
            updateDeleteMode();
        }
    }

    function handleWindowBlur() {
        isShiftPressed = false;
        updateDeleteMode();
    }

    function toggle(shouldEnable) {
        const nextEnabled = Boolean(shouldEnable);

        if (nextEnabled === isEnabled) {
            return;
        }

        isEnabled = nextEnabled;

        if (isEnabled) {
            document.addEventListener(
                "click",
                handlePageClick,
                true
            );

            document.documentElement.classList.add(
                "adapt-note-placement-mode"
            );
        } else {
            document.removeEventListener(
                "click",
                handlePageClick,
                true
            );

            document.documentElement.classList.remove(
                "adapt-note-placement-mode"
            );

            closeNote();
        }
    }

    function destroy() {
        toggle(false);
        closeNote();

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

        window.removeEventListener(
            "blur",
            handleWindowBlur
        );

        window.removeEventListener(
            "resize",
            handleWindowResize
        );

        if (resizeAnimationFrame !== null) {
            window.cancelAnimationFrame(
                resizeAnimationFrame
            );

            resizeAnimationFrame = null;
        }

        notes.forEach((note) => {
            note.element.remove();
        });

        notes.clear();
        document.documentElement.classList.remove(
            "adapt-note-placement-mode"
        );

        if (overlay) {
            overlay.remove();
        }

        document
            .getElementById(STYLE_ID)
            ?.remove();

        overlay = null;
        textarea = null;
        closeButton = null;
        activeNoteId = null;
    }

    injectStyles();
    createDialog();

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

    window.addEventListener(
        "blur",
        handleWindowBlur
    );

    window.addEventListener(
        "resize",
        handleWindowResize
    );

    window.ADAPTNote = {
        toggle,
        close: closeNote,
        delete: deleteNote,
        destroy,

        reposition: repositionNotes,
        restore: restoreNotes,
        save: saveNotes,

        isEnabled: () => isEnabled,

        setSelectedColor(colorId) {
            selectedNoteColor =
                ADAPT.getNoteColor(colorId).id;

            return selectedNoteColor;
        },

        getSelectedColor() {
            return selectedNoteColor;
        },

        getNotes: () => {
            return serializeNotes();
        }
    };
})();
