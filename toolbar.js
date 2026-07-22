// const { act } = require("react");

// Inject font styles.
const style = document.createElement("style");
style.textContent = ADAPT.getFontStyles();
adaptShadow.appendChild(style);

// Tracks active toolbar buttons.
const activeButtons = new Set();

function getToolbarButton(buttonId) {
    return adaptShadow.getElementById(buttonId);
}

function resetButtonBackground(buttonId) {
    const button = getToolbarButton(buttonId);

    if (button) {
        button.style.background = "transparent";
    }
}

function deactivateHighlightTool() {
    activeButtons.delete("adapt-highlight");
    resetButtonBackground("adapt-highlight");
    toggleHighlight(false);
}

function deactivateLineGuideTool() {
    activeButtons.delete("adapt-line-guide");
    resetButtonBackground("adapt-line-guide");
    toggleLineGuide(false);
}

function deactivateNoteTool() {
    activeButtons.delete("adapt-note");
    resetButtonBackground("adapt-note");

    if (window.ADAPTNote) {
        window.ADAPTNote.toggle(false);
    }
}

function deactivateDefineTool() {
    activeButtons.delete("adapt-define");
    resetButtonBackground("adapt-define");
}

function deactivateSpeakTool() {
    activeButtons.delete("adapt-speak");
    resetButtonBackground("adapt-speak");
}

// Style toolbar buttons.
adaptShadow
    .querySelectorAll("button")
    .forEach((btn) => {
        btn.style.background = "transparent";
        btn.style.color = textColor;
        btn.style.border = "none";
        btn.style.padding = "4px 8px";
        btn.style.borderRadius = "4px";
        btn.style.cursor = "pointer";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";

        btn.addEventListener("mouseenter", () => {
            const isTextAlteration =
                btn.id === "adapt-bold" ||
                btn.id === "adapt-italic" ||
                btn.id === "adapt-underline";

            const hoverBackground =
                activeButtons.has(btn.id)
                    ? isTextAlteration
                        ? hoverSelectedAlterationColor
                        : hoverSelectedToolColor
                    : hoverColor;

            btn.style.background = hoverBackground;
        });

        btn.addEventListener("mouseleave", () => {
            if (
                btn.id === "adapt-dropdown-btn" &&
                dropdownMenu.style.display === "block"
            ) {
                return;
            }

            if (activeButtons.has(btn.id)) {
                const isTextAlteration =
                    btn.id === "adapt-bold" ||
                    btn.id === "adapt-italic" ||
                    btn.id === "adapt-underline";

                btn.style.background = isTextAlteration
                    ? selectedAlterationColor
                    : selectedToolColor;
            } else {
                btn.style.background = "transparent";
            }
        });
    });

// Handle toolbar button input.
adaptShadow
    .querySelectorAll("button")
    .forEach((btn) => {
        btn.addEventListener("click", () => {
            if (btn.id === "adapt-dropdown-btn") {
                return;
            }

            /*
             * Underline
             */
            if (btn.id === "adapt-underline") {
                if (activeButtons.has(btn.id)) {
                    activeButtons.delete(btn.id);
                    btn.style.background = "transparent";
                } else {
                    activeButtons.add(btn.id);
                    btn.style.background =
                        selectedAlterationColor;
                }

                toggleUnderline(
                    activeButtons.has(btn.id)
                );
            }

            /*
             * Bold
             */
            if (btn.id === "adapt-bold") {
                if (activeButtons.has(btn.id)) {
                    activeButtons.delete(btn.id);
                    btn.style.background = "transparent";
                } else {
                    activeButtons.add(btn.id);
                    btn.style.background =
                        selectedAlterationColor;
                }

                toggleBold(
                    activeButtons.has(btn.id)
                );
            }

            /*
             * Italics
             */
            if (btn.id === "adapt-italic") {
                if (activeButtons.has(btn.id)) {
                    activeButtons.delete(btn.id);
                    btn.style.background = "transparent";
                } else {
                    activeButtons.add(btn.id);
                    btn.style.background =
                        selectedAlterationColor;
                }

                toggleItalics(
                    activeButtons.has(btn.id)
                );
            }

            /*
             * Highlight
             *
             * Highlight cannot be active with Note.
             * It also remains exclusive with the other
             * primary tools.
             */
            if (btn.id === "adapt-highlight") {
                if (activeButtons.has(btn.id)) {
                    deactivateHighlightTool();
                } else {
                    deactivateDefineTool();
                    deactivateSpeakTool();
                    deactivateNoteTool();

                    activeButtons.add(btn.id);
                    btn.style.background =
                        selectedToolColor;

                    toggleHighlight(true);
                }
            }

            /*
             * Define
             */
            else if (btn.id === "adapt-define") {
                if (activeButtons.has(btn.id)) {
                    deactivateDefineTool();
                } else {
                    deactivateHighlightTool();
                    deactivateSpeakTool();
                    deactivateLineGuideTool();
                    deactivateNoteTool();

                    activeButtons.add(btn.id);
                    btn.style.background =
                        selectedToolColor;
                }
            }

            /*
             * Speak
             */
            else if (btn.id === "adapt-speak") {
                if (activeButtons.has(btn.id)) {
                    deactivateSpeakTool();
                } else {
                    deactivateHighlightTool();
                    deactivateDefineTool();
                    deactivateLineGuideTool();
                    deactivateNoteTool();

                    activeButtons.add(btn.id);
                    btn.style.background =
                        selectedToolColor;
                }
            }

            /*
             * Line Guide
             *
             * Line Guide is allowed to remain active
             * at the same time as Note.
             */
            else if (btn.id === "adapt-line-guide") {
                if (activeButtons.has(btn.id)) {
                    deactivateLineGuideTool();
                } else {
                    deactivateHighlightTool();
                    deactivateDefineTool();
                    deactivateSpeakTool();

                    /*
                     * Do not deactivate Note here.
                     */
                    activeButtons.add(btn.id);
                    btn.style.background =
                        selectedToolColor;

                    toggleLineGuide(true);
                }
            }

            /*
             * Sticky Note
             *
             * Note is allowed to remain active at the
             * same time as Line Guide.
             */
            else if (btn.id === "adapt-note") {
                if (!window.ADAPTNote) {
                    console.error(
                        "[ADAPT] tools/note.js was not loaded"
                    );
                    return;
                }

                if (activeButtons.has(btn.id)) {
                    deactivateNoteTool();
                } else {
                    deactivateHighlightTool();
                    deactivateDefineTool();
                    deactivateSpeakTool();

                    /*
                     * Do not deactivate Line Guide here.
                     */
                    activeButtons.add(btn.id);
                    btn.style.background =
                        selectedToolColor;

                    window.ADAPTNote.toggle(true);
                }
            }

            // Reference size.js.
            if (btn.id === "adapt-decrease-size") {
                decreaseSize();
            } else if (
                btn.id === "adapt-increase-size"
            ) {
                increaseSize();
            }

            // Reference leading.js.
            if (btn.id === "adapt-decrease-leading") {
                decreaseLeading();
            } else if (
                btn.id === "adapt-increase-leading"
            ) {
                increaseLeading();
            }

            // Reference spacing.js.
            if (btn.id === "adapt-decrease-spacing") {
                decreaseSpacing();
            } else if (
                btn.id === "adapt-increase-spacing"
            ) {
                increaseSpacing();
            }
        });
    });

// Keyboard shortcuts.
document.addEventListener("keydown", (event) => {
    const target = event.target;
    const tag = target?.tagName;

    if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
    ) {
        return;
    }

    const ctrlOrMeta =
        event.ctrlKey || event.metaKey;

    const shift = event.shiftKey;
    const alt = event.altKey;
    const key = event.key.toUpperCase();

    // Ctrl/Cmd + Shift + letter.
    if (ctrlOrMeta && shift && !alt) {
        switch (key) {
            case "P":
                event.preventDefault();
                logo.click();
                break;

            case "H":
                event.preventDefault();
                getToolbarButton(
                    "adapt-highlight"
                ).click();
                break;

            case "B":
                event.preventDefault();
                getToolbarButton(
                    "adapt-bold"
                ).click();
                break;

            case "I":
                event.preventDefault();
                getToolbarButton(
                    "adapt-italic"
                ).click();
                break;

            case "U":
                event.preventDefault();
                getToolbarButton(
                    "adapt-underline"
                ).click();
                break;

            case "L":
                event.preventDefault();
                getToolbarButton(
                    "adapt-line-guide"
                ).click();
                break;

            case "D":
                event.preventDefault();
                getToolbarButton(
                    "adapt-define"
                ).click();
                break;

            case "S":
                event.preventDefault();
                getToolbarButton(
                    "adapt-speak"
                ).click();
                break;

            case "J":
                event.preventDefault();
                getToolbarButton(
                    "adapt-note"
                ).click();
                break;

            case "E":
                event.preventDefault();

                if (toolbar.style.display === "none") {
                    tab.click();
                } else {
                    getToolbarButton(
                        "adapt-hide"
                    ).click();
                }

                break;
        }
    }

    // Ctrl + Alt sizing and spacing shortcuts.
    if (event.ctrlKey && alt && !shift) {
        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                getToolbarButton(
                    "adapt-increase-leading"
                ).click();
                break;

            case "ArrowDown":
                event.preventDefault();
                getToolbarButton(
                    "adapt-decrease-leading"
                ).click();
                break;

            case "ArrowLeft":
                event.preventDefault();
                getToolbarButton(
                    "adapt-decrease-spacing"
                ).click();
                break;

            case "ArrowRight":
                event.preventDefault();
                getToolbarButton(
                    "adapt-increase-spacing"
                ).click();
                break;

            case ".":
                event.preventDefault();
                getToolbarButton(
                    "adapt-increase-size"
                ).click();
                break;

            case ",":
                event.preventDefault();
                getToolbarButton(
                    "adapt-decrease-size"
                ).click();
                break;
        }
    }
});

// Dropdown elements.
const dropdownBtn =
    getToolbarButton("adapt-dropdown-btn");

const dropdownMenu =
    getToolbarButton("adapt-dropdown-menu");

const dropdownArrow =
    getToolbarButton("adapt-dropdown-icon");

dropdownBtn.addEventListener("click", () => {
    const isOpen =
        dropdownMenu.style.display === "block";

    dropdownMenu.style.display =
        isOpen ? "none" : "block";

    dropdownArrow.style.transform = isOpen
        ? "rotate(0deg)"
        : "rotate(180deg) translateY(-2px)";

    dropdownBtn.style.background = isOpen
        ? "transparent"
        : hoverColor;
});

// Close when clicking elsewhere inside the shadow root.
adaptShadow.addEventListener("click", (event) => {
    if (!event.target.closest("#adapt-dropdown")) {
        dropdownMenu.style.display = "none";
        dropdownArrow.style.transform =
            "rotate(0deg)";
        dropdownBtn.style.background =
            "transparent";
    }
});

// Close when clicking outside the shadow root.
document.addEventListener("click", (event) => {
    const path = event.composedPath();

    const insideDropdown = path.some(
        (element) =>
            element.id === "adapt-dropdown"
    );

    if (!insideDropdown) {
        dropdownMenu.style.display = "none";
        dropdownArrow.style.transform =
            "rotate(0deg)";
        dropdownBtn.style.background =
            "transparent";
    }
});

// Dropdown item hover and selection.
adaptShadow
    .querySelectorAll(".adapt-dropdown-item")
    .forEach((item) => {
        item.style.padding = "8px 12px";
        item.style.cursor = "pointer";
        item.style.color = textColor;
        item.style.borderBottom =
            `1px solid ${borderColor}`;

        item.addEventListener(
            "mouseenter",
            () => {
                item.style.background =
                    hoverColor;
            }
        );

        item.addEventListener(
            "mouseleave",
            () => {
                item.style.background =
                    "transparent";
            }
        );

        item.addEventListener("click", () => {
            const font =
                item.getAttribute("data-value");

            const fontObj = ADAPT.fonts.find(
                (fontEntry) =>
                    fontEntry.value === font
            );

            const label = getToolbarButton(
                "adapt-dropdown-label"
            );

            label.textContent = item.textContent;

            dropdownArrow.style.transform =
                "rotate(0deg)";

            label.style.fontFamily =
                font === "page-default"
                    ? "inherit"
                    : `"${fontObj.label}", sans-serif`;

            changeFont(font, fontObj);

            dropdownMenu.style.display = "none";
            dropdownBtn.style.background =
                "transparent";
        });
    });

// Style toolbar inputs.
adaptShadow
    .querySelectorAll("input")
    .forEach((input) => {
        input.style.background = inputColor;
        input.style.color = textColor;
        input.style.fontSize = "12px";
        input.style.border =
            `1px solid ${borderColor}`;
        input.style.padding = "4px 8px";
        input.style.borderRadius = "4px";
        input.style.cursor = "text";
        input.style.textAlign = "center";
        input.style.outline = "none";
        input.style.display = "flex";
        input.style.alignItems = "center";
        input.style.justifyContent = "center";

        input.addEventListener(
            "focus",
            (event) => {
                event.target.style.border =
                    `1px solid ${selectedInputBorderColor}`;
            }
        );

        input.addEventListener(
            "blur",
            (event) => {
                event.target.style.border =
                    `1px solid ${borderColor}`;
            }
        );
    });

// Toggle the extension active state.
let isActive = true;

const logo = getToolbarButton("adapt-logo");

logo.addEventListener("click", () => {
    isActive = !isActive;

    logo.src = isActive
        ? logoSrc
        : logoInactiveSrc;
});

// Hide/show toolbar.
getToolbarButton("adapt-hide")
    .addEventListener("click", () => {
        toolbar.style.display = "none";
        document.body.style.marginTop = "0px";
        tab.style.display = "block";

        /*
         * Recalculate proportional note positions
         * after the page layout changes.
         */
        window.requestAnimationFrame(() => {
            window.ADAPTNote?.reposition();
        });
    });

tab.addEventListener("click", () => {
    toolbar.style.display = "flex";
    document.body.style.marginTop = "48px";
    tab.style.display = "none";

    window.requestAnimationFrame(() => {
        window.ADAPTNote?.reposition();
    });
});